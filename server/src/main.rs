mod db;
mod interop;
mod macros;
mod notary;
#[allow(warnings, unused)]
mod prisma;
mod router;
mod routes;
mod util;

use axum::{
    response::{IntoResponse, Response},
    routing::get,
};

use db::init_prisma_client;
use dotenv::dotenv;
use interop::IntoAxumRouter;

use http::StatusCode;
use router::get_router;
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
