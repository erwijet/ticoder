import { queryOptions } from "@tanstack/react-query";
import { useEffect } from "react";
import { api, trpc } from "shared/api";
import { runCatching } from "shared/fns";
import { logger } from "shared/logger";

const key = "dev.ticoder.notary.token";

export const session = {
    getToken: () => localStorage.getItem(key),
    setToken: (token: string) => localStorage.setItem(key, token),
    clear: () => localStorage.removeItem(key),
    queryOptions: () =>
        queryOptions({
            queryKey: ["session"],
            queryFn: async () => {
                const result = await runCatching(() => api.session.get.query());

                const computed = {
                    initials: (result?.user.givenName.toUpperCase().at(0) ?? "") + result?.user.familyName.toUpperCase().at(0),
                };

                return { ...result?.user, ...computed };
            },
        }),
};

export const SessionRenewer = () => {
    const { data } = trpc.session.renew.useQuery(void 0, {
        refetchInterval: 2 * 60 * 1000, // 2 minutes
        refetchIntervalInBackground: true,
    });

    useEffect(() => {
        if (!data?.ok) logger.error(data?.reason);
        else session.setToken(data.token);
    }, [data]);

    return null;
};
