import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const profiles = [
  { profile: "cold-audio-enabled", processState: "cold", audioMode: "enabled" },
  { profile: "cold-audio-disabled", processState: "cold", audioMode: "disabled" },
  { profile: "warm-audio-enabled", processState: "warm", audioMode: "enabled" },
  { profile: "full-session", processState: "cold", audioMode: "enabled" }
];

function option(name, fallback = undefined) {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? fallback : process.argv[index + 1];
}

if (process.argv.includes("--help")) {
  process.stdout.write(
    "Usage: node scripts/qualify-cold-start.mjs " +
    "[--target URL_OR_PATH --output-dir PATH | --runs-dir PATH] " +
    "[--json-out PATH --markdown-out PATH] [--dry-run]\n"
  );
  process.exit(0);
}

const target = option("target");
const suppliedRunsDirectory = option("runs-dir");
const outputDirectory = path.resolve(root, suppliedRunsDirectory ?? option(
  "output-dir", ".scratch/cold-start-qualification"));
if (target === undefined && suppliedRunsDirectory === undefined) {
  throw new Error("--target or --runs-dir is required");
}
const isUrl = target !== undefined && /^https?:\/\//u.test(target);
const normalizedTarget = target === undefined ? null
  : isUrl ? new URL(target).href.replace(/\/$/u, "") : path.resolve(target);
const plan = {
  schema: "amso-cold-start-plan-v1",
  target: normalizedTarget,
  outputDirectory,
  runs: profiles.map(({ profile, processState, audioMode }) => ({
    profile,
    processState,
    audioMode,
    target: normalizedTarget,
    output: path.join(outputDirectory, `${profile}.json`)
  }))
};

if (process.argv.includes("--dry-run")) {
  process.stdout.write(`${JSON.stringify(plan)}\n`);
  process.exit(0);
}

if (target !== undefined) {
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const run of plan.runs) {
    const targetArgs = isUrl ? ["--url", normalizedTarget] : ["--artifact", normalizedTarget];
    const result = spawnSync(process.execPath, [
      "scripts/run-performance-reference.mjs",
      ...targetArgs,
      "--audio", run.audioMode,
      "--process", run.processState,
      "--profile", run.profile,
      "--variant", "after",
      "--output", run.output
    ], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
    if (!fs.existsSync(run.output)) {
      throw new Error(`qualification run did not produce evidence: ${run.profile} (${result.status})`);
    }
  }
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

function identity(run) {
  const { audioMode: _audioMode, ...configuration } = run.configuration;
  return { target: run.target, artifact: run.artifact, configuration, environment: run.environment };
}

function scenarioPassed(run) {
  return run.scenario.checkpointsPassed === true && run.scenario.coveragePassed === true &&
    run.scenario.digestPassed === true && run.scenario.replayValid === true &&
    run.scenario.inputQueueOverflows === 0;
}

function smooth(run) {
  return run.frames.p95Ms <= 18 && run.frames.p99Ms <= 33 && run.frames.maxMs <= 100 &&
    run.frames.over100Ms === 0;
}

function frameWindow(run, fromMs, toMs) {
  return run.frameTimeline.filter(({ atMs }) => atMs >= fromMs && atMs <= toMs);
}

function summarizeFirstTenSeconds(run) {
  const activeStartMs = run.frameTimeline[0]?.atMs ?? 0;
  const frames = frameWindow(run, activeStartMs, activeStartMs + 10_000)
    .map(({ intervalMs }) => intervalMs);
  return {
    sampleCount: frames.length,
    maxMs: frames.length === 0 ? null : Math.max(...frames),
    over33Ms: frames.filter((duration) => duration > 33).length,
    passed: frames.length > 0 && frames.every((duration) => duration <= 33)
  };
}

function transitionWindow(run, worldId) {
  const transition = run.worldTransitions.find((entry) => entry.worldId === worldId);
  if (transition === undefined) return null;
  const frames = frameWindow(run, transition.atMs - 500, transition.atMs + 500);
  const activeDecodes = run.decodeTimings.filter(({ active, startedAtMs }) =>
    active === true && Math.abs(startedAtMs - transition.atMs) <= 500);
  return {
    worldId,
    transitionAtMs: transition.atMs,
    sampleCount: frames.length,
    maxFrameMs: frames.length === 0 ? null : Math.max(...frames.map(({ intervalMs }) => intervalMs)),
    activeDecodeCount: activeDecodes.length,
    passed: frames.length > 0 && activeDecodes.length === 0 &&
      frames.every(({ intervalMs }) => intervalMs <= 33)
  };
}

function hasMonotonicGrowth(samples) {
  return Array.isArray(samples) && samples.length >= 3 &&
    samples.slice(1).every((value, index) => value >= samples[index]) &&
    samples.at(-1) > samples[0];
}

function summarizeRun(run) {
  const firstTenSeconds = summarizeFirstTenSeconds(run);
  const transitionWindows = ["order-process", "quality-service"]
    .map((worldId) => transitionWindow(run, worldId));
  const { frameTimeline: _frameTimeline, ...rest } = run;
  return { ...rest, firstTenSeconds, transitionWindows };
}

function markdownReport(report) {
  const rows = Object.entries(report.runs).map(([profile, run]) =>
    `| ${profile} | ${run.frames.p50Ms} | ${run.frames.p95Ms} | ${run.frames.p99Ms} | ` +
    `${run.frames.maxMs} | ${run.frames.over33Ms} | ${run.frames.over50Ms ?? 0} | ` +
    `${run.frames.over100Ms} |`);
  const details = Object.entries(report.runs).flatMap(([profile, run]) => [
    `### ${profile}`,
    "",
    `- First 10 seconds: ${JSON.stringify(run.firstTenSeconds)}`,
    `- World windows: ${JSON.stringify(run.transitionWindows)}`,
    `- Long tasks: ${JSON.stringify(run.longTasks)}`,
    `- Long animation frames: ${JSON.stringify(run.longAnimationFrames)}`,
    `- Resources: ${run.resourceTimings.length}`,
    `- Network: ${JSON.stringify(run.attribution.network)}`,
    `- Decode: ${JSON.stringify(run.attribution.decode)}`,
    `- GPU/compositing: ${JSON.stringify(run.attribution.gpuCompositing)}`,
    `- JavaScript: ${JSON.stringify(run.attribution.javascript)}`,
    `- GC: ${JSON.stringify(run.attribution.gc)}`,
    `- DOM: ${JSON.stringify(run.dom)}`,
    ""
  ]);
  return [
    "# Cold-start browser qualification",
    "",
    `Comparable: ${report.comparable}`,
    `Release gate: ${report.releaseGate.status}`,
    "",
    "| Run | p50 | p95 | p99 | max | >33 | >50 | >100 |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows,
    "",
    ...details,
    `Automated checks: ${JSON.stringify(report.automatedChecks)}`,
    `Release reasons: ${report.releaseGate.reasons.join(", ")}`,
    ""
  ].join("\n");
}

const jsonPath = path.resolve(root, option("json-out", path.join(
  outputDirectory, "qualification.json")));
const markdownPath = path.resolve(root, option("markdown-out", path.join(
  outputDirectory, "qualification.md")));
const missingProfiles = profiles.map(({ profile }) => profile).filter((profile) =>
  !fs.existsSync(path.join(outputDirectory, `${profile}.json`)));
if (missingProfiles.length > 0) {
  const report = {
    schema: "amso-cold-start-qualification-v1",
    comparable: false,
    target: normalizedTarget,
    runs: {},
    automatedChecks: {},
    releaseGate: {
      status: "fail",
      reasons: missingProfiles.map((profile) => `required-profile-missing:${profile}`)
    }
  };
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.mkdirSync(path.dirname(markdownPath), { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(markdownPath, [
    "# Cold-start browser qualification", "", "Comparable: false",
    "Release gate: fail", "", `Release reasons: ${report.releaseGate.reasons.join(", ")}`, ""
  ].join("\n"));
  process.exitCode = 1;
} else {
const runs = Object.fromEntries(profiles.map(({ profile }) => {
  const filePath = path.join(outputDirectory, `${profile}.json`);
  const run = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (run.schema !== "amso-performance-run-v1" || run.profile !== profile) {
    throw new Error(`invalid qualification evidence: ${filePath}`);
  }
  return [profile, run];
}));
const runValues = Object.values(runs);
const identities = runValues.map(identity);
const comparable = identities.every((candidate) => equal(candidate, identities[0])) &&
  runs["cold-audio-enabled"].processState === "cold" &&
  runs["cold-audio-enabled"].configuration.audioMode === "enabled" &&
  runs["cold-audio-disabled"].processState === "cold" &&
  runs["cold-audio-disabled"].configuration.audioMode === "disabled" &&
  runs["warm-audio-enabled"].processState === "warm" &&
  runs["warm-audio-enabled"].configuration.audioMode === "enabled";
const digests = runValues.map(({ scenario }) => scenario.finalDigest);
const gameplayContractPassed = runValues.every(scenarioPassed) &&
  digests.every((digest) => typeof digest === "string" && digest === digests[0]) &&
  runValues.every(({ scenario }) => equal(
    scenario.canonicalState, runValues[0].scenario.canonicalState));
const summaries = Object.fromEntries(Object.entries(runs)
  .map(([profile, run]) => [profile, summarizeRun(run)]));
const automatedChecks = {
  smoothRunsPassed: runValues.every(smooth),
  firstTenSecondsPassed: Object.values(summaries)
    .every(({ firstTenSeconds }) => firstTenSeconds.passed),
  worldTransitionWindowsPassed: summaries["full-session"].transitionWindows
    .every((window) => window?.passed === true),
  fullSessionPassed: runs["full-session"].scenario.session?.durationSeconds >= 59.5 &&
    runs["full-session"].worldTransitions.some(({ worldId }) => worldId === "order-process") &&
    runs["full-session"].worldTransitions.some(({ worldId }) => worldId === "quality-service"),
  startBudgetsPassed: runValues.every(({ readiness }) =>
    readiness.coldStartMs <= 3_000 && readiness.criticalReadyMs <= 2_000),
  attributionComplete: runValues.every(({ attribution, longTasks, longAnimationFrames,
    resourceTimings }) => attribution !== undefined && longTasks !== undefined &&
      longAnimationFrames !== undefined && Array.isArray(resourceTimings)),
  diagnosticsPassed: runValues.every(({ diagnostics }) =>
    diagnostics.consoleErrors.length === 0 && diagnostics.externalRequests.length === 0),
  domGrowthPassed: runValues.every(({ dom }) => dom.maxNodeCount - dom.initialNodeCount <= 32 &&
    !hasMonotonicGrowth(dom.samples)),
  auxiliaryMemoryTrendPassed: runValues.every(({ memory }) =>
    !hasMonotonicGrowth(memory.samples)),
  gameplayContractPassed
};
const failedChecks = Object.entries(automatedChecks)
  .filter(([, passed]) => passed === false).map(([name]) => `automated-check-failed:${name}`);
const missingEvidence = [];
if (runValues.some(({ memory }) => memory.available !== true)) {
  missingEvidence.push("physical-process-memory-evidence-unavailable");
}
if (runValues.some(({ visualFixturesPassed }) => visualFixturesPassed !== true)) {
  missingEvidence.push("approved-visual-fixtures-unavailable");
}
if (runValues.some(({ offlineProductionParityPassed }) =>
  offlineProductionParityPassed !== true)) {
  missingEvidence.push("offline-production-parity-evidence-unavailable");
}
missingEvidence.push("minimum-profile-device-unavailable", "iphone-safari-report-unavailable");
const automatedFailed = !comparable || failedChecks.length > 0;
const report = {
  schema: "amso-cold-start-qualification-v1",
  comparable,
  target: runs["full-session"].target,
  runs: summaries,
  automatedChecks,
  releaseGate: {
    status: automatedFailed ? "fail" : missingEvidence.length > 0 ? "incomplete" : "pass",
    reasons: [
      ...(!comparable ? ["qualification-identity-incomplete-or-mismatched"] : []),
      ...failedChecks,
      ...missingEvidence
    ]
  }
};
fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
fs.mkdirSync(path.dirname(markdownPath), { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(markdownPath, markdownReport(report));
process.stdout.write(`${JSON.stringify({ plan, report: jsonPath })}\n`);
if (automatedFailed) process.exitCode = 1;
}
