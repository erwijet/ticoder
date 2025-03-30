import { Badge, BadgeProps } from "@mantine/core";
import { BlendIcon, LockIcon } from "lucide-react";

export const PublicBadge = (props: BadgeProps) => (
    <Badge size="sm" variant="light" radius="xs" color="indigo" leftSection={<BlendIcon size={12} />} {...props}>
        Public
    </Badge>
);

export const PrivateBadge = (props: BadgeProps) => (
    <Badge size="sm" variant="light" color="gray" leftSection={<LockIcon size={12} />} radius="xs" {...props}>
        Private
    </Badge>
);
