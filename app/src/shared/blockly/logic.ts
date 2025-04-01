import { block } from "shared/blockly/core";

block("logic_eq")
    .meta("category", "Logic")
    .inline()
    .outputs("Boolean")
    .slot("lhs", { allow: "*", content: (v) => v })
    .slot("rhs", { allow: "*", content: (v) => v.text("=") })
    .impl(({ resolve }) => `(${resolve("lhs")})=(${resolve("rhs")})`);

block("logic_neq")
    .content((v) => v.text("neq"))
    .impl(() => "");

block("logic_gt")
    .content((v) => v.text("gt"))
    .impl(() => "");

block("logic_gte")
    .content((v) => v.text("gte"))
    .impl(() => "");

block("logic_lt")
    .content((v) => v.text("lt"))
    .impl(() => "");

block("logic_lte")
    .content((v) => v.text("lte"))
    .impl(() => "");

block("logic_and")
    .content((v) => v.text("and"))
    .impl(() => "");

block("logic_or")
    .content((v) => v.text("or"))
    .impl(() => "");

block("logic_not")
    .content((v) => v.text("not"))
    .impl(() => "");
