import { ActionIcon, Badge, Button, Divider, Group, Menu, Stack, Text, TextInput, TextInputProps, Title, Tooltip } from "@mantine/core";
import { useField } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { Project } from "@prisma/client";
import { createFileRoute, useNavigate, useStableCallback } from "@tanstack/react-router";
import { BlendIcon, EllipsisVerticalIcon, InfoIcon, LockIcon, PencilIcon, SearchIcon, X } from "lucide-react";
import { forwardRef, useDeferredValue, useState } from "react";
import { alert } from "shared/alert";
import { trpc } from "shared/api";
import { Layout } from "shared/components/Layout";
import { formatRelativeTimeAgo } from "shared/datetime";
import { downloadBlob } from "shared/download";
import { useTiCalc } from "shared/react-ticalc";
import { tifiles } from "ticalc-usb";

function component() {
    const [data] = trpc.project.mine.useSuspenseQuery();
    const nav = useNavigate();
    const search = useField({ initialValue: "" });
    const deferredSearch = useDeferredValue(search.getValue());
    const projects = data.filter((it) => it.name.toLocaleLowerCase().includes(deferredSearch));

    const newProjectTitle = useField({ initialValue: "PROJECT" });

    const { mutateAsync: createProject } = trpc.project.create.useMutation();

    function handleCreateProject() {
        modals.open({
            title: <Title order={3}>Create Project</Title>,
            children: (
                <CreateProjectConfirmPanel
                    onCreate={({ name }) =>
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

const CreateProjectConfirmPanel = (props: { onCreate: (values: { name: string }) => unknown }) => {
    const [name, setName] = useState("PROJECT");

    return (
        <Stack>
            <TextInput
                label="Project Title"
                value={name}
                rightSection={
                    <Tooltip
                        w={220}
                        multiline
                        label="Project names must each have it's own unique name, be eight characters or less, and can only contain A-Z, 0-9 characters."
                    >
                        <InfoIcon size={16} />
                    </Tooltip>
                }
                onChange={(e) =>
                    setName(
                        e.target.value
                            .toUpperCase()
                            .replaceAll(/[^A-Z0-9]/g, "X")
                            .slice(0, 8),
                    )
                }
            />
            <Button ml="auto" onClick={() => props.onCreate({ name })}>
                Create
            </Button>
        </Stack>
    );
};

type ProjectCardProps = {
    project: Project;
};

function ProjectCard(props: ProjectCardProps) {
    const nav = useNavigate();
    const { choose, queueFile } = useTiCalc();
    const { mutateAsync: compileProject } = trpc.project.compile.useMutation();
    const { mutateAsync: duplicateProject } = trpc.project.duplicate.useMutation();
    const { mutateAsync: updateProject } = trpc.project.update.useMutation();
    const { mutateAsync: deleteProject } = trpc.project.delete.useMutation();

    const [, { refetch }] = trpc.project.mine.useSuspenseQuery();

    function handleEdit() {
        nav({ to: "/projects/$id", params: { id: props.project.id } });
    }

    async function handleSendToCalc() {
        const toastId = notifications.show({
            loading: true,
            title: "Sending to calculator...",
            message: "Please wait",
            autoClose: false,
            withCloseButton: false,
        });

        await choose();

        const result = await compileProject(props.project.id).catch(() => {
            notifications.update({
                id: toastId,
                color: "red",
                icon: <X size={20} />,
                title: "Failed to send!",
                message: "Could not compile project.",
            });
        });

        if (!result) {
            notifications.update({
                id: toastId,
                color: "red",
                icon: <X size={20} />,
                title: "Failed to send!",
                message: "Could not compile project.",
            });

            return;
        }

        const buffer = new Uint8Array(result.bytes);
        await new Promise<void>((didSend) => queueFile(tifiles.parseFile(buffer), didSend));

        notifications.hide(toastId);

        alert.ok("Sent to calculator!");
    }

    async function handleDuplicate() {
        await duplicateProject(props.project.id).catch(alert.error);
        alert.ok("Duplicated Project!");

        await refetch();
    }

    function handleDownloadTxt() {
        downloadBlob(props.project.source ?? "", {
            name: props.project.name + ".txt",
            type: "text/plain",
        });
    }

    async function handleDownload8xp() {
        const toastId = notifications.show({
            loading: true,
            title: "Building Project...",
            message: "Please wait",
            autoClose: false,
            withCloseButton: false,
        });

        const result = await compileProject(props.project.id).catch(() => {
            notifications.update({
                id: toastId,
                color: "red",
                icon: <X size={20} />,
                title: "Failed to download!",
                message: "Could not build project.",
            });
        });

        if (!result) {
            notifications.update({
                id: toastId,
                color: "red",
                icon: <X size={20} />,
                title: "Failed to download!",
                message: "Could not build project.",
            });

            return;
        }

        downloadBlob(new Uint8Array(result.bytes), {
            name: props.project.name.toUpperCase().slice(0, 8) + ".8xp",
            type: "application/octet-stream",
        });

        const buffer = new Uint8Array(result.bytes);
        await new Promise<void>((didSend) => queueFile(tifiles.parseFile(buffer), didSend));

        notifications.hide(toastId);

        alert.ok("Downloaded .8xp File");
    }

    async function handleMakePrivate() {
        await updateProject({
            ...props.project,
            published: false,
        }).catch(alert.error);

        await refetch();
        alert.ok("Project is private.");
    }

    async function handleMakePublic() {
        await updateProject({
            ...props.project,
            published: true,
        }).catch(alert.error);

        await refetch();
        alert.ok("Project is public.");
    }

    async function handleDeleteProject() {
        modals.openConfirmModal({
            title: <Title order={3}>Delete Project</Title>,
            children: <Text size="sm">Are you sure to you want to delete this project? This can't be undone.</Text>,
            labels: {
                confirm: "Delete Project",
                cancel: "Cancel",
            },
            confirmProps: {
                color: "red",
            },
            async onConfirm() {
                await deleteProject(props.project.id).catch(alert.error);
                await refetch();
                alert.ok("Deleted project.");
            },
        });
    }

    return (
        <Stack gap="xs">
            <Group justify="space-between">
                <Stack gap={0}>
                    <Group>
                        <Text>{props.project.name}</Text>
                        {props.project.published ? (
                            <Badge size="sm" variant="light" radius="xs" color="indigo" leftSection={<BlendIcon size={12} />}>
                                Public
                            </Badge>
                        ) : (
                            <Badge size="sm" variant="light" color="gray" leftSection={<LockIcon size={12} />} radius="xs">
                                Private
                            </Badge>
                        )}
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
                            <Menu.Item onClick={handleSendToCalc}>Send to Calculator</Menu.Item>
                            <Menu.Item onClick={handleDuplicate}>Duplicate</Menu.Item>
                            <Menu.Item onClick={handleDownloadTxt}>Download .txt</Menu.Item>
                            <Menu.Item onClick={handleDownload8xp}>Download .8xp</Menu.Item>
                            {props.project.published ? (
                                <Menu.Item onClick={handleMakePrivate}>Make Private</Menu.Item>
                            ) : (
                                <Menu.Item onClick={handleMakePublic}>Make Public</Menu.Item>
                            )}
                            <Menu.Divider />
                            <Menu.Item c="red" onClick={handleDeleteProject}>
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
