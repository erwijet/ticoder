import { createFileRoute } from "@tanstack/react-router";
import { EarthIcon } from "lucide-react";

export const Route = createFileRoute("/_auth/explore")({
    staticData: {
        nav: {
            title: "Explore",
            icon: <EarthIcon />,
            ord: 2,
        },
    },
});
