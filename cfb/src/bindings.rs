use std::fmt::format;

use anyhow::{Context, Result};

use crate::{
    registers,
    traits::{AsTiBasic, CfbLifecycle},
    CfbCtx,
};

#[derive(PartialEq, Debug)]
pub enum BindingVariant {
    Str(Option<String>),
    Num(Option<String>),
    Vec(String),
    Grid(String, String),
}

pub struct CfbBinding {
    pub variant: BindingVariant,
    pub name: String,
    pub id: u16,
}

impl CfbBinding {
    fn next_id<'a, I: Iterator<Item = &'a Self>>(bindings: I, variant: &BindingVariant) -> u16 {
        bindings
            .filter(|binding| {
                std::mem::discriminant(&binding.variant) == std::mem::discriminant(&variant)
            })
            .count() as u16
    }

    pub fn new<'a>(name: String, variant: BindingVariant, ctx: &CfbCtx) -> Self {
        let id = CfbBinding::next_id(ctx.bindings.values(), &variant);
        CfbBinding { variant, name, id }
    }
}

impl AsTiBasic for CfbBinding {
    fn as_tibasic(&self) -> Result<String> {
        match &self.variant {
            BindingVariant::Num(inital) => Ok(('A'..='Z')
                .nth(self.id as usize)
                .context("id out of bounds")?
                .to_string()),
            BindingVariant::Str(inital) => Ok(format!("Str{}", self.id)),
            BindingVariant::Vec(size) => Ok(format!(
                "[list]LST{}",
                ('A'..='Z')
                    .flat_map(|chr1| ('A'..='Z').map(move |chr2| format!("{chr1}{chr2}")))
                    .nth(self.id as usize)
                    .context("id out of bounds")?
            )),
            BindingVariant::Grid(col, row) => Ok(format!(
                "[{}]",
                ('A'..'J')
                    .nth(self.id as usize)
                    .context("id out of bounds")?
            )),
        }
    }
}

impl CfbLifecycle for CfbBinding {
    fn init_ti(&self) -> Result<String> {
        match &self.variant {
            BindingVariant::Num(inital) => Ok(format!(
                "{}->{}",
                inital.clone().unwrap_or("0".into()),
                self.as_tibasic()?
            )),
            BindingVariant::Str(inital) => Ok(format!(
                "\"{}->{}",
                inital.clone().unwrap_or("".into()),
                self.as_tibasic()?
            )),
            BindingVariant::Grid(col, row) => {
                Ok(format!("{{{col},{row}->dim({}", self.as_tibasic()?))
            }
            BindingVariant::Vec(size) => Ok(format!(
                "{size}->dim([list]LST{}",
                ('A'..='Z')
                    .flat_map(|chr1| ('A'..='Z').map(move |chr2| format!("{chr1}{chr2}")))
                    .nth(self.id as usize)
                    .context("id out of bounds")?
            )),
        }
    }
    fn drop_ti(&self) -> Result<String> {
        match &self.variant {
            BindingVariant::Vec(_) => Ok(format!("ClrList {}", self.as_tibasic()?)),
            _ => Ok(format!("DelVar {}", self.as_tibasic()?)),
        }
    }
}
