import { Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { alert } from "shared/alert";
import { trpc } from "shared/api";
import { downloadBlob } from "shared/download";
import { runPromising } from "shared/fns";
import { createProjectResourceParams, ProjectState } from "shared/form/project/context";
import { just, maybe } from "shared/fp";
import { useTiCalc } from "shared/react-ticalc";
import { useTracer } from "shared/use-tracer";
import { tifiles } from "ticalc-usb";

export function useProjectActions(opts: { id: string; project: ProjectState; onInvalidate?: () => unknown }) {
    const { choose, queueFile } = useTiCalc();
    const { mutateAsync: compileProject } = trpc.project.compile.useMutation();
    const { mutateAsync: duplicateProject } = trpc.project.duplicate.useMutation();
    const { mutateAsync: updateProject } = trpc.project.update.useMutation();
    const { mutateAsync: deleteProject } = trpc.project.delete.useMutation();

    async function sendToCalculator() {
        const loader = alert.createLoader("Sending to calculator...");
        await choose().catch(loader.dismiss);

        const result = await compileProject(opts.id).catch(loader.error);

        if (!result) {
            loader.error("Failed to compile project.");
            return;
        }

        await just(result.bytes)
            .map(Uint8Array.from)
            .map(tifiles.parseFile)
            .take((file) => runPromising((didSend) => queueFile(file, didSend)));

        loader.ok("Sent to calculator.");
    }

    async function duplicate() {
        await duplicateProject(opts.id).catch(alert.error);
        alert.ok("Duplicated project.");
        opts.onInvalidate?.();
    }

    async function download8xp() {
        const loader = alert.createLoader("Building project...");

        const result = await compileProject(opts.id).catch(loader.error);

        if (!result) {
            loader.error("Could not build project.");
            return;
        }

        downloadBlob(new Uint8Array(result.bytes), {
            name: opts.project.name.toUpperCase().slice(0, 8) + ".8xp",
            type: "application/octet-stream",
        });

        loader.ok("Downloaded .8xp file.");
    }

    async function makePrivate() {
        await updateProject({
            id: opts.id,
            ...createProjectResourceParams(opts.project),
            published: false,
        }).catch(alert.error);

        opts.onInvalidate?.();
        alert.ok("Project is private.");
    }

    async function makePublic() {
        await updateProject({
            id: opts.id,
            ...createProjectResourceParams(opts.project),
            published: true,
        }).catch(alert.error);

        opts.onInvalidate?.();
        alert.ok("Project is public.");
    }

    async function promptDelete() {
        return new Promise<void>((resolve, reject) => {
            modals.openConfirmModal({
                title: <Title order={3}>Delete Project</Title>,
                children: <Text size="sm">Are you sure to you want to delete this project? This can't be undone.</Text>,
                labels: {
                    confirm: "Delete Project",
                    cancel: "Cancel",
                },
                confirmProps: {
                    color: "red",
                },
                onCancel: reject,
                async onConfirm() {
                    const loader = alert.createLoader("Deleting project...");
                    await deleteProject(opts.id).catch(loader.error);

                    opts.onInvalidate?.();
                    loader.ok("Deleted project.");
                    resolve();
                },
            });
        });
    }

    return {
        sendToCalculator,
        download8xp,
        duplicate,
        makePublic,
        makePrivate,
        promptDelete,
    };
}
