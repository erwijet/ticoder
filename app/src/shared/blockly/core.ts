import * as Blockly from "blockly/core";
import { createBlockBuilder, createCustomContentView, createToolboxPlugin } from "better-blockly";
import * as shareableProcedures from "@blockly/block-shareable-procedures";

Blockly.common.defineBlocks(shareableProcedures.blocks);

export const generator = new Blockly.Generator("ticoder");

export const toolbox = createToolboxPlugin({
    categories: {
        Flow: { color: "rgb(153, 102, 255)" },
        Values: { color: "rgb(207, 99, 207)" },
        Math: { color: "rgb(255, 51, 85)" },
        Text: { color: "rgb(255, 140, 26)" },
        Logic: { color: "rgb(92, 177, 214)" },
    },
});

export const block = createBlockBuilder({
    Blockly,
    generator,
    customTypes: ["native-str", "native-num", "native-lst", "ctx-menu", "bool"],
    plugins: [toolbox.register()],
});

export const views = {
    numVarDropdown: createCustomContentView(({ key, builder }) =>
        builder.dropdown(
            key,
            Object.fromEntries(
                "XYZABCDEFGHIJKLMNOPQRSTUVW"
                    .split("")
                    .map((each) => [each, each])
                    .concat([["ϴ", "[theta]"]]),
            ),
        ),
    ),
    strVarDropdown: createCustomContentView(({ key, builder }) =>
        builder.dropdown(
            key,
            Array.from({ length: 9 }, (_, n) => `str${n}`),
        ),
    ),
    varDropdown: createCustomContentView(({ key, builder }) =>
        builder.dropdown(key, {
            ...Object.fromEntries(Array.from({ length: 9 }, (_, n) => [`str${n}`, `str${n}`])),
            ...Object.fromEntries(
                "XYZABCDEFGHIJKLMNOPQRSTUVW"
                    .split("")
                    .map((each) => [each, each])
                    .concat([["ϴ", "[theta]"]]),
            ),
        }),
    ),
};

/** adapted from https://github.com/google/blockly/blob/1fe82b23545b9a344d5365f15b01dd7bbea2bcbc/generators/javascript/javascript_generator.js#L29 */
export const ord = {
    ATOMIC: 0, // 0 "" ...
    NEW: 1.1, // new
    MEMBER: 1.2, // . []
    FUNCTION_CALL: 2, // ()
    INCREMENT: 3, // ++
    DECREMENT: 3, // --
    BITWISE_NOT: 4.1, // ~
    UNARY_PLUS: 4.2, // +
    UNARY_NEGATION: 4.3, // -
    LOGICAL_NOT: 4.4, // !
    TYPEOF: 4.5, // typeof
    VOID: 4.6, // void
    DELETE: 4.7, // delete
    AWAIT: 4.8, // await
    EXPONENTIATION: 5.0, // **
    MULTIPLICATION: 5.1, // *
    DIVISION: 5.2, // /
    MODULUS: 5.3, // %
    SUBTRACTION: 6.1, // -
    ADDITION: 6.2, // +
    BITWISE_SHIFT: 7, // << >> >>>
    RELATIONAL: 8, // < <= > >=
    IN: 8, // in
    INSTANCEOF: 8, // instanceof
    EQUALITY: 9, // == != === !==
    BITWISE_AND: 10, // &
    BITWISE_XOR: 11, // ^
    BITWISE_OR: 12, // |
    LOGICAL_AND: 13, // &&
    LOGICAL_OR: 14, // ||
    CONDITIONAL: 15, // ?:
    ASSIGNMENT: 16, //: += -= **= *= /= %= <<= >>= ...
    YIELD: 17, // yield
    COMMA: 18, // ,
    NONE: 99, // (...)
};
