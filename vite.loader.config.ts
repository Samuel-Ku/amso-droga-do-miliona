import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
    sourcemap: true,
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: "src/loader.ts",
      name: "AMSOMillionRunnerLoader",
      formats: ["iife"],
      fileName: () => "assets/milion-runner/runner-loader.iife.js"
    }
  }
});
