import * as Blockly from "blockly/core";
import { just } from "shared/fp";

export function processVariables(workspace: Blockly.Workspace, source: string): string {
    const registers = {
        str: Array.from({ length: 10 }, (_, n) => `Str${n}`),
        lst: Array.from({ length: 26 }, (_, n) => `[list]${String.fromCharCode("A".charCodeAt(0) + n)}`),
        num: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
    };

    function nextRegister(type: string) {
        if (type == "native-str") return registers.str.shift();
        if (type == "native-num") return registers.num.shift();
        if (type == "native-lst") return registers.lst.shift();
    }

    type Macro = { type: keyof typeof registers; reg: string | null; createPrelude?: (reg: string) => string };

    const macros: Record<string, Macro> = {
        strToNumIndex: {
            type: "num",
            reg: null,
        },
        charmap: {
            type: "str",
            reg: null,
            createPrelude: (reg: string) => `"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_ 1234567890->${reg}`,
        },
    };

    function getMacro(k: keyof typeof macros): { reg: string; prelude: string } {
        console.log("getting macro: " + k);
        if (macros[k].reg != null) return { reg: macros[k].reg, prelude: "" };
        const reg = registers[macros[k].type].shift();
        if (!reg) throw new Error(`Failed to allocate register for system macro '${k}'`);

        macros[k] = {
            ...macros[k],
            reg,
        };

        return { reg, prelude: macros[k].createPrelude?.(reg) ?? "" };
    }

    const vars = workspace.getAllVariables();

    function _processBlocklyVars(source: string, prelude: string = "") {
        const next = vars.shift();
        if (!next) return [prelude, source].join("\n");

        const reg = nextRegister(next.type);
        if (!reg) throw new Error("Failed to allocate register for: " + JSON.stringify(next.name));

        source = source.replaceAll(next.getId(), reg);

        if (next.type == "native-lst") prelude += `SetUpEditor ${reg}\n`;

        return _processBlocklyVars(source, prelude);
    }

    // process sys macros

    function _processSystemMacros(source: string) {
        const prelude: string[] = [];

        Object.keys(macros).forEach((k: keyof typeof macros) => {
            if (source.includes(`{@@${k}}`)) {
                const macro = getMacro(k);
                source = source.replaceAll(`{@@${k}}`, macro.reg);
                prelude.push(macro.prelude);
            }
        });

        return prelude.concat([source]).join("\n");
    }

    return just(source).map(_processSystemMacros).map(_processBlocklyVars).take();
}
