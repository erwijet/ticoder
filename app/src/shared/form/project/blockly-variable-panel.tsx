import {
    ActionIcon,
    Badge,
    Button,
    Code,
    Loader,
    rem,
    Skeleton,
    Stack,
    Table,
    Text,
    Title,
    Group,
    Tooltip,
    TextInput,
} from "@mantine/core";
import { useWorkspace } from "./editor";
import { PlusIcon, SearchIcon, TextCursorIcon, TextCursorInputIcon, Trash2Icon, TrashIcon } from "lucide-react";
import { match } from "ts-pattern";
import { useState } from "react";
import { modals } from "@mantine/modals";
import { alert } from "shared/alert";
import { useQuery } from "@tanstack/react-query";

export const BlocklyVariablePanel = () => {
    const workspace = useWorkspace();

    const { data, refetch } = useQuery({
        queryKey: ["workspace-variables"],
        queryFn: () => workspace?.getAllVariables(),
    });

    if (!workspace)
        return (
            <Stack>
                <Skeleton h="md" w={rem(200)} />
                <Skeleton h="md" w={rem(256)} />
                <Skeleton h="md" w={rem(120)} />
            </Stack>
        );

    const [search, setSearch] = useState("");

    async function handleDeleteVariable(varId: string) {
        if (!workspace) return;
        const varName = workspace.getVariableById(varId)!.name;

        modals.openConfirmModal({
            title: <Title order={3}>Delete Variable</Title>,
            children: (
                <Text size="sm">
                    Are you sure you want to delete <strong>{varName}</strong> and all blocks referencing it? This action cannot be undone.
                </Text>
            ),
            labels: {
                confirm: "Delete",
                cancel: "Cancel",
            },
            confirmProps: {
                color: "Red",
                leftSection: <Trash2Icon size={16} />,
            },
            onConfirm() {
                workspace.deleteVariableById(varId);
                refetch();
                alert.ok("Deleted.");
            },
        });
    }

    return (
        <Stack>
            <TextInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftSection={<SearchIcon size={16} />}
                variant="filled"
                placeholder="Search..."
            />
            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Variable</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th />
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {data
                        ?.filter((it) => it.name.includes(search.trim()))
                        .map((each) => (
                            <Table.Tr key={each.getId()}>
                                <Table.Td>
                                    <Code>{each.name}</Code>
                                </Table.Td>
                                <Table.Td>
                                    {match(each.type)
                                        .with("native-num", () => (
                                            <Badge variant="light" color="red" radius="sm">
                                                Number
                                            </Badge>
                                        ))
                                        .with("native-str", () => (
                                            <Badge variant="light" color="orange" radius="sm">
                                                Text
                                            </Badge>
                                        ))
                                        .with("native-lst", () => (
                                            <Badge variant="light" color="indigo" radius="sm">
                                                List
                                            </Badge>
                                        ))
                                        .with("task", () => (
                                            <Badge variant="light" color="pink" radius="sm">
                                                Task
                                            </Badge>
                                        ))
                                        .otherwise(() => null)}
                                </Table.Td>
                                <Table.Td>
                                    <ActionIcon.Group>
                                        <Tooltip label="Rename">
                                            <ActionIcon variant="default">
                                                <TextCursorInputIcon size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Delete">
                                            <ActionIcon variant="default" onClick={() => handleDeleteVariable(each.getId())}>
                                                <Trash2Icon size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </ActionIcon.Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                </Table.Tbody>
            </Table>
        </Stack>
    );
};
