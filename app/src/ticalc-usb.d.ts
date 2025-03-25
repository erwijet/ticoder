declare module "ticalc-usb" {
  declare class Calculator {
    name: string;

    isReady(): Promise<boolean>;
    sendFile(file: tifiles.File): Promise<void>;

    canReceive(file: tifiles.File): boolean;
  }

  declare namespace tifiles {
    declare class File {}
    function parseFile(bindata: Uint8Array): File;
    function isValid(file: File): boolean;
  }

  declare namespace ticalc {
    type TiCalcEvent = "connect" | "disconnect";
    type InitSupportLevel = "beta" | "none";

    function addEventListener(evt: TiCalcEvent, fn: (calc: Calculator) => void);
    async function init(options?: { supportLevel?: InitSupportLevel }): Promise<void>;
    async function choose(): Promise<void>;
  }
}
