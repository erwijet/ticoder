use dotenv::dotenv;
use prisma_client_rust::query_core::schema_builder::build;
use rspc::Router;
use serde::{ Deserialize, Serialize };
use specta::Type;
use std::{ borrow::Borrow, io::Read, sync::Arc };
use tap::{ Pipe, Tap };

use crate::{ db::get_prisma_client, prisma::user, server::ServerContext };

trait TicoderRouterError<T> {
    fn or_bad_request<S: Into<String>>(self, msg: S) -> Result<T, rspc::Error>;
    fn or_server_error<S: Into<String>>(self, msg: S) -> Result<T, rspc::Error>;
}

impl<T, E> TicoderRouterError<T> for Result<T, E> {
    fn or_bad_request<S: Into<String>>(self, msg: S) -> Result<T, rspc::Error> {
        self.map_err(|_| rspc::Error::new(rspc::ErrorCode::BadRequest, msg.into()))
    }

    fn or_server_error<S: Into<String>>(self, msg: S) -> Result<T, rspc::Error> {
        self.map_err(|_| rspc::Error::new(rspc::ErrorCode::InternalServerError, msg.into()))
    }
}

impl<T> TicoderRouterError<T> for Option<T> {
    fn or_bad_request<S: Into<String>>(self, msg: S) -> Result<T, rspc::Error> {
        self.ok_or(rspc::Error::new(rspc::ErrorCode::BadRequest, msg.into()))
    }

    fn or_server_error<S: Into<String>>(self, msg: S) -> Result<T, rspc::Error> {
        self.ok_or(rspc::Error::new(rspc::ErrorCode::InternalServerError, msg.into()))
    }
}

#[derive(Debug, Serialize, Type)]
struct AuthLoginParams {}

#[derive(Debug, Serialize, Type)]
struct TestResult(String, String);

// pub fn get_auth_router() -> Arc<Router<()>> {
//     rspc::Router::<()>::new()
//         .mutation("login", |t| {
//             t(|_ctx, params: AuthLoginParams| unimplemented!())
//         })
//         .build()
//         .arced()
// }

#[derive(Debug, Serialize, Type)]
struct GetAuthResp {
    url: String,
}

#[derive(Deserialize)]
struct NotaryAuthResp {
    url: String,
}

pub fn get_router() -> Arc<Router<()>> {
    dotenv().ok();

    rspc::Router::<()>
        ::new()
        .query("auth", |t| {
            t(|_ctx, _: ()| async move {
                let notary_server = std::env
                    ::var("NOTARY_HOST")
                    .expect("missing env var 'NOTARY_HOST'");
                let notary_svc_key = std::env
                    ::var("NOTARY_KEY")
                    .expect("missing env var 'NOTARY_KEY'");

                let NotaryAuthResp { url } = reqwest
                    ::get(
                        format!(
                            "{}/authorize/ticoder?via=google&key={}&callback=http://localhost:3000/token",
                            notary_server,
                            notary_svc_key
                        )
                    ).await
                    .or_server_error("failed to connect to notary server")?
                    .text().await
                    .or_server_error("error reading from notary server")?
                    .pipe(|it| serde_json::from_str(&it).unwrap());

                Ok(GetAuthResp {
                    url,
                })
            })
        })
        .middleware(|builder| {
            builder.middleware(|prev| async move {
                Ok(prev.with_ctx(ServerContext { actor_id: 0 }))
            })
        })
        .query("me", |t| {
            t(|ctx, _: ()| async move {
                let user = get_prisma_client()
                    .user()
                    .find_first(vec![user::id::equals(ctx.actor_id)])
                    .exec().await
                    .unwrap()
                    .or_bad_request(format!("unknown actor_id: {}", ctx.actor_id))?;

                Ok(user)
            })
        })
        .mutation("mut", |t| t(|ctx, var: (String, String)| { TestResult(var.0, var.1) }))
        .build()
        .arced()
}
