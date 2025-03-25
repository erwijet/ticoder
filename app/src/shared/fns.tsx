import { ReactNode } from "react";

export function runCatching<T>(f: () => T): T | undefined {
    try {
        return f();
    } catch {
        return undefined;
    }
}

export function runCapturing<T>(f: (capture: (v: T) => void) => unknown): T | void {
    try {
        f((captured) => {
            throw captured;
        });
    } catch (thrown: unknown) {
        return thrown as T;
    }
}

export function run<T>(f: () => T): T {
    return f();
}

export function runVoiding(f: () => unknown): () => void {
    return () => {
        f();
    };
}

export function createMarkerComponent() {
    return ({ children }: { children: ReactNode }) => children;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
type XArr<T> = {
    get: () => T[];
    minus: (other: T[] | XArr<T>) => XArr<T>;
    to: <K extends keyof T>(k: K) => XArr<T[K]>;
};
export function arr<T>(ker: T[]): XArr<T> {
    return {
        get: () => ker,
        to(k) {
            return arr(ker.map((each) => each[k]));
        },
        minus(other) {
            const o = "get" in other ? other.get() : other;
            return arr(ker.filter((it) => !o.includes(it)));
        },
    };
}
