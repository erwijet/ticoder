use std::{collections::HashMap, sync::Arc};

use axum::{
    body::Body,
    extract::{Path, Query, Request},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, RequestPartsExt,
};

use http::{HeaderMap, StatusCode};
use rspc::{
    internal::jsonrpc::{self, JsonRPCError},
    ExecError,
};
use serde_json::Value;

use crate::{maybe, status};
use tap::Pipe;

pub trait ExecErrorIntoResponse {
    fn into_response(self, id: &str) -> Response;
}

impl ExecErrorIntoResponse for ExecError {
    fn into_response(self, id: &str) -> Response {
        let err: JsonRPCError = self.into();

        (
            StatusCode::from_u16(err.code as u16).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
            serde_json::to_string(&jsonrpc::Response {
                jsonrpc: "2.0",
                id: jsonrpc::RequestId::String(id.to_owned()),
                result: jsonrpc::ResponseInner::Error(err),
            })
            .unwrap(),
        )
            .into_response()
    }
}

pub trait IntoAxumRouter<S: Clone + Send + Sync + 'static = ()> {
    /// Although `rspc` does ship an `axum` integration, it is broken for newer versions of `axum`. As such, we roll our own integration here.
    fn into_axum_router(self, path: &str) -> axum::Router<S>;
}

impl<S: Clone + Send + Sync + 'static> IntoAxumRouter<S> for rspc::Router<HeaderMap> {
    fn into_axum_router(self, path: &str) -> axum::Router<S> {
        self.arced().into_axum_router(path)
    }
}

impl<S: Clone + Send + Sync + 'static> IntoAxumRouter<S> for Arc<rspc::Router<HeaderMap>> {
    fn into_axum_router(self, path_base: &str) -> axum::Router<S> {
        let query_router = self.clone();
        let mutation_router = self.clone();

        let path: &str = &(path_base.to_owned() + "/:id");

        axum::Router::new()
            .route(
                path,
                get(
                    // |Path(params): Path<HashMap<String, String>>, headers: HeaderMap| async move {
                    |request: Request<Body>| async move {
                        let (mut parts, _body) = request.into_parts();

                        let path_params = parts
                            .extract::<Path<HashMap<String, String>>>()
                            .await
                            .map(|Path(path_params)| path_params)
                            .unwrap();

                        let query_params = parts
                            .extract::<Query<HashMap<String, String>>>()
                            .await
                            .map(|Query(params)| params)
                            .unwrap();

                        let headers = parts.headers.clone();
                        let id = path_params.get("id").unwrap().to_owned();

                        let input: Option<Value> = query_params
                            .get("input")
                            .map(|s| serde_json::from_str(s).unwrap());

                        let exec_result = query_router
                            .exec(headers, rspc::ExecKind::Query, id.clone(), input)
                            .await;

                        maybe!(exec_result, let err in {
                            return err.into_response(&id);
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
                post(
                    |Path(params): Path<HashMap<String, String>>,
                     headers: HeaderMap,
                     body: String| async move {
                        let id = params.get("id").unwrap().to_owned();

                        let exec_result = mutation_router
                            .exec(
                                headers,
                                rspc::ExecKind::Mutation,
                                id.clone(),
                                Some(maybe!(serde_json::from_str(&body), let err in {
                                    return status(400, Some(err));
                                })),
                            )
                            .await;

                        maybe!(exec_result, let err in {
                            return err.into_response(&id)
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
    }
}
