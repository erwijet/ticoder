import { ActionIcon, Button, Divider, Group, Menu, Stack, Text, TextInput, Title } from "@mantine/core";
import { useField } from "@mantine/form";
import { modals } from "@mantine/modals";
import { Project } from "@prisma/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EllipsisVerticalIcon, PencilIcon, SearchIcon } from "lucide-react";
import { useDeferredValue } from "react";
import { alert } from "shared/alert";
import { trpc } from "shared/api";
import { PrivateBadge, PublicBadge } from "shared/components/badges";
import { Layout } from "shared/components/Layout";
import { ProjectNamePanel } from "shared/components/panel/ProjectNamePanel";
import { formatRelativeTimeAgo } from "shared/datetime";
import { downloadBlob } from "shared/download";
import { createProjectState } from "shared/form/project/context";
import { useProjectActions } from "shared/form/project/use-project-actions";
import { useTracer } from "shared/use-tracer";

function component() {
    const [data] = trpc.project.mine.useSuspenseQuery();
    const nav = useNavigate();
    const search = useField({ initialValue: "" });
    const deferredSearch = useDeferredValue(search.getValue());
    const projects = data.filter((it) => it.name.toLocaleLowerCase().includes(deferredSearch));
    const tracer = useTracer("create");

    const { mutateAsync: createProject } = trpc.project.create.useMutation();

    function handleCreateProject() {
        modals.open({
            title: <Title order={3}>Create Project</Title>,
            children: (
                <ProjectNamePanel
                    action="Create"
                    onDone={({ name }) =>
                        createProject({ name })
                            .then(({ id }) => nav({ to: "/projects/$id", params: { id } }))
                            .then(() => modals.closeAll())
                            .then(() => alert.ok("Created new project."))
                    }
                />
            ),
        });
    }

    return (
        <Layout>
            <Layout.Title>Projects</Layout.Title>
            <Layout.Action>
                <TextInput leftSection={<SearchIcon size={16} />} placeholder="Search..." {...search.getInputProps()} />
            </Layout.Action>
            <Layout.Action>
                <Button onClick={handleCreateProject}>Create</Button>
            </Layout.Action>

            {projects.map((project) => (
                <ProjectCard project={project} />
            ))}
        </Layout>
    );
}

type ProjectCardProps = {
    project: Project;
};

function ProjectCard(props: ProjectCardProps) {
    const nav = useNavigate();

    const [, { refetch }] = trpc.project.mine.useSuspenseQuery();
    const actions = useProjectActions({ id: props.project.id, project: createProjectState(props.project), onInvalidate: () => refetch() });

    function handleEdit() {
        nav({ to: "/projects/$id", params: { id: props.project.id } });
    }

    function handleDownloadTxt() {
        downloadBlob(props.project.source, {
            name: props.project.name + ".txt",
            type: "plain/text",
        });
    }

    return (
        <Stack gap="xs">
            <Group justify="space-between">
                <Stack gap={0}>
                    <Group>
                        <Text>{props.project.name}</Text>
                        {props.project.published ? <PublicBadge /> : <PrivateBadge />}
                    </Group>

                    <Text size="sm" c="dimmed" fs="italic">
                        {formatRelativeTimeAgo(props.project.updatedAt)}
                    </Text>
                </Stack>

                <ActionIcon.Group>
                    <ActionIcon variant="default" onClick={handleEdit}>
                        <PencilIcon size={16} />
                    </ActionIcon>
                    <Menu>
                        <Menu.Target>
                            <ActionIcon variant="default">
                                <EllipsisVerticalIcon size={16} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item onClick={actions.sendToCalculator}>Send to Calculator</Menu.Item>
                            <Menu.Item onClick={actions.duplicate}>Duplicate</Menu.Item>
                            <Menu.Item onClick={handleDownloadTxt}>Download .txt</Menu.Item>
                            <Menu.Item onClick={actions.download8xp}>Download .8xp</Menu.Item>
                            {props.project.published ? (
                                <Menu.Item onClick={actions.makePrivate}>Make Private</Menu.Item>
                            ) : (
                                <Menu.Item onClick={actions.makePublic}>Make Public</Menu.Item>
                            )}
                            <Menu.Divider />
                            <Menu.Item c="red" onClick={actions.promptDelete}>
                                Delete
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </ActionIcon.Group>
            </Group>
            <Divider />
        </Stack>
    );
}

export const Route = createFileRoute("/_auth/projects/")({
    component,
});
