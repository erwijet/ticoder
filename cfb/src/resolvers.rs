use std::{collections::HashMap, sync::Arc};

use anyhow::{anyhow, bail, Context, Result};
use itertools::Itertools;
use pest::iterators::Pair;
use tap::{Pipe, Tap};

use crate::{pratt_parser, registers, shared::PairUtils, traits::AsTiBasic, CfbCtx, Rule};

pub fn resolve_expr(expr: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    pratt_parser()
        .map_primary(|primary| match primary.as_rule() {
            Rule::expr => resolve_expr(primary, ctx),
            Rule::literal => resolve_literal(primary, ctx),
            Rule::ident => resolve_ident(primary, ctx),
            Rule::index => resolve_index(primary, ctx),
            _ => unreachable!(),
        })
        .map_infix(|lhs, op, rhs| {
            Ok(format!("({}{}{})", lhs?, op.as_str(), rhs?))
        })
        .parse(expr.into_inner())
}

pub fn resolve_ident(ident: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    let needle = ident.as_str();

    // try consts
    if let Some(result) = ctx.consts.get(needle) {
        return Ok(result.as_tibasic()?);
    }

    // try bindings
    if let Some(result) = ctx.bindings.get(needle) {
        return Ok(result.as_tibasic()?);
    }

    bail!("unknown identifier: '{needle}'");
}

pub fn resolve_literal(pair: Pair<Rule>, _ctx: &mut CfbCtx) -> Result<String> {
    let wrapped = pair.into_inner().exactly_one().unwrap();

    match wrapped.as_rule() {
        Rule::bool_literal => Ok((if wrapped.as_str() == "true" { 1 } else { 0 }).to_string()),
        Rule::vec_literal => Ok(format!(
            "{{{}}}",
            wrapped.into_inner().map(|each| each.as_str()).join(",")
        )),
        _ => Ok(wrapped.as_str().into()),
    }
}

pub fn resolve_index(pair: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    format!(
        "{}({})",
        pair.find_rule(Rule::ident)
            .context("expected inner ident rule")?
            .pipe(|ident| resolve_ident(ident, ctx))?,
        pair.find_rule(Rule::expr)
            .context("expected inner expr rule")?
            .pipe(|expr| resolve_expr(expr, ctx))?
    )
    .pipe(Ok)
}
