mod db;
mod macros;
mod notary;
#[allow(warnings, unused)]
mod prisma;
mod router;
mod routes;
mod util;

use axum::routing::get;

use db::init_prisma_client;
use dotenv::dotenv;

use router::{build_router, UnauthedCtx};
use tower_http::cors::{Any, CorsLayer};
use util::get_project_root;

#[tokio::main]
async fn main() {
    dotenv().ok();

    init_prisma_client().await;
    build_router()
        .export_ts(format!(
            "{}/../src/codegen/api.d.ts",
            get_project_root().unwrap()
        ))
        .unwrap();

    let app = axum::Router::new()
        .route("/", get(|| async { "ok" }))
        .merge(rspc_axum::endpoint(build_router(), |headers: axum::http::HeaderMap| UnauthedCtx(headers)))
        .layer(CorsLayer::new().allow_origin(Any).allow_headers(Any));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
