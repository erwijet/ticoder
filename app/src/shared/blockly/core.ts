import * as Blockly from "blockly/core";
import { createBlockBuilder, createToolboxPlugin, createValidationPlugin } from "better-blockly";
import { createPresetShadowsPlugin } from "shared/blockly/plugin";
import { workspaceStore } from "shared/form/project/editor";

export const generator = new Blockly.Generator("ticoder");

const shadows = createPresetShadowsPlugin({
    presets: ({ num, str }) => ({
        num: {
            blockType: "val_num",
            fields: {
                value: num ?? 10,
            },
        },
        str: {
            blockType: "val_str",
            fields: {
                value: str ?? "text",
            },
        },
        bool: {
            blockType: "val_bool",
            fields: {
                value: true,
            },
        },
    }),
});

export const toolbox = createToolboxPlugin({
    categories: {
        Flow: { color: "rgb(153, 102, 255)" },
        Menu: { color: "#0F7173" },
        Math: { color: "rgb(255, 51, 85)" },
        Screen: { color: "rgb(102, 204, 102)" },
        Lists: { color: "rgb(207, 99, 207)" },
        Text: { color: "rgb(255, 140, 26)" },
        Logic: { color: "rgb(92, 177, 214)" },
        Tasks: { color: "rgb(255, 102, 128)" },
    },
});

const validation = createValidationPlugin();

export const block = createBlockBuilder({
    Blockly,
    generator,
    customTypes: ["native-str", "native-num", "native-lst", "ctx-menu", "bool", "task"],
    plugins: [shadows.register(), toolbox.register(), validation.register()],
    variables: {
        getDefaultVariableName(type) {
            return workspaceStore.getState().workspace?.getVariablesOfType(type).at(0)?.name ?? null;
        },
    },
});

if (window.location.href.includes("localhost")) {
    block("__raw")
        .meta("category", "Flow")
        .meta("validate", ({ warn }) => warn("DEBUG USE ONLY!"))
        .content((v) => v.text("_EXEC").textbox("content", ""))
        .impl(({ fields }) =>
            fields.content.replaceAll(/\{[^}]*\}/g, (it) => {
                const ws = workspaceStore.getState().workspace!;
                const inner = it.slice(1, -1);
                const [type, iden] = inner.split(":");

                return ws.getVariable(iden, type)?.getId() ?? "{UNKNOWN}";
            }),
        );
}

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

export function shadowNum(n: number) {
    return {
        blockType: "val_num",
        fields: {
            value: n,
        },
    };
}
