import { block, views } from "shared/blockly/core";

function capitalize(s: string) {
    return s.at(0)?.toUpperCase() + s.slice(1).toLowerCase();
}

block("val_num")
    .meta("category", "Values")
    .content((v) => v.textbox("value", "10"))
    .outputs("native-num")
    .impl(({ fields }) => `${fields.value}`);

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
