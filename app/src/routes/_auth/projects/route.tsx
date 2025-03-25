import { createFileRoute } from "@tanstack/react-router";
import { BlocksIcon } from "lucide-react";

export const Route = createFileRoute("/_auth/projects")({
    staticData: {
        nav: {
            title: "Projects",
            icon: <BlocksIcon />,
            ord: 1,
        },
    },
});
