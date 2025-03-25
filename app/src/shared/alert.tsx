import { notifications } from "@mantine/notifications";
import { CheckCheckIcon, CheckCircle, CheckCircle2Icon, X } from "lucide-react";

export const alert = {
    error(msg: Error | string) {
        notifications.show({
            color: "red",
            title: "Error",
            icon: <X size={20} />,
            message: msg instanceof Error ? msg.message : msg,
        });
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
