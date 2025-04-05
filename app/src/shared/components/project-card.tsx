import { ActionIcon, Anchor, Card, Group, Stack, Text } from "@mantine/core";
import { Account, Project } from "@prisma/client";
import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon, StarIcon } from "lucide-react";

export function ProjectCard(props: { project: Project & { account: Account; _count: { stars: number } } }) {
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
            <Card.Section withBorder inheritPadding mt="md">
                <Group py="md">
                    <Group gap="xs">
                        <StarIcon size={16} />
                        <Text size="xs">{props.project._count.stars}</Text>
                    </Group>
                </Group>
            </Card.Section>
        </Card>
    );
}
