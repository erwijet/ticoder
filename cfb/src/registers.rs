use std::fmt::Display;

use anyhow::Result;

use crate::traits::{AsTiBasic, CfbLifecycle};

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

impl AsTiBasic for CfbReg {
    fn as_tibasic(&self) -> Result<String> {
        Ok(self.0.into())
    }
}

impl CfbLifecycle for CfbReg {
    fn init_ti(&self) -> Result<String> {
        Ok(format!("0->{}", self.as_tibasic()?))
    }

    fn drop_ti(&self) -> Result<String> {
        Ok(format!("DelVar {}", self.as_tibasic()?))
    }
}

//

pub static DROP_BINDING_REG: CfbReg = CfbReg("A");