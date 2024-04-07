use std::fmt::Display;

use anyhow::Result;

use crate::ti_lifecycle::TiLifecycle;

pub struct CfbReg(&'static str);

impl From<&CfbReg> for &str {
    fn from(value: &CfbReg) -> Self {
        value.into()
    }
}

impl From<CfbReg> for String {
    fn from(value: CfbReg) -> Self {
        value.as_tibasic().unwrap()
    }
}

impl Display for CfbReg {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl TiLifecycle for CfbReg {
    fn as_tibasic(&self) -> Result<String> {
        Ok(self.0.into())
    }

    fn as_ti_init(&self) -> ::anyhow::Result<String> {
        Ok(format!("0->{}", self.as_tibasic()?))
    }

    fn as_ti_drop(&self) -> ::anyhow::Result<String> {
        Ok(format!("DelVar {}", self.as_tibasic()?))
    }
}

//

pub static DROP_BINDING_REG: CfbReg = CfbReg("A");
