import { Button, Stack, TextInput } from "@mantine/core";
import { useField } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { CheckCircle2Icon, X } from "lucide-react";

export const alert = {
    error(msg: Error | string) {
        notifications.show({
            color: "red",
            title: "Error",
            icon: <X size={20} />,
            message: msg instanceof Error ? msg.message : msg,
        });
    },
    async ask(msg: string, opts?: { confirmText?: string; label?: string }) {
        const { promise, resolve, reject } = Promise.withResolvers();

        modals.open({
            title: msg,
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

const RequestModalPane = (props: { label?: string; confirmText?: string; onConfirm?: (value: string) => void }) => {
    const field = useField({ initialValue: "" });

    return (
        <Stack>
            <TextInput label={props.label} {...field.getInputProps()} />
            <Button ml="auto" onClick={() => props.onConfirm?.(field.getValue())}>
                {props.confirmText ?? "Confirm"}
            </Button>
        </Stack>
    );
};
