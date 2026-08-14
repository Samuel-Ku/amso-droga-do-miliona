import fs from "node:fs";
import path from "node:path";
import { assessFullStoryRuntimeProfile } from "./full-story-runtime-profile-policy.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const localPath = argument("--local");
const productionPath = argument("--production");
const outputPath = argument("--output");
if (!localPath || !productionPath) {
  throw new Error("Usage: node scripts/profile-full-story-runtime.mjs --local <evidence> --production <evidence> [--output <report>]");
}

const read = (file) => JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
const local = read(localPath);
const production = read(productionPath);
const assessment = assessFullStoryRuntimeProfile(local, production);
const status = assessment.eligible
  ? assessment.primaryCandidate ? "candidate-selected" : "no-runtime-candidate"
  : "invalid-evidence";
const report = {
  schema: "amso-full-story-runtime-profile-report-v1",
  capturedAt: new Date().toISOString(),
  status,
  ...assessment,
  identity: {
    scenarioId: local.configuration?.scenarioId ?? null,
    seed: local.configuration?.seed ?? null,
    inputTraceDigest: local.configuration?.inputTraceDigest ?? null,
    sourceIdentity: local.provenance?.sourceIdentity ?? null,
    localTarget: local.target ?? null,
    productionTarget: production.provenance?.finalUrl ?? null
  },
  observedPerformance: {
    local: {
      p50Ms: local.performance?.p50Ms ?? null,
      p95Ms: local.performance?.p95Ms ?? null,
      p99Ms: local.performance?.p99Ms ?? null,
      maxMs: local.performance?.maxMs ?? null,
      over33Ms: local.performance?.over33Ms ?? null,
      over100Ms: local.performance?.over100Ms ?? null
    },
    production: {
      p50Ms: production.performance?.p50Ms ?? null,
      p95Ms: production.performance?.p95Ms ?? null,
      p99Ms: production.performance?.p99Ms ?? null,
      maxMs: production.performance?.maxMs ?? null,
      over33Ms: production.performance?.over33Ms ?? null,
      over100Ms: production.performance?.over100Ms ?? null
    }
  },
  attribution: {
    local: {
      phases: local.performance?.phaseAggregates ?? null,
      segments: local.performance?.activeSegments ?? null,
      worlds: local.performance?.activeWorlds ?? null,
      longTasks: local.performance?.longTasks ?? null,
      longAnimationFrames: local.performance?.longAnimationFrames ?? null,
      runtimeProfile: local.performance?.runtimeProfile ?? null
    },
    production: {
      phases: production.performance?.phaseAggregates ?? null,
      segments: production.performance?.activeSegments ?? null,
      worlds: production.performance?.activeWorlds ?? null,
      longTasks: production.performance?.longTasks ?? null,
      longAnimationFrames: production.performance?.longAnimationFrames ?? null,
      runtimeProfile: production.performance?.runtimeProfile ?? null
    }
  }
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) {
  const absolute = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, serialized);
}
process.stdout.write(serialized);
process.exitCode = status === "candidate-selected" ? 0 : status === "no-runtime-candidate" ? 2 : 1;
