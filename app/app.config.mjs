import { createApp } from "vinxi";
import reactRefresh from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import commonjs from "vite-plugin-commonjs";

export default createApp({
    server: {
        preset: "koyeb", // needed for docker support
        experimental: {
            asyncContext: true,
        },
    },
    routers: [
        {
            type: "static",
            name: "public",
            dir: "./public",
        },
        {
            type: "http",
            name: "trpc",
            base: "/trpc",
            handler: "./src/api/trpc.handler.ts",
            target: "server",
            plugins: () => [reactRefresh(), tsConfigPaths(), commonjs()],
        },
        {
            type: "spa",
            name: "client",
            handler: "./index.html",
            target: "browser",
            plugins: () => [
                TanStackRouterVite({
                    routesDirectory: "./src/routes",
                    generatedRouteTree: "./src/routeTree.gen.ts",
                    autoCodeSplitting: true,
                }),
                reactRefresh(),
                tsConfigPaths(),
                commonjs(),
            ],
        },
    ],
});
