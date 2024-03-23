FROM rust:bullseye
WORKDIR /app

COPY ./ /app

RUN cargo prisma generate
RUN cargo build --bin ticoder-server --release

CMD ["./target/release/ticoder-server"]
