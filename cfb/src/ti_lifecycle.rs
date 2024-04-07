use anyhow::Result;

pub trait TiLifecycle {
    fn as_ti_init(&self) -> Result<String>;
    fn as_ti_drop(&self) -> Result<String>;
    fn as_tibasic(&self) -> Result<String>;
}