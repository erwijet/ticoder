import { createNotary, Notary } from "@erwijet/notary";
import { PrismaClient } from "@prisma/client";
import { runCatching } from "shared/fns";
import { initTRPC, TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";
import { defineEventHandler, toWebRequest } from "vinxi/http";
import superjson from "superjson";
import { z } from "zod";

const notary = createNotary({
    client: "ticoder",
    url: "https://notary.ticoder.dev",
    callback: process.env["NOTARY_CALLBACK"]!,
    key: process.env["NOTARY_KEY"]!,
});

const prisma = new PrismaClient();

const t = initTRPC.context<{ token: string }>().create({ transformer: superjson });

const ensure = {
    nonnull<T>(): (t: T) => NonNullable<T> {
        return (t: T) => t ?? fail("NOT_FOUND");
    },
};

function fail<T>(code: TRPC_ERROR_CODE_KEY): NonNullable<T> {
    throw new TRPCError({ code });
}

function ok() {
    return { ok: true };
}

function createNotaryTrpcAuthenticationPlugin({ notary }: { notary: Notary }) {
    const t = initTRPC.context<{ token: string }>().create({ transformer: superjson });

    return t.procedure.use(async ({ ctx: { token }, next }) => {
        const auth = await runCatching(() => notary.inspect(token));

        if (!auth?.valid) throw fail("UNAUTHORIZED");

        return next({
            ctx: {
                user: auth.claims,
                userId: auth.claims.userId,
            },
        });
    });
}

const _authenticated = t.procedure.unstable_concat(createNotaryTrpcAuthenticationPlugin({ notary }));

const authenticated = Object.assign(_authenticated, {
    resource: _authenticated.use(async ({ ctx, next }) => {
        const account = await prisma.account.findFirst({ where: { userId: ctx.userId } });
        if (!account) throw fail("PRECONDITION_FAILED");

        return next({
            ctx: {
                ...ctx,
                account,
            },
        });
    }),
});

const appRouter = t.router({
    session: {
        get: authenticated.query(({ ctx: { user } }) => ({
            user,
        })),
        authenticate: t.procedure.input(z.literal("google")).query(({ input: via }) => notary.authenticate({ via })),
        renew: authenticated.query(({ ctx: { token } }) => notary.renew(token)),
    },
    isHandleAvalible: t.procedure
        .input(z.string())
        .query(({ input: handle }) => prisma.account.findFirst({ where: { handle } }).then((it) => !it)),
    account: {
        get: authenticated.query(({ ctx: { userId } }) => prisma.account.findFirst({ where: { userId } })),
        create: authenticated.input(z.object({ displayName: z.string(), handle: z.string() })).mutation(({ input, ctx: { user } }) =>
            prisma.account.create({
                data: {
                    ...input,
                    email: user.email,
                    userId: user.userId,
                },
            }),
        ),
    },
    project: {
        get: authenticated.resource.input(z.string().cuid()).query(({ input: id, ctx: { account } }) =>
            prisma.project
                .findFirst({
                    where: {
                        AND: [
                            {
                                id,
                                OR: [{ account }, { published: true }],
                            },
                        ],
                    },
                })
                .then(ensure.nonnull()),
        ),
        mine: authenticated.resource.query(({ ctx: { account } }) => prisma.project.findMany({ where: { account } })),
        duplicate: authenticated.resource.input(z.string().cuid()).mutation(({ ctx: { account }, input: id }) =>
            prisma.project
                .findFirst({
                    where: {
                        AND: [
                            {
                                id,
                                OR: [{ account }, { published: true }],
                            },
                        ],
                    },
                })
                .then(ensure.nonnull())
                .then(({ accountId, id, name, ...rest }) =>
                    prisma.project.create({ data: { ...rest, name: `Copy of ${name}`, account: { connect: account } } }),
                ),
        ),
        create: authenticated.resource
            .input(z.object({ name: z.string() }))
            .mutation(({ ctx: { account }, input }) =>
                prisma.project.create({ data: { ...input, blockly: "", source: "", account: { connect: account } } }),
            ),
        delete: authenticated.resource
            .input(z.string().cuid())
            .mutation(({ ctx: { account }, input: id }) => prisma.project.delete({ where: { account, id } })),
        update: authenticated.resource
            .input(z.object({ id: z.string().cuid(), name: z.string(), blockly: z.string(), source: z.string(), published: z.boolean() }))
            .mutation(({ ctx: { account }, input }) => prisma.project.update({ where: { id: input.id, account }, data: input })),
        compile: authenticated.resource.input(z.string().cuid()).mutation(({ input: id, ctx: { account, token } }) =>
            prisma.project
                .findFirst({ where: { AND: [{ id }, { OR: [{ published: true }, { account }] }] } })
                .then(ensure.nonnull())
                .then(({ source, name }) =>
                    fetch(`${process.env["TIBUILDER_URL"]}/build`, {
                        method: "POST",
                        headers: {
                            "content-type": "application/json",
                            authorization: "Bearer " + token,
                        },
                        body: JSON.stringify({ source, name }),
                    }),
                )
                .then((res) => {
                    if (!res.ok) throw fail("BAD_REQUEST");
                    return res.json();
                })
                .then(z.object({ bytes: z.number().array() }).parse),
        ),
    },
});

export type AppRouter = typeof appRouter;

export default defineEventHandler((event) => {
    const request = toWebRequest(event);

    return fetchRequestHandler({
        endpoint: "/trpc",
        req: request,
        router: appRouter,
        async createContext({ req }) {
            const token = req.headers.get("Authorization")?.split("Bearer ")[1] ?? "";
            return { token };
        },
    });
});
