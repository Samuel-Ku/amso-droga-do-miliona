import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];

function evidence(audioMode: "enabled" | "disabled", variant: "before" | "after") {
  return {
    schema: "amso-performance-run-v1",
    variant,
    artifact: { bytes: variant === "before" ? 18_000_000 : 17_900_000 },
    configuration: {
      scenarioId: "performance-reference-v1",
      scenarioConfigVersion: "runner-config-v4",
      seed: 0x4d5a1201,
      inputTraceDigest: "fnv1a32:trace",
      challengeWorldDurationSeconds: 24,
      viewport: { width: 960, height: 540 },
      dpr: 1,
      quality: "force-full",
      motion: "system",
      audioMode
    },
    environment: {
      host: { platform: "darwin", architecture: "arm64", release: "25.6", cpuModel: "M2" },
      browser: {
        engine: "chromium", version: "140.0", executableSource: "playwright-bundled",
        userAgent: "test", headless: true
      },
      profiler: { name: "playwright-init-script", version: 1 },
      hardwareConcurrency: 8,
      deviceMemoryGiB: null
    },
    frames: variant === "before"
      ? { sampleCount: 3_500, p50Ms: 16.7, p95Ms: 18.4, p99Ms: 31.2, maxMs: 266.7,
          over33Ms: 4, over100Ms: 1 }
      : { sampleCount: 3_550, p50Ms: 16.7, p95Ms: 17.1, p99Ms: 18.2, maxMs: 25.1,
          over33Ms: 0, over100Ms: 0 },
    frameTimeline: [
      { atMs: 47_900, intervalMs: 16.7 },
      { atMs: 48_100, intervalMs: 17.1 }
    ],
    qualityHistory: [{ level: "full", atMs: 0 }],
    decodeTimings: [],
    worldTransitions: [
      { worldId: "order-process", atMs: 24_000 },
      { worldId: "quality-service", atMs: 48_000 }
    ],
    scenario: {
      checkpointsPassed: true,
      coveragePassed: true,
      digestPassed: true,
      finalDigest: "fnv1a32:game",
      canonicalState: { simulationStep: 7_200, score: 12_345, worldIndex: 2 },
      replayValid: true,
      inputQueueOverflows: 0
    },
    diagnostics: { consoleErrors: [], externalRequests: [] },
    readiness: { coldStartMs: 900, criticalReadyMs: 700 },
    memory: { available: false },
    visualFixturesPassed: true,
    offlineProductionParityPassed: true
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("performance comparison CLI", () => {
  it("documents the reproducible capture command", () => {
    const result = spawnSync(process.execPath, [
      "scripts/run-performance-reference.mjs",
      "--help"
    ], { cwd: process.cwd(), encoding: "utf8" });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("--artifact");
    expect(result.stdout).toContain("--audio enabled|disabled");
    expect(result.stdout).toContain("--output");
    expect(result.stdout).toContain("--variant before|after");
  });

  it("writes a comparable report while keeping physical-device sign-off incomplete", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-performance-comparison-"));
    temporaryDirectories.push(directory);
    const beforePath = path.join(directory, "before.json");
    const afterPath = path.join(directory, "after.json");
    const audioDisabledPath = path.join(directory, "after-audio-disabled.json");
    const reportPath = path.join(directory, "comparison.json");
    const markdownPath = path.join(directory, "comparison.md");
    writeFileSync(beforePath, JSON.stringify(evidence("enabled", "before")));
    writeFileSync(afterPath, JSON.stringify(evidence("enabled", "after")));
    writeFileSync(audioDisabledPath, JSON.stringify(evidence("disabled", "after")));

    execFileSync(process.execPath, [
      "scripts/compare-performance-evidence.mjs",
      "--before", beforePath,
      "--after", afterPath,
      "--audio-disabled", audioDisabledPath,
      "--json-out", reportPath,
      "--markdown-out", markdownPath
    ], { cwd: process.cwd() });

    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    expect(report).toMatchObject({
      schema: "amso-performance-comparison-v1",
      comparable: true,
      automatedChecks: {
        smoothRunPassed: true,
        audioIsolationPassed: true,
        gameplayContractPassed: true,
        visualContractPassed: true,
        diagnosticsPassed: true,
        offlineParityPassed: true,
        artifactBudgetPassed: true,
        artifactRegressionPassed: true
      },
      releaseGate: { status: "incomplete" }
    });
    expect(report.releaseGate.reasons).toContain("iphone-safari-report-unavailable");
    expect(report.runs.after.frameTimeline).toBeUndefined();
    expect(report.runs.after.scenario.canonicalState).toBeUndefined();
    const markdown = readFileSync(markdownPath, "utf8");
    expect(markdown).toContain("Release gate: incomplete");
    expect(markdown).toContain("Decode timings");
    expect(markdown).toContain("quality-service");
    expect(markdown).toContain("Cold start");
  });

  it("fails closed when scenario identity differs between runs", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-performance-comparison-"));
    temporaryDirectories.push(directory);
    const beforePath = path.join(directory, "before.json");
    const afterPath = path.join(directory, "after.json");
    const audioDisabledPath = path.join(directory, "after-audio-disabled.json");
    const reportPath = path.join(directory, "comparison.json");
    const markdownPath = path.join(directory, "comparison.md");
    const mismatchedAfter = evidence("enabled", "after");
    mismatchedAfter.configuration.seed += 1;
    writeFileSync(beforePath, JSON.stringify(evidence("enabled", "before")));
    writeFileSync(afterPath, JSON.stringify(mismatchedAfter));
    writeFileSync(audioDisabledPath, JSON.stringify(evidence("disabled", "after")));

    const result = spawnSync(process.execPath, [
      "scripts/compare-performance-evidence.mjs",
      "--before", beforePath,
      "--after", afterPath,
      "--audio-disabled", audioDisabledPath,
      "--json-out", reportPath,
      "--markdown-out", markdownPath
    ], { cwd: process.cwd() });

    expect(result.status).toBe(1);
    expect(JSON.parse(readFileSync(reportPath, "utf8"))).toMatchObject({
      comparable: false,
      releaseGate: { status: "fail" }
    });
    expect(JSON.parse(readFileSync(reportPath, "utf8")).releaseGate.reasons)
      .toContain("comparison-identity-incomplete-or-mismatched");
  });

  it("fails closed when the browser environment differs between runs", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-performance-comparison-"));
    temporaryDirectories.push(directory);
    const paths = {
      before: path.join(directory, "before.json"),
      after: path.join(directory, "after.json"),
      audioDisabled: path.join(directory, "after-audio-disabled.json"),
      report: path.join(directory, "comparison.json"),
      markdown: path.join(directory, "comparison.md")
    };
    const changedBrowser = evidence("enabled", "after");
    changedBrowser.environment.browser.version = "141.0";
    writeFileSync(paths.before, JSON.stringify(evidence("enabled", "before")));
    writeFileSync(paths.after, JSON.stringify(changedBrowser));
    writeFileSync(paths.audioDisabled, JSON.stringify(evidence("disabled", "after")));

    const result = spawnSync(process.execPath, [
      "scripts/compare-performance-evidence.mjs",
      "--before", paths.before,
      "--after", paths.after,
      "--audio-disabled", paths.audioDisabled,
      "--json-out", paths.report,
      "--markdown-out", paths.markdown
    ], { cwd: process.cwd() });

    expect(result.status).toBe(1);
    expect(JSON.parse(readFileSync(paths.report, "utf8")).comparable).toBe(false);
  });

  it("does not infer offline-production parity from clean diagnostics", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-performance-comparison-"));
    temporaryDirectories.push(directory);
    const paths = {
      before: path.join(directory, "before.json"),
      after: path.join(directory, "after.json"),
      audioDisabled: path.join(directory, "after-audio-disabled.json"),
      report: path.join(directory, "comparison.json"),
      markdown: path.join(directory, "comparison.md")
    };
    const runs = [evidence("enabled", "before"), evidence("enabled", "after"),
      evidence("disabled", "after")];
    for (const run of runs) run.offlineProductionParityPassed = null as unknown as boolean;
    writeFileSync(paths.before, JSON.stringify(runs[0]));
    writeFileSync(paths.after, JSON.stringify(runs[1]));
    writeFileSync(paths.audioDisabled, JSON.stringify(runs[2]));

    const result = spawnSync(process.execPath, [
      "scripts/compare-performance-evidence.mjs",
      "--before", paths.before,
      "--after", paths.after,
      "--audio-disabled", paths.audioDisabled,
      "--json-out", paths.report,
      "--markdown-out", paths.markdown
    ], { cwd: process.cwd() });

    expect(result.status).toBe(0);
    const report = JSON.parse(readFileSync(paths.report, "utf8"));
    expect(report.automatedChecks).toMatchObject({ diagnosticsPassed: true, offlineParityPassed: null });
    expect(report.releaseGate.reasons).toContain("offline-production-parity-evidence-unavailable");
  });

  it("fails a deterministic artifact size regression", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-performance-comparison-"));
    temporaryDirectories.push(directory);
    const paths = {
      before: path.join(directory, "before.json"),
      after: path.join(directory, "after.json"),
      audioDisabled: path.join(directory, "after-audio-disabled.json"),
      report: path.join(directory, "comparison.json"),
      markdown: path.join(directory, "comparison.md")
    };
    const after = evidence("enabled", "after");
    const audioDisabled = evidence("disabled", "after");
    after.artifact.bytes = 18_000_001;
    audioDisabled.artifact.bytes = 18_000_001;
    writeFileSync(paths.before, JSON.stringify(evidence("enabled", "before")));
    writeFileSync(paths.after, JSON.stringify(after));
    writeFileSync(paths.audioDisabled, JSON.stringify(audioDisabled));

    const result = spawnSync(process.execPath, [
      "scripts/compare-performance-evidence.mjs",
      "--before", paths.before,
      "--after", paths.after,
      "--audio-disabled", paths.audioDisabled,
      "--json-out", paths.report,
      "--markdown-out", paths.markdown
    ], { cwd: process.cwd() });

    expect(result.status).toBe(1);
    expect(JSON.parse(readFileSync(paths.report, "utf8"))
      .automatedChecks.artifactRegressionPassed).toBe(false);
  });

  it("keeps missing approved visual fixtures incomplete instead of treating them as a pass", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-performance-comparison-"));
    temporaryDirectories.push(directory);
    const paths = {
      before: path.join(directory, "before.json"),
      after: path.join(directory, "after.json"),
      audioDisabled: path.join(directory, "after-audio-disabled.json"),
      report: path.join(directory, "comparison.json"),
      markdown: path.join(directory, "comparison.md")
    };
    const runs = [
      evidence("enabled", "before"),
      evidence("enabled", "after"),
      evidence("disabled", "after")
    ];
    for (const run of runs) run.visualFixturesPassed = null as unknown as boolean;
    writeFileSync(paths.before, JSON.stringify(runs[0]));
    writeFileSync(paths.after, JSON.stringify(runs[1]));
    writeFileSync(paths.audioDisabled, JSON.stringify(runs[2]));

    const result = spawnSync(process.execPath, [
      "scripts/compare-performance-evidence.mjs",
      "--before", paths.before,
      "--after", paths.after,
      "--audio-disabled", paths.audioDisabled,
      "--json-out", paths.report,
      "--markdown-out", paths.markdown
    ], { cwd: process.cwd() });

    expect(result.status).toBe(0);
    const report = JSON.parse(readFileSync(paths.report, "utf8"));
    expect(report.automatedChecks.visualContractPassed).toBeNull();
    expect(report.releaseGate).toMatchObject({ status: "incomplete" });
    expect(report.releaseGate.reasons).toContain("visual-fixture-evidence-unavailable");
  });

  it("fails audio-disabled isolation when quality-service has a local long frame", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-performance-comparison-"));
    temporaryDirectories.push(directory);
    const beforePath = path.join(directory, "before.json");
    const afterPath = path.join(directory, "after.json");
    const audioDisabledPath = path.join(directory, "after-audio-disabled.json");
    const reportPath = path.join(directory, "comparison.json");
    const markdownPath = path.join(directory, "comparison.md");
    const isolated = evidence("disabled", "after");
    isolated.frameTimeline = [{ atMs: 48_050, intervalMs: 91.6 }];
    writeFileSync(beforePath, JSON.stringify(evidence("enabled", "before")));
    writeFileSync(afterPath, JSON.stringify(evidence("enabled", "after")));
    writeFileSync(audioDisabledPath, JSON.stringify(isolated));

    const result = spawnSync(process.execPath, [
      "scripts/compare-performance-evidence.mjs",
      "--before", beforePath,
      "--after", afterPath,
      "--audio-disabled", audioDisabledPath,
      "--json-out", reportPath,
      "--markdown-out", markdownPath
    ], { cwd: process.cwd() });

    expect(result.status).toBe(1);
    expect(JSON.parse(readFileSync(reportPath, "utf8"))
      .automatedChecks.audioIsolationPassed).toBe(false);
  });
});
