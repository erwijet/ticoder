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
    .impl(({ resolve }) => ({ value: `(${resolve("lhs")}+${resolve("rhs")})`, order: ord.ADDITION }));

block("math_sub")
    .meta("category", "Math")
    .meta("shadow", shadows)
    .slot("lhs", { allow: "native-num", content: (v) => v })
    .slot("rhs", { allow: "native-num", content: (v) => v.text("-") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `(${resolve("lhs")}-${resolve("rhs")})`, order: ord.SUBTRACTION }));

block("math_mul")
    .meta("category", "Math")
    .meta("shadow", shadows)
    .slot("lhs", { allow: "native-num", content: (v) => v })
    .slot("rhs", { allow: "native-num", content: (v) => v.text("*") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `(${resolve("lhs")}*${resolve("rhs")})`, order: ord.MULTIPLICATION }));

block("math_div")
    .meta("category", "Math")
    .meta("shadow", shadows)
    .slot("lhs", { allow: "native-num", content: (v) => v })
    .slot("rhs", { allow: "native-num", content: (v) => v.text("/") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `(${resolve("lhs")}/${resolve("rhs")})`, order: ord.DIVISION }));

block("math_pow")
    .meta("category", "Math")
    .meta("shadow", {
        rhs: {
            blockType: "val_num",
            fields: {
                value: 2,
            },
        },
        lhs: {
            blockType: "val_num",
            fields: {
                value: 3,
            },
        },
    })
    .slot("lhs", { allow: "native-num", content: (v) => v })
    .slot("rhs", { allow: "native-num", content: (v) => v.text("to the power of") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `(${resolve("lhs")}^${resolve("rhs")})`, order: ord.EXPONENTIATION }));

block("math_sqrt")
    .meta("category", "Math")
    .meta("shadow", {
        val: {
            blockType: "val_num",
            fields: {
                value: 25,
            },
        },
    })
    .slot("val", { allow: "native-num", content: (v) => v.text("√") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `[root]^2(${resolve("val")})`, order: ord.EXPONENTIATION }));
