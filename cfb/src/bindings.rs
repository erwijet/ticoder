use anyhow::{Context, Result};

use crate::{registers, ti_lifecycle::TiLifecycle, CfbCtx};

#[derive(PartialEq, Debug)]
pub enum BindingVariant {
    Str(Option<String>),
    Num(Option<String>),
    Vec(String),
    Grid(String, String),
}

pub struct Binding {
    pub variant: BindingVariant,
    pub name: String,
    pub id: u16,
}

impl Binding {
    fn next_id<'a, I: Iterator<Item = &'a Self>>(bindings: I, variant: &BindingVariant) -> u16 {
        match variant {
            // ticalc var pool for Grid and Vec is the same
            BindingVariant::Grid(_, _) | BindingVariant::Vec(_) => bindings
                .filter(|binding| {
                    matches!(
                        binding.variant,
                        BindingVariant::Vec(_) | BindingVariant::Grid(_, _)
                    )
                })
                .count() as u16,
            _ => bindings
                .filter(|binding| {
                    std::mem::discriminant(&binding.variant) == std::mem::discriminant(&variant)
                })
                .count() as u16,
        }
    }

    pub fn new<'a>(name: String, variant: BindingVariant, ctx: &CfbCtx) -> Self {
        let id = Binding::next_id(ctx.bindings.values(), &variant);
        Binding { variant, name, id }
    }
}

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

impl TiLifecycle for Binding {
    fn as_tibasic(&self) -> Result<String> {
        match &self.variant {
            BindingVariant::Num(inital) => Ok(format!("[list]NMEM({})", self.id + 1)),
            BindingVariant::Str(inital) => Ok(format!("Str{}", self.id)),
            BindingVariant::Vec(size) => Ok(format!(
                "[{}]",
                ('A'..'J')
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
    fn as_ti_drop(&self) -> Result<String> {
        let reg = &registers::DROP_BINDING_REG;

        match &self.variant {
            BindingVariant::Num(_) => Ok(format!(
                "seq([list]NMEM({reg}+({reg}>={})),{reg},1,dim([list]NMEM)-1)->[list]NMEM",
                self.id + 1
            )),
            _ => Ok(format!("DelVar {}", self.as_tibasic()?)),
        }
    }
    fn as_ti_init(&self) -> Result<String> {
        match &self.variant {
            BindingVariant::Num(inital) => Ok(format!(
                "dim([list]NMEM)+1->dim([list]NMEM\n{}->{}",
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
            BindingVariant::Vec(size) => Ok(format!("{{1,{size}->dim({}", self.as_tibasic()?)),
        }
    }
}
