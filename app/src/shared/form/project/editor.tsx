import "shared/blockly/prelude"; // load block library

import { shadowBlockConversionChangeListener } from "@blockly/shadow-block-converter";
import * as Blockly from "blockly/core";
import { useDeferredValue, useEffect, useRef } from "react";
import { useBlocklyWorkspace } from "react-blockly";
import { generator, toolbox } from "shared/blockly/core";
import { useLayout } from "shared/components/Layout";
import { run, runCatching, runPromising } from "shared/fns";
import { useProjectFormContext } from "shared/form/project/context";
import { validateWorkspace } from "shared/blockly/validate";
import { processVariables } from "shared/blockly/postprocess";
import { create } from "zustand";
import { alert } from "shared/alert";
import { match } from "ts-pattern";

export const workspaceStore = create<{ set: (workspace: Blockly.Workspace) => void; workspace?: Blockly.Workspace }>()((set) => ({
    set: (ws: Blockly.Workspace) => set({ workspace: ws }),
}));

export const useWorkspace = () => workspaceStore((s) => s.workspace);

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
            renderer: "Thrasos",
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
            workspace?.createVariable("my text", "native-str");

        if (workspace?.getAllVariables().filter((it) => it.type == "native-num").length == 0)
            workspace?.createVariable("my number", "native-num");

        if (workspace?.getAllVariables().filter((it) => it.type == "native-lst").length == 0)
            workspace?.createVariable("my list", "native-lst");

        if (workspace?.getAllVariables().filter((it) => it.type == "task").length == 0) workspace?.createVariable("my task", "task");

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

        run(async () => {
            form.setFieldValue("blockly", JSON.stringify(json));

            const validation = validateWorkspace(workspace);
            console.log({ validation });
            if (validation.isErr()) {
                await alert.popup(validation.error.msg, {
                    title: match(validation.error.type)
                        .with("internal", () => "Internal Error")
                        .with("validation", () => "Issue with Project")
                        .exhaustive(),
                });

                alert.error("Invalid workspace.");

                return;
            }

            const source = workspace
                .getBlocksByType("flow_start")
                .map((block) => generator.blockToCode(block))
                .join('\n"--\n');

            form.setFieldValue("source", processVariables(workspace, source));
        });
    }, [deferredJson]);

    return (
        <>
            <div style={{ height: `calc(100vh - ${layout.headingRef.current?.clientHeight}px)`, width: "100%" }}>
                <div ref={ref} style={{ height: "100%", width: "100%" }} />
            </div>
        </>
    );
};
