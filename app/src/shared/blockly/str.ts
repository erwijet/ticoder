import { block } from "shared/blockly/core";

block("str_concat")
    .meta("category", "Values")
    .slot("lhs", { allow: "native-str", content: (v) => v.text("join") })
    .slot("rhs", { allow: "native-str", content: (v) => v.text("with") })
    .inline()
    .outputs("native-str")
    .impl(({ resolve }) => `${resolve("lhs")}+${resolve("rhs")}`);
