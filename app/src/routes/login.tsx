import { Button, Card, Image, Space, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { trpc } from "shared/api";
import { GoogleSvg } from "shared/svg/Google";
import brand from "src/public/brand.png";
import { z } from "zod";

function component() {
    const [{ url }] = trpc.session.authenticate.useSuspenseQuery("google");
    const to = Route.useSearch()?.to;

    useEffect(() => {
        if (to) localStorage.setItem("dev.ticoder.app.login-target", to);
        else localStorage.removeItem("dev.ticoder.app.login-target");
    }, [to]);

    function handleSignInWithGoogle() {
        window.location.href = url;
    }

    return (
        <Stack h="100vh" w="100vw" bg="gray.0">
            <Card shadow="md" padding="lg" radius="md" m="auto" withBorder>
                <Card.Section inheritPadding my="md">
                    <Stack align="center" my="0">
                        <Stack gap={0} align="center">
                            <Image src={brand} h={80} w={80} />
                            <Title order={1}>TiCoder</Title>
                            <Text size="sm" mt="xs" c="dimmed">
                                Sign in to continute to your account
                            </Text>
                        </Stack>
                        <Space h="xl" />
                        <Text size="sm" c="dimmed">
                            Welcome to TiCoder. Please sign in to continue.
                        </Text>
                    </Stack>
                </Card.Section>

                <Card.Section>
                    <Stack w="100%" bg="gray.1" p="lg" mt="md" gap="md">
                        <Button
                            size="lg"
                            variant="default"
                            w="100%"
                            leftSection={<GoogleSvg />}
                            style={{ fontSize: "inherit" }}
                            onClick={handleSignInWithGoogle}
                        >
                            Sign in with Google
                        </Button>
                        <Text size="xs" c="dimmed">
                            By signing in, you agree to our Terms of Service and Privacy Policy
                        </Text>
                    </Stack>
                </Card.Section>
            </Card>
        </Stack>
    );
}

export const Route = createFileRoute("/login")({
    validateSearch: z.object({ to: z.string().optional() }),
    component,
});
