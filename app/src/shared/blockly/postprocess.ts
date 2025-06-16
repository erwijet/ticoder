import * as Blockly from "blockly/core";
import { just } from "shared/fp";
import { generator } from "shared/blockly/core";

const letters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const nums = [..."0123456789"];

const alphabet = [...letters, ...nums];

const doubles = Array.from({ length: alphabet.length ** 2 }, (_, i) => {
    const first = Math.floor(i / alphabet.length);
    const second = i % alphabet.length;
    return alphabet[first] + alphabet[second];
});

export function processVariables(workspace: Blockly.Workspace, source: string): string {
    const registers = {
        str: Array.from({ length: 10 }, (_, n) => `Str${n}`),
        lst: Array.from({ length: 26 }, (_, n) => `[list]${String.fromCharCode("A".charCodeAt(0) + n)}`),
        num: [...letters],
        lbl: [...letters, ...nums, ...doubles],
    };

    function nextRegister(type: string) {
        if (type == "native-str") return registers.str.shift();
        if (type == "native-num") return registers.num.shift();
        if (type == "native-lst") return registers.lst.shift();
        if (type == "task") return registers.lbl.shift();
    }

    type Macro = { type: keyof typeof registers; reg: string | null; createPrelude?: (reg: string) => string };

    const macros: Record<string, Macro> = {
        strToNumIndex: {
            type: "num",
            reg: null,
        },
        retstk: {
            type: "lst",
            reg: "[list]RET",
        },
        retptr: {
            type: "num",
            reg: null,
        },
        lbldone: {
            type: "lbl",
            reg: null,
        },
        lblret: {
            type: "lbl",
            reg: null,
        },
        jmpcode: {
            type: "num",
            reg: null,
        },
        charmap: {
            type: "str",
            reg: null,
            createPrelude: (reg: string) => `"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_ 1234567890!@#$%^&*()-=_+->${reg}`,
        },
    };

    function getMacro(k: keyof typeof macros): { reg: string; prelude: string } {
        if (macros[k].reg != null) return { reg: macros[k].reg, prelude: "" };
        const reg = registers[macros[k].type].shift();
        if (!reg) throw new Error(`Failed to allocate register for system macro '${k}'`);

        macros[k] = {
            ...macros[k],
            reg,
        };

        return { reg, prelude: macros[k].createPrelude?.(reg) ?? "" };
    }

    function _processTaskBlocks(source: string) {
        const taskBlocks = workspace.getBlocksByType("task_def");
        if (taskBlocks.length == 0) return source;

        const tasks = taskBlocks.map((each) => generator.blockToCode(each) + "\nGoto {@@lblret}").join("\n");

        return [source, "Goto {@@lbldone}", '"TASKS', tasks].join("\n");
    }

    function _processCalls(source: string) {
        const rets: { lbl: string; code: number }[] = [];

        function _createRet() {
            const code = rets.length + 1;
            const lbl = registers.lbl.shift();
            if (!lbl) throw new Error("Failed to allocated return lbl");
            rets.push({ lbl, code });
            return { lbl, code };
        }

        workspace.getVariablesOfType("task").forEach((taskdef) => {
            source = source.replaceAll(`{:call ${taskdef.getId()}}`, () => {
                const { code, lbl } = _createRet();
                return `{@@retptr}+1->{@@retptr}:${code}->{@@retstk}({@@retptr}:Goto ${taskdef.getId()}:Lbl ${lbl}`;
            });
        });

        if (rets.length == 0) return source;

        const jmptable =
            '"JMPTBL\n' +
            "Lbl {@@lblret}\n{@@retstk}({@@retptr}->{@@jmpcode}\n{@@retptr}-1->{@@retptr}\n" +
            rets.map((ret) => `If {@@jmpcode}=${ret.code}:Goto ${ret.lbl}`).join("\n") +
            "\nLbl {@@lbldone}";

        return ["0->{@@retptr}", "99->dim({@@retstk}", source, jmptable].join("\n");
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

    function processSystemMacros(source: string) {
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

    // trim whitespace

    function _trimWhitespace(source: string) {
        return source
            .split("\n")
            .filter((it) => it.match(/\S/))
            .join("\n");
    }

    return just(source)
        .map(_processTaskBlocks)
        .map(_processCalls)
        .map(processSystemMacros)
        .map(_processBlocklyVars)
        .map(_trimWhitespace)
        .take();
}
