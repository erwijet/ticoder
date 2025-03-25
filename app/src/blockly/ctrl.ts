import { block, categories } from "src/blockly/core";

block("flow_if")
    .hue(categories.Control)
    .slot("cond", { allow: "Boolean", content: (v) => v.text("If ") })
    .stmt("then", { allow: "*" })
    .impl(({ resolve }) => `If ${resolve("cond")}\n${resolve("then")}\nEnd`);
