import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactPath = path.join(root, "droga-do-miliona-qa.html");
const maxBytes = 24 * 1024 * 1024;

if (!fs.existsSync(artifactPath)) {
  console.error("release gate incomplete: autonomous HTML artifact is missing");
  process.exitCode = 2;
} else {
  const bytes = fs.statSync(artifactPath).size;
  if (bytes > maxBytes) {
    console.error(
      `release gate failed: autonomous HTML is ${(bytes / 1024 / 1024).toFixed(2)} MB; budget is 24 MB`
    );
    process.exitCode = 1;
  } else {
    console.log(`autonomous HTML budget passed: ${(bytes / 1024 / 1024).toFixed(2)} MB`);
  }
}
