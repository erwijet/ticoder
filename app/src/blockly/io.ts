import { block, categories, views } from "src/blockly/core";

block("io_input")
    .hue(categories.IO)
    .content((v) => v.text("Ask “").textbox("prompt", "value?").text("” for ").custom("var", views.varDropdown))
    .impl(({ fields }) => {
        if (fields.prompt.toLowerCase() == fields.var.toLowerCase() + "?") return "Prompt " + fields.var;
        return `Input \"${fields.prompt + " "}\",${fields.var}`;
    });

block("io_disp")
    .hue(categories.IO)
    .content((v) => v.text("Display"))
    .inline()
    .slot("text", { allow: "*", content: (v) => v })
    .impl(({ resolve }) => "Disp " + resolve("text"));

block("io_output")
    .content((v) => v.text("output"))
    .impl(() => "");

block("io_getKey")
    .content((v) => v.text("getKey"))
    .impl(() => "");

block("io_clrHome")
    .content((v) => v.text("ClrHome"))
    .impl(() => "");
