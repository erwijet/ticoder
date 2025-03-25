import { block, categories } from "src/blockly/core";

block("str_concat")
    .hue(categories.Values)
    .slot("lhs", { allow: "native-str", content: (v) => v.text("Concat") })
    .slot("rhs", { allow: "native-str", content: (v) => v.text("with") })
    .inline()
    .outputs("native-str")
    .impl(({ resolve }) => `${resolve("lhs")}+${resolve("rhs")}`);
