import { Button, Stack, Text, TextInput, Title, Group } from "@mantine/core";
import { useField } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { CheckCircle2Icon, X } from "lucide-react";
import { useTracer } from "./use-tracer";
import { maybe } from "./fp";

export const alert = {
    error(msg: Error | string) {
        notifications.show({
            color: "red",
            title: "Error",
            icon: <X size={20} />,
            message: msg instanceof Error ? msg.message : msg,
        });
    },
    async popup(msg: string, opts?: { title?: string }) {
        const { promise, resolve } = Promise.withResolvers<void>();

        modals.open({
            title: maybe(opts?.title)?.take((title) => <Title order={3}>{title}</Title>),
            children: (
                <Stack>
                    <Text size="sm">{msg}</Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={modals.closeAll}>
                            Okay
                        </Button>
                    </Group>
                </Stack>
            ),
            onClose: resolve,
        });

        return promise;
    },
    async ask(title: string, opts?: { confirmText?: string; label?: string; initialValue?: string }): Promise<string> {
        const { promise, resolve, reject } = Promise.withResolvers<string>();

        modals.open({
            title: <Title order={3}>{title}</Title>,
            onClose: () => reject(),
            children: (
                <RequestModalPane
                    {...opts}
                    onConfirm={(value) => {
                        resolve(value);
                        modals.closeAll();
                    }}
                />
            ),
        });

        return promise;
    },
    createLoader: (msg: string) => {
        const toastId = notifications.show({
            loading: true,
            title: msg,
            message: "Please wait.",
            autoClose: false,
            withCloseButton: false,
        });

        return {
            ok: (msg: string) => {
                notifications.update({
                    id: toastId,
                    loading: false,
                    color: "green",
                    title: "Success",
                    icon: <CheckCircle2Icon size={20} />,
                    message: msg,
                    autoClose: true,
                    withCloseButton: true,
                });
            },
            error: (msg: Error | string) => {
                notifications.hide(toastId);
                alert.error(msg);
            },
            dismiss: () => {
                notifications.hide(toastId);
            },
        };
    },
    ok(msg: string) {
        notifications.show({
            color: "green",
            title: "Success",
            icon: <CheckCircle2Icon size={20} />,
            message: msg,
        });
    },
};

const RequestModalPane = (props: { label?: string; initialValue?: string; confirmText?: string; onConfirm?: (value: string) => void }) => {
    const field = useField({ initialValue: props.initialValue ?? "" });

    return (
        <Stack>
            <TextInput label={props.label} {...field.getInputProps()} />
            <Button ml="auto" onClick={() => props.onConfirm?.(field.getValue())}>
                {props.confirmText ?? "Confirm"}
            </Button>
        </Stack>
    );
};
