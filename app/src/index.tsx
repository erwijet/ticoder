import "src/index.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/spotlight/styles.css";

import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { ReactNode, StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { client, trpc } from "shared/api";
import { FileRoutesByFullPath, routeTree } from "src/routeTree.gen";
import { qc } from "shared/api";
import { theme, cssVariablesResolver } from "shared/theme";

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
                {/* <ReactQueryDevtools initialIsOpen={false} /> */}
                <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver}>
                    <ModalsProvider modalProps={{ centered: true }}>
                        <Notifications />
                        <RouterProvider router={router} />
                    </ModalsProvider>
                </MantineProvider>
            </QueryClientProvider>
        </trpc.Provider>
    </StrictMode>,
);
