import { useState } from "react";
import { Stack, TextInput, Button, Tooltip } from "@mantine/core";
import { InfoIcon } from "lucide-react";

export const ProjectNamePanel = (props: { defaultValue?: string; action?: string; onDone: (values: { name: string }) => unknown }) => {
    const [name, setName] = useState(props.defaultValue ?? "PROJECT");

    return (
        <Stack>
            <TextInput
                label="Project Title"
                value={name}
                rightSection={
                    <Tooltip
                        w={220}
                        multiline
                        label="Project names must be eight characters or less, and can only contain A-Z, 0-9 characters."
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
            <Button ml="auto" onClick={() => props.onDone({ name })}>
                {props.action}
            </Button>
        </Stack>
    );
};
