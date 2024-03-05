
#[derive(Clone)]
pub struct ServerContext {
    pub actor_id: i32,
}
use axum::response::{self, IntoResponse};
use chrono::{Duration, Utc};
use http::StatusCode;
use jsonwebtoken::{self, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

use crate::prisma;

const JWT_EXPIRATION_HOURS: i64 = 24;
const SECRET: &str = "SECRET";

type UserModel = prisma::user::Data;

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct Claims {
    pub email: String,
    pub given_name: String,
    pub surname: String,
    pub picture: String,
    pub id: i32,
    exp: i64,
}

impl From<UserModel> for Claims {
    fn from(value: UserModel) -> Self {
        Self {
            email: value.email,
            surname: value.surname,
            given_name: value.given_name,
            id: value.id,
            picture: value.picture,
            exp: (Utc::now() + Duration::hours(JWT_EXPIRATION_HOURS)).timestamp(),
        }
    }
}

/// Create a json web token (JWT)
pub(crate) fn create_jwt(claims: Claims) -> Result<String, StatusCode> {
    let encoding_key = EncodingKey::from_secret(SECRET.as_bytes());
    jsonwebtoken::encode(&Header::default(), &claims, &encoding_key)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

/// Decode a json web token (JWT)
pub(crate) fn decode_jwt(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let decoding_key = DecodingKey::from_secret(SECRET.as_bytes());
    jsonwebtoken::decode::<Claims>(token, &decoding_key, &Validation::default())
        .map(|data| data.claims)
}
