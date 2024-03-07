import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import svgr from 'vite-plugin-svgr';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env = { ...process.env, ...env };

  return {
    plugins: [svgr(), react(), tsConfigPaths()],
    build: {
      outDir: "build",
    },
    server: {
      open: true,
      port: 3000,
    },
  };
});
