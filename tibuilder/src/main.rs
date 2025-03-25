#[allow(dead_code)]
use rocket::{
    http::Status,
    outcome::Outcome,
    request::{self, FromRequest, Request},
    serde::json::Json,
};

use serde::{Deserialize, Serialize};

#[macro_use]
extern crate rocket;

struct Token(String);

#[derive(Debug)]
enum TokenError {
    Missing,
    Invalid,
}

#[derive(Deserialize)]
struct NotaryInspection {
    claims: NotaryClaims,
}

#[derive(Deserialize)]
struct NotaryClaims {
    aud: String,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Token {
    type Error = TokenError;

    async fn from_request(request: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let token = match request.headers().get_one("Authorization") {
            Some(token) => token.strip_prefix("Bearer ").unwrap_or(token).to_string(),
            None => return Outcome::Error((Status::Unauthorized, TokenError::Missing)),
        };

        let notary_resp =
            match reqwest::get(format!("https://notary.ticoder.dev/inspect/{}", token)).await {
                Ok(resp) => resp,
                Err(_) => {
                    return Outcome::Error((Status::InternalServerError, TokenError::Invalid));
                }
            };

        let bytes = match notary_resp.bytes().await {
            Ok(bytes) => bytes,
            Err(_) => return Outcome::Error((Status::InternalServerError, TokenError::Invalid)),
        };

        let res = match serde_json::from_slice::<NotaryInspection>(&bytes) {
            Ok(res) => res,
            Err(_) => return Outcome::Error((Status::Unauthorized, TokenError::Invalid)),
        };

        if res.claims.aud != "ticoder" {
            return Outcome::Error((Status::Unauthorized, TokenError::Invalid));
        }

        Outcome::Success(Token(token))
    }
}

#[derive(Deserialize)]
struct CompileRequestBody {
    name: String,
    source: String,
}

#[derive(Serialize)]
struct CompileResponseBody {
    bytes: Vec<u8>,
}

#[post("/build", format = "json", data = "<body>")]
fn build(
    body: Json<CompileRequestBody>,
    _token: Token, // require auth
) -> Result<Json<CompileResponseBody>, Status> {
    let tokens = tibrs::parse_str(&body.source).map_err(|err| {
        println!("{err:?}");
        Status::BadRequest
    })?;
    let mut name = body.name.to_ascii_uppercase();
    name.truncate(8);

    Ok(Json(CompileResponseBody {
        bytes: tibrs::compile(tokens, name.as_bytes()).map_err(|err| {
            println!("{err:?}");
            Status::BadRequest
        })?,
    }))
}

#[get("/")]
fn index() -> &'static str {
    return "ok";
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![index, build])
}
