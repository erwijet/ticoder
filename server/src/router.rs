use dotenv::dotenv;
use http::HeaderMap;
use rspc::Router;
use std::{ops::Deref, sync::Arc};
use tap::Pipe;

use crate::{
    notary,
    routes::{self, TicoderRouterError},
};

pub struct UnauthedCtx(pub HeaderMap);
impl Deref for UnauthedCtx {
    type Target = HeaderMap;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

pub struct AuthedCtx {
    pub headers: HeaderMap,
    pub claims: notary::NotaryClaims,
}

//

pub fn build_router() -> Arc<Router<UnauthedCtx>> {
    dotenv().ok();

    rspc::Router::<UnauthedCtx>::new()
        .merge("auth:", routes::auth::get_router())
        .middleware(|builder| {
            fn no_auth() -> rspc::Error {
                rspc::Error::new(rspc::ErrorCode::Unauthorized, "unauthorized".into())
            }

            builder.middleware(|prev| async move {
                let headers = prev.ctx.clone();

                let claims = headers
                    .get("authorization")
                    .ok_or(no_auth())?
                    .to_str()
                    .unwrap()
                    .strip_prefix("Bearer ")
                    .ok_or(no_auth())?
                    .pipe(notary::inspect_token)
                    .await
                    .or_server_error("failed to inspect incoming token")?
                    .claims
                    .ok_or(no_auth())?;

                Ok(prev.with_ctx(AuthedCtx { headers, claims }))
            })
        })
        .merge("program:", routes::program::get_router())
        .build()
        .arced()
}
