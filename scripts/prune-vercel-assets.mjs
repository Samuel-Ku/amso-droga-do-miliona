import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXPECTED_CAMPAIGN_ASSETS } from "./performance-request-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "dist-vercel");
if (path.basename(outputDirectory) !== "dist-vercel" || !fs.existsSync(outputDirectory)) {
  throw new Error("Vercel output directory is missing");
}

const allowed = new Set([
  "index.html",
  ...[...EXPECTED_CAMPAIGN_ASSETS].map((asset) => asset.replace(/^\//u, ""))
]);
const isGeneratedBundle = (relativePath) =>
  /^assets\/index-[A-Za-z0-9_-]+\.(?:js|css)$/u.test(relativePath);

function prune(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      prune(absolutePath);
      if (fs.readdirSync(absolutePath).length === 0) fs.rmdirSync(absolutePath);
      continue;
    }
    const relativePath = path.relative(outputDirectory, absolutePath).split(path.sep).join("/");
    if (!allowed.has(relativePath) && !isGeneratedBundle(relativePath)) {
      fs.rmSync(absolutePath);
    }
  }
}

prune(outputDirectory);
console.log("Vercel production assets pruned to the runtime request policy");
