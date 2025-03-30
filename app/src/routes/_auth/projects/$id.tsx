import { ActionIcon, Button, Menu, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
    Edit3Icon,
    EllipsisIcon,
    EllipsisVerticalIcon,
    FileCode2,
    FileCode2Icon,
    FileCog2Icon,
    FileCogIcon,
    FileDownIcon,
    Globe2Icon,
    SaveIcon,
    SendHorizonalIcon,
    SendIcon,
    TrashIcon,
} from "lucide-react";
import { alert } from "shared/alert";
import { trpc } from "shared/api";
import { Layout } from "shared/components/Layout";
import { ProjectNamePanel } from "shared/components/panel/ProjectNamePanel";
import { downloadBlob } from "shared/download";
import {
    createProjectResourceParams,
    createProjectState,
    ProjectFormProvider,
    useProjectForm,
    validate,
} from "shared/form/project/context";
import { ProjectEditor } from "shared/form/project/editor";
import { useProjectActions } from "shared/form/project/use-project-actions";
import { useTracer } from "shared/use-tracer";

function component() {
    const nav = useNavigate();
    const { id } = useParams({ from: "/_auth/projects/$id" });
    const [data, { refetch }] = trpc.project.get.useSuspenseQuery(id);
    const { mutateAsync: updateProject } = trpc.project.update.useMutation();
    const { mutateAsync: compileProject } = trpc.project.compile.useMutation();

    const form = useProjectForm({
        initialValues: createProjectState(data),
        validate,
    });

    const tracer = useTracer("save", "update");
    const actions = useProjectActions({ id, project: form.values });

    async function handleCompile() {
        await updateProject({ id, ...createProjectResourceParams({ ...form.getValues(), name: form.values.name }) });
        const { bytes } = await compileProject(id);

        downloadBlob(new Uint8Array(bytes), {
            name: form.values.name + ".8xp",
            type: "application/octet-stream",
        });
    }

    async function handleDownloadTxt() {
        downloadBlob(form.values.source, {
            name: form.values.name.toUpperCase().slice(0, 8) + ".txt",
            type: "plain/text",
        });
    }

    async function handleSave() {
        if (!form.validate()) return;

        tracer.trace("save")(updateProject({ id, ...createProjectResourceParams(form.getValues()) }).then(() => alert.ok("Saved")));
    }

    async function handleRename() {
        modals.open({
            title: <Title order={3}>Rename</Title>,
            children: (
                <ProjectNamePanel
                    action="Rename"
                    defaultValue={form.values.name}
                    onDone={({ name }) => {
                        form.setFieldValue("name", name);
                        modals.closeAll();
                    }}
                />
            ),
        });
    }

    return (
        <ProjectFormProvider form={form}>
            <Layout>
                <Layout.Title>{form.values.name}</Layout.Title>
                <Layout.Title>
                    <ActionIcon variant="subtle" color="text" ml="xs" onClick={handleRename}>
                        <Edit3Icon size={16} />
                    </ActionIcon>
                </Layout.Title>

                <Layout.Action>
                    <Button variant="default" leftSection={<SaveIcon size={16} />} loading={tracer.isLoading("save")} onClick={handleSave}>
                        Save
                    </Button>
                </Layout.Action>

                <Layout.Action>
                    <Menu>
                        <Menu.Target>
                            <ActionIcon variant="default" size="input-sm">
                                <EllipsisVerticalIcon size={16} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Item leftSection={<SendIcon size={16} />} onClick={actions.sendToCalculator}>
                                Send to Calculator
                            </Menu.Item>
                            <Menu.Item leftSection={<FileCode2Icon size={16} />} onClick={handleDownloadTxt}>
                                Download .txt
                            </Menu.Item>
                            <Menu.Item leftSection={<FileCogIcon size={16} />} onClick={actions.download8xp}>
                                Download .8xp
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                                color="red"
                                leftSection={<TrashIcon size={16} />}
                                onClick={() => actions.promptDelete().then(() => nav({ to: "/projects" }))}
                            >
                                Delete
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Layout.Action>

                <Layout.Bleed>
                    <ProjectEditor />
                </Layout.Bleed>
            </Layout>
        </ProjectFormProvider>
    );
}

export const Route = createFileRoute("/_auth/projects/$id")({
    component,
});
