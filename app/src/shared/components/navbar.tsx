import { Box, Group, Text, Stack, Button, Menu, rem, Image, Title, Divider, Space, Avatar, UnstyledButton } from "@mantine/core";
import { Link, useMatches, useNavigate, useRouteContext, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";
import brand from "src/public/brand.png?url";
import { maybe } from "shared/fp";

export function Navbar() {
    const { flatRoutes } = useRouter();
    const { session } = useRouteContext({ from: "/_auth" });
    const nav = useNavigate();
    const matches = useMatches();
    const navRoutes = useMemo(
        () =>
            flatRoutes
                .filter((it) => !!it.options.staticData?.nav)
                .toSorted(
                    (a, b) =>
                        maybe(a.options.staticData?.nav?.ord)
                            ?.binding("a")
                            .bind("b", b.options.staticData?.nav?.ord)
                            ?.take(({ a, b }) => a - b) ?? 0,
                ),
        [flatRoutes],
    );

    function handleLogout() {
        nav({ to: "/logout" });
    }

    return (
        <Box h="100%" w="full" p="md">
            <Stack justify="space-between" h="100%">
                <Stack gap="xs">
                    <Group justify="center" h={rem(40)} w="100%">
                        <Image h={rem(30)} src={brand} />
                        <Title order={1} size="xl">
                            TICoder
                        </Title>
                    </Group>
                    <Space h="xl" />
                    <Stack>
                        {navRoutes
                            .filter((it) => !it.options.staticData?.nav?.parent)
                            .map((route) => (
                                <Link to={route.fullPath}>
                                    <Button
                                        w="100%"
                                        component="div"
                                        variant={matches.some((it) => it.id == route.id) ? "light" : "transparent"}
                                        leftSection={route.options.staticData!.nav!.icon}
                                    >
                                        <Group justify="space-between" w="100%">
                                            <Text size="sm">{route.options.staticData!.nav!.title}</Text>
                                        </Group>
                                    </Button>
                                </Link>
                            ))}
                    </Stack>
                </Stack>
                <Menu position="right">
                    <Menu.Target>
                        <UnstyledButton w="100%" style={{ borderTop: "solid 1px var(--mantine-color-default-border)" }} pt="sm">
                            <Group wrap="nowrap" gap={"xs"}>
                                <Avatar src={session?.picture} size="md" />
                                <Stack gap={0} maw={rem(120)}>
                                    <Text size="sm" truncate="end">
                                        {session?.fullname}
                                    </Text>

                                    <Text size="xs" c="dimmed" truncate="end" title={session?.email}>
                                        {session?.email}
                                    </Text>
                                </Stack>
                            </Group>
                        </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item onClick={handleLogout}>Logout</Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Stack>
        </Box>
    );
}
