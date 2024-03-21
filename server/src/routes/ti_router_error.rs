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
