import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import {
  aggregateRuntimeReadiness,
  buildFourCycleQualification
} from "./runtime-readiness-policy.mjs";

const root = path.resolve(import.meta.dirname, "..");
const option = (name, fallback = undefined) => {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? fallback : process.argv[index + 1];
};
const target = new URL(option("target", "https://game.amso.pl/")).href;
const referencePath = path.resolve(root, option("reference",
  ".scratch/full-story-performance-reference/evidence/ticket-04/production-chromium.json"));
const outputDirectory = path.resolve(root, option("output-dir",
  ".scratch/finalna-gotowosc-wydajnosciowa/evidence/ticket-04"));
const paths = {
  sixtySecond: path.join(outputDirectory, "sixty-second.json"),
  coldStartDirectory: path.join(outputDirectory, "cold-start"),
  coldStart: path.join(outputDirectory, "cold-start", "qualification.json"),
  fourCycleRun: path.join(outputDirectory, "four-cycle-run.json"),
  fourCycle: path.join(outputDirectory, "four-cycle-qualification.json"),
  aggregate: path.join(outputDirectory, "runtime-readiness.json")
};
const plan = {
  schema: "amso-runtime-readiness-plan-v1",
  target,
  reference: referencePath,
  outputDirectory,
  scenarios: { sixtySecond: "performance-reference-v1", fourCycle: "four-cycle-memory-v1" },
  paths
};

if (process.argv.includes("--dry-run")) {
  process.stdout.write(`${JSON.stringify(plan)}\n`);
  process.exit(0);
}

fs.mkdirSync(outputDirectory, { recursive: true });
const read = (filePath) => {
  if (!fs.existsSync(filePath)) return null;
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return null; }
};
const reference = read(referencePath);
if (reference?.provenance === undefined) {
  const report = {
    schema: "amso-runtime-readiness-v1",
    capturedAt: new Date().toISOString(),
    target,
    status: "incomplete",
    provenance: null,
    gates: { reference: ["full-story-reference-evidence-missing"] },
    paths
  };
  fs.writeFileSync(paths.aggregate, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ output: paths.aggregate, status: report.status,
    gates: report.gates }, null, 2)}\n`);
  process.exit(2);
}
const run = (args) => spawnSync(process.execPath, args, {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
  env: { ...process.env, AMSO_PERFORMANCE_SCENARIO_TIMEOUT_MS:
    process.env.AMSO_PERFORMANCE_SCENARIO_TIMEOUT_MS ?? "120000" }
});
const capture = (name, outputPath, args) => {
  fs.rmSync(outputPath, { force: true });
  const startedAtMs = Date.now();
  const result = run(args);
  const freshOutput = fs.existsSync(outputPath) &&
    fs.statSync(outputPath).mtimeMs >= startedAtMs - 1_000;
  return { name, status: result.status, signal: result.signal, freshOutput,
    error: result.error?.message ?? null };
};
const captureProcesses = [
  capture("sixtySecond", paths.sixtySecond,
    ["scripts/run-performance-reference.mjs", "--url", target,
      "--scenario", "performance-reference-v1", "--audio", "enabled",
      "--profile", "full-session", "--output", paths.sixtySecond]),
  capture("coldStart", paths.coldStart,
    ["scripts/qualify-cold-start.mjs", "--target", target,
      "--output-dir", paths.coldStartDirectory]),
  capture("fourCycle", paths.fourCycleRun,
    ["scripts/run-performance-reference.mjs", "--url", target,
      "--scenario", "four-cycle-memory-v1", "--audio", "enabled",
      "--profile", "full-session", "--cycles", "4", "--output", paths.fourCycleRun])
];

const expectedProvenance = reference?.provenance ?? null;
const captured = (name, filePath) => captureProcesses.find((item) => item.name === name)?.freshOutput
  ? read(filePath) : null;
const sixtySecond = captured("sixtySecond", paths.sixtySecond);
const coldStart = captured("coldStart", paths.coldStart);
const fourCycleRun = captured("fourCycle", paths.fourCycleRun);
const fourCycle = fourCycleRun && expectedProvenance
  ? buildFourCycleQualification(fourCycleRun, expectedProvenance)
  : null;
if (fourCycle) fs.writeFileSync(paths.fourCycle, `${JSON.stringify(fourCycle, null, 2)}\n`);
const aggregate = expectedProvenance
  ? aggregateRuntimeReadiness({ expectedProvenance, sixtySecond, coldStart, fourCycle,
      captureProcesses })
  : {
      schema: "amso-runtime-readiness-v1",
      status: "incomplete",
      provenance: null,
      gates: { reference: ["full-story-reference-evidence-missing"] }
    };
const report = { ...aggregate, capturedAt: new Date().toISOString(), target, paths,
  captureProcesses };
fs.writeFileSync(paths.aggregate, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output: paths.aggregate, status: report.status,
  gates: report.gates }, null, 2)}\n`);
process.exitCode = report.status === "passed" ? 0 : report.status === "failed" ? 1 : 2;
