import { createNotary, Notary } from "@erwijet/notary";
import { PrismaClient } from "@prisma/client";
import { initTRPC, TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";
import { runCatching } from "shared/fns";
import superjson from "superjson";
import { defineEventHandler, toWebRequest } from "vinxi/http";
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
        self: {
            get: authenticated.query(({ ctx: { userId } }) => prisma.account.findFirst({ where: { userId } })),
            profile: authenticated.resource.query(({ ctx: { userId } }) =>
                prisma.account
                    .findFirst({ where: { userId }, include: { followers: true, following: true, projects: true, stars: true } })
                    .then(ensure.nonnull()),
            ),
        },
        isFollowing: authenticated.resource
            .input(z.string().cuid())
            .query(({ ctx: { account }, input }) =>
                prisma.follower.findMany({ where: { followerId: account.id, followingId: input } }).then((it) => it.length > 0),
            ),
        get: authenticated.input(z.string().cuid()).query(({ input }) =>
            prisma.account
                .findFirst({
                    where: { id: input },
                    include: { followers: true, following: true, projects: true, stars: true },
                })
                .then(ensure.nonnull()),
        ),
        byHandle: authenticated.input(z.string()).query(({ input }) =>
            prisma.account
                .findFirst({
                    where: { handle: input.trim().replaceAll("@", "").toLowerCase() },
                    include: { followers: true, following: true, projects: true, stars: true },
                })
                .then(ensure.nonnull()),
        ),
        follow: authenticated.resource
            .input(z.string())
            .mutation(({ ctx: { account }, input }) => prisma.follower.create({ data: { followerId: account.id, followingId: input } })),
        unfollow: authenticated.resource
            .input(z.string())
            .mutation(({ ctx: { account }, input }) =>
                prisma.follower.deleteMany({ where: { followerId: account.id, followingId: input } }),
            ),
        search: authenticated
            .input(z.string())
            .query(({ input }) => prisma.account.findMany({ where: { handle: { contains: input } }, take: 10 })),
        create: authenticated.input(z.object({ displayName: z.string(), handle: z.string() })).mutation(({ input, ctx: { user } }) =>
            prisma.account.create({
                data: {
                    ...input,
                    email: user.email,
                    userId: user.userId,
                },
            }),
        ),
        delete: authenticated.resource.mutation(async ({ ctx: { account } }) => {
            await prisma.star.deleteMany({ where: { account } });
            await prisma.star.deleteMany({ where: { project: { account } } });
            await prisma.follower.deleteMany({ where: { following: account } });
            await prisma.follower.deleteMany({ where: { follower: account } });
            await prisma.project.deleteMany({ where: { account } });
            await prisma.account.delete({ where: account });
        }),
    },
    projects: {
        ownedBy: authenticated.resource
            .input(z.string().cuid())
            .query(({ input }) =>
                prisma.project.findMany({ where: { accountId: input }, include: { account: true, _count: { select: { stars: true } } } }),
            ),
        deleteAll: authenticated.resource.mutation(({ ctx: { account } }) => prisma.project.deleteMany({ where: { account } })),
        following: authenticated.resource.query(({ ctx: { account } }) =>
            prisma.project.findMany({
                where: { account: { followers: { some: { followerId: account.id } } } },
                include: { _count: { select: { stars: true } }, account: true },
            }),
        ),
        top: authenticated.query(() =>
            prisma.project.findMany({
                where: { published: true },
                orderBy: { stars: { _count: "desc" } },
                include: { account: true, _count: { select: { stars: true } } },
                take: 10,
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
        isStarred: authenticated.resource
            .input(z.string().cuid())
            .query(({ ctx: { account }, input }) =>
                prisma.star.findMany({ where: { account, projectId: input } }).then((it) => it.length > 0),
            ),
        star: authenticated.resource
            .input(z.string().cuid())
            .mutation(({ ctx: { account }, input }) =>
                prisma.star.create({ data: { account: { connect: { id: account.id } }, project: { connect: { id: input } } } }),
            ),
        unstar: authenticated.resource
            .input(z.string().cuid())
            .mutation(({ ctx: { account }, input }) => prisma.star.deleteMany({ where: { account, projectId: input } })),
        mine: authenticated.resource.query(({ ctx: { account } }) =>
            prisma.project.findMany({ where: { account }, include: { stars: true } }),
        ),
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
            .mutation(({ ctx: { account }, input: id }) =>
                prisma.star.deleteMany({ where: { projectId: id } }).then(() => prisma.project.delete({ where: { account, id } })),
            ),
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
