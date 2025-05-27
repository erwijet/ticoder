import { Workspace } from "blockly";
import { err, ok, Result, safeTry } from "neverthrow";

type ValidationError = {
    type: "validation" | "internal";
    msg: string;
};

export function validateWorkspace(workspace: Workspace): Result<void, ValidationError> {
    return safeTry(function* () {
        const taskVars = workspace.getBlocksByType("task_run").map((it) => it.getField("var")?.getValue());

        for (const taskId of taskVars) {
            yield* validateTaskDefBlockExists(workspace, taskId);
            yield* validateTaskHasUniqueDefintion(workspace, taskId);
        }

        return ok();
    });
}

function validateTaskDefBlockExists(workspace: Workspace, taskId: string): Result<void, ValidationError> {
    return safeTry(function* () {
        const taskName = yield* getTaskName(workspace, taskId);

        console.log(workspace.getBlocksByType("task_def").map((it) => it.getField("var")?.getValue()));

        if (!workspace.getBlocksByType("task_def").some((it) => it.getField("var")?.getValue() == taskId))
            return err({
                type: "validation",
                msg: `The task '${taskName}' has one or more "run" blocks, but no definition! Did you forget to use a "define task" block somewhere in your project?`,
            });

        return ok();
    });
}

function validateTaskHasUniqueDefintion(workspace: Workspace, taskId: string): Result<void, ValidationError> {
    return safeTry(function* () {
        const taskName = yield* getTaskName(workspace, taskId);

        if (workspace.getBlocksByType("task_def").filter((it) => it.getField("var")?.getValue() == taskId).length > 1)
            return err({
                type: "validation",
                msg: `The task '${taskName}' has two or more definition specified in this project, however only one is permitted per task. Do you have an extra "define task" block somewhere?`,
            });

        return ok();
    });
}

function getTaskName(workspace: Workspace, taskId: string): Result<string, ValidationError> {
    const task = workspace.getVariableById(taskId);
    if (!task) return err({ type: "internal", msg: "Failed to find associated task with taskVar: " + taskId });

    return ok(task.name);
}
