import { notifications } from "@mantine/notifications";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, retryLink } from "@trpc/client";
import { createTRPCQueryUtils, createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "src/api/trpc.handler";
import { session } from "src/shared/session";
import superjson from "superjson";

const retry = retryLink({
    retry(opts) {
        if (opts.error.data?.code == "CONFLICT") {
            notifications.show({
                color: "red",
                title: "Operation Failed",
                message: "A resource with that name already exists!",
            });
        }

        if (opts.error.data?.code == "UNAUTHORIZED") {
            window.location.href = "/logout"; // not too fond, but whatever
        }

        return false; // don't retry
    },
});

export const api = createTRPCClient<AppRouter>({
    links: [
        retry,
        httpBatchLink({
            transformer: superjson,
            headers: () => ({
                Authorization: `Bearer ${session.getToken()}`,
            }),
            url: "/trpc",
        }),
    ],
});

export const trpc = createTRPCReact<AppRouter>({});

export const client = trpc.createClient({
    links: [
        retry,
        httpBatchLink({
            transformer: superjson,
            headers: () => ({
                Authorization: `Bearer ${session.getToken()}`,
            }),
            url: "/trpc",
        }),
    ],
});

export const qc = new QueryClient({
    defaultOptions: {
        mutations: {
            throwOnError: false,
        },
    },
});

export const trpcQC = createTRPCQueryUtils({
    queryClient: qc,
    client: client,
});
