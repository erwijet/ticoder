import { block, views } from "shared/blockly/core";

block("io_input")
    .meta("category", "Text")
    .content((v) =>
        v
            .text("ask “")
            .textbox("prompt", "value?")
            .text("” for ")
            .variable("var", { types: ["native-str"] }),
    )
    .impl(({ fields }) => {
        if (fields.prompt.toLowerCase() == fields.var.toLowerCase() + "?") return "Prompt " + fields.var;
        return `Input \"${fields.prompt + " "}\",${fields.var}`;
    });

block("io_disp")
    .meta("category", "Text")
    .inline()
    .slot("text", { allow: "*", content: (v) => v.text("say") })
    .meta("shadow", { text: { blockType: "val_str", fields: { value: "Hello" } } })
    .impl(({ resolve }) => "Disp " + resolve("text"));

// block("io_output")
//     .meta("category", "I/O")
//     .content((v) => v.text("output"))
//     .impl(() => "");

// block("io_getKey")
//     .meta("category", "I/O")
//     .content((v) => v.text("getKey"))
//     .impl(() => "");

// block("io_clrHome")
//     .meta("category", "I/O")
//     .content((v) => v.text("ClrHome"))
//     .impl(() => "");
