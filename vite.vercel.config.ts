import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist-vercel",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false
  }
});
