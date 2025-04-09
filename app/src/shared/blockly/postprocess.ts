import * as Blockly from "blockly/core";

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

    const vars = workspace.getAllVariables();

    function _process(source: string, prelude: string = "") {
        const next = vars.shift();
        if (!next) return [prelude, source].join("\n");

        const reg = nextRegister(next.type);
        if (!reg) throw new Error("Failed to allocate register for: " + JSON.stringify(next));

        const processed = source.replaceAll(next.getId(), reg);

        if (next.type == "native-lst") {
            return _process(processed, [`SetUpEditor ${reg}`, prelude].join("\n"));
        }

        return _process(processed, prelude);
    }

    return _process(source);
}
