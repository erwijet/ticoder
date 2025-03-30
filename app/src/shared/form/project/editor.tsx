import "src/blockly/prelude"; // load block library

import { useDeferredValue, useEffect, useRef } from "react";
import * as Blockly from "blockly/core";
import { buildToolbox, generator } from "src/blockly/core";
import { useBlocklyWorkspace } from "react-blockly";

import { useProjectFormContext } from "./context";
import { runCatching } from "shared/fns";

export const ProjectEditor = () => {
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
        <>
            <div style={{ height: "100vh", display: "flex" }}>
                <div ref={ref} style={{ height: "100%", flex: "1" }} />
            </div>
        </>
    );
};
