import { Center, Loader, Stack, Text } from "@mantine/core";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { qc } from "shared/api";
import { session } from "shared/session";
import { z } from "zod";

function component() {
    const { token } = useSearch({ from: "/token" });
    const nav = useNavigate();

    useEffect(() => {
        session.setToken(token);
        qc.invalidateQueries({ queryKey: session.queryOptions().queryKey });
        nav({ to: "/" });
    }, [token, nav]);

    return (
        <Center h="100vh" w="100pw">
            <Stack align="center">
                <Loader type="bars" />
                <Text size="sm">Getting Everything Ready...</Text>
            </Stack>
        </Center>
    );
}

export const Route = createFileRoute("/token")({
    component,
    validateSearch: (search) => z.object({ token: z.string() }).parse(search),
});
