use anyhow::{anyhow, bail, Context, Result};
use itertools::Itertools;
use pest::iterators::Pair;
use tap::Pipe;

use crate::{pratt_parser, registers, shared::PairUtils, ti_lifecycle::TiLifecycle, CfbCtx, Rule};

pub fn resolve_expr(expr: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    pratt_parser()
        .map_primary(|primary| match primary.as_rule() {
            Rule::expr => resolve_expr(primary, ctx),
            Rule::literal => resolve_literal(primary, ctx),
            Rule::ident => resolve_ident(primary, ctx),
            Rule::index => resolve_index(primary, ctx),
            _ => unreachable!(),
        })
        .parse(expr.into_inner())
}

pub fn resolve_ident(ident: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    ctx.bindings
        .get(ident.as_str())
        .ok_or(anyhow!("unknown identifier: '{}'", ident.as_str()))?
        .as_tibasic()
}

pub fn resolve_literal(pair: Pair<Rule>, _ctx: &mut CfbCtx) -> Result<String> {
    let wrapped = pair.into_inner().exactly_one().unwrap();

    match wrapped.as_rule() {
        Rule::inum_literal | Rule::fnum_literal | Rule::str_literal => Ok(wrapped.as_str().into()),
        Rule::bool_literal => Ok((if wrapped.as_str() == "true" { 1 } else { 0 }).to_string()),
        _ => bail!("unknown rule discriminant"),
    }
}

pub fn resolve_index(pair: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    format!(
        "{}(1,{})",
        pair.find_rule(Rule::ident)
            .context("expected inner ident rule")?
            .pipe(|ident| resolve_ident(ident, ctx))?,
        pair.find_rule(Rule::expr)
            .context("expected inner expr rule")?
            .pipe(|expr| resolve_expr(expr, ctx))?
    )
    .pipe(Ok)
}