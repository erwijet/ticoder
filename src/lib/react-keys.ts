import { Ref, RefObject, useCallback, useEffect, useRef } from "react";
import { match } from "ts-pattern";

type UseKeyAction = "focus" | "blur";

export function useKey<T extends HTMLInputElement>(
  key: string,
  options: {
    action: UseKeyAction;
    ref: RefObject<T>;
  }
) {
  const handle = useCallback(
    (e: KeyboardEvent) => {
      if (e.key == key) {
        e.preventDefault();
        e.stopImmediatePropagation();

        match(options.action)
          .with("blur", () => options.ref.current?.blur())
          .with("focus", () => options.ref.current?.focus())
          .exhaustive();
      }
    },
    [options.ref.current]
  );

  useEffect(() => {
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);
}
