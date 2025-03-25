import { block, categories } from "src/blockly/core";

block("flow_start")
    .hue(categories.Flow)
    .content((v) => v.text("Begin Program"))
    .follows("none")
    .impl(() => '"PROGRAM START');

block("flow_quit")
    .hue(categories.Flow)
    .content((v) => v.text("Exit"))
    .preceeds("none")
    .impl(() => "Stop");

block("flow_comment")
    .hue(categories.Flow)
    .content((v) => v.text("Comment: ").textbox("msg", "note..."))
    .impl(({ fields }) => '"' + fields.msg);
