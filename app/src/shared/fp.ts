type Maybe<T> = Just<T> | null | undefined;
type IntoMaybe<T> = T extends null | undefined ? null : Just<T>;

export function maybe<T>(inner: T): IntoMaybe<T> {
    if (inner == null) return null as IntoMaybe<T>;
    else return just(inner) as IntoMaybe<T>;
}

export function just<T>(inner: T): Just<T> {
    return new Just(inner);
}

/** @private */
abstract class Wrapped<T> {
    constructor(protected inner: T) {}

    take<E>(mapping: (it: T) => E): E;
    take(): T;

    take<E = T>(mapping?: (it: T) => E): T | E {
        return typeof mapping == "function" ? mapping(this.inner) : this.inner;
    }
}

/** @private */
class Just<T> extends Wrapped<T> {
    map<E>(fn: (it: T) => E): IntoMaybe<E> {
        return maybe(fn(this.inner));
    }

    takeIf(predicate: (it: T) => boolean): T | null {
        if (predicate(this.inner)) return this.inner;
        else return null;
    }

    filter(predicate: (it: T) => boolean): Maybe<T> {
        if (predicate(this.inner)) return this;
        else return null;
    }

    run(fn: (it: T) => unknown): Just<T> {
        fn(this.inner);
        return this;
    }

    zip<O>(other: O): Maybe<[T, O]> {
        return maybe(other)?.map((other) => [this.inner, other]);
    }

    binding<const K extends string>(k: K): Bind<Record<K, T>> {
        return new Bind({ [k]: this.inner }) as Bind<Record<K, T>>;
    }
}

/** @private */
class Bind<T> extends Wrapped<T> {
    bind<const K extends string, E>(k: K, other: E): Bind<T & Record<K, NonNullable<E>>> | undefined {
        if (!other) return undefined;
        return new Bind({ ...this.inner, [k]: other }) as Bind<T & Record<K, NonNullable<E>>>;
    }
}
