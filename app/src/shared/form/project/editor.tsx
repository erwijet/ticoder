import "shared/blockly/prelude"; // load block library

import { shadowBlockConversionChangeListener } from "@blockly/shadow-block-converter";
import * as Blockly from "blockly/core";
import { useDeferredValue, useEffect, useRef } from "react";
import { useBlocklyWorkspace } from "react-blockly";
import { generator, toolbox } from "shared/blockly/core";

import { useLayout } from "shared/components/Layout";
import { runCatching } from "shared/fns";
import { useProjectFormContext } from "shared/form/project/context";
import { processVariables } from "shared/blockly/postprocess";
import { create } from "zustand";

export const workspaceStore = create<{ set: (workspace: Blockly.Workspace) => void; workspace?: Blockly.Workspace }>()((set) => ({
    set: (ws: Blockly.Workspace) => set({ workspace: ws }),
}));

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
        toolboxConfiguration: toolbox.buildToolbox(),
    });

    useEffect(() => {
        // set up default variables...
        if (workspace?.getAllVariables().filter((it) => it.type == "native-str").length == 0)
            workspace?.createVariable("myTextVariable", "native-str");

        // do shameful stuff...
        workspaceStore.getState().set(workspace!);

        // and event listeners...
        workspace?.addChangeListener(shadowBlockConversionChangeListener);

        return () => {
            workspace?.removeChangeListener(shadowBlockConversionChangeListener);
        };
    }, [workspace]);

    const deferredJson = useDeferredValue(json);

    useEffect(() => {
        if (!workspace) return;

        form.setFieldValue("blockly", JSON.stringify(json));

        const source = workspace
            .getBlocksByType("flow_start")
            .map((block) => generator.blockToCode(block))
            .join('\n"--\n');

        form.setFieldValue("source", processVariables(workspace, source));
    }, [deferredJson]);

    return (
        <>
            <div style={{ height: `calc(100vh - ${layout.headingRef.current?.clientHeight}px)`, width: "100%" }}>
                <div ref={ref} style={{ height: "100%", width: "100%" }} />
            </div>
        </>
    );
};
