import {
    ActionIcon,
    Avatar,
    Box,
    Button,
    Divider,
    Group,
    HoverCard,
    Image,
    Menu,
    rem,
    Space,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { Link, useMatches, useNavigate, useRouteContext, useRouter } from "@tanstack/react-router";
import { MenuItem } from "blockly";
import { profile } from "console";
import {
    BotOffIcon,
    FileX2,
    FileX2Icon,
    HeartCrackIcon,
    HeartOffIcon,
    LogOutIcon,
    ShareIcon,
    SkullIcon,
    TrashIcon,
    UserIcon,
    UserMinus,
    UserMinus2Icon,
    UserMinusIcon,
} from "lucide-react";
import { useMemo } from "react";
import { alert } from "shared/alert";
import { trpc } from "shared/api";
import { maybe } from "shared/fp";
import { useTracer } from "shared/use-tracer";
import brand from "src/public/brand.png?url";
import { match } from "ts-pattern";

export function Navbar() {
    const { flatRoutes } = useRouter();
    const { session, account } = useRouteContext({ from: "/_auth" });
    const { trace, isLoading } = useTracer("erase-all");
    const nav = useNavigate();
    const clipboard = useClipboard();
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

    const { mutateAsync: deleteAllProjects } = trpc.projects.deleteAll.useMutation();

    function handle(action: "go-profile" | "go-logout" | "share" | "erase-all" | "delete-account") {
        match(action)
            .with("go-profile", () => nav({ to: "/account/$handle", params: { handle: account.handle } }))
            .with("go-logout", () => nav({ to: "/logout" }))
            .with("share", () => {
                clipboard.copy(`https://app.ticoder.dev/@${account.handle}`);
                alert.ok("URL copied to clipboard.");
            })
            .with("erase-all", () => {
                trace("erase-all")(deleteAllProjects());
            })
            .with("delete-account", () => {
                modals.openConfirmModal({
                    title: <Title order={3}>Delete Account</Title>,
                    children: (
                        <Text>Are you sure you want to delete your account and all associated data? This action cannot be undone.</Text>
                    ),
                    labels: {
                        cancel: "Cancel",
                        confirm: "Goodbye",
                    },
                    confirmProps: {
                        color: "red",
                        leftSection: <HeartCrackIcon size={16} />,
                    },
                });
            })
            .exhaustive();
    }

    function handleLogout() {
        nav({ to: "/logout" });
    }

    return (
        <Box h="100%" w="full" py="md">
            <Stack justify="space-between" h="100%">
                <Stack gap="xs">
                    <Group justify="center" h={rem(40)} w="100%">
                        <Image h={rem(30)} src={brand} />
                    </Group>
                    <Space h="xl" />
                    <Stack>
                        {navRoutes
                            .filter((it) => !it.options.staticData?.nav?.parent)
                            .map((route) => (
                                <Link to={route.fullPath} style={{ width: "min-content", margin: "0px auto" }}>
                                    <Tooltip label={route.options.staticData?.nav?.title} position="right">
                                        <ActionIcon
                                            component="div"
                                            variant={matches.some((it) => it.id == route.id) ? "light" : "transparent"}
                                            size="xl"
                                        >
                                            {route.options.staticData?.nav?.icon}
                                        </ActionIcon>
                                    </Tooltip>
                                </Link>
                            ))}
                    </Stack>
                </Stack>

                <HoverCard shadow="sm" position="right" radius="md">
                    <HoverCard.Target>
                        <Avatar
                            src={session?.picture}
                            size="md"
                            style={{ margin: "0px auto", border: "solid 1px var(--mantine-color-default-border)" }}
                        />
                    </HoverCard.Target>
                    <HoverCard.Dropdown>
                        <Group wrap="nowrap" gap={"xs"}>
                            <Avatar src={session?.picture} size="md" />
                            <Stack gap={0} maw={rem(120)}>
                                <Text size="sm" truncate="end">
                                    {session?.fullname}
                                </Text>

                                <Text size="xs" c="dimmed" truncate="end" title={session?.email}>
                                    @{account?.handle}
                                </Text>
                            </Stack>
                        </Group>
                        <Divider my="md" mx="-md" />
                        <Group justify="space-evenly">
                            <ActionIcon.Group>
                                <Tooltip label="My profile">
                                    <ActionIcon size="lg" variant="default" onClick={() => handle("go-profile")}>
                                        <UserIcon size={16} />
                                    </ActionIcon>
                                </Tooltip>

                                <Tooltip label="Share">
                                    <ActionIcon size="lg" variant="default" onClick={() => handle("share")}>
                                        <ShareIcon size={16} />
                                    </ActionIcon>
                                </Tooltip>

                                <Tooltip label="Logout">
                                    <ActionIcon size="lg" variant="default" onClick={() => handle("go-logout")}>
                                        <LogOutIcon size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </ActionIcon.Group>

                            <Menu position="right">
                                <Tooltip label="Danger zone">
                                    <Menu.Target>
                                        <ActionIcon size="lg" variant="default">
                                            <SkullIcon size={16} />
                                        </ActionIcon>
                                    </Menu.Target>
                                </Tooltip>
                                <Menu.Dropdown>
                                    <Menu.Item leftSection={<FileX2Icon size={16} />} onClick={() => handle("erase-all")}>
                                        Erase all projects
                                    </Menu.Item>
                                    <Menu.Item
                                        color="red"
                                        leftSection={<HeartOffIcon size={16} />}
                                        onClick={() => handle("delete-account")}
                                    >
                                        Delete account
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    </HoverCard.Dropdown>
                </HoverCard>
            </Stack>
        </Box>
    );
}
