import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { assessFullStoryComparison } from "./full-story-performance-policy.mjs";

const root = path.resolve(import.meta.dirname, "..");
const option = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? null : process.argv[index + 1] ?? null;
};
const beforePath = option("before");
const afterPath = option("after");
const outputPath = option("output");
if (!beforePath || !afterPath) {
  throw new Error("Usage: compare-full-story-runtime.mjs --before FILE --after FILE [--output FILE]");
}
const read = (file) => JSON.parse(fs.readFileSync(path.resolve(root, file), "utf8"));
const before = read(beforePath);
const after = read(afterPath);
const assessment = assessFullStoryComparison(before, after);
const report = {
  schema: "amso-full-story-runtime-comparison-v1",
  generatedAt: new Date().toISOString(),
  status: assessment.comparable ? "comparable" : "rejected",
  reasons: assessment.reasons,
  identity: {
    scenarioId: after?.configuration?.scenarioId ?? null,
    scenarioConfigVersion: after?.configuration?.scenarioConfigVersion ?? null,
    seed: after?.configuration?.seed ?? null,
    inputTraceDigest: after?.configuration?.inputTraceDigest ?? null,
    browser: after?.browser ?? null,
    browserVersion: after?.provenance?.browserVersion ?? null,
    viewport: after?.provenance?.viewport ?? null,
    deviceScaleFactor: after?.provenance?.deviceScaleFactor ?? null,
    target: after?.target ?? null
  },
  before: {
    capturedAt: before?.capturedAt ?? null,
    sourceIdentity: before?.provenance?.sourceIdentity ?? null,
    htmlSha256: before?.provenance?.htmlSha256 ?? null,
    performance: before?.performance === undefined ? null : {
      p50Ms: before.performance.p50Ms,
      p95Ms: before.performance.p95Ms,
      p99Ms: before.performance.p99Ms,
      maxMs: before.performance.maxMs,
      over33Ms: before.performance.over33Ms,
      over100Ms: before.performance.over100Ms,
      activeSegments: before.performance.activeSegments,
      phaseAggregates: before.performance.phaseAggregates,
      longTasks: before.performance.longTasks,
      longAnimationFrames: before.performance.longAnimationFrames,
      transitionWindows: before.performance.transitionWindows,
      decodes: before.performance.decodes,
      activeDecodeStarts: before.performance.activeDecodeStarts,
      hotPathImageNodesCreated: before.performance.hotPathImageNodesCreated,
      repeatedWorldDecodeSources: before.performance.repeatedWorldDecodeSources,
      blankFrameCount: before.performance.blankFrameCount,
      collectorComparison: before.performance.collectorComparison,
      quality: before.configuration?.quality ?? null
    }
  },
  after: {
    capturedAt: after?.capturedAt ?? null,
    sourceIdentity: after?.provenance?.sourceIdentity ?? null,
    htmlSha256: after?.provenance?.htmlSha256 ?? null,
    performance: after?.performance === undefined ? null : {
      p50Ms: after.performance.p50Ms,
      p95Ms: after.performance.p95Ms,
      p99Ms: after.performance.p99Ms,
      maxMs: after.performance.maxMs,
      over33Ms: after.performance.over33Ms,
      over100Ms: after.performance.over100Ms,
      activeSegments: after.performance.activeSegments,
      phaseAggregates: after.performance.phaseAggregates,
      longTasks: after.performance.longTasks,
      longAnimationFrames: after.performance.longAnimationFrames,
      transitionWindows: after.performance.transitionWindows,
      decodes: after.performance.decodes,
      activeDecodeStarts: after.performance.activeDecodeStarts,
      hotPathImageNodesCreated: after.performance.hotPathImageNodesCreated,
      repeatedWorldDecodeSources: after.performance.repeatedWorldDecodeSources,
      blankFrameCount: after.performance.blankFrameCount,
      collectorComparison: after.performance.collectorComparison,
      quality: after.configuration?.quality ?? null
    }
  },
  deltas: assessment.deltas,
  diagnosticBaselines: {
    before: before?.performance?.emptyRafBaseline ?? null,
    after: after?.performance?.emptyRafBaseline ?? null
  }
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) {
  const absolute = path.resolve(root, outputPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, serialized);
}
process.stdout.write(serialized);
process.exitCode = assessment.comparable ? 0 : 1;
