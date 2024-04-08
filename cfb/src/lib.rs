mod bindings;
mod consts;
mod macros;
mod registers;
mod resolvers;
mod shared;
mod traits;

use std::{
    borrow::Borrow, collections::HashMap, convert::identity, fmt::format, path::Iter,
    sync::OnceLock,
};

use anyhow::{anyhow, bail, Context, Result};
use bindings::{BindingVariant, CfbBinding};
use consts::CfbConst;
use itertools::Itertools;
use pest::{
    iterators::Pair,
    pratt_parser::{Assoc::Left, Op, PrattParser},
    Parser,
};
use pest_derive::Parser;
use resolvers::{resolve_expr, resolve_ident, resolve_index, resolve_literal};
use shared::PairUtils;
use tap::{Pipe, Tap};
use traits::CfbLifecycle;

#[derive(Parser)]
#[grammar = "../grammar.peg"]
pub struct CfbParser;

static PRATT_PARSER: OnceLock<PrattParser<Rule>> = OnceLock::new();
fn pratt_parser() -> &'static PrattParser<Rule> {
    // see: https://education.ti.com/html/eguides/graphing/84plusce/en/content/eg_gsguide/m_expressions/exp_order_of_operations.HTML
    // precedence defined lowest to highest
    PRATT_PARSER.get_or_init(|| {
        PrattParser::new()
            .op(Op::infix(Rule::xor, Left) | Op::infix(Rule::or, Left))
            .op(Op::infix(Rule::and, Left))
            .op(Op::infix(Rule::lt, Left)
                | Op::infix(Rule::lte, Left)
                | Op::infix(Rule::gt, Left)
                | Op::infix(Rule::gte, Left)
                | Op::infix(Rule::eq, Left)
                | Op::infix(Rule::neq, Left))
            .op(Op::infix(Rule::add, Left) | Op::infix(Rule::sub, Left))
            .op(Op::infix(Rule::mul, Left) | Op::infix(Rule::div, Left))
            .op(Op::infix(Rule::pow, Left))
            .op(Op::infix(Rule::ncr, Left) | Op::infix(Rule::ncr, Left))
    })
}

pub struct CfbCtx {
    pub bindings: HashMap<String, CfbBinding>,
    pub consts: HashMap<String, CfbConst>,
}

// impl CfbCtx {
//     fn create_binding<'a>(&'a mut self, name: String, binding_type: BindingType) -> &'a Binding {
//         let id = self.bindings.values().pipe(|values| {
//             if let BindingType::Grid(_, _) | BindingType::Vec(_) = binding_type {
//                 values
//                     .filter(|binding| {
//                         matches!(
//                             binding.binding_type,
//                             BindingType::Grid(_, _) | BindingType::Vec(_)
//                         )
//                     })
//                     .count()
//             } else {
//                 values
//                     .filter(|binding| {
//                         std::mem::discriminant(&binding.binding_type)
//                             == std::mem::discriminant(&binding_type)
//                     })
//                     .count()
//             }
//         }) as u16;

//         let binding = Binding {
//             id,
//             binding_type,
//             name: name.to_owned(),
//         };

//         self.bindings.insert(name.clone(), binding);
//         &self.bindings.get(&name).unwrap()
//     }
// }

pub fn resolve(token: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    match token.as_rule() {
        Rule::expr => resolve_expr(token, ctx),
        Rule::binding => {
            let mut inner = token.into_inner();

            let ident_pair = inner.nth(0).context("expected inner to have 2 pairs")?;
            ident_pair.expect_to_be(Rule::ident)?;

            let type_pair = inner.nth(0).context("expected inner to have 2 pairs")?;
            type_pair.expect_to_be_one_of(vec![
                Rule::str_type,
                Rule::num_type,
                Rule::vec_type,
                Rule::grid_type,
            ])?;

            let binding_type: BindingVariant = match type_pair.as_rule() {
                Rule::str_type => BindingVariant::Str(None),
                Rule::num_type => BindingVariant::Num(None),
                Rule::vec_type => BindingVariant::Vec(
                    type_pair
                        .find_rule(Rule::inum_literal)
                        .context("expected vec_type to have inum_literal child")?
                        .as_str()
                        .into(),
                ),
                Rule::grid_type => {
                    (if let [colpair, rowpair] = &type_pair.find_rules(Rule::inum_literal)[..] {
                        Ok(BindingVariant::Grid(
                            colpair.as_str().into(),
                            rowpair.as_str().into(),
                        ))
                    } else {
                        Err(anyhow!("expected 2 inner pairs"))
                    })?
                }
                _ => unreachable!(),
            };

            let binding = CfbBinding::new(ident_pair.as_str().into(), binding_type, &ctx);
            ctx.bindings.insert(ident_pair.as_str().into(), binding);

            Ok(ctx.bindings.get(ident_pair.as_str()).unwrap().init_ti()?)
        }
        Rule::assignment_binding => {
            let ident = token
                .find_rule(Rule::ident)
                .context("expected ident child pair")?;

            let literal = token
                .find_rule(Rule::literal)
                .context("expected literal child pair")?
                .into_inner()
                .exactly_one()
                .map_err(|_| anyhow!("literal pair should have exactly 1 child"))?;

            let binding_type = match literal.as_rule() {
                Rule::str_literal => BindingVariant::Str(Some(
                    literal.find_rule(Rule::raw_str).unwrap().as_str().into(),
                )),
                Rule::inum_literal | Rule::fnum_literal => {
                    BindingVariant::Num(Some(literal.as_str().into()))
                }
                Rule::bool_literal => BindingVariant::Num(Some(
                    (if literal.as_str() == "true" { 1 } else { 0 }).to_string(),
                )),
                _ => unreachable!(),
            };

            let binding = CfbBinding::new(ident.as_str().into(), binding_type, &ctx);
            ctx.bindings.insert(ident.as_str().into(), binding);

            Ok(ctx.bindings.get(ident.as_str()).unwrap().init_ti()?)
        }
        Rule::assignment => {
            let (receiver, val_expr) = token.into_inner().take(2).collect_tuple().unwrap();
            let val = resolve_expr(val_expr, ctx)?;

            Ok(format!(
                "{val}->{}",
                match receiver.as_rule() {
                    Rule::ident => resolve_ident(receiver, ctx)?,
                    Rule::index => resolve_index(receiver, ctx)?,
                    _ => unreachable!(),
                }
            ))
        }
        Rule::r#const => {
            let (ident, expr) = token.into_inner().take(2).collect_tuple().unwrap();
            let value = resolve_expr(expr, ctx)?;

            ctx.consts.insert(ident.as_str().into(), CfbConst(value));

            Ok("".into())
        }
        Rule::builtin => {
            let builtin = token
                .into_inner()
                .exactly_one()
                .map_err(|_| anyhow!("builtin pair type expectes exactly 1 child"))?;

            match builtin.as_rule() {
                Rule::disp => {
                    let args: Vec<String> = builtin
                        .into_inner()
                        .map(|each| resolve_expr(each, ctx))
                        .try_collect()?;

                    Ok(format!("Disp {}", args.join(",")))
                }
                Rule::store => {
                    let args: Vec<String> = builtin
                        .into_inner()
                        .map(|each| resolve_expr(each, ctx))
                        .try_collect()?;

                    let (val, target) = args.into_iter().take(2).collect_tuple().unwrap();

                    Ok(format!("{val}->{target}"))
                }
                _ => Ok(format!(
                    "\"[noimpl ({:?})]: {}",
                    builtin.as_rule(),
                    builtin.as_str()
                )),
            }
        }
        Rule::EOI => Ok("".into()),
        _ => Ok(format!(
            "\"[noimpl ({:?})]: {}",
            token.as_rule(),
            token.as_str()
        )),
    }
}

pub fn run() {
    let src = include_str!("../for.cfb");

    let pairs = CfbParser::parse(Rule::program, src)
        .tap(|it| {
            if let Err(err) = it {
                eprintln!("{err:#}");
            }
        })
        .unwrap()
        .exactly_one()
        .unwrap()
        .into_inner();

    let mut tib = String::new();
    let mut ctx = CfbCtx {
        bindings: HashMap::new(),
        consts: HashMap::new(),
    };

    // TI-Basic Init

    tib += "0->dim([list]NMEM\n"; // initialize number variable list

    // Body

    for pair in pairs {
        println!("======== NEXT PAIR ==========");
        println!("{pair:#?}");

        let result = maybe!(resolve(pair, &mut ctx), else let err in {
            eprintln!("{err:#?}");
            return;
        });

        tib += &format!("{result}\n");
    }
    // Cleanup

    tib += ctx
        .bindings
        .values()
        .filter(|each| !matches!(each.variant, BindingVariant::Num(_)))
        .map(|each| each.drop_ti().unwrap())
        .join("")
        .borrow();

    tib += "ClrList [list]NMEM"; // drop number memory

    println!("=====TIBASIC=====");
    println!("{tib}");
}

#[cfg(test)]
mod tests {
    #[test]
    fn run() {
        super::run();
        assert!(false)
    }
}
