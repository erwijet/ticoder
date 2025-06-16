import { block } from "shared/blockly/core";

block("flow_menu")
    .meta("category", "Menu")
    .content((v) => v.text("Show menu ").textbox("message", "message"))
    .stmt("body", { allow: "ctx-menu" })
    .impl(() => "");

block("flow_menu_option")
    .meta("category", "Menu")
    .meta("validate", ({ self, warn }) => {
        if (self.getParent()?.type != "flow_menu") warn("This block must appear within a 'Show menu' block");
    })
    .follows("ctx-menu")
    .preceeds("ctx-menu")
    .content((v) => v.text("Menu option").textbox("OPTION", "text"))
    .stmt("body", { allow: "*" })
    .impl(() => "");
