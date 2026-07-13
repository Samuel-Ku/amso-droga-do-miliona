import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
    sourcemap: true,
    outDir: "dist",
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "assets/milion-runner/runner.js",
      cssFileName: "runner"
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name === "runner.css"
            ? "assets/milion-runner/runner.css"
            : "assets/milion-runner/[name]-[hash][extname]"
      }
    }
  }
});
