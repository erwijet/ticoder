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
    .stmt("then", { allow: "*" })
    .extern()
    .impl(({ resolve }) => `If ${resolve("cond")}\nThen\n${resolve("then")}\nEnd`);

block("flow_if_else")
    .meta("category", "Flow")
    .slot("cond", { allow: "bool", content: (v) => v.text("if ") })
    .stmt("then", { allow: "*" })
    .content((v) => v.text("else"))
    .stmt("else", { allow: "*" })
    .extern()
    .impl(({ resolve }) => `If ${resolve("cond")}\nThen\n${resolve("then")}\nElse\n${resolve("else")}\nEnd`);

block("flow_wait_for_keypress")
    .meta("category", "Flow")
    .content((v) => v.text("wait until a key is pressed"))
    .impl(() => `Repeat Ans\n  getKey\nEnd`);

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
