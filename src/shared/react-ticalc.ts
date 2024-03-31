import { err } from "@tsly/core";
import { useEffect } from "react";
import { Calculator, ticalc, tifiles } from "ticalc-usb";
import { create } from "zustand";

type TiCalcStore = {
  calc?: Calculator;
  sendQueue: { file: tifiles.File; didSend?: () => unknown }[];

  queueFile(file: tifiles.File, didSend?: () => unknown): void;
  popFile(): { file: tifiles.File; didSend?: () => unknown } | undefined;
};

const ticalcStore = create<TiCalcStore>((set, get) => {
  return {
    sendQueue: [],
    onConnectHandlers: [],
    onDisconnectHandlers: [],

    queueFile(file, didSend) {
      set((prev) => ({
        ...prev,
        sendQueue: [...prev.sendQueue, { file, didSend }],
      }));
    },

    popFile() {
      const {
        sendQueue: [head, ...tail],
      } = get();
      set((prev) => ({ ...prev, sendQueue: tail }));

      return head;
    },
  };
});

ticalc.addEventListener("connect", async (calc) => {
  if (!(await calc.isReady())) return err("failed to init calculator");
  ticalcStore.setState((prev) => ({ ...prev, calc }));
});

ticalc.addEventListener("disconnect", async (calc) => {
  if (ticalcStore.getState().calc == calc)
    ticalcStore.setState((prev) => ({ ...prev, calc: undefined }));
});

ticalc.init({ supportLevel: "none" });

export function useTiCalc() {
  const { queueFile, popFile, sendQueue, calc } = ticalcStore();

  useEffect(() => {
    if (!calc || sendQueue.length == 0) return;

    const { file, didSend } = popFile()!;

    if (!tifiles.isValid(file)) return console.error("invalid file");
    calc.sendFile(file).then(() => didSend?.());
  }, [calc, sendQueue]);

  return {
    calc,
    choose: () => ticalc.choose(),
    queueFile,
  };
}
