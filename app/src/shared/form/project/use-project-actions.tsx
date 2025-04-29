import { Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { alert } from "shared/alert";
import { trpc } from "shared/api";
import { downloadBlob } from "shared/download";
import { runPromising } from "shared/fns";
import { createProjectResourceParams, ProjectState } from "shared/form/project/context";
import { just, maybe } from "shared/fp";
import { useTiCalc } from "shared/react-ticalc";
import { tifiles } from "ticalc-usb";

export function useProjectActions(conf: { id: string; project: ProjectState; onInvalidate?: () => unknown }) {
    const { choose, queueFile, calc } = useTiCalc();
    const { mutateAsync: compileProject } = trpc.project.compile.useMutation();
    const { mutateAsync: duplicateProject } = trpc.project.duplicate.useMutation();
    const { mutateAsync: updateProject } = trpc.project.update.useMutation();
    const { mutateAsync: deleteProject } = trpc.project.delete.useMutation();

    async function sendToCalculator() {
        const loader = alert.createLoader("Sending to calculator...");
        if (!calc) await choose().catch(loader.error);

        const result = await compileProject(conf.id).catch(loader.error);

        if (!result) {
            loader.error("Failed to compile project.");
            return;
        }

        await just(result.bytes)
            .map((it) => Uint8Array.from(it))
            .map((it) => tifiles.parseFile(it))
            .take((file) => runPromising((resolve) => queueFile(file, resolve)));

        loader.ok(`Sent to ${calc?.name}.`);
    }

    async function duplicate() {
        const result = await duplicateProject(conf.id).catch(alert.error);
        alert.ok("Duplicated project.");
        conf.onInvalidate?.();
        return result;
    }

    async function download8xp() {
        const loader = alert.createLoader("Building project...");

        const result = await compileProject(conf.id).catch(loader.error);

        if (!result) {
            loader.error("Could not build project.");
            return;
        }

        downloadBlob(new Uint8Array(result.bytes), {
            name: conf.project.name.toUpperCase().slice(0, 8) + ".8xp",
            type: "application/octet-stream",
        });

        loader.ok("Downloaded .8xp file.");
    }

    async function makePrivate() {
        await updateProject({
            id: conf.id,
            ...createProjectResourceParams(conf.project),
            published: false,
        }).catch(alert.error);

        conf.onInvalidate?.();
        alert.ok("Project is private.");
    }

    async function makePublic() {
        await updateProject({
            id: conf.id,
            ...createProjectResourceParams(conf.project),
            published: true,
        }).catch(alert.error);

        conf.onInvalidate?.();
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
                    await deleteProject(conf.id).catch(loader.error);

                    conf.onInvalidate?.();
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
