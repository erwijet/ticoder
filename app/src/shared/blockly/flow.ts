import { resultOf } from "@trpc/client/dist/links/internals/urlWithConnectionParams";
import { block } from "shared/blockly/core";

block("flow_start")
    .meta("category", "Flow")
    .content((v) => v.text("Begin Program"))
    .follows("none")
    .impl(() => '"PROGRAM START');

block("flow_quit")
    .meta("category", "Flow")
    .content((v) => v.text("Exit"))
    .preceeds("none")
    .impl(() => "Stop");

block("flow_comment")
    .meta("category", "Flow")
    .content((v) => v.text("Comment: ").textbox("msg", "note..."))
    .impl(({ fields }) => '"' + fields.msg);

block("flow_if")
    .meta("category", "Flow")
    .slot("cond", { allow: "bool", content: (v) => v.text("if ") })
    .content((v) => v.text("then"))
    .stmt("then", { allow: "*" })
    .impl(({ resolve }) => `If ${resolve("cond")}\nThen\n${resolve("then")}\nEnd`);

block("flow_if_else")
    .meta("category", "Flow")
    .slot("cond", { allow: "bool", content: (v) => v.text("if ") })
    .content((v) => v.text("then"))
    .stmt("then", { allow: "*" })
    .content((v) => v.text("else"))
    .stmt("else", { allow: "*" })
    .impl(({ resolve }) => `If ${resolve("cond")}\nThen\n${resolve("then")}\nElse\n${resolve("else")}End`);

block("flow_menu")
    .meta("category", "Flow")
    .content((v) => v.text("Show menu ").textbox("message", "message"))
    .stmt("body", { allow: "ctx-menu" })
    .impl(() => "");

block("flow_menu_option")
    .meta("category", "Flow")
    .follows("ctx-menu")
    .preceeds("ctx-menu")
    .content((v) => v.text("Menu Option").textbox("OPTION", "text"))
    .stmt("body", { allow: "*" })
    .impl(() => "");

block("flow_wait")
    .meta("category", "Flow")
    .slot("delaySec", { allow: "native-num", content: (v) => v.text("wait") })
    .content((v) => v.text("seconds"))
    .meta("shadow", {
        delaySec: {
            blockType: "val_num",
            fields: {
                value: 5,
            },
        },
    })
    .impl(({ resolve }) => `rand(${resolve("delaySec")}00`);

block("flow_while")
    .meta("category", "Flow")
    .slot("cond", { allow: "bool", content: (v) => v.text("while") })
    .stmt("body", { allow: "*" })
    .impl(({ resolve }) => `While ${resolve("cond")}\n${resolve("body")}\nEnd`);

block("flow_repeat")
    .meta("category", "Flow")
    .content((v) => v.text("repeat"))
    .stmt("body", { allow: "*" })
    .slot("cond", { allow: "bool", content: (v) => v.text("until") })
    .impl(({ resolve }) => `Repeat ${resolve("cond")}\n${resolve("body")}\nEnd`);

block("flow_for")
    .meta("category", "Flow")
    .meta("shadow", { lower: { blockType: "val_num", fields: { value: 0 } }, upper: { blockType: "val_num", fields: { value: 10 } } })
    .inline()
    .content((v) =>
        v
            .text("with")
            .variable("var", { types: ["native-num"] })
            .text("ranging from"),
    )
    .slot("lower", { allow: "native-num", content: (v) => v })
    .slot("upper", { allow: "native-num", content: (v) => v.text("to") })
    .stmt("body", { allow: "*" })
    .impl(({ fields, resolve }) => `For(${fields.var},${resolve("lower")},${resolve("upper")}\n${resolve("body")}\nEnd`);
