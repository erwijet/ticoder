/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
    readonly VITE_GIT_FINGERPRINT?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

//

declare module "monaco-vim";
declare module "ticalc-usb";