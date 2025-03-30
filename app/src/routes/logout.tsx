import { Center, Loader, Stack, Text } from "@mantine/core";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { session } from "shared/session";

function component() {
    const nav = useNavigate();

    useEffect(() => {
        session.clear();
        nav({ to: "/login" });
    }, []);

    return (
        <Center h="100vh" w="100pw">
            <Stack align="center">
                <Loader type="bars" />
                <Text size="sm">Goodbye</Text>
            </Stack>
        </Center>
    );
}

export const Route = createFileRoute("/logout")({
    component,
});
