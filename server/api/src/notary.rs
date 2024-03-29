use serde::Deserialize;
use tap::Pipe;

use crate::routes::TicoderRouterError;

#[derive(Deserialize)]
pub struct NotaryAuthResp {
    pub url: String,
}

pub async fn get_oauth_url() -> Result<NotaryAuthResp, rspc::Error> {
    let notary_server = std::env::var("NOTARY_HOST").expect("missing env var 'NOTARY_HOST'");
    let notary_svc_key = std::env::var("NOTARY_KEY").expect("missing env var 'NOTARY_KEY'");
    let notary_target = std::env::var("NOTARY_TARGET").expect("missing env var 'NOTARY_TARGET'");

    reqwest::get(format!(
        "{}/authorize/ticoder?via=google&key={}&callback={notary_target}",
        notary_server, notary_svc_key
    ))
    .await
    .or_server_error("failed to connect to notary server")?
    .text()
    .await
    .or_server_error("error reading from notary server")?
    .pipe(|it| serde_json::from_str(&it).or_server_error("failed to parse notary payload"))
}

#[derive(Deserialize)]
pub struct NotaryInspectResp {
    pub valid: bool,
    pub claims: Option<NotaryClaims>,
}

#[derive(Deserialize)]
pub struct NotaryClaims {
    pub aud: String,
    pub exp: u32,
    pub family_name: String,
    pub fullname: String,
    pub given_name: String,
    pub iat: u32,
    pub iss: String,
    pub jti: String,
    pub nbf: u32,
    pub picture: String,
    pub sub: String,
    pub user_id: String,
    pub via: String,
}

pub async fn inspect_token<S: Into<String>>(token: S) -> Result<NotaryInspectResp, rspc::Error> {
    let notary_server = std::env::var("NOTARY_HOST").expect("missing env var 'NOTARY_HOST'");

    reqwest::get(format!("{notary_server}/inspect/{}", token.into()))
        .await
        .or_server_error("failed to connect to notary server")?
        .bytes()
        .await
        .or_server_error("error reading from notary server")?
        .pipe(|it| serde_json::from_slice::<NotaryInspectResp>(&it).unwrap())
        .pipe(Ok)
}
