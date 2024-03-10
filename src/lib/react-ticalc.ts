import { err } from "@tsly/core";
import { useEffect, useRef, useState } from "react";
import { ticalc } from "ticalc-usb";

function useTiUsbHandlers(handlers: {
  onConnect?: (calc: any) => any;
  onDisconnect?: (calc: any) => any;
}) {
  const ref = useRef(false);

  useEffect(() => {
    if (!!ref.current) return;

    console.log("MARK");
    ticalc.init({ supportLevel: "none" });

    if (handlers.onDisconnect)
      ticalc.addEventListener("disconnect", handlers.onDisconnect);

    if (handlers.onConnect)
      ticalc.addEventListener("connect", handlers.onConnect);

    ref.current = true;
  }, []);
}

export function useTiCalc() {
  const [calc, setCalc] = useState<any>(undefined);

  useTiUsbHandlers({
    async onConnect(calc) {
      if (await !calc.isReady()) return err("failed to init calculator");
      setCalc(calc);
    },
    onDisconnect(disconnected) {
      if (calc == disconnected) setCalc(undefined);
    },
  });

  return { calc, choose: () => ticalc.choose() };
}
