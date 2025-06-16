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

block("val_charcode_of")
    .meta("category", "Text")
    .meta("shadow-field:str", "text")
    .meta("shadow-value:str", "A")
    .slot("text", {
        allow: "native-str",
        content: (v) => v.text("value of letter "),
    })
    .outputs("native-num")
    .impl(({ resolve }) => `inString({@@charmap},sub(${resolve("text")},1,1))`);

block("val_str_from_charcode")
    .meta("category", "Text")
    .meta("shadow-field:num", "val")
    .meta("shadow-value:num", 1)
    .slot("val", {
        allow: "native-num",
        content: (v) => v.text("letter of value"),
    })
    .outputs("native-str")
    .impl(({ resolve }) => `sub({@@charmap},${resolve("val")},1)`);

block("var_str_set_to_num")
    .meta("category", "Text")
    .meta("shadow-field:num", "val")
    .slot("val", {
        allow: "native-num",
        content: (v) =>
            v
                .text("set")
                .variable("var", { types: ["native-str"] })
                .text("to text of number"),
    })
    .impl(
        ({ resolve, fields }) =>
            // prettier-ignore
            `"?\nFor({@@strToNumIndex},1,1+log(${resolve("val")}+not(${resolve("val")}\n  sub("0123456789",iPart(10fPart(${resolve("val")}10^([neg]{@@strToNumIndex})))+1,1)+Ans\nEnd\nsub(Ans,1,length(Ans)-1->${fields.var}`,
    );

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
    .slot("lhs", { allow: "native-str", content: (v) => v })
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
    .slot("source", { allow: "native-str", content: (v) => v.text("letters of ") })
    .slot("start", { allow: "native-num", content: (v) => v.text("starting at letter") })
    .inline()
    .outputs("native-str")
    .impl(({ resolve }) => `sub(${resolve("source")},${resolve("start")},${resolve("size")})`);
