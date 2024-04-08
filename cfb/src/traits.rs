use anyhow::Result;

pub trait AsTiBasic {
    fn as_tibasic(&self) -> Result<String>;
}

pub trait CfbLifecycle {
    fn init_ti(&self) -> Result<String>;
    fn drop_ti(&self) -> Result<String>;
}