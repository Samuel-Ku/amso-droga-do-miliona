import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { aggregateFullStoryReleaseGate } from "./full-story-performance-policy.mjs";

const root = path.resolve(import.meta.dirname, "..");
const evidenceRoot = path.join(root, ".scratch/full-story-performance-reference/evidence");
const read = (relative) => {
  const file = path.join(evidenceRoot, relative);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
};
const readConfiguredEvidence = (name) => {
  const configured = process.env[name];
  if (!configured) return null;
  const file = path.resolve(root, configured);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
};
const sixtySecond = readConfiguredEvidence("AMSO_PERFORMANCE_EVIDENCE");
const coldStart = readConfiguredEvidence("AMSO_COLD_START_EVIDENCE");
const fourCycle = readConfiguredEvidence("AMSO_FOUR_CYCLE_EVIDENCE");
const beforeEvidence = readConfiguredEvidence("AMSO_FULL_STORY_BEFORE_EVIDENCE");
let vercelBuildAndBrowser = false;
if (process.argv.includes("--run-vercel-gate")) {
  execFileSync("npm", ["run", "check:vercel"], { cwd: root, stdio: "inherit" });
  vercelBuildAndBrowser = true;
}
const currentHtmlPath = path.join(root, "dist-vercel/index.html");
const currentHtml = fs.existsSync(currentHtmlPath) ? fs.readFileSync(currentHtmlPath) : null;
const currentSourceIdentity = currentHtml?.toString("utf8")
  .match(/<meta name="amso-build-source" content="([a-f0-9]{64})">/u)?.[1] ?? null;
const currentHtmlSha256 = currentHtml === null ? null : createHash("sha256").update(currentHtml).digest("hex");
const localEvidence = [read("ticket-03/local-chromium.json"), read("ticket-03/local-webkit.json")];
const comparableAfter = beforeEvidence === null ? null : localEvidence.find((evidence) => evidence?.browser === beforeEvidence.browser);
const beforeAfterComparison = beforeEvidence?.schemaVersion === "full-story-reference-evidence-v1" &&
  comparableAfter?.configuration?.scenarioId === beforeEvidence.configuration?.scenarioId &&
  comparableAfter.configuration?.audioMode === beforeEvidence.configuration?.audioMode &&
  comparableAfter.configuration?.quality === beforeEvidence.configuration?.quality &&
  comparableAfter.configuration?.motion === beforeEvidence.configuration?.motion &&
  comparableAfter.configuration?.requestedDpr === beforeEvidence.configuration?.requestedDpr &&
  JSON.stringify(comparableAfter.provenance?.viewport) === JSON.stringify(beforeEvidence.provenance?.viewport) &&
  comparableAfter.provenance?.browserVersion === beforeEvidence.provenance?.browserVersion &&
  comparableAfter.provenance?.deviceScaleFactor === beforeEvidence.provenance?.deviceScaleFactor &&
  comparableAfter.provenance?.sourceIdentity !== beforeEvidence.provenance?.sourceIdentity &&
  comparableAfter.correctness?.manifest?.routeWaveIds?.join("|") ===
    beforeEvidence.correctness?.manifest?.routeWaveIds?.join("|");
const currentArtifact = currentSourceIdentity !== null && currentHtmlSha256 !== null && localEvidence.every((evidence) =>
  evidence?.provenance?.sourceIdentity === currentSourceIdentity &&
  evidence?.provenance?.htmlSha256 === currentHtmlSha256);
const report = aggregateFullStoryReleaseGate({
  localChromium: localEvidence[0],
  localWebKit: localEvidence[1],
  productionChromium: read("ticket-04/production-chromium.json"),
  productionWebKit: read("ticket-04/production-webkit.json"),
  physical: read("ticket-05/physical.json"),
  prerequisites: {
    vercelBuildAndBrowser,
    sixtySecondEvidence: sixtySecond,
    coldStartEvidence: coldStart,
    fourCycleEvidence: fourCycle,
    beforeAfterComparison,
    currentArtifact
  }
});
report.beforeAfter = {
  status: beforeAfterComparison ? "comparable" : "incomplete",
  before: beforeEvidence === null ? null : {
    capturedAt: beforeEvidence.capturedAt ?? null,
    sourceIdentity: beforeEvidence.provenance?.sourceIdentity ?? null,
    browser: beforeEvidence.browser ?? null
  },
  after: comparableAfter === null || comparableAfter === undefined ? null : {
    capturedAt: comparableAfter.capturedAt,
    sourceIdentity: comparableAfter.provenance?.sourceIdentity,
    browser: comparableAfter.browser
  },
  deltas: beforeAfterComparison ? {
    p95Ms: comparableAfter.performance.p95Ms - beforeEvidence.performance.p95Ms,
    p99Ms: comparableAfter.performance.p99Ms - beforeEvidence.performance.p99Ms,
    maxMs: comparableAfter.performance.maxMs - beforeEvidence.performance.maxMs,
    over33Ms: comparableAfter.performance.over33Ms - beforeEvidence.performance.over33Ms
  } : null
};
report.manualGates = {
  macBookM1ProChrome: read("ticket-05/physical.json")?.macBookM1ProChrome ?? "incomplete",
  baselineAndroid: read("ticket-05/physical.json")?.baselineAndroid ?? "incomplete",
  physicalIphoneSafari: read("ticket-05/physical.json")?.physicalIphoneSafari ?? "incomplete"
};
fs.mkdirSync(path.join(evidenceRoot, "ticket-04"), { recursive: true });
fs.writeFileSync(path.join(evidenceRoot, "ticket-04/release-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.status === "failed") process.exitCode = 1;
else if (report.status === "incomplete") process.exitCode = 2;
