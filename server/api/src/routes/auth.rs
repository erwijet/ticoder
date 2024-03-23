use rspc::{Router, RouterBuilder};
use serde::Serialize;
use specta::Type;
use tap::Pipe;

use crate::{notary, router::UnauthedCtx};
use super::TicoderRouterError;

#[derive(Serialize, Type)]
struct GetOauth2UrlParams {
    url: String,
}

pub fn get_router() -> RouterBuilder<UnauthedCtx, ()> {
    Router::<UnauthedCtx>::new().query("get_oauth2_url", |t| {
        t(|_ctx, _: ()| async move {
            notary::get_oauth_url()
                .await
                .or_server_error("failed to fetch OAuth2 url from notary server")?
                .pipe(|payload| Ok(GetOauth2UrlParams { url: payload.url }))
        })
    })
}
