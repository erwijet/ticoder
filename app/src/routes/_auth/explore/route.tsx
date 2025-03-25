import { Group, Text } from "@mantine/core";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { EarthIcon, GroupIcon } from "lucide-react";

export const Route = createFileRoute("/_auth/explore")({
    component: RouteComponent,
    staticData: {
        nav: {
            title: "Explore",
            icon: <EarthIcon />,
            ord: 3,
        },
    },
});

function RouteComponent() {
    return (
        <Group>
            <Text>Matches!</Text>
            <Outlet />
        </Group>
    );
}
