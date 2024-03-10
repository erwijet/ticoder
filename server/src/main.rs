mod db;
mod interop;
mod macros;
#[allow(warnings, unused)]
mod prisma;
mod router;
mod util;
mod notary;
mod routes;

use std::{borrow::Borrow, collections::HashMap, ops::Deref, os::macos::raw::stat, sync::Arc};

use axum::{
    body::{Body, Bytes},
    extract::Path,
    response::{IntoResponse, Response},
    routing::{get, post, MethodRouter},
    Json,
};

use db::init_prisma_client;
use dotenv::dotenv;
use interop::IntoAxumRouter;

use http::{Request, StatusCode};
use router::get_router;
use rspc::{
    internal::jsonrpc::{self, JsonRPCError},
    ExecError,
};
use serde_json::json;
use tap::Pipe;
use tower_http::cors::{Any, CorsLayer};
use util::get_project_root;

fn status<S: ToString>(code: u16, msg: Option<S>) -> Response {
    let msg: String = match msg {
        Some(msg) => msg.to_string(),
        None => "Error".to_owned(),
    };

    let code = StatusCode::from_u16(code).unwrap();

    (code, msg).into_response()
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    init_prisma_client().await;
    get_router()
        .export_ts(format!(
            "{}/../src/codegen/api.d.ts",
            get_project_root().unwrap()
        ))
        .unwrap();

    let app = axum::Router::new()
        .route("/", get(|| async { "ok" }))
        .merge(get_router().into_axum_router("/rspc"))
        .layer(CorsLayer::new().allow_origin(Any).allow_headers(Any));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
