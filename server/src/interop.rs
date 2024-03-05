use std::{any::Any, cell::OnceCell, collections::HashMap, ops::Deref, sync::Arc};

use axum::{
    body::{self, Bytes},
    extract::{FromRequest, Path, Request},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json,
};

use http::{HeaderMap, StatusCode};
use rspc::{
    internal::jsonrpc::{self, JsonRPCError},
    ExecError,
};

use crate::{maybe, status};
use tap::Pipe;

pub trait ExecErrorIntoResponse {
    fn into_response(self) -> Response;
}

impl ExecErrorIntoResponse for ExecError {
    fn into_response(self) -> Response {
        let err: JsonRPCError = self.into();

        (
            StatusCode::from_u16(err.code as u16).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
            serde_json::to_string(&err).unwrap(),
        )
            .into_response()
    }
}

pub trait IntoAxumRouter<S: Clone + Send + Sync + 'static = ()> {
    /// Although `rspc` does ship an `axum` integration, it is broken for newer versions of `axum`. As such, we roll our own integration here.
    fn into_axum_router(self, path: &str) -> axum::Router<S>;
}

impl<S: Clone + Send + Sync + 'static> IntoAxumRouter<S> for rspc::Router<()> {
    fn into_axum_router(self, path: &str) -> axum::Router<S> {
        self.arced().into_axum_router(path)
    }
}

impl<S: Clone + Send + Sync + 'static> IntoAxumRouter<S> for Arc<rspc::Router<()>> {
    fn into_axum_router(self, path_base: &str) -> axum::Router<S> {
        let query_router = self.clone();
        let mutation_router = self.clone();

        let path: &str = &(path_base.to_owned() + "/:id");

        axum::Router::new()
            .route(
                path,
                get(
                    |Path(params): Path<HashMap<String, String>>, headers: HeaderMap| async move {
                        let id = params.get("id").unwrap().to_owned();

                        let exec_result = query_router
                            .exec((), rspc::ExecKind::Query, id.clone(), None)
                            .await;

                        maybe!(exec_result, let err in {
                            return err.into_response();
                        })
                        .pipe(|result| jsonrpc::Response {
                            jsonrpc: "2.0",
                            id: jsonrpc::RequestId::String(id),
                            result: jsonrpc::ResponseInner::Response(result),
                        })
                        .pipe(|rpc_res| Json(rpc_res).into_response())
                    },
                ),
            )
            .route(
                path,
                post(|Path(params): Path<HashMap<String, String>>, headers: HeaderMap, body: String| async move {

                    let id = params.get("id").unwrap().to_owned();

                    let exec_result = mutation_router
                        .exec(
                            (),
                            rspc::ExecKind::Mutation,
                            id.clone(),
                            Some(maybe!(serde_json::from_str(&body), let err in {
                                return status(400, Some(err));
                            })),
                        )
                        .await;

                    maybe!(exec_result, let err in {
                        return err.into_response()
                    })
                    .pipe(|result| jsonrpc::Response {
                        jsonrpc: "2.0",
                        id: jsonrpc::RequestId::String(id),
                        result: jsonrpc::ResponseInner::Response(result),
                    })
                    .pipe(|rpc_res| Json(rpc_res).into_response())
                }),
            )
    }
}
