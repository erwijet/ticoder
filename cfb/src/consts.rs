use anyhow::Result;

use crate::traits::AsTiBasic;

pub struct CfbConst(pub String);

impl AsTiBasic for CfbConst {
    fn as_tibasic(&self) -> Result<String> {
        Ok(self.0.to_string())
    }
}
