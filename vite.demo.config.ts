import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist-demo",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: true
  }
});
