import { block, categories, views } from "src/blockly/core";

function capitalize(s: string) {
    return s.at(0)?.toUpperCase() + s.slice(1).toLowerCase();
}

block("val_num")
    .hue(categories.Values)
    .content((v) => v.textbox("value", "10"))
    .outputs("native-num")
    .impl(({ fields }) => `${fields.value}`);

block("val_str")
    .hue(categories.Values)
    .content((v) => v.text("“").textbox("value", "text").text("”"))
    .outputs("native-str")
    .impl(({ fields }) => `"${fields.value}"`);

block("val_var_str")
    .hue(categories.Values)
    .content((v) => v.text("Text Variable").custom("var", views.strVarDropdown))
    .outputs("native-str")
    .impl(({ fields }) => capitalize(fields.var));

block("val_var_num")
    .hue(categories.Values)
    .content((v) => v.text("Variable").custom("var", views.numVarDropdown))
    .outputs("native-num")
    .impl(({ fields }) => fields.var);
