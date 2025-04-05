import { block, views } from "shared/blockly/core";

function capitalize(s: string) {
    return s.at(0)?.toUpperCase() + s.slice(1).toLowerCase();
}

block("val_num")
    .meta("category", "Values")
    .content((v) => v.textbox("value", "10"))
    .outputs("native-num")
    .impl(({ fields }) => `${fields.value}`);

block("var_num")
    .meta("category", "Math")
    .content((v) => v.variable("var", { types: ["native-num"] }))
    .outputs("native-num")
    .impl(({ fields }) => fields.var);

block("io_input_num")
    .meta("category", "Math")
    .content((v) =>
        v
            .text("ask “")
            .textbox("prompt", "value?")
            .text("” for number ")
            .variable("var", { types: ["native-num"] }),
    )
    .impl(({ fields }) => {
        if (fields.prompt.toLowerCase() == fields.var.toLowerCase() + "?") return "Prompt " + fields.var;
        return `Input \"${fields.prompt + " "}\",${fields.var}`;
    });

block("val_str")
    .meta("category", "Values")
    .content((v) => v.text("“").textbox("value", "text").text("”"))
    .outputs("native-str")
    .impl(({ fields }) => `"${fields.value}"`);

block("var_str")
    .meta("category", "Text")
    .content((v) => v.variable("var", { types: ["native-str"] }))
    .outputs("native-str")
    .impl(({ fields }) => fields.var);

block("val_var_num")
    .meta("category", "Values")
    .content((v) => v.text("Variable").custom("var", views.numVarDropdown))
    .outputs("native-num")
    .impl(({ fields }) => fields.var);
