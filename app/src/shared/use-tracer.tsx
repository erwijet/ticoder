import { useState } from "react";

export function useTracer<K extends string>(...traceKeys: K[]) {
    const [state, setState] = useState<Record<K, boolean>>(Object.fromEntries(traceKeys.map((k) => [k, false])) as Record<K, boolean>);

    return {
        isLoading: (k: K) => state[k],
        trace: (k: K) => {
            return function <T>(promise: Promise<T>) {
                setState((s) => ({ ...s, [k]: true }));
                return promise.finally(() => setState((s) => ({ ...s, [k]: false })));
            };
        },
    };
}
