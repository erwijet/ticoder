import "src/blockly/prelude"; // load block library

import { useDeferredValue, useEffect, useRef } from "react";
import * as Blockly from "blockly/core";
import { buildToolbox, generator } from "src/blockly/core";
import { useBlocklyWorkspace } from "react-blockly";

import { createProjectResourceParams, useProjectFormContext } from "./context";
import { trpc } from "shared/api";
import { Button } from "@mantine/core";
import { useParams } from "@tanstack/react-router";
import { downloadBlob } from "shared/download";
import { runCatching } from "shared/fns";

export const ProjectEditor = () => {
    const form = useProjectFormContext();
    const ref = useRef(null);

    const { mutateAsync: updateProject } = trpc.project.update.useMutation();
    const { mutateAsync: compileProject } = trpc.project.compile.useMutation();

    const { id } = useParams({ from: "/_auth/projects/$id" });

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

    async function handleCompile() {
        await updateProject({ id, ...createProjectResourceParams({ ...form.getValues(), name: form.values.name }) });
        const { bytes } = await compileProject(id);

        downloadBlob(new Uint8Array(bytes), {
            name: form.values.name + ".8xp",
            type: "application/octet-stream",
        });
    }

    return (
        <>
            <Button onClick={handleCompile}>save & download</Button>
            <div style={{ height: "100vh", width: "100vw", display: "flex" }}>
                <div ref={ref} style={{ height: "100%", flex: "1" }} />
                <div style={{ flex: "1" }}>
                    <pre>{form.values.source}</pre>
                </div>
            </div>
        </>
    );
};
