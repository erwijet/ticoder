import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/$handle")({
    beforeLoad: ({ params: { handle } }) => {
        if (handle.startsWith("@")) throw redirect({ to: "/account/$handle", params: { handle: handle.slice(1) } });
    },
});
