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
    diagnostics: { consoleErrors: [], externalRequests: [], failedResponses: [] },
    readiness: { coldStartMs: 900, criticalReadyMs: 700 },
    memory: { available: false },
    visualFixturesPassed: true,
    offlineProductionParityPassed: true
  };
}

function qualificationEvidence(
  profile: "cold-audio-enabled" | "cold-audio-disabled" |
    "warm-audio-enabled" | "full-session"
) {
  const audioMode = profile === "cold-audio-disabled" ? "disabled" : "enabled";
  const run: any = evidence(audioMode, "after");
  run.capturePassed = true;
  run.artifact.sha256 = "a".repeat(64);
  run.profile = profile;
  run.processState = profile === "warm-audio-enabled" ? "warm" : "cold";
  run.target = { kind: "url", value: "https://runner.example/campaign" };
  run.frames.over50Ms = 0;
  run.frameTimeline = [
    { atMs: 5_000, intervalMs: 16.7 },
    { atMs: 23_900, intervalMs: 16.7 },
    { atMs: 24_100, intervalMs: 17.0 },
    { atMs: 47_900, intervalMs: 16.7 },
    { atMs: 48_100, intervalMs: 17.1 }
  ];
  run.longTasks = { support: "supported", count: 0, totalDurationMs: 0,
    maxDurationMs: 0, entries: [] };
  run.longAnimationFrames = { support: "supported", count: 0,
    totalBlockingDurationMs: 0, entries: [] };
  run.resourceTimings = [];
  run.attribution = {
    network: { support: "supported", transferSizeBytes: 0, durationMs: 0 },
    decode: { support: "supported", durationMs: 0 },
    gpuCompositing: { support: "proxy", durationMs: 0 },
    javascript: { support: "proxy", durationMs: 0 },
    gc: { support: "unsupported", durationMs: null }
  };
  run.dom = { initialNodeCount: 120, maxNodeCount: 124, finalNodeCount: 124,
    addedNodeCount: 4, removedNodeCount: 0 };
  run.memory.samples = [100, 102, 101, 103];
  run.scenario.session = { durationSeconds: 60, replayValid: true, inputQueueOverflows: 0 };
  return run;
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
    expect(result.stdout).toContain("--url");
    expect(result.stdout).toContain("--audio enabled|disabled");
    expect(result.stdout).toContain("--process cold|warm");
    expect(result.stdout).toContain("--profile cold-audio-enabled|cold-audio-disabled|warm-audio-enabled|full-session");
    expect(result.stdout).toContain("--output");
    expect(result.stdout).toContain("--variant before|after");
  });

  it("plans all four qualification profiles against one deployment", () => {
    const result = spawnSync(process.execPath, [
      "scripts/qualify-cold-start.mjs",
      "--target", "https://runner.example/campaign",
      "--output-dir", "/tmp/amso-cold-start",
      "--dry-run"
    ], { cwd: process.cwd(), encoding: "utf8" });

    expect(result.status).toBe(0);
    const plan = JSON.parse(result.stdout);
    expect(plan.target).toBe("https://runner.example/campaign");
    expect(plan.runs.map(({ profile }: { profile: string }) => profile)).toEqual([
      "cold-audio-enabled",
      "cold-audio-disabled",
      "warm-audio-enabled",
      "full-session"
    ]);
    expect(plan.runs.every(({ target }: { target: string }) =>
      target === plan.target)).toBe(true);
  });

  it("qualifies four comparable runs while leaving physical evidence incomplete", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-cold-start-qualification-"));
    temporaryDirectories.push(directory);
    for (const profile of ["cold-audio-enabled", "cold-audio-disabled",
      "warm-audio-enabled", "full-session"] as const) {
      writeFileSync(path.join(directory, `${profile}.json`),
        JSON.stringify(qualificationEvidence(profile)));
    }
    const reportPath = path.join(directory, "qualification.json");
    const markdownPath = path.join(directory, "qualification.md");

    const result = spawnSync(process.execPath, [
      "scripts/qualify-cold-start.mjs",
      "--runs-dir", directory,
      "--json-out", reportPath,
      "--markdown-out", markdownPath
    ], { cwd: process.cwd(), encoding: "utf8" });

    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync(reportPath, "utf8"))).toMatchObject({
      schema: "amso-cold-start-qualification-v1",
      comparable: true,
      automatedChecks: {
        smoothRunsPassed: true,
        firstTenSecondsPassed: true,
        worldTransitionWindowsPassed: true,
        fullSessionPassed: true,
        diagnosticsPassed: true,
        domGrowthPassed: true,
        gameplayContractPassed: true
      },
      releaseGate: { status: "incomplete" }
    });
    const markdown = readFileSync(markdownPath, "utf8");
    expect(markdown).toContain("Long animation frames");
    expect(markdown).toContain("GPU/compositing");
    expect(markdown).toContain("Release gate: incomplete");
  });

  it("fails qualification on a cold-start spike or decode at either world transition", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-cold-start-qualification-"));
    temporaryDirectories.push(directory);
    for (const profile of ["cold-audio-enabled", "cold-audio-disabled",
      "warm-audio-enabled", "full-session"] as const) {
      const run = qualificationEvidence(profile);
      if (profile === "cold-audio-enabled") {
        run.frameTimeline.push({ atMs: 6_000, intervalMs: 66.7 });
      }
      if (profile === "full-session") {
        run.decodeTimings.push({ active: true, startedAtMs: 24_100, durationMs: 30 });
      }
      writeFileSync(path.join(directory, `${profile}.json`), JSON.stringify(run));
    }
    const reportPath = path.join(directory, "qualification.json");

    const result = spawnSync(process.execPath, [
      "scripts/qualify-cold-start.mjs",
      "--runs-dir", directory,
      "--json-out", reportPath,
      "--markdown-out", path.join(directory, "qualification.md")
    ], { cwd: process.cwd(), encoding: "utf8" });

    expect(result.status).toBe(1);
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    expect(report.automatedChecks.firstTenSecondsPassed).toBe(false);
    expect(report.automatedChecks.worldTransitionWindowsPassed).toBe(false);
    expect(report.releaseGate.status).toBe("fail");
  });

  it("fails qualification when a capture process reports failure", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-cold-start-qualification-"));
    temporaryDirectories.push(directory);
    for (const profile of ["cold-audio-enabled", "cold-audio-disabled",
      "warm-audio-enabled", "full-session"] as const) {
      const run = qualificationEvidence(profile);
      if (profile === "cold-audio-enabled") run.capturePassed = false;
      writeFileSync(path.join(directory, `${profile}.json`), JSON.stringify(run));
    }
    const reportPath = path.join(directory, "qualification.json");

    const result = spawnSync(process.execPath, [
      "scripts/qualify-cold-start.mjs",
      "--runs-dir", directory,
      "--json-out", reportPath,
      "--markdown-out", path.join(directory, "qualification.md")
    ], { cwd: process.cwd(), encoding: "utf8" });

    expect(result.status).toBe(1);
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    expect(report.automatedChecks.captureProcessesPassed).toBe(false);
    expect(report.releaseGate.reasons).toContain(
      "automated-check-failed:captureProcessesPassed"
    );
  });

  it("rejects a full-session run with the wrong process mode", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-cold-start-qualification-"));
    temporaryDirectories.push(directory);
    for (const profile of ["cold-audio-enabled", "cold-audio-disabled",
      "warm-audio-enabled", "full-session"] as const) {
      const run = qualificationEvidence(profile);
      if (profile === "full-session") run.processState = "warm";
      writeFileSync(path.join(directory, `${profile}.json`), JSON.stringify(run));
    }
    const reportPath = path.join(directory, "qualification.json");

    const result = spawnSync(process.execPath, [
      "scripts/qualify-cold-start.mjs",
      "--runs-dir", directory,
      "--json-out", reportPath,
      "--markdown-out", path.join(directory, "qualification.md")
    ], { cwd: process.cwd(), encoding: "utf8" });

    expect(result.status).toBe(1);
    expect(JSON.parse(readFileSync(reportPath, "utf8"))).toMatchObject({
      comparable: false,
      releaseGate: { status: "fail" }
    });
  });

  it("writes a failed gate when required cold-process evidence is missing", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-cold-start-qualification-"));
    temporaryDirectories.push(directory);
    for (const profile of ["cold-audio-enabled", "warm-audio-enabled",
      "full-session"] as const) {
      writeFileSync(path.join(directory, `${profile}.json`),
        JSON.stringify(qualificationEvidence(profile)));
    }
    const reportPath = path.join(directory, "qualification.json");

    const result = spawnSync(process.execPath, [
      "scripts/qualify-cold-start.mjs",
      "--runs-dir", directory,
      "--json-out", reportPath,
      "--markdown-out", path.join(directory, "qualification.md")
    ], { cwd: process.cwd(), encoding: "utf8" });

    expect(result.status).toBe(1);
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    expect(report.releaseGate.status).toBe("fail");
    expect(report.releaseGate.reasons).toContain(
      "required-profile-missing:cold-audio-disabled"
    );
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
