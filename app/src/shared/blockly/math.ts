import { block, ord } from "shared/blockly/core";
import { match } from "ts-pattern";

block("math_add")
    .meta("category", "Math")
    .meta("shadow-field:num", ["lhs", "rhs"])
    .slot("lhs", { allow: "native-num", content: (v) => v })
    .slot("rhs", { allow: "native-num", content: (v) => v.text("+") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `(${resolve("lhs")}+${resolve("rhs")})`, order: ord.ADDITION }));

block("math_sub")
    .meta("category", "Math")
    .meta("shadow-field:num", ["lhs", "rhs"])
    .slot("lhs", { allow: "native-num", content: (v) => v })
    .slot("rhs", { allow: "native-num", content: (v) => v.text("-") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `(${resolve("lhs")}-${resolve("rhs")})`, order: ord.SUBTRACTION }));

block("math_mul")
    .meta("category", "Math")
    .meta("shadow-field:num", ["lhs", "rhs"])
    .slot("lhs", { allow: "native-num", content: (v) => v })
    .slot("rhs", { allow: "native-num", content: (v) => v.text("*") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `(${resolve("lhs")}*${resolve("rhs")})`, order: ord.MULTIPLICATION }));

block("math_div")
    .meta("category", "Math")
    .meta("shadow-field:num", ["lhs", "rhs"])
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
    .meta("shadow-field:num", "val")
    .slot("val", { allow: "native-num", content: (v) => v.text("√") })
    .inline()
    .outputs("native-num")
    .impl(({ resolve }) => ({ value: `[root]^2(${resolve("val")})`, order: ord.EXPONENTIATION }));

block("val_num")
    .meta("category", "Math")
    .content((v) => v.textbox("value", "10"))
    .outputs("native-num")
    .impl(
        ({ fields }) =>
            match(fields.value)
                .when(
                    (it) => it.startsWith("-"),
                    (it) => "[neg]" + it.slice(1).replaceAll(/[^0-9\.]/g, ""),
                )
                .otherwise((it) => it.replaceAll(/[^0-9\.]/g, "")) || "0",
    );

block("var_num")
    .meta("category", "Math")
    .content((v) => v.variable("var", { types: ["native-num"] }))
    .outputs("native-num")
    .impl(({ fields }) => fields.var);

block("var_num_set_bool")
    .meta("category", "Math")
    .content((v) =>
        v
            .text("set")
            .variable("var", { types: ["native-num"] })
            .text("to")
            .dropdown("val", { True: "1", False: "0" }),
    )
    .impl(({ fields }) => `${fields.val}->${fields.var}`);

block("var_num_set")
    .meta("category", "Math")
    .meta("shadow-field:num", "val")
    .slot("val", {
        allow: "native-num",
        content: (v) =>
            v
                .text("set")
                .variable("var", { types: ["native-num"] })
                .text("to"),
    })
    .impl(({ fields, resolve }) => `${resolve("val")}->${fields.var}`);

block("val_math_unary_fn")
    .meta("category", "Math")
    .meta("shadow-field:num", "val")
    .slot("val", { allow: "native-num", content: (v) => v.dropdown("op", { "absolute value": "abs", sum: "sum" }).text("of") })
    .outputs("native-num")
    .impl(({ fields, resolve }) => `${fields.op}(${resolve("val")})`);
