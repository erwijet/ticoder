import { ActionIcon, Anchor, Button, Code, Divider, Drawer, Group, Loader, Menu, Modal, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
    BracesIcon,
    CalculatorIcon,
    ChevronDownIcon,
    CircleFadingPlusIcon,
    CopyIcon,
    Edit3Icon,
    FileCode2Icon,
    FileCogIcon,
    GitBranchIcon,
    PlusCircleIcon,
    ReceiptRussianRuble,
    SaveIcon,
    Trash2Icon,
    TrashIcon,
    UsbIcon,
    VariableIcon,
} from "lucide-react";
import { alert } from "shared/alert";
import { trpc } from "shared/api";
import { Layout } from "shared/components/Layout";
import { PageLoader } from "shared/components/page-loader";
import { ProjectNamePanel } from "shared/components/panel/ProjectNamePanel";
import { downloadBlob } from "shared/download";
import { run, runPromising } from "shared/fns";
import { BlocklyVariablePanel } from "shared/form/project/blockly-variable-panel";
import {
    createProjectResourceParams,
    createProjectState,
    ProjectFormProvider,
    useProjectForm,
    validate,
} from "shared/form/project/context";
import { ProjectEditor, useWorkspace } from "shared/form/project/editor";
import { useProjectActions } from "shared/form/project/use-project-actions";
import { useTiCalc } from "shared/react-ticalc";
import { useTracer } from "shared/use-tracer";
import { match } from "ts-pattern";

function component() {
    const nav = useNavigate();
    const { id } = Route.useParams();
    const { account } = Route.useRouteContext();
    const workspace = useWorkspace();

    const [data] = trpc.project.get.useSuspenseQuery(id);
    const { mutateAsync: updateProject } = trpc.project.update.useMutation();

    const form = useProjectForm({
        initialValues: createProjectState(data),
        validate,
    });

    const isOwner = data.accountId == account.id;

    const tracer = useTracer("save", "update", "send", "remix");
    const actions = useProjectActions({ id, project: form.values });
    const { choose, calc } = useTiCalc();
    const [sourceDrawerOpened, sourceDrawer] = useDisclosure();
    const [variablesOpened, variables] = useDisclosure();

    async function handleDownloadTxt() {
        downloadBlob(form.values.source, {
            name: form.values.name.toUpperCase().slice(0, 8) + ".txt",
            type: "plain/text",
        });
    }

    async function handleSave() {
        if (!form.validate()) return;
        const loader = alert.createLoader("Saving...");

        return tracer
            .trace("save")(updateProject({ id, ...createProjectResourceParams(form.getValues()) }))
            .then(() => loader.ok("Saved"))
            .catch(loader.error);
    }

    async function handleRemix() {
        const name = await alert.ask("Test", { confirmText: "Remix" });
        alert.ok(name);

        modals.openConfirmModal({
            closeOnConfirm: false,
            title: <Title order={3}>Remix Project</Title>,
            children: (
                <Text size="sm">Are you sure you want to remix this project? This will create a copy of this project that you own.</Text>
            ),
            labels: {
                confirm: "Remix",
                cancel: "Cancel",
            },
            confirmProps: {
                loading: tracer.isLoading("remix"),
            },
            onConfirm() {
                tracer.trace("remix")(
                    run(async () => {
                        const result = await actions.duplicate();
                        if (!result) return;

                        await nav({ to: "/projects/$id", params: { id: result.id } });
                        window.location.reload();
                        modals.closeAll();
                    }),
                );
            },
        });
    }

    async function handleSendToCalculator() {
        await handleSave();
        await actions.sendToCalculator();
    }

    async function handleSelectCalculator() {
        const loader = alert.createLoader("Targeting device...");
        await choose().catch(loader.dismiss);
        loader.ok(`Connected.`);
    }

    async function handleRename() {
        modals.open({
            title: <Title order={3}>Rename</Title>,
            children: (
                <ProjectNamePanel
                    action="Rename"
                    defaultValue={form.values.name}
                    onDone={({ name }) =>
                        runPromising((done) => {
                            form.setFieldValue("name", name);
                            modals.closeAll();
                            done();
                        })
                    }
                />
            ),
        });
    }

    async function handleCreateVariable(type: "native-num" | "native-str" | "native-lst" | "task") {
        if (!workspace) return;

        const varName = await alert.ask(
            match(type)
                .with("native-lst", () => "Create List Variable")
                .with("native-num", () => "Create Number Variable")
                .with("native-str", () => "Create Text Variable")
                .with("task", () => "Create Task")
                .exhaustive(),
            { confirmText: "Create", label: "Name" },
        );

        workspace.createVariable(varName, type);
        alert.ok("Created.");
    }

    return (
        <ProjectFormProvider form={form}>
            <Drawer
                opened={variablesOpened}
                title={
                    <Group>
                        <Title order={3}>Project Variables</Title>
                        <Menu>
                            <Menu.Target>
                                <Button variant="default" size="compact-md" leftSection={<CircleFadingPlusIcon size={16} />}>
                                    Create
                                </Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Item color="red" onClick={() => handleCreateVariable("native-num")}>
                                    Number Variable
                                </Menu.Item>
                                <Menu.Item color="orange" onClick={() => handleCreateVariable("native-str")}>
                                    Text Variable
                                </Menu.Item>
                                <Menu.Item color="violet" onClick={() => handleCreateVariable("native-lst")}>
                                    List Variable
                                </Menu.Item>
                                <Menu.Item color="pink" onClick={() => handleCreateVariable("task")}>
                                    Task
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                }
                onClose={variables.close}
                position="right"
            >
                <BlocklyVariablePanel />
            </Drawer>
            <Drawer
                opened={sourceDrawerOpened}
                title={<Title order={3}>Generated TIBasic</Title>}
                onClose={sourceDrawer.close}
                position="right"
            >
                <Stack>
                    <Text size="xs" c="dimmed">
                        TIBasic is the code that is sent to the calculator to be executed! <br />
                        You can learn more about it at{" "}
                        <Anchor target="_blank" href="http://tibasicdev.wikidot.com/sk:overview">
                            tibasicdev.wikidot.com
                        </Anchor>
                        .
                    </Text>
                    <Divider mx="-md" />
                    <Code block>{form.values.source}</Code>
                </Stack>
            </Drawer>

            <Layout>
                <Layout.Title>{form.values.name}</Layout.Title>
                <Layout.Title>
                    <ActionIcon variant="subtle" color="text" ml="xs" onClick={handleRename}>
                        <Edit3Icon size={16} />
                    </ActionIcon>
                </Layout.Title>

                <Layout.Action>
                    <Group wrap="nowrap" gap={0}>
                        <Button
                            variant="default"
                            leftSection={isOwner ? <SaveIcon size={16} /> : <GitBranchIcon size={16} />}
                            loading={isOwner ? tracer.isLoading("save") : tracer.isLoading("remix")}
                            onClick={isOwner ? handleSave : handleRemix}
                            style={{ borderTopRightRadius: "0", borderBottomRightRadius: "0" }}
                        >
                            {isOwner ? "Save" : "Remix"}
                        </Button>
                        <Menu>
                            <Menu.Target>
                                <ActionIcon
                                    color="text"
                                    variant="default"
                                    size={36}
                                    style={{
                                        borderTopLeftRadius: "0",
                                        borderBottomLeftRadius: "0",
                                        borderLeft: "none",
                                    }}
                                >
                                    <ChevronDownIcon size={16} />
                                </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Item onClick={handleSelectCalculator} leftSection={<UsbIcon size={16} />}>
                                    Connect Calculator
                                </Menu.Item>
                                <Menu.Item leftSection={<FileCode2Icon size={16} />} onClick={handleDownloadTxt}>
                                    Download .txt
                                </Menu.Item>
                                <Menu.Item leftSection={<FileCogIcon size={16} />} onClick={actions.download8xp}>
                                    Download .8xp
                                </Menu.Item>
                                <Menu.Item leftSection={<BracesIcon size={16} />} onClick={sourceDrawer.open}>
                                    View Generated Code
                                </Menu.Item>
                                <Menu.Item leftSection={<VariableIcon size={16} />} onClick={variables.open}>
                                    Manage Variables
                                </Menu.Item>
                                <Menu.Item leftSection={<CopyIcon size={16} />} onClick={handleRemix}>
                                    Make a Copy
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item
                                    color="red"
                                    leftSection={<TrashIcon size={16} />}
                                    onClick={() => actions.promptDelete().then(() => nav({ to: "/projects" }))}
                                    disabled={!isOwner}
                                >
                                    Delete
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Layout.Action>

                <Layout.Action>
                    {!!calc ?
                        <Button
                            variant="default"
                            leftSection={<CalculatorIcon size={16} />}
                            loading={tracer.isLoading("send")}
                            onClick={() => tracer.trace("send")(handleSendToCalculator())}
                        >
                            {calc.name}
                        </Button>
                    :   <Button variant="default" leftSection={<UsbIcon size={16} />} onClick={handleSelectCalculator}>
                            Connect Calculator
                        </Button>
                    }
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
    pendingComponent: PageLoader,
});
