import { block } from "shared/blockly/core";

block("task_def")
    .meta("category", "Tasks")
    .follows("none")
    .content((v) =>
        v
            .text("define task")
            .variable("var", { types: ["task"] })
            .text(":"),
    )
    .impl(({ fields }) => `Lbl ${fields.var}`);

block("task_run")
    .meta("category", "Tasks")
    .content((v) => v.text("run task").variable("var", { types: ["task"] }))
    .impl(({ fields }) => `{:call ${fields.var}}`);
