mod macros;
mod shared;

use std::{collections::HashMap, fmt::format, sync::OnceLock};

use anyhow::{anyhow, bail, Context, Result};
use itertools::Itertools;
use pest::{
    iterators::Pair,
    pratt_parser::{Assoc::Left, Op, PrattParser},
    Parser,
};
use pest_derive::Parser;
use shared::PairUtils;
use tap::{Pipe, Tap};

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

#[derive(PartialEq, Debug)]
enum BindingType {
    Str(Option<String>),
    Num(Option<String>),
    Vec(String),
    Grid(String, String),
}

#[derive(Debug)]
struct Binding {
    pub binding_type: BindingType,
    pub name: String,
    pub id: u16,
}

impl Binding {
    fn as_alloc_tib(&self) -> Result<String> {
        match &self.binding_type {
            BindingType::Num(inital) => Ok(format!(
                "dim([list]NMEM)+1->dim([list]\n{}->[list]NMEM({}",
                inital.clone().unwrap_or("0".into()),
                self.id
            )),
            BindingType::Str(inital) => Ok(format!(
                "\"{}->Str{}",
                inital.clone().unwrap_or("".into()),
                ('1'..'9')
                    .nth(self.id as usize)
                    .context("no free str register")?
            )),
            BindingType::Vec(size) => Ok(format!(
                "{{1,{size}->dim({}",
                ('A'..'J')
                    .nth(self.id as usize)
                    .context("no free matrix register")?
            )),
            BindingType::Grid(col, row) => Ok(format!(
                "{{{col},{row}->dim({}",
                ('A'..'J')
                    .nth(self.id as usize)
                    .context("no free matrix register")?
            )),
        }
    }

    fn as_expr_tib(&self) -> Result<String> {
        match &self.binding_type {
            BindingType::Num(inital) => Ok(format!("[list]NMEM({})", self.id)),
            BindingType::Str(inital) => Ok(format!("Str{}", self.id)),
            BindingType::Vec(size) => Ok(format!(
                "{{1,{size}->dim({}",
                ('A'..'J')
                    .nth(self.id as usize)
                    .context("id out of bounds")?
            )),
            BindingType::Grid(col, row) => Ok(format!(
                "{{{col},{row}->dim({}",
                ('A'..'J')
                    .nth(self.id as usize)
                    .context("id out of bounds")?
            )),
        }
    }
}

#[derive(Debug)]
struct CfbCtx {
    bindings: HashMap<String, Binding>,
}

impl CfbCtx {
    fn create_binding<'a>(&'a mut self, name: String, binding_type: BindingType) -> &'a Binding {
        let id = self.bindings.values().pipe(|values| {
            if let BindingType::Grid(_, _) | BindingType::Vec(_) = binding_type {
                values
                    .filter(|binding| {
                        matches!(
                            binding.binding_type,
                            BindingType::Grid(_, _) | BindingType::Vec(_)
                        )
                    })
                    .count()
            } else {
                values
                    .filter(|binding| {
                        std::mem::discriminant(&binding.binding_type)
                            == std::mem::discriminant(&binding_type)
                    })
                    .count()
            }
        }) as u16;

        let binding = Binding {
            id,
            binding_type,
            name: name.to_owned(),
        };

        self.bindings.insert(name.clone(), binding);
        &self.bindings.get(&name).unwrap()
    }
}

fn resolve_ident(ident: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    ctx.bindings
        .get(ident.as_str())
        .ok_or(anyhow!("unknown identifier: '{}'", ident.as_str()))?
        .as_expr_tib()
}

pub fn resolve_expr(expr: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    pratt_parser()
        .map_primary(|primary| match primary.as_rule() {
            Rule::expr => resolve_expr(primary, ctx),
            Rule::literal => {
                let wrapped = primary.into_inner().exactly_one().unwrap();

                match wrapped.as_rule() {
                    Rule::str_literal => {
                        Ok(wrapped.into_inner().exactly_one().unwrap().as_str().into())
                    }
                    Rule::inum_literal | Rule::fnum_literal => Ok(wrapped.as_str().into()),
                    Rule::bool_literal => {
                        Ok((if wrapped.as_str() == "true" { 1 } else { 0 }).to_string())
                    }
                    _ => bail!("unknown rule discriminant"),
                }
            }
            Rule::ident => resolve_ident(primary, ctx),
            Rule::index => format!(
                "{}({})",
                primary
                    .find_rule(Rule::ident)
                    .context("expected inner ident rule")?
                    .pipe(|ident| resolve_ident(ident, ctx))?,
                primary
                    .find_rule(Rule::expr)
                    .context("expected inner expr rule")?
                    .pipe(|expr| resolve_expr(expr, ctx))?
            )
            .pipe(Ok),
            _ => unreachable!(),
        })
        .parse(expr.into_inner())
}

pub fn resolve(token: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    match token.as_rule() {
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

            let binding_type: BindingType = match type_pair.as_rule() {
                Rule::str_type => BindingType::Str(None),
                Rule::num_type => BindingType::Num(None),
                Rule::vec_type => BindingType::Vec(
                    type_pair
                        .find_rule(Rule::inum_literal)
                        .context("expected vec_type to have inum_literal child")?
                        .as_str()
                        .into(),
                ),
                Rule::grid_type => {
                    (if let [colpair, rowpair] = &type_pair.find_rules(Rule::inum_literal)[..] {
                        Ok(BindingType::Grid(
                            colpair.as_str().into(),
                            rowpair.as_str().into(),
                        ))
                    } else {
                        Err(anyhow!("expected 2 inner pairs"))
                    })?
                }
                _ => unreachable!(),
            };

            Ok(ctx
                .create_binding(ident_pair.as_str().into(), binding_type)
                .as_alloc_tib()?)
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
                Rule::str_literal => BindingType::Str(Some(
                    literal.find_rule(Rule::raw_str).unwrap().as_str().into(),
                )),
                Rule::inum_literal | Rule::fnum_literal => {
                    BindingType::Num(Some(literal.as_str().into()))
                }
                Rule::bool_literal => BindingType::Num(Some(
                    (if literal.as_str() == "true" { 1 } else { 0 }).to_string(),
                )),
                _ => unreachable!(),
            };

            Ok(ctx
                .create_binding(ident.as_str().into(), binding_type)
                .as_alloc_tib()?)
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
    let src = include_str!("../let.cfb");

    let pairs = CfbParser::parse(Rule::program, src)
        .tap(|it| {
            if let Err(err) = it {
                eprintln!("{err:#?}");
            }
        })
        .unwrap()
        .exactly_one()
        .unwrap()
        .into_inner();

    let mut tib = String::new();
    let mut ctx = CfbCtx {
        bindings: HashMap::new(),
    };

    for pair in pairs {
        println!("======== NEXT PAIR ==========");
        println!("{pair:#?}");

        let result = maybe!(resolve(pair, &mut ctx), else let err in {
            eprintln!("{err:#?}");
            return;
        });

        tib += &format!("{result}\n");
    }

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
