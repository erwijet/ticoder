import {
    ActionIcon,
    Anchor,
    Box,
    Button,
    Card,
    Container,
    Divider,
    Group,
    SegmentedControl,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { Account, Project } from "@prisma/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { trace } from "console";
import { ExternalLinkIcon } from "lucide-react";
import { Suspense, useState } from "react";
import { qc, trpc } from "shared/api";
import { Layout } from "shared/components/Layout";
import { ProjectCard } from "shared/components/project-card";
import { run, runPromising } from "shared/fns";
import { useTracer } from "shared/use-tracer";
import { match } from "ts-pattern";

function component() {
    const { handle } = Route.useParams();
    const [account] = trpc.account.byHandle.useSuspenseQuery(handle);
    const [isFollowing] = trpc.account.isFollowing.useSuspenseQuery(account.id);
    const { mutateAsync: follow } = trpc.account.follow.useMutation();
    const { mutateAsync: unfollow } = trpc.account.unfollow.useMutation();
    const { trace, isLoading } = useTracer("follow", "unfollow");

    const [page, setPage] = useState("Projects");

    function handleFollow() {
        trace("follow")(
            run(async () => {
                await follow(account.id);
                await qc.invalidateQueries();
            }),
        );
    }

    function handleUnfollow() {
        trace("unfollow")(
            run(async () => {
                await unfollow(account.id);
                await qc.invalidateQueries();
            }),
        );
    }

    return (
        <Layout>
            <Layout.Bleed>
                <Container w="100%" pt="md">
                    <Group justify="space-between" w="100%">
                        <div>
                            <Title order={2}>{account.displayName}</Title>
                            <Text c="dimmed">@{account.handle}</Text>
                        </div>
                        <Group>
                            <Box ta="center">
                                <Text fw="bold">{account.projects.length}</Text>
                                <Text fz="xs" c="dimmed">
                                    Projects
                                </Text>
                            </Box>

                            <Box ta="center">
                                <Text fw="bold">{account.followers.length}</Text>
                                <Text fz="xs" c="dimmed">
                                    Followers
                                </Text>
                            </Box>

                            <Box ta="center">
                                <Text fw="bold">{account.following.length}</Text>
                                <Text fz="xs" c="dimmed">
                                    Following
                                </Text>
                            </Box>

                            {isFollowing ?
                                <Button variant="outline" onClick={handleUnfollow} loading={isLoading("unfollow")}>
                                    Unfollow
                                </Button>
                            :   <Button onClick={handleFollow} loading={isLoading("follow")}>
                                    Follow
                                </Button>
                            }
                        </Group>
                    </Group>
                </Container>
                <Divider mb="xl" />
            </Layout.Bleed>

            <SegmentedControl data={["Projects", "Followers", "Following"]} value={page} onChange={setPage} w="fit-content" />
            {match(page)
                .with("Projects", () => <Projects />)
                .with("Followers", () => <Followers />)
                .with("Following", () => <Following />)
                .otherwise(() => null)}
        </Layout>
    );
}

function Projects() {
    const { handle } = Route.useParams();
    const [account] = trpc.account.byHandle.useSuspenseQuery(handle);
    const [projects] = trpc.projects.ownedBy.useSuspenseQuery(account.id);

    return (
        <SimpleGrid cols={{ sm: 2, lg: 3 }}>
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </SimpleGrid>
    );
}

function Followers() {
    const { handle } = Route.useParams();
    const [account] = trpc.account.byHandle.useSuspenseQuery(handle);

    return (
        <SimpleGrid cols={{ sm: 2, lg: 3 }}>
            {account.followers.map((follow) => (
                <Suspense fallback={<Skeleton animate h={180} w={300} />}>
                    <ConnectionCard key={follow.followerId} accountId={follow.followerId} />
                </Suspense>
            ))}
        </SimpleGrid>
    );
}

function Following() {
    const { handle } = Route.useParams();
    const [account] = trpc.account.byHandle.useSuspenseQuery(handle);

    return (
        <SimpleGrid cols={{ sm: 2, lg: 3 }}>
            {account.following.map((follow) => (
                <Suspense fallback={<Skeleton animate h={180} w={300} />}>
                    <ConnectionCard key={follow.followingId} accountId={follow.followingId} />
                </Suspense>
            ))}
        </SimpleGrid>
    );
}

function ConnectionCard(props: { accountId: string }) {
    const [account] = trpc.account.get.useSuspenseQuery(props.accountId);
    const [isFollowing] = trpc.account.isFollowing.useSuspenseQuery(account.id);

    return (
        <Card withBorder shadow="sm" p="lg" radius="md">
            <Stack>
                <Group justify="space-between">
                    <Link to="/account/$handle" params={{ handle: account.handle }} style={{ textDecoration: "none" }}>
                        <Anchor underline="hover" c="var(--mantine-color-text)" fw={600} fz={"xl"}>
                            {account.displayName}
                        </Anchor>
                    </Link>
                    <Link to="/account/$handle" params={{ handle: account.handle }} style={{ textDecoration: "none" }}>
                        <ActionIcon variant="transparent" color="var(--mantine-color-text)">
                            <ExternalLinkIcon size={16} />
                        </ActionIcon>
                    </Link>
                </Group>

                <Group py="md" justify="space-between">
                    <Text c="dimmed">@{account.handle}</Text>
                    {isFollowing ?
                        <Button variant="outline">Following</Button>
                    :   <Button variant="default">Follow</Button>}
                </Group>
            </Stack>
        </Card>
    );
}

export const Route = createFileRoute("/_auth/account/$handle")({
    component,
});
