import { block } from "shared/blockly/core";

block("screen_input_str")
    .meta("category", "Screen")
    .content((v) =>
        v
            .text("ask “")
            .textbox("prompt", "value?")
            .text("” for ")
            .variable("var", { types: ["native-str", "native-num"] }),
    )
    .impl(({ fields }) => {
        if (fields.prompt.toLowerCase() == fields.var.toLowerCase() + "?") return "Prompt " + fields.var;
        return `Input \"${fields.prompt + " "}\",${fields.var}`;
    });

block("screen_input_disp")
    .meta("category", "Screen")
    .inline()
    .slot("text", { allow: "*", content: (v) => v.text("say") })
    .meta("shadow", { text: { blockType: "val_str", fields: { value: "Hello" } } })
    .extern()
    .impl(({ resolve }) => "Disp " + resolve("text"));

block("screen_read_key")
    .meta("category", "Screen")
    .content((v) => v.text("wait for key press and save to").variable("var", { types: ["native-num"] }))
    .impl(({ fields }) => `getKey\nRepeat Ans\n  getKey\nEnd\nAns->${fields.var}`);

block("val_screen_last_key_pressed")
    .meta("category", "Screen")
    .content((v) => v.text("code of last key pressed"))
    .outputs("native-num")
    .impl(() => `getKey`);

block("val_keycode")
    .meta("category", "Screen")
    .content((v) =>
        v
            .text("code of ")
            .dropdown("key", { "right arrow": "26", "up arrow": "25", "down arrow": "34", "left arrow": "24", enter: "105" })
            .text("key"),
    )
    .outputs("native-num")
    .impl(({ fields }) => fields.key);

block("screen_clrhome")
    .meta("category", "Screen")
    .content((v) => v.text("clear screen"))
    .impl(() => "ClrHome");

block("screen_write")
    .meta("category", "Screen")
    .meta("shadow", {
        str: { blockType: "val_str", fields: { value: "text" } },
        col: { blockType: "val_num", fields: { value: 1 } },
        row: { blockType: "val_num", fields: { value: 1 } },
    })
    .inline()
    .slot("str", { allow: "*", content: (v) => v.text("draw") })
    .slot("row", { allow: "native-num", content: (v) => v.text("at row") })
    .slot("col", { allow: "native-num", content: (v) => v.text("and column") })
    .impl(({ resolve }) => `Output(${resolve("row")},${resolve("col")},${resolve("str")}`);
