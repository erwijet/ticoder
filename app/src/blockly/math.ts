import { block, categories, ord } from "src/blockly/core";

block("math_add")
    .hue(categories.Math)
    .slot("lhs", { allow: "native-num", content: (v) => v })
    .slot("rhs", { allow: "native-num", content: (v) => v.text("+") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `${resolve("lhs")}+${resolve("rhs")}`, order: ord.ADDITION }));

block("math_sub")
    .hue(categories.Math)
    .slot("lhs", { allow: "native-num", content: (v) => v })
    .slot("rhs", { allow: "native-num", content: (v) => v.text("-") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `${resolve("lhs")}-${resolve("rhs")}`, order: ord.SUBTRACTION }));
