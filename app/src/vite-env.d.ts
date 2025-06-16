/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
    readonly VITE_TICODER_API?: string;
    readonly VITE_GIT_FINGERPRINT?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

//

declare module "monaco-vim";
declare module "@mit-app-inventor/blockly-plugin-workspace-multiselect";
declare module "@mit-app-inventor/blockly-block-lexical-variables";
declare module "@mit-app-inventor/blockly-block-lexical-variables/core";
