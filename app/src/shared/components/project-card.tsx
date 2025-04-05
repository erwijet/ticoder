import { ActionIcon, Anchor, Button, Card, Group, Skeleton, Stack, Text, UnstyledButton } from "@mantine/core";
import { Account, Project } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon, StarIcon, StarOffIcon } from "lucide-react";
import { qc, trpc } from "shared/api";

export function ProjectCard(props: { project: Project & { account: Account; _count: { stars: number } }; onInvalidate?: () => unknown }) {
    const isStarred = trpc.project.isStarred.useQuery(props.project.id);
    const { mutateAsync: star } = trpc.project.star.useMutation();
    const { mutateAsync: unstar } = trpc.project.unstar.useMutation();

    function handleStar() {
        star(props.project.id)
            .then(() => isStarred.refetch())
            .then(() => props.onInvalidate?.());
    }

    function handleUnstar() {
        unstar(props.project.id)
            .then(() => isStarred.refetch())
            .then(() => props.onInvalidate?.());
    }

    return (
        <Card withBorder shadow="sm" p="lg" radius="md">
            <Stack>
                <Group justify="space-between">
                    <Link to="/account/$handle" params={{ handle: props.project.account.handle }} style={{ textDecoration: "none" }}>
                        <Anchor underline="hover" c="var(--mantine-color-text)" fw={600}>
                            @{props.project.account.handle}
                        </Anchor>
                    </Link>
                    <Link to="/projects/$id" params={{ id: props.project.id }}>
                        <ActionIcon variant="transparent" c="var(--mantine-color-text)">
                            <ExternalLinkIcon size={16} />
                        </ActionIcon>
                    </Link>
                </Group>

                <Link to="/projects/$id" params={{ id: props.project.id }} style={{ textDecoration: "none" }}>
                    <Anchor underline="hover" c="var(--mantine-color-text)" fw="bold" fz={"xl"}>
                        {props.project.name}
                    </Anchor>
                </Link>
            </Stack>
            <Card.Section withBorder mt="md">
                <Skeleton animate visible={isStarred.isLoading}>
                    {isStarred.data ? (
                        <Button
                            variant="transparent"
                            leftSection={<StarIcon size={16} />}
                            c="var(--mantine-color-yellow-7)"
                            onClick={handleUnstar}
                        >
                            <Text size="xs">{props.project._count.stars}</Text>
                        </Button>
                    ) : (
                        <Button
                            variant="transparent"
                            leftSection={<StarIcon size={16} />}
                            c="var(--mantine-color-text)"
                            onClick={handleStar}
                        >
                            <Text size="xs">{props.project._count.stars}</Text>
                        </Button>
                    )}
                </Skeleton>
            </Card.Section>
        </Card>
    );
}
