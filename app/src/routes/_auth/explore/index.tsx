import { Group, SegmentedControl, Select, SimpleGrid, Skeleton, Stack, TextInput, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { Suspense, useState } from "react";
import { trpc } from "shared/api";
import { Layout } from "shared/components/Layout";
import { ProjectCard } from "shared/components/project-card";
import { match } from "ts-pattern";

function component() {
    const [panel, setPanel] = useState("Trending");

    return (
        <Layout>
            <Layout.Title>Explore</Layout.Title>
            <Layout.Action>
                <TextInput leftSection={<SearchIcon size={16} />} placeholder="Search projects..." />
            </Layout.Action>

            <SegmentedControl data={["Trending", "Friends"]} value={panel} onChange={setPanel} w="fit-content" />

            <Suspense fallback={<Loader />}>
                {match(panel)
                    .with("Trending", () => <TopProjects />)
                    .with("Friends", () => <Following />)
                    .otherwise(() => null)}
            </Suspense>
        </Layout>
    );
}

function TopProjects() {
    const [projects] = trpc.projects.top.useSuspenseQuery();

    return (
        <Stack>
            <Group justify="space-between">
                <Title order={2}>Trending Projects</Title>
                <Select data={["Today", "This week", "This month", "This year"]} value="This week" />
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </SimpleGrid>
        </Stack>
    );
}

function Following() {
    const [projects] = trpc.projects.following.useSuspenseQuery();

    return (
        <Stack>
            <Title order={2}>Friend's Projects</Title>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </SimpleGrid>
        </Stack>
    );
}

function Loader() {
    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} h={160} w={300} animate />
            ))}
        </SimpleGrid>
    );
}

export const Route = createFileRoute("/_auth/explore/")({
    component,
});
