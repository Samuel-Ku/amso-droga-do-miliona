import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const AUTONOMIC_HTML_BUDGET_BYTES = 24 * 1024 * 1024;
const defaultPaths = {
  before: ".scratch/performance-comparison/before-audio-enabled.json",
  after: ".scratch/performance-comparison/after-audio-enabled.json",
  "audio-disabled": ".scratch/performance-comparison/after-audio-disabled.json",
  "json-out": "docs/qa/performance-comparison-v1.json",
  "markdown-out": "docs/qa/performance-comparison-v1.md"
};

function parseArguments(argv) {
  if (argv.includes("--help")) {
    process.stdout.write(
      "Usage: node scripts/compare-performance-evidence.mjs " +
      "[--before PATH --after PATH --audio-disabled PATH --json-out PATH --markdown-out PATH]\n"
    );
    process.exit(0);
  }
  const values = new Map(Object.entries(defaultPaths));
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error(`invalid argument near ${key ?? "end of command"}`);
    }
    values.set(key.slice(2), value);
  }
  return values;
}

function readEvidence(filePath) {
  const evidence = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (evidence?.schema !== "amso-performance-run-v1") {
    throw new Error(`unsupported evidence schema: ${filePath}`);
  }
  return evidence;
}

function comparableConfiguration(evidence) {
  const { configuration } = evidence;
  return {
    scenarioId: configuration.scenarioId,
    scenarioConfigVersion: configuration.scenarioConfigVersion,
    seed: configuration.seed,
    inputTraceDigest: configuration.inputTraceDigest,
    challengeWorldDurationSeconds: configuration.challengeWorldDurationSeconds,
    viewport: configuration.viewport,
    dpr: configuration.dpr,
    quality: configuration.quality,
    motion: configuration.motion,
    environment: evidence.environment
  };
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right)).map(([key, nested]) => [key, stable(nested)]));
  }
  return value;
}

function equal(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function comparableIdentityComplete(identity) {
  return typeof identity.scenarioId === "string" &&
    typeof identity.scenarioConfigVersion === "string" &&
    Number.isInteger(identity.seed) &&
    typeof identity.inputTraceDigest === "string" &&
    Number.isFinite(identity.challengeWorldDurationSeconds) &&
    Number.isFinite(identity.viewport?.width) && Number.isFinite(identity.viewport?.height) &&
    Number.isFinite(identity.dpr) && typeof identity.quality === "string" &&
    typeof identity.motion === "string" &&
    typeof identity.environment?.host?.platform === "string" &&
    typeof identity.environment?.host?.architecture === "string" &&
    typeof identity.environment?.host?.release === "string" &&
    typeof identity.environment?.host?.cpuModel === "string" &&
    typeof identity.environment?.browser?.version === "string" &&
    typeof identity.environment?.browser?.executableSource === "string" &&
    identity.environment?.browser?.headless === true &&
    typeof identity.environment?.profiler?.name === "string" &&
    Number.isInteger(identity.environment?.profiler?.version);
}

function scenarioPassed(evidence) {
  const scenario = evidence.scenario;
  return scenario.checkpointsPassed === true && scenario.coveragePassed === true &&
    scenario.digestPassed === true &&
    scenario.replayValid === true && scenario.inputQueueOverflows === 0;
}

function semanticEqual(left, right, key = "") {
  if (typeof left === "number" && typeof right === "number") {
    return Math.abs(left - right) <= (key === "simulationStep" ? 1 : 0.0001);
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length &&
      left.every((value, index) => semanticEqual(value, right[index], key));
  }
  if (left !== null && right !== null && typeof left === "object" && typeof right === "object") {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    return [...keys].every((nestedKey) =>
      semanticEqual(left[nestedKey], right[nestedKey], nestedKey));
  }
  return Object.is(left, right);
}

function diagnosticsPassed(evidence) {
  return evidence.diagnostics.consoleErrors.length === 0 &&
    evidence.diagnostics.externalRequests.length === 0;
}

function smoothRunPassed(evidence) {
  return evidence.frames.p95Ms <= 18 && evidence.frames.p99Ms <= 33 &&
    evidence.frames.maxMs <= 100 && evidence.frames.over100Ms === 0;
}

function noActiveQualityDecode(evidence) {
  const qualityTransition = evidence.worldTransitions.find(
    ({ worldId }) => worldId === "quality-service"
  );
  if (qualityTransition === undefined || !Array.isArray(evidence.frameTimeline)) return false;
  const transitionFrames = evidence.frameTimeline.filter(({ atMs }) =>
    Math.abs(atMs - qualityTransition.atMs) <= 500);
  return evidence.decodeTimings.every((entry) => entry.active !== true) &&
    transitionFrames.length > 0 &&
    transitionFrames.every(({ intervalMs }) => intervalMs <= 33);
}

function summarizeRun(evidence) {
  const { frameTimeline, scenario, ...rest } = evidence;
  const { canonicalState: _canonicalState, session, ...scenarioSummary } = scenario;
  const qualityTransition = evidence.worldTransitions.find(
    ({ worldId }) => worldId === "quality-service"
  );
  const qualityFrames = qualityTransition === undefined ? [] : frameTimeline.filter(({ atMs }) =>
    Math.abs(atMs - qualityTransition.atMs) <= 500);
  return {
    ...rest,
    longFrames: frameTimeline.filter(({ intervalMs }) => intervalMs > 33),
    qualityServiceWindow: qualityTransition === undefined ? null : {
      transitionAtMs: qualityTransition.atMs,
      sampleCount: qualityFrames.length,
      maxFrameMs: qualityFrames.length === 0
        ? null
        : Math.max(...qualityFrames.map(({ intervalMs }) => intervalMs)),
      activeDecodeCount: evidence.decodeTimings.filter(({ active, startedAtMs }) =>
        active === true && Math.abs(startedAtMs - qualityTransition.atMs) <= 500).length
    },
    scenario: {
      ...scenarioSummary,
      session: session === null || session === undefined ? null : {
        durationSeconds: session.durationSeconds,
        collisions: session.collisions,
        ordersCollected: session.ordersCollected,
        replayValid: session.replayValid,
        inputQueueOverflows: session.inputQueueOverflows
      }
    }
  };
}

function markdownReport(report) {
  const labeledRuns = [
    ["Before / audio enabled", report.runs.before],
    ["After / audio enabled", report.runs.after],
    ["After / audio disabled", report.runs.audioDisabled]
  ];
  const rows = labeledRuns.map(([label, run]) =>
    `| ${label} | ${run.frames.p50Ms} | ${run.frames.p95Ms} | ${run.frames.p99Ms} | ` +
    `${run.frames.maxMs} | ${run.frames.over33Ms} | ${run.frames.over100Ms} |`);
  const runDetails = labeledRuns.flatMap(([label, run]) => {
    const decodeMax = run.decodeTimings.length === 0
      ? 0
      : Math.max(...run.decodeTimings.map(({ durationMs }) => durationMs));
    const transitions = run.worldTransitions
      .map(({ worldId, atMs }) => `${worldId}@${Math.round(atMs)}ms`).join(", ");
    return [
      `### ${label}`,
      "",
      `- Quality history: ${JSON.stringify(run.qualityHistory)}`,
      `- Decode timings: ${run.decodeTimings.length} total, ` +
        `${run.decodeTimings.filter(({ active }) => active === true).length} active, ` +
        `${Math.round(decodeMax * 10) / 10} ms max`,
      `- First world transitions: ${transitions || "none"}`,
      `- quality-service window: ${run.qualityServiceWindow === null
        ? "not observed"
        : `${Math.round(run.qualityServiceWindow.maxFrameMs * 10) / 10} ms max, ` +
          `${run.qualityServiceWindow.activeDecodeCount} active decode`}`,
      `- Cold start: ${run.readiness.coldStartMs} ms; critical readiness: ` +
        `${run.readiness.criticalReadyMs} ms`,
      `- Artifact: ${(run.artifact.bytes / 1024 / 1024).toFixed(2)} MB`,
      `- Memory: ${run.memory.available === true ? "recorded" : run.memory.reason ?? "unavailable"}`,
      ""
    ];
  });
  return [
    "# Performance comparison report",
    "",
    `Comparable: ${report.comparable}`,
    `Release gate: ${report.releaseGate.status}`,
    "",
    "| Run | p50 ms | p95 ms | p99 ms | max ms | >33 ms | >100 ms |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows,
    "",
    ...runDetails,
    "Start comparisons allow 15% headless measurement tolerance; absolute budgets remain 3 s cold / 2 s critical.",
    "",
    `Automated checks: ${JSON.stringify(report.automatedChecks)}`,
    `Release reasons: ${report.releaseGate.reasons.join(", ")}`,
    ""
  ].join("\n");
}

const args = parseArguments(process.argv.slice(2));
const before = readEvidence(args.get("before"));
const after = readEvidence(args.get("after"));
const audioDisabled = readEvidence(args.get("audio-disabled"));
const comparableIdentities = [before, after, audioDisabled].map(comparableConfiguration);
const comparable = comparableIdentities.every(comparableIdentityComplete) &&
  equal(comparableIdentities[0], comparableIdentities[1]) &&
  equal(comparableIdentities[1], comparableIdentities[2]) &&
  before.configuration.audioMode === "enabled" &&
  after.configuration.audioMode === "enabled" &&
  audioDisabled.configuration.audioMode === "disabled";
const visualFixtureValues = [before, after, audioDisabled]
  .map(({ visualFixturesPassed }) => visualFixturesPassed);
const visualContractPassed = visualFixtureValues.every((value) => value === true)
  ? true
  : visualFixtureValues.some((value) => value === false) ? false : null;
const parityValues = [before, after, audioDisabled]
  .map(({ offlineProductionParityPassed }) => offlineProductionParityPassed);
const offlineParityPassed = parityValues.every((value) => value === true)
  ? true
  : parityValues.some((value) => value === false) ? false : null;
const finalDigests = [before, after, audioDisabled]
  .map(({ scenario }) => scenario.finalDigest);
const gameplayContractPassed = [before, after, audioDisabled].every(scenarioPassed) &&
  finalDigests.every((digest) => typeof digest === "string" && digest === finalDigests[0]) &&
  semanticEqual(before.scenario.canonicalState, after.scenario.canonicalState) &&
  semanticEqual(after.scenario.canonicalState, audioDisabled.scenario.canonicalState);
const automatedChecks = {
  smoothRunPassed: smoothRunPassed(after),
  audioIsolationPassed: smoothRunPassed(audioDisabled) && noActiveQualityDecode(audioDisabled),
  gameplayContractPassed,
  visualContractPassed,
  diagnosticsPassed: [before, after, audioDisabled].every(diagnosticsPassed),
  offlineParityPassed,
  artifactBudgetPassed: after.artifact.bytes <= AUTONOMIC_HTML_BUDGET_BYTES,
  artifactRegressionPassed: after.artifact.bytes <= before.artifact.bytes,
  startBudgetPassed: after.readiness.coldStartMs <= 3_000 &&
    after.readiness.criticalReadyMs <= 2_000,
  startRegressionPassed: after.readiness.coldStartMs <= before.readiness.coldStartMs * 1.15 &&
    after.readiness.criticalReadyMs <= before.readiness.criticalReadyMs * 1.15
};
const automatedFailed = !comparable || Object.values(automatedChecks).some((value) => value === false);
const missingEvidence = [];
if (visualContractPassed === null) missingEvidence.push("visual-fixture-evidence-unavailable");
if (offlineParityPassed === null) missingEvidence.push("offline-production-parity-evidence-unavailable");
if ([before, after, audioDisabled].some(({ memory }) => memory.available !== true)) {
  missingEvidence.push("android-memory-evidence-unavailable");
}
const failedChecks = Object.entries(automatedChecks)
  .filter(([, passed]) => passed === false)
  .map(([name]) => `automated-check-failed:${name}`);
const releaseGate = {
  status: automatedFailed ? "fail" : "incomplete",
  reasons: [
    ...(!comparable ? ["comparison-identity-incomplete-or-mismatched"] : []),
    ...failedChecks,
    "minimum-profile-device-unavailable",
    "minimum-profile-report-unavailable",
    "oneplus-report-unavailable",
    "nokia-report-unavailable",
    "iphone-safari-report-unavailable",
    ...missingEvidence
  ]
};
const report = {
  schema: "amso-performance-comparison-v1",
  comparable,
  configuration: comparableConfiguration(after),
  runs: {
    before: summarizeRun(before),
    after: summarizeRun(after),
    audioDisabled: summarizeRun(audioDisabled)
  },
  automatedChecks,
  releaseGate
};
const jsonPath = path.resolve(args.get("json-out"));
const markdownPath = path.resolve(args.get("markdown-out"));
fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
fs.mkdirSync(path.dirname(markdownPath), { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(markdownPath, markdownReport(report));
if (automatedFailed) process.exitCode = 1;
