import "src/blockly/prelude"; // load block library

import { useElementSize } from "@mantine/hooks";
import { useDeferredValue, useEffect, useRef } from "react";
import * as Blockly from "blockly/core";
import { buildToolbox, generator } from "src/blockly/core";
import { useBlocklyWorkspace } from "react-blockly";

import { useProjectFormContext } from "./context";
import { runCatching } from "shared/fns";
import { useLayout } from "shared/components/Layout";

export const ProjectEditor = () => {
    const layout = useLayout();
    const form = useProjectFormContext();
    const ref = useRef(null);

    const { workspace, json } = useBlocklyWorkspace({
        ref,
        workspaceConfiguration: {
            grid: {
                colour: "#333333",
                length: 4,
                snap: true,
                spacing: 16,
            },
            theme: {
                name: "ticoder",
                base: Blockly.Themes.Zelos,
                componentStyles: {
                    workspaceBackgroundColour: "#222222",
                },
            },
        },
        initialJson: runCatching(() => JSON.parse(form.values.blockly)),
        toolboxConfiguration: buildToolbox(),
    });

    const deferredJson = useDeferredValue(json);

    useEffect(() => {
        if (!workspace) return;

        form.setFieldValue("blockly", JSON.stringify(json));

        const source = workspace
            .getBlocksByType("flow_start")
            .map((blk) => generator.blockToCode(blk))
            .join('\n"--\n');

        form.setFieldValue("source", source);
    }, [deferredJson]);

    return (
        <div style={{ height: `calc(100vh - ${layout.headingRef.current?.clientHeight}px)`, width: "100%" }}>
            <div ref={ref} style={{ height: "100%", width: "100%" }} />
        </div>
    );
};
