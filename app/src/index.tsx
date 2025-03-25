import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { createRouter, RouterProvider, useNavigate } from "@tanstack/react-router";
import { routeTree, FileRoutesByFullPath } from "./routeTree.gen";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { createTheme, MantineProvider } from "@mantine/core";
import { trpc, client } from "shared/api";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/spotlight/styles.css";
import { theme } from "shared/theme";
import { qc } from "shared/api";
import { SessionRenewer } from "shared/session";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }

    type NavMeta = { title: string; icon: ReactNode; ord?: number; parent?: keyof FileRoutesByFullPath };

    interface StaticDataRouteOption {
        nav?: NavMeta;
    }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <trpc.Provider client={client} queryClient={qc}>
            <QueryClientProvider client={qc}>
                <MantineProvider theme={theme}>
                    <ModalsProvider modalProps={{ centered: true }}>
                        <Notifications />
                        <RouterProvider router={router} />
                    </ModalsProvider>
                </MantineProvider>
            </QueryClientProvider>
        </trpc.Provider>
    </StrictMode>,
);
