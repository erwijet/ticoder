use std::{collections::HashMap, sync::Arc};

use anyhow::{anyhow, bail, Context, Result};
use itertools::Itertools;
use pest::iterators::Pair;
use tap::{Pipe, Tap};

use crate::{pratt_parser, registers, shared::PairUtils, traits::{AsTiBasic, CfbLifecycle}, CfbCtx, Rule};

pub fn resolve_expr(expr: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    pratt_parser()
        .map_primary(|primary| match primary.as_rule() {
            Rule::expr => resolve_expr(primary, ctx),
            Rule::literal => resolve_literal(primary, ctx),
            Rule::ident => resolve_ident(primary, ctx),
            Rule::index => resolve_index(primary, ctx),
            Rule::func_call => resolve_func_call(primary, ctx),
            Rule::inline_for => resolve_inline_for(primary, ctx),
            other => unreachable!("{other:?}"),
        })
        .map_infix(|lhs, op, rhs| Ok(format!("({}){}({})", lhs?, op.as_str(), rhs?)))
        .parse(expr.into_inner())
}

pub fn resolve_inline_for(token: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    let (expr, ident, lower, mode, upper) = token.into_inner().take(5).collect_tuple().unwrap();

    let var = ctx.create_binding(ident.as_str().into(), crate::bindings::BindingVariant::Num(None))?.as_tibasic().unwrap();
    let func = resolve_expr(expr, ctx)?;
    let lower = resolve_expr(lower, ctx)?;
    let upper = resolve_expr(upper, ctx)?;

    if mode.as_str() == "downto" {
        Ok(format!("seq({func},{var},{lower},{upper},[neg]1)"))
    } else {
        Ok(format!("seq({func},{var},{lower},{upper})"))
    }
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

pub fn resolve_func_call(pair: Pair<Rule>, ctx: &mut CfbCtx) -> Result<String> {
    let mut inner = pair.into_inner();
    let ident = inner.nth(0).unwrap().as_str();

    Ok(format!(
        "{ident}({})",
        inner
            .map(|each| resolve_expr(each, ctx))
            .collect::<Result<Vec<_>>>()?
            .join(",")
    ))
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
