# FROM rust:bullseye
# WORKDIR /app

# COPY ./ /app

# RUN cargo prisma generate --schema=./server/prisma-cli/schema.prisma
# RUN cargo build --bin ticoder-server --release

# CMD ["./target/release/ticoder-server"]

FROM node:20-alpine AS base
RUN npm i -g pnpm

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nitro
COPY --from=builder /app .
USER nitro
EXPOSE 3000
ENV PORT 3000

CMD ["pnpm", "start"]