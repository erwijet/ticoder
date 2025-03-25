import React from "react";

export function createMarkerComponent() {
    return ({ children }: { children: React.ReactNode }) => children;
}

type SlotResult<S extends string> = {
    [K in S | "rest"]: React.ReactNode[];
};

type AnyFC = React.FC<any>; // eslint-disable-line

export function createSlots<S extends string>(children: React.ReactNode, config: { [s in S]: AnyFC }): SlotResult<S> {
    const ss = Object.keys(config).concat(["rest"]) as S[];

    const nodes = React.Children.toArray(children);
    function eq(node: React.ReactNode, f: AnyFC) {
        if (!React.isValidElement(node)) return false;
        return node.type === f;
    }

    return Object.fromEntries(
        ss.map((s) => {
            if (s == "rest") return ["rest", nodes.filter((node) => !ss.some((s) => eq(node, config[s])))];
            return [s, nodes.filter((node) => eq(node, config[s]))];
        }),
    ) as SlotResult<S>;
}
