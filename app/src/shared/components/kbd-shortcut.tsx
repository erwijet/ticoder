import { Kbd, Text } from "@mantine/core";
import { useOs } from "@mantine/hooks";

export const KbdShortcut = (props: { children: string }) => {
    const os = useOs();
    const isMacos = os == "macos";
    const mod = isMacos ? "⌘" : "Ctrl";
    const shift = "⇧";

    return (
        <div dir="ltr">
            {props.children
                .replaceAll("mod", mod)
                .replaceAll("shift", shift)
                .split("+")
                .map((it) => it.trim())
                .map((part) => <Kbd size="xs">{part}</Kbd>)
                .reduce((acc, cur) => (
                    <>
                        {acc} <span style={{ fontSize: "8px" }}>+</span> {cur}
                    </>
                ))}
        </div>
    );
};
