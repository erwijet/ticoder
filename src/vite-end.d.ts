/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GIT_FINGERPRINT?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
