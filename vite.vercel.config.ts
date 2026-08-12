import { defineConfig } from "vite";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

function buildSourceIdentity(): string {
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const diff = execFileSync("git", ["diff", "--binary", "HEAD", "--", "src", "public", "index.html", "package.json", "vite.vercel.config.ts"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "--", "src", "public", "index.html", "package.json", "vite.vercel.config.ts"],
    { encoding: "utf8" }).trim().split("\n").filter(Boolean).sort();
  const hash = createHash("sha256").update(`${commit}\n${diff}`);
  for (const file of untracked) hash.update(`\n${file}\n`).update(readFileSync(file));
  return hash.digest("hex");
}

const sourceIdentity = buildSourceIdentity();

export default defineConfig({
  base: "./",
  plugins: [{
    name: "amso-vercel-build-provenance",
    transformIndexHtml(html) {
      return html.replace("</head>", `<meta name="amso-build-source" content="${sourceIdentity}">\n</head>`);
    }
  }],
  build: {
    outDir: "dist-vercel",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false
  }
});
