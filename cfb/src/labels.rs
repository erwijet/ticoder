use crate::traits::AsTiBasic;

pub struct CfbLabel(pub u16);

impl AsTiBasic for CfbLabel {
    fn as_tibasic(&self) -> anyhow::Result<String> {
        Ok(format!(
            "{}",
            ('A'..'Z')
                .flat_map(|c1| ('A'..'Z').map(move |c2| format!("{c1}{c2}")))
                .nth(self.0 as usize)
                .unwrap()
        ))
    }
}
