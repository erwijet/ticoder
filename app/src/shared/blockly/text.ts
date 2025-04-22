import { block } from "shared/blockly/core";

block("val_str")
    .meta("category", "Text")
    .content((v) => v.text("“").textbox("value", "text").text("”"))
    .outputs("native-str")
    .impl(({ fields }) => `"${fields.value}"`);

block("var_str")
    .meta("category", "Text")
    .content((v) => v.variable("var", { types: ["native-str"] }))
    .outputs("native-str")
    .impl(({ fields }) => fields.var);

block("var_str_set")
    .meta("category", "Text")
    .slot("val", {
        allow: "native-str",
        content: (v) =>
            v
                .text("set")
                .variable("var", { types: ["native-str"] })
                .text("to"),
    })
    .impl(({ fields, resolve }) => `${resolve("val")}->${fields.var}`);

block("str_concat")
    .meta("category", "Text")
    .meta("shadow", {
        lhs: {
            blockType: "val_str",
            fields: { value: "hello, " },
        },
        rhs: {
            blockType: "val_str",
            fields: { value: "world" },
        },
    })
    .slot("lhs", { allow: "native-str", content: (v) => v.text("join") })
    .slot("rhs", { allow: "native-str", content: (v) => v.text("with") })
    .inline()
    .outputs("native-str")
    .impl(({ resolve }) => `${resolve("lhs")}+${resolve("rhs")}`);

block("val_text_len")
    .meta("category", "Text")
    .meta("shadow-field:str", "str")
    .slot("str", { allow: "native-str", content: (v) => v.text("length of ") })
    .outputs("native-num")
    .impl(({ resolve }) => `length(${resolve("str")})`);

block("val_text_sub")
    .meta("category", "Text")
    .meta("shadow", {
        source: { blockType: "val_str", fields: { value: "text" } },
        start: { blockType: "val_num", fields: { value: 1 } },
        size: { blockType: "val_num", fields: { value: 3 } },
    })
    .slot("size", { allow: "native-num", content: (v) => v.text("first") })
    .slot("source", { allow: "native-str", content: (v) => v.text("characters from ") })
    .slot("start", { allow: "native-num", content: (v) => v.text("starting at") })
    .inline()
    .outputs("native-str")
    .impl(({ resolve }) => `sub(${resolve("source")},${resolve("start")},${resolve("size")})`);
