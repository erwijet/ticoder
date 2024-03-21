use prisma_client_rust::{and, or};
use rspc::{Router, RouterBuilder};
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::{
    db::get_prisma_client, maybe, prisma::program, router::AuthedCtx, routes::TicoderRouterError,
    util::expect,
};

#[derive(Deserialize, Type)]
struct GetProgramParams {
    program_id: i32,
}

#[derive(Deserialize, Type)]
struct CreateProgramParams {
    name: String,
    blockly: String,
}

#[derive(Deserialize, Type)]
struct UpdateProgramParams {
    id: i32,
    name: String,
    blockly: String,
    public: bool,
}

#[derive(Deserialize, Type)]
struct CompileProgramParams {
    program_id: i32,
}

#[derive(Serialize, Type)]
#[serde(tag = "status")]
enum CompileProgramResp {
    Ok { buffer: Vec<u8> },
    Err { reason: String },
}

pub fn get_router() -> RouterBuilder<AuthedCtx, ()> {
    Router::<AuthedCtx>::new()
        .query("get", |t| {
            t(|ctx, params: GetProgramParams| async move {
                let doc = get_prisma_client()
                    .program()
                    .find_first(vec![and![
                        program::id::equals(params.program_id),
                        or![
                            program::user_id::equals(ctx.claims.user_id),
                            program::public::equals(true)
                        ]
                    ]])
                    .exec()
                    .await
                    .or_server_error("failed to query programs")?
                    .or_not_found()?;

                Ok(doc)
            })
        })
        .query("list", |t| {
            t(|ctx, _: ()| async move {
                get_prisma_client()
                    .program()
                    .find_many(vec![program::user_id::equals(ctx.claims.user_id)])
                    .exec()
                    .await
                    .or_server_error("failed to query programs")
            })
        })
        .mutation("create", |t| {
            t(|ctx, params: CreateProgramParams| async move {
                get_prisma_client()
                    .program()
                    .create(
                        ctx.claims.user_id,
                        params.name,
                        vec![program::blockly::set(Some(params.blockly))],
                    )
                    .exec()
                    .await
                    .or_server_error("failed to insert program")
            })
        })
        .mutation("update", |t| {
            t(|ctx, params: UpdateProgramParams| async move {
                // check for ownership
                get_prisma_client()
                    .program()
                    .find_first(vec![and![
                        program::id::equals(params.id),
                        program::user_id::equals(ctx.claims.user_id)
                    ]])
                    .exec()
                    .await
                    .or_server_error("failed to check ownership")?
                    .or_not_found()?;

                // then, update
                get_prisma_client()
                    .program()
                    .update(
                        program::id::equals(params.id),
                        vec![
                            program::name::set(params.name),
                            program::public::set(params.public),
                            program::blockly::set(Some(params.blockly)),
                        ],
                    )
                    .exec()
                    .await
                    .or_server_error("failed to update record")
            })
        })
        .mutation("delete", |t| {
            t(|ctx, id: i32| async move {
                let delete_count = get_prisma_client()
                    .program()
                    .delete_many(vec![and![
                        program::id::equals(id),
                        program::user_id::equals(ctx.claims.user_id)
                    ]])
                    .exec()
                    .await
                    .or_server_error("failed to delete record")?;

                expect(delete_count == 0).or_not_found()?;
                Ok(())
            })
        })
        .query("compile", |t| {
            t(|ctx, params: CompileProgramParams| async move {
                let doc = get_prisma_client()
                    .program()
                    .find_first(vec![and![
                        program::id::equals(params.program_id),
                        or![
                            program::user_id::equals(ctx.claims.user_id),
                            program::public::equals(true)
                        ]
                    ]])
                    .exec()
                    .await
                    .or_server_error("failed to query program")?
                    .or_not_found()?;

                let blockly = doc
                    .blockly
                    .or_bad_request("program has no body to compile")?;

                let tokens = maybe!(tibrs::parse_str(&blockly), let err in {
                    return Ok(CompileProgramResp::Err { reason: err.to_string() });
                });

                let mut name = doc.name;
                name.truncate(8);
                name.make_ascii_uppercase();

                let buffer = maybe!(tibrs::compile(tokens, name.as_bytes()), let err in {
                    return Ok(CompileProgramResp::Err { reason: err.to_string() });
                });

                Ok(CompileProgramResp::Ok { buffer })
            })
        })
}
