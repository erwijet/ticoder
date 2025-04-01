import { block, ord } from "shared/blockly/core";

const shadows = {
    rhs: {
        blockType: "val_num",
        fields: {
            value: 10,
        },
    },
    lhs: {
        blockType: "val_num",
        fields: {
            value: 10,
        },
    },
};

block("math_add")
    .meta("category", "Math")
    .meta("shadow", shadows)
    .slot("lhs", { allow: "native-num", content: (v) => v })
    .slot("rhs", { allow: "native-num", content: (v) => v.text("+") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `${resolve("lhs")}+${resolve("rhs")}`, order: ord.ADDITION }));

block("math_sub")
    .meta("category", "Math")
    .meta("shadow", shadows)
    .slot("lhs", { allow: "native-num", content: (v) => v })
    .slot("rhs", { allow: "native-num", content: (v) => v.text("-") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `${resolve("lhs")}-${resolve("rhs")}`, order: ord.SUBTRACTION }));
