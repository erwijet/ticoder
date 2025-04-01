import * as Blockly from "blockly/core";

export function processVariables(workspace: Blockly.Workspace, source: string): string {
    const registers = {
        str: Array.from({ length: 10 }, (_, n) => `Str${n}`),
        num: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat(["[theta]"]),
    };

    function nextRegister(type: string) {
        if (type == "native-str") return registers.str.shift();
        if (type == "native-num") return registers.num.shift();
    }

    const vars = workspace.getAllVariables();

    function _process(source: string) {
        const next = vars.shift();
        if (!next) return source;

        const reg = nextRegister(next.type);
        if (!reg) throw new Error("Failed to allocate register for: " + JSON.stringify(next));

        const processed = source.replaceAll(next.getId(), reg);
        return _process(processed);
    }

    return _process(source);
}
