import { ActionIcon, Badge, Button, Divider, Group, Menu, rem, Stack, Text, TextInput, Title } from "@mantine/core";
import { api, trpc } from "shared/api";
import { Layout } from "shared/components/Layout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
    BlendIcon,
    BlocksIcon,
    EllipsisVertical,
    EllipsisVerticalIcon,
    Globe2Icon,
    LockIcon,
    MenuIcon,
    PencilIcon,
    SearchIcon,
    UsersRoundIcon,
    X,
} from "lucide-react";
import { useField } from "@mantine/form";
import { useDeferredValue } from "react";
import { alert } from "shared/alert";
import { Project } from "@prisma/client";
import { formatRelativeTimeAgo } from "shared/datetime";
import { notifications } from "@mantine/notifications";
import { useTiCalc } from "shared/react-ticalc";
import { runCatching } from "shared/fns";
import { tifiles } from "ticalc-usb";
import { downloadBlob } from "shared/download";
import { modals } from "@mantine/modals";

// import {
//     Badge,
//     Button,
//     ButtonGroup,
//     Divider,
//     HStack,
//     Heading,
//     IconButton,
//     Input,
//     InputGroup,
//     InputLeftElement,
//     InputRightElement,
//     Kbd,
//     Link,
//     Menu,
//     MenuButton,
//     MenuDivider,
//     MenuItem,
//     MenuList,
//     Spinner,
//     Stack,
//     Text,
//     Tooltip,
// } from "@chakra-ui/react";
// import { Program } from "@codegen/api";
// import { raw } from "src/shared/api";
// import { timeAgo } from "src/shared/datetime";
// import { downloadBlob } from "src/shared/download";
// import { useKey } from "src/shared/react-keys";
// import { useTiCalc } from "src/shared/react-ticalc";
// import {
//     IconCopy,
//     IconFileCode,
//     IconFileDigit,
//     IconFileDownload,
//     IconMenu2,
//     IconSearch,
//     IconTransfer,
//     IconTrash,
//     IconWorldCancel,
//     IconWorldUpload,
// } from "@tabler/icons-react";
// import { useMutation, useQuery } from "@tanstack/react-query";
// import { useRef, useState } from "react";
// import { Link as RouterLink } from "react-router-dom";
// import { toast } from "sonner";
// import { paths, useRouter } from "src/core/router";
// import { tifiles } from "ticalc-usb";

// export function ProgramList() {
//     const [search, setSearch] = useState("");

//     function applySearch(each: Program): boolean {
//         if (!search) return true;
//         return each.name.toLocaleLowerCase().includes(search.toLocaleLowerCase());
//     }

//     const router = useRouter();

//     const {
//         data: programs,
//         isLoading: isLoadingPrograms,
//         refetch: refetchPrograms,
//     } = useQuery({
//         queryKey: ["programs"],
//         queryFn: () => raw.query(["program:list"]),
//         select: (programs) => programs.filter(applySearch).toSorted((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
//     });

//     const { mutate: createProgram, isPending } = useMutation({
//         mutationFn: () => raw.mutation(["program:create", { name: "Untitled", blockly: "" }]),
//         onSuccess(data) {
//             toast.success("Created new program");
//             router.programs.nav(data.id);
//         },
//     });

//     const searchRef = useRef(null);
//     useKey("/", { action: "focus", ref: searchRef });
//     useKey("Escape", { action: "blur", ref: searchRef });

//     const { calc, choose, queueFile } = useTiCalc();

//     //

//

//     async function handleDuplicate(prgm: Program) {
//         const { id } = await raw.mutation(["program:create", { name: prgm.name + " (copy)", blockly: prgm.blockly ?? "" }]);

//         toast.success(`Successfully duplicated '${prgm.name}'`);
//         router.programs.nav(id);
//     }

//     function handleDownloadTxt(prgm: Program) {
//         downloadBlob(prgm.blockly ?? "", {
//             name: prgm.name + ".txt",
//             type: "text/plain",
//         });
//     }

//     function handleDownload8xp(prgm: Program) {
//         toast.promise(
//             async () => {
//                 const res = await raw.query(["program:compile", { program_id: prgm.id }]);

//                 if (res.status == "Err") throw res.reason;

//                 downloadBlob(new Uint8Array(res.buffer), {
//                     name: prgm.name.toUpperCase().slice(0, 8) + ".8xp",
//                     type: "application/octet-stream",
//                 });
//             },
//             {
//                 loading: `Compiling '${prgm.name}'...`,
//                 success: `Downloaded '${prgm.name}' 8xp binary`,
//                 error: "Failed to compile.",
//             },
//         );
//     }

//     async function handlePublish(prgm: Program) {
//         await raw.mutation(["program:update", { ...prgm, blockly: prgm.blockly ?? "", public: true }]);

//         toast.success(`Published '${prgm.name}' successfully.`);
//         refetchPrograms();
//     }

//     async function handleUnpublish(prgm: Program) {
//         await raw.mutation(["program:update", { ...prgm, blockly: prgm.blockly ?? "", public: false }]);

//         toast.success(`Unpublished '${prgm.name}' successfully.`);
//         refetchPrograms();
//     }

//     async function handleDelete(prgm: Program) {
//         if (!confirm(`Are you sure you want to delete '${prgm.name}'?`)) return;

//         await raw.mutation(["program:delete", prgm.id]);
//         toast.success(`Deleted '${prgm.name}' successfully.`);
//         refetchPrograms();
//     }

//     //

//     return (
//         <Stack h={"100vh"} position={"relative"}>
//             <Stack w={"100%"} h={"65px"} gap={0} justifyContent={"space-between"}>
//                 <div />

//                 <HStack justifyContent={"space-between"} sx={{ px: 4 }}>
//                     <Heading as={"h2"} size="lg" justifySelf={"center"}>
//                         My Programs
//                     </Heading>

//                     <HStack>
//                         <InputGroup size={"md"}>
//                             <InputLeftElement>
//                                 <IconSearch />
//                             </InputLeftElement>
//                             <Input
//                                 ref={searchRef}
//                                 variant={"filled"}
//                                 placeholder="Search..."
//                                 value={search}
//                                 onChange={(e) => setSearch(e.target.value)}
//                             />
//                             <InputRightElement>
//                                 <Kbd>/</Kbd>
//                             </InputRightElement>
//                         </InputGroup>

//                         <Button isLoading={isPending} onClick={() => createProgram()}>
//                             Create
//                         </Button>
//                     </HStack>
//                 </HStack>

//                 <Divider />
//             </Stack>

//             {isLoadingPrograms ? (
//                 <Stack
//                     sx={{
//                         width: "100%",
//                         height: "100%",
//                         top: 0,
//                         left: 0,
//                         position: "absolute",
//                         justifyContent: "center",
//                         alignItems: "center",
//                     }}
//                 >
//                     <Spinner />
//                 </Stack>
//             ) : (
//                 <Stack sx={{ gap: 2 }}>
//                     {programs?.map((each) => (
//                         <Stack sx={{ py: 2, px: 4 }} w="100%">
//                             <HStack w={"100%"} justifyContent={"space-between"}>
//                                 <Stack>
//                                     <HStack>
//                                         {
//                                             <Link as={RouterLink} to={paths.programs.get(each.id)} color="blue.700" fontWeight={700}>
//                                                 {each.name}
//                                             </Link>
//                                         }
//                                         <Badge colorScheme={each.public ? "purple" : undefined}>{each.public ? "public" : "private"}</Badge>
//                                     </HStack>
//                                     <Text fontSize={"xs"}>Created {timeAgo(new Date(each.createdAt))}</Text>
//                                 </Stack>
//                                 <ButtonGroup>
//                                     <Tooltip label="Edit">
//                                         <IconButton aria-label="edit" variant={"ghost"}>
//                                             <IconFileCode />
//                                         </IconButton>
//                                     </Tooltip>

//                                     <Menu>
//                                         <MenuButton as={IconButton} aria-label="options" icon={<IconMenu2 />} variant={"ghost"} />
//                                         <MenuList>
//                                             <MenuItem onClick={() => handleSendToCalc(each)} icon={<IconTransfer />}>
//                                                 Send to Calculator
//                                             </MenuItem>
//                                             <MenuItem onClick={() => handleDuplicate(each)} icon={<IconCopy />}>
//                                                 Duplicate
//                                             </MenuItem>
//                                             <MenuItem onClick={() => handleDownloadTxt(each)} icon={<IconFileDownload />}>
//                                                 Download .txt
//                                             </MenuItem>
//                                             <MenuItem onClick={() => handleDownload8xp(each)} icon={<IconFileDigit />}>
//                                                 Download .8xp
//                                             </MenuItem>
//                                             {each.public ? (
//                                                 <MenuItem onClick={() => handleUnpublish(each)} icon={<IconWorldCancel />}>
//                                                     Unpublish
//                                                 </MenuItem>
//                                             ) : (
//                                                 <MenuItem onClick={() => handlePublish(each)} icon={<IconWorldUpload />}>
//                                                     Publish
//                                                 </MenuItem>
//                                             )}
//                                             <MenuDivider />
//                                             <MenuItem onClick={() => handleDelete(each)} icon={<IconTrash />}>
//                                                 Delete
//                                             </MenuItem>
//                                         </MenuList>
//                                     </Menu>
//                                 </ButtonGroup>
//                             </HStack>
//                             <Divider />
//                         </Stack>
//                     ))}
//                 </Stack>
//             )}
//         </Stack>
//     );
// }

function component() {
    const [data] = trpc.project.mine.useSuspenseQuery();
    const nav = useNavigate();
    const search = useField({ initialValue: "" });
    const deferredSearch = useDeferredValue(search.getValue());
    const projects = data.filter((it) => it.name.toLocaleLowerCase().includes(deferredSearch));

    const { mutateAsync: createProject } = trpc.project.create.useMutation();

    function handleCreateProject() {
        createProject({ name: `Untitled Project ${data.length + 1}` })
            .then(({ id }) => nav({ to: "/projects/$id", params: { id } }))
            .then(() => alert.ok("Projected Created"));
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
    const { calc, choose, queueFile } = useTiCalc();
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
