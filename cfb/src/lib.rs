mod bindings;
mod consts;
mod labels;
mod macros;
mod registers;
mod resolvers;
mod shared;
mod traits;

use std::{
    borrow::Borrow, collections::HashMap, convert::identity, fmt::format, ops::Deref, path::Iter,
    sync::OnceLock,
};

use anyhow::{anyhow, bail, Context, Result};
use bindings::{BindingVariant, CfbBinding};
use consts::CfbConst;
use itertools::Itertools;
use labels::CfbLabel;
use pest::{
    iterators::Pair,
    pratt_parser::{Assoc::Left, Op, PrattParser},
    Parser, RuleType,
};
use pest_derive::Parser;
use registers::FOR_EACH_IDX_REG;
use resolvers::{resolve_expr, resolve_ident, resolve_index, resolve_literal};
use shared::{CfbIterUtil, PairUtils};
use tap::{Pipe, Tap};
use traits::{AsTiBasic, CfbLifecycle};

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
    pub labels: HashMap<String, CfbLabel>,
}

impl CfbCtx {
    fn create_binding<'a>(
        &'a mut self,
        name: String,
        variant: BindingVariant,
    ) -> Result<&CfbBinding> {
        if self.bindings.contains_key(&name) {
            bail!("Binding '{name}' already exists")
        }

        let id = self
            .bindings
            .values()
            .filter(|binding| {
                std::mem::discriminant(&binding.variant) == std::mem::discriminant(&variant)
            })
            .count() as u16;

        self.bindings.insert(
            name.clone(),
            CfbBinding {
                id,
                variant,
                name: name.clone(),
            },
        );
        Ok(self.bindings.get(&name).unwrap())
    }

    fn create_const(&mut self, name: String, value: String) -> Result<&CfbConst> {
        if self.consts.contains_key(&name) {
            bail!("Constant '{name}' was already defined")
        }

        self.consts.insert(name.clone(), CfbConst(value));
        Ok(self.consts.get(&name).unwrap())
    }

    fn create_anon_label(&mut self) -> Result<&CfbLabel> {
        self.create_label(format!("@@anon_{}", self.labels.len()))
    }

    fn create_label(&mut self, name: String) -> Result<&CfbLabel> {
        if self.bindings.contains_key(&name) {
            bail!("Label '{name}' already exists");
        }

        let id = self.labels.len() as u16;

        self.labels.insert(name.clone(), CfbLabel(id));
        Ok(self.labels.get(&name).unwrap())
    }
}

pub fn resolve_stmt(token: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    match token.as_rule() {
        Rule::pass => Ok("".into()),
        Rule::expr => resolve_expr(token, ctx),
        Rule::block => Ok(token
            .into_inner()
            .map(|each| resolve_stmt(each, ctx))
            .collect::<Result<Vec<_>>>()?
            .join("\n")),
        Rule::while_loop => {
            let (cond, block) = token.into_inner().take(2).collect_tuple().unwrap();

            Ok(format!(
                "While {}\n{}\nEnd",
                resolve_expr(cond, ctx)?,
                resolve_stmt(block, ctx)?
            ))
        }
        Rule::menu => {
            let (name_pair, arm_pairs) = token.into_inner().head_tail().unwrap();
            let name = resolve_expr(name_pair, ctx)?;
            let exit_lbl = ctx.create_anon_label()?.as_tibasic()?;

            let regions = arm_pairs
                .into_iter()
                .map(|each| {
                    let (case_pair, body_pair) = each.into_inner().take(2).collect_tuple().unwrap();
                    let case = resolve_expr(case_pair, ctx)?;
                    let body = resolve_stmt(body_pair, ctx)?;

                    let lbl = ctx.create_anon_label()?.as_tibasic()?;
                    Ok((case, lbl, body))
                })
                .collect::<Result<Vec<_>>>()?;

            Ok(format!(
                "Menu({name},{})\n{}\nLbl {exit_lbl}",
                regions
                    .iter()
                    .map(|(case, lbl, _)| format!("{case},{lbl}"))
                    .join(","),
                regions
                    .iter()
                    .map(|(_, lbl, block)| format!("Lbl {lbl}\n{block}"))
                    .join(&format!("\nGoto {exit_lbl}\n"))
            ))
        }
        Rule::for_loop => {
            let (ident, lower, mode, upper, block) =
                token.into_inner().take(5).collect_tuple().unwrap();

            let var = ctx
                .create_binding(ident.as_str().into(), BindingVariant::Num(None))?
                .as_tibasic()
                .unwrap();

            let lower = resolve_expr(lower, ctx)?;
            let upper = resolve_expr(upper, ctx)?;
            let body = resolve_stmt(block, ctx)?;

            Ok(format!(
                "For({var},{lower},{upper}{})\n{body}\nEnd",
                if mode.as_str() == "downto" {
                    ",[neg]1"
                } else {
                    ""
                }
            ))
        }
        Rule::r#if => {
            let (expr, block) = token.into_inner().take(2).collect_tuple().unwrap();
            let cond = resolve_expr(expr, ctx)?;
            let content = resolve_stmt(block, ctx)?;

            Ok(format!("If {cond}\nThen\n{content}\nEnd"))
        }
        Rule::named_block => {
            let (name, block) = token.into_inner().take(2).collect_tuple().unwrap();

            let label = ctx.create_label(name.as_str().strip_prefix("@").unwrap().into())?;

            Ok(format!(
                "Lbl {}\n{}",
                label.as_tibasic()?,
                block
                    .into_inner()
                    .map(|each| resolve_stmt(each, ctx))
                    .collect::<Result<Vec<_>>>()?
                    .join("\n")
            ))
        }
        Rule::jump => {
            let ti_label = token
                .into_inner()
                .exactly_one()
                .unwrap()
                .as_str()
                .strip_prefix(":")
                .unwrap()
                .pipe(|target| {
                    ctx.labels
                        .get(target)
                        .context(format!("Unknown label '{target}'"))
                })?
                .as_tibasic()?;

            Ok(format!("Goto {ti_label}"))
        }
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

            let init_val = inner
                .nth(0)
                .map(|pair| resolve_expr(pair, ctx))
                .transpose()?;

            let variant: BindingVariant = match type_pair.as_rule() {
                Rule::str_type => BindingVariant::Str(init_val),
                Rule::num_type => BindingVariant::Num(init_val),
                Rule::vec_type => {
                    let sz = type_pair
                        .into_inner()
                        .nth(0)
                        .map(|pair| pair.as_str())
                        .unwrap_or("0");

                    BindingVariant::Vec(sz.into(), init_val)
                }
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

            ctx.create_binding(ident_pair.as_str().into(), variant)?
                .init_ti()
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

            let variant = match literal.as_rule() {
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

            ctx.create_binding(ident.as_str().into(), variant)?
                .init_ti()
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
        Rule::increment => {
            let ident = token.into_inner().nth(0).unwrap();
            let var = resolve_ident(ident, ctx)?;

            Ok(format!("{var}+1->{var}"))
        }
        Rule::decrement => {
            let ident = token.into_inner().nth(0).unwrap();
            let var = resolve_ident(ident, ctx)?;

            Ok(format!("{var}-1->{var}"))
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
        labels: HashMap::new(),
    };

    // TI-Basic Init

    // Body

    for pair in pairs {
        println!("======== NEXT PAIR ==========");
        println!("{pair:#?}");

        let result = maybe!(resolve_stmt(pair, &mut ctx), else let err in {
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
