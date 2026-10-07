/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

/** Ship two stylesheets: tokens only, and tokens + component styles. */
function stylesheets(): Plugin {
  return {
    name: "orbit-stylesheets",
    closeBundle() {
      mkdirSync("dist", { recursive: true });
      const tokens = readFileSync("src/styles/tokens.css", "utf8");
      const components = readFileSync("src/styles/components.css", "utf8");
      copyFileSync("src/styles/tokens.css", "dist/tokens.css");
      writeFileSync("dist/styles.css", `${tokens}\n${components}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), stylesheets()],
  build: {
    lib: { entry: resolve(import.meta.dirname, "src/index.ts"), formats: ["es"] },
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      // One output file per source module: bundlers can drop unused components entirely.
      output: { preserveModules: true, preserveModulesRoot: "src", entryFileNames: "[name].js" },
    },
  },
  test: {
    environment: "jsdom",
    pool: "threads",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
