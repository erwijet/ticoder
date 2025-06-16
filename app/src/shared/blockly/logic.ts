import { block } from "shared/blockly/core";

block("val_bool")
    .meta("category", "Logic")
    .content((v) => v.dropdown("val", { True: "1", False: "0" }))
    .outputs("bool")
    .impl(({ fields }) => fields.val);

block("logic_eq")
    .meta("category", "Logic")
    .inline()
    .outputs("bool")
    .slot("lhs", { allow: "*", content: (v) => v })
    .slot("rhs", { allow: "*", content: (v) => v.text("equals") })
    .impl(({ resolve }) => `(${resolve("lhs")}=${resolve("rhs")})`);

block("logic_not")
    .meta("category", "Logic")
    .meta("shadow-field:bool", "arg")
    .extern()
    .outputs("bool")
    .slot("arg", { allow: "*", content: (v) => v.text("not") })
    .impl(({ resolve }) => `not(${resolve("arg")})`);

block("logic_neq")
    .meta("category", "Logic")
    .inline()
    .outputs("bool")
    .slot("lhs", { allow: "*", content: (v) => v })
    .slot("rhs", { allow: "*", content: (v) => v.text("not equals") })
    .impl(({ resolve }) => `(${resolve("lhs")})!=(${resolve("rhs")})`);

block("logic_num_cmp")
    .meta("category", "Logic")
    .inline()
    .outputs("bool")
    .slot("lhs", { allow: "native-num", content: (v) => v })
    .slot("rhs", {
        allow: "native-num",
        content: (v) =>
            v.dropdown("op", {
                ">": ">",
                "<": "<",
                "≥": ">=",
                "≤": "<=",
            }),
    })
    .impl(({ resolve, fields }) => `(${resolve("lhs")}${fields.op}${resolve("rhs")})`);

block("logic_or")
    .meta("category", "Logic")
    .slot("lhs", { allow: "bool", content: (v) => v })
    .slot("rhs", { allow: "bool", content: (v) => v.dropdown("op", ["or", "and"]) })
    .inline()
    .outputs("bool")
    .impl(({ fields, resolve }) => `(${resolve("lhs")}${fields.op == "or" ? " or " : "and"}${resolve("rhs")})`);
