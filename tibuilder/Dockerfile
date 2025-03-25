FROM rust:bullseye
WORKDIR /app

COPY ./ /app

RUN cargo build --release

CMD ["./target/release/tibuilder"]