import fs from "node:fs";
import path from "node:path";
import {
  assessWorldSeamPerformanceEvidence,
  sameWorldSeamScenarioConfiguration
} from "./world-seam-performance-policy.mjs";

const root = path.resolve(import.meta.dirname, "..");
const evidenceRoot = path.join(
  root, ".scratch/challenge-soft-world-seams/evidence/ticket-04"
);
const qualifications = [
  { file: "local-chromium.json", engine: "chromium", targetKind: "vercel-build",
    targetValue: "dist-vercel" },
  { file: "local-webkit.json", engine: "webkit", targetKind: "vercel-build",
    targetValue: "dist-vercel" },
  { file: "production-chromium.json", engine: "chromium", targetKind: "url",
    targetValue: "https://game.amso.pl/" },
  { file: "production-webkit.json", engine: "webkit", targetKind: "url",
    targetValue: "https://game.amso.pl/" }
];

const evidence = [];
const failures = [];
for (const expected of qualifications) {
  const evidencePath = path.join(evidenceRoot, expected.file);
  if (!fs.existsSync(evidencePath)) {
    failures.push(`${expected.file}: evidence-missing`);
    continue;
  }
  const parsed = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  evidence.push({ expected, parsed });
  failures.push(...assessWorldSeamPerformanceEvidence(parsed, expected)
    .map((reason) => `${expected.file}: ${reason}`));
}

const baseline = evidence[0]?.parsed;
for (const item of evidence.slice(1)) {
  if (!sameWorldSeamScenarioConfiguration(baseline, item.parsed)) {
    failures.push(`${item.expected.file}: scenario-configuration-differs-from-local-chromium`);
  }
}

if (failures.length > 0) {
  throw new Error(`World seam performance release failed:\n${failures.join("\n")}`);
}
console.log("World seam performance release passed: local and production Chromium/WebKit");
