use std::sync::OnceLock;

use crate::prisma::PrismaClient;

static PRISMA_CLIENT: OnceLock<PrismaClient> = OnceLock::new();

pub async fn init_prisma_client() {
    PRISMA_CLIENT
        .set(PrismaClient::_builder().build().await.unwrap())
        .unwrap();
}

pub fn get_prisma_client() -> &'static PrismaClient {
    PRISMA_CLIENT.get().unwrap()
}
