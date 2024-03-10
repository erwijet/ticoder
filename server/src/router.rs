use dotenv::dotenv;
use http::HeaderMap;
use rspc::Router;
use serde::Serialize;
use specta::Type;
use std::sync::Arc;
use tap::Pipe;

use crate::{notary, routes};

pub trait TicoderRouterError<T> {
    fn or_bad_request<S: Into<String>>(self, msg: S) -> Result<T, rspc::Error>;
    fn or_server_error<S: Into<String>>(self, msg: S) -> Result<T, rspc::Error>;
    fn or_not_found(self) -> Result<T, rspc::Error>;
}

impl<T, E> TicoderRouterError<T> for Result<T, E> {
    fn or_bad_request<S: Into<String>>(self, msg: S) -> Result<T, rspc::Error> {
        self.map_err(|_| rspc::Error::new(rspc::ErrorCode::BadRequest, msg.into()))
    }

    fn or_server_error<S: Into<String>>(self, msg: S) -> Result<T, rspc::Error> {
        self.map_err(|_| rspc::Error::new(rspc::ErrorCode::InternalServerError, msg.into()))
    }

    fn or_not_found(self) -> Result<T, rspc::Error> {
        self.map_err(|_| rspc::Error::new(rspc::ErrorCode::NotFound, "not found".into()))
    }
}

impl<T> TicoderRouterError<T> for Option<T> {
    fn or_bad_request<S: Into<String>>(self, msg: S) -> Result<T, rspc::Error> {
        self.ok_or(rspc::Error::new(rspc::ErrorCode::BadRequest, msg.into()))
    }

    fn or_server_error<S: Into<String>>(self, msg: S) -> Result<T, rspc::Error> {
        self.ok_or(rspc::Error::new(
            rspc::ErrorCode::InternalServerError,
            msg.into(),
        ))
    }

    fn or_not_found(self) -> Result<T, rspc::Error> {
        self.ok_or(rspc::Error::new(
            rspc::ErrorCode::NotFound,
            "not found".into(),
        ))
    }
}

pub struct AuthedCtx {
    pub headers: HeaderMap,
    pub claims: notary::NotaryClaims,
}

#[derive(Debug, Serialize, Type)]
struct AuthLoginParams {}

#[derive(Debug, Serialize, Type)]
struct GetAuthResp {
    url: String,
}

#[derive(Debug, Serialize, Type)]
struct GetMeResp {
    name: String,
}

pub fn get_router() -> Arc<Router<HeaderMap>> {
    dotenv().ok();

    rspc::Router::<HeaderMap>::new()
        .query("auth", |t| {
            t(|_ctx, _: ()| async move {
                notary::get_oauth_url()
                    .await
                    .or_server_error("failed to fetch OAuth2 url from notary server")?
                    .pipe(|payload| Ok(GetAuthResp { url: payload.url }))
            })
        })
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
        .query("me", |t| {
            t(|ctx, _: ()| async move {
                Ok(GetMeResp {
                    name: ctx.claims.fullname,
                })
            })
        })
        .merge("program:", routes::program::get_router())
        .build()
        .arced()
}
