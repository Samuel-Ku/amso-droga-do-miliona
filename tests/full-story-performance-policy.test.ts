import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { APPROVED_FULL_STORY_DIGEST, APPROVED_FULL_STORY_ROUTE,
  aggregateFullStoryReleaseGate, assessFullStoryComparison,
  assessFullStoryEvidence } from "../scripts/full-story-performance-policy.mjs";

const checkpointDefinitions = [
  ["first-package", "epoch_1.first_package", "first-mile", 11, 4],
  ["order-backlog", "epoch_1.order_backlog", "order-process", 31, 8],
  ["quality-process", "epoch_2.quality_process", "quality-service", 87, 12],
  ["client-growth", "epoch_3.client_growth", "client-paths", 106, 6],
  ["order-scale", "epoch_4.order_scale", "scale-logistics", 132, 9],
  ["million-threshold", "epoch_5.million_threshold", "million-approach", 160, 7]
] as const;

const passing = {
  schemaVersion: "full-story-reference-evidence-v2",
  capturedAt: "2026-08-13T08:00:00.000Z",
  browser: "chromium",
  target: "local-dist-vercel",
  configuration: { scenarioId: "full-story-reference-v1", scenarioConfigVersion: 1,
    seed: 0x4d5a1202, inputTraceDigest: "trace-a", audioMode: "enabled",
    quality: "force-full", motion: "full", requestedDpr: 1, stopAfterChapter: null },
  provenance: { finalUrl: "https://game.amso.pl/", vercelId: "fra1::abc",
    browserVersion: "149.0.7827.55", viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1,
    sourceIdentity: "a".repeat(64), htmlSha256: "b".repeat(64), assetIdentities: [{ bytes: 10, sha256: "same" }] },
  correctness: {
    completed: true, resultVisible: true, failure: null,
    storyScenes: ["story.first_package", "story.order_backlog", "story.quality_promise",
      "client.business_start", "client.business_growth", "story.matching_result", "story.scale",
      "story.million_approach", "challenge.million_wave", "story.million_finale", "story.challenge_handoff"],
    countdownTrace: ["prologue", "epoch_1", "epoch_2", "epoch_3", "epoch_3", "epoch_5", "finale"]
      .flatMap((sectionId) => [3, 2, 1].map((value) => ({ sectionId, value }))),
    finalPresentation: { worldId: "million-finale", ready: true, hidden: false, naturalWidth: 1780, readyDelayMs: 0 },
    seenMicrolevels: ["first-package", "order-backlog", "quality-process", "client-growth", "order-scale", "million-threshold"],
    manifest: {
      expectedFinalDigest: APPROVED_FULL_STORY_DIGEST,
      routeWaveIds: APPROVED_FULL_STORY_ROUTE,
      checkpoints: checkpointDefinitions.map(([microlevelId, segmentId, worldId, minimumCumulativePackages]) =>
        ({ microlevelId, segmentId, worldId, minimumCumulativePackages }))
    },
    waveResults: APPROVED_FULL_STORY_ROUTE.map((waveId) => ({ waveId, attempts: 1, passed: true })),
    inputTrace: [{ step: 12, action: "jump", active: true, token: "guided-low-stack:1" }],
    checkpoints: checkpointDefinitions.map(([microlevelId, segmentId, worldId, packagesCollected, completedWaves], index) =>
      ({ microlevelId, segmentId, completedWaves, worldId, packagesCollected,
        ...(index === checkpointDefinitions.length - 1 ? { millionCounterValue: 1_000_000 } : {}),
        canonicalState: { simulationStep: 10 + index, rngState: [1, 2], score: index,
          distance: index, worldIndex: index, collisionCount: 0, pickupCount: packagesCollected } })),
    finalDigest: APPROVED_FULL_STORY_DIGEST
  },
  performance: {
    activeFrameCount: 10, p95Ms: 18, p99Ms: 33, maxMs: 100, over33Ms: 0, over100Ms: 0,
    activeDecodeStarts: 0,
    hotPathImageNodesCreated: 0, blankFrameCount: 0, repeatedWorldDecodeSources: [], collectorCostP95Ms: 0.1,
    collectorComparison: {
      mode: "alternating-active-trace-ab-v2",
      sampledIntervalP95Ms: 16.7, controlIntervalP95Ms: 16.7, intervalDeltaP95Ms: 0,
      sampledExecutionP95Ms: 0.1, controlExecutionP95Ms: 0.02, executionDeltaP95Ms: 0.08,
      sampledLayoutReads: 5, controlLayoutReads: 0
    },
    emptyRafBaseline: { diagnosticOnly: true, sampleCount: 120, p50Ms: 16.7,
      p95Ms: 16.8, p99Ms: 17, maxMs: 18, over33Ms: 0 },
    phaseAggregates: { "active-gameplay": {}, "story-scene": {}, countdown: {}, result: {} },
    activeSegments: {
      ...Object.fromEntries(checkpointDefinitions.map(([, segmentId]) =>
        [segmentId, { frameCount: 5, p95Ms: 10, p99Ms: 12, maxMs: 15 }]))
    },
    longTasks: [], longAnimationFrames: [], transitions: [],
    transitionWindows: checkpointDefinitions.slice(1).map(() => ({ presentationReady: true, hidden: false, blankFrames: 0,
      phase: "story-scene", narrativeGapMs: 1_000, phaseResidualPx: 100 }))
  },
  browserFailures: []
};

describe("full story performance policy", () => {
  it("accepts complete bounded evidence", () => expect(assessFullStoryEvidence(passing)).toEqual([]));
  it("rejects legacy evidence without the controlled runtime comparison contract", () => {
    const legacy = { ...passing, schemaVersion: "full-story-reference-evidence-v1",
      configuration: { ...passing.configuration, seed: undefined },
      performance: { ...passing.performance, emptyRafBaseline: undefined } };
    expect(assessFullStoryEvidence(legacy)).toEqual(expect.arrayContaining([
      "evidence-schema-invalid", "release-configuration-invalid", "empty-raf-baseline-missing"
    ]));
  });
  it("rejects incomplete story and active decode", () => {
    expect(assessFullStoryEvidence({ ...passing, correctness: { ...passing.correctness, resultVisible: false }, performance: { ...passing.performance, activeDecodeStarts: 1 } }))
      .toEqual(expect.arrayContaining(["story-result-not-visible", "active-decode-started"]));
  });
  it("rejects duplicate route entries and incomplete checkpoints", () => {
    const invalid = {
      ...passing,
      correctness: {
        ...passing.correctness,
        waveResults: [...passing.correctness.waveResults, passing.correctness.waveResults[1]],
        checkpoints: passing.correctness.checkpoints.slice(0, 1)
      }
    };
    expect(assessFullStoryEvidence(invalid)).toEqual(expect.arrayContaining([
      "authored-wave-route-mismatch", "chapter-checkpoint-count-mismatch"
    ]));
  });
  it("rejects a self-consistent but shortened 45-wave route", () => {
    const route = APPROVED_FULL_STORY_ROUTE.slice(0, -1);
    const invalid = { ...passing, correctness: { ...passing.correctness,
      manifest: { ...passing.correctness.manifest, routeWaveIds: route },
      waveResults: passing.correctness.waveResults.slice(0, -1) } };
    expect(assessFullStoryEvidence(invalid)).toContain("authored-wave-route-mismatch");
  });
  it("keeps the empty-rAF baseline diagnostic and still rejects an over-budget WebKit run", () => {
    const webkit = { ...passing, browser: "webkit", performance: { ...passing.performance,
      p95Ms: 20, emptyRafBaseline: { ...passing.performance.emptyRafBaseline, p95Ms: 20 } } };
    expect(assessFullStoryEvidence(webkit)).toContain("active-p95-over-18ms");
  });
  it("keeps a correct red baseline comparable for measuring an optimization", () => {
    const before = { ...passing, performance: { ...passing.performance, p95Ms: 21,
      maxMs: 120, activeSegments: { ...passing.performance.activeSegments,
        "epoch_1.first_package": { frameCount: 5, p95Ms: 21, p99Ms: 30, maxMs: 120 } } } };
    const after = { ...passing, capturedAt: "2026-08-13T09:00:00.000Z",
      provenance: { ...passing.provenance, sourceIdentity: "c".repeat(64) } };
    expect(assessFullStoryComparison(before, after)).toMatchObject({ comparable: true, reasons: [] });
  });
  it("does not treat missing samples, active decode, or collector overhead as an allowed red baseline", () => {
    const before = { ...passing, performance: { ...passing.performance,
      activeFrameCount: 0, activeDecodeStarts: 1,
      collectorComparison: { ...passing.performance.collectorComparison, intervalDeltaP95Ms: 10 } } };
    const after = { ...passing, capturedAt: "2026-08-13T09:00:00.000Z",
      provenance: { ...passing.provenance, sourceIdentity: "c".repeat(64) } };
    expect(assessFullStoryComparison(before, after).reasons).toEqual(expect.arrayContaining([
      "comparison-before:active-frames-missing",
      "comparison-before:active-decode-started",
      "comparison-before:collector-ab-overhead-too-high"
    ]));
  });
  it("does not treat missing segment coverage as an allowed red baseline", () => {
    const activeSegments = { ...passing.performance.activeSegments };
    delete activeSegments["epoch_2.quality_process"];
    const before = { ...passing, performance: { ...passing.performance, activeSegments } };
    const after = { ...passing, capturedAt: "2026-08-13T09:00:00.000Z",
      provenance: { ...passing.provenance, sourceIdentity: "c".repeat(64) } };
    expect(assessFullStoryComparison(before, after).reasons)
      .toContain("comparison-before:segment-samples-missing:epoch_2.quality_process");
  });
  it("accepts only controlled before/after evidence from distinct sources", () => {
    const after = { ...passing, capturedAt: "2026-08-13T09:00:00.000Z",
      provenance: { ...passing.provenance, sourceIdentity: "c".repeat(64),
        htmlSha256: "d".repeat(64) } };
    expect(assessFullStoryComparison(passing, after)).toMatchObject({
      comparable: true,
      reasons: [],
      deltas: { p95Ms: 0, p99Ms: 0, maxMs: 0, over33Ms: 0 }
    });
  });
  it("rejects stale, differently configured, or differently driven comparisons", () => {
    const stale = { ...passing, capturedAt: "2026-08-13T07:00:00.000Z" };
    expect(assessFullStoryComparison(passing, stale).reasons).toEqual(expect.arrayContaining([
      "comparison-source-identity-not-distinct", "comparison-capture-order-invalid"
    ]));

    const mismatched = { ...passing, capturedAt: "2026-08-13T09:00:00.000Z",
      provenance: { ...passing.provenance, sourceIdentity: "c".repeat(64), browserVersion: "different" },
      configuration: { ...passing.configuration, seed: 123 },
      correctness: { ...passing.correctness,
        inputTrace: [{ step: 13, action: "jump", active: true, token: "guided-low-stack:1" }] } };
    expect(assessFullStoryComparison(passing, mismatched).reasons).toEqual(expect.arrayContaining([
      "comparison-configuration-mismatch:seed", "comparison-browser-version-mismatch",
      "comparison-input-trace-mismatch"
    ]));
  });
  it("rejects comparisons whose matching provenance is absent", () => {
    const withoutProvenance = { ...passing,
      provenance: { ...passing.provenance, browserVersion: undefined, viewport: undefined,
        deviceScaleFactor: undefined } };
    const after = { ...withoutProvenance, capturedAt: "2026-08-13T09:00:00.000Z",
      provenance: { ...withoutProvenance.provenance, sourceIdentity: "c".repeat(64) } };
    expect(assessFullStoryComparison(withoutProvenance, after).reasons).toEqual(expect.arrayContaining([
      "comparison-browser-version-missing", "comparison-viewport-missing", "comparison-dpr-missing"
    ]));
  });
  it("revalidates both complete runs before comparing their deltas", () => {
    const invalidBefore = { ...passing, correctness: { ...passing.correctness,
      waveResults: passing.correctness.waveResults.map((result, index) => index === 0
        ? { ...result, attempts: 2 } : result) } };
    const after = { ...passing, capturedAt: "2026-08-13T09:00:00.000Z",
      provenance: { ...passing.provenance, sourceIdentity: "c".repeat(64) } };
    expect(assessFullStoryComparison(invalidBefore, after).reasons)
      .toEqual(expect.arrayContaining(["comparison-before:strict-wave-route-failed"]));
  });
  it("fails closed when a checkpoint lacks a finite simulation step", () => {
    const before = { ...passing, correctness: { ...passing.correctness,
      checkpoints: passing.correctness.checkpoints.map((checkpoint, index) => index === 0
        ? { ...checkpoint, canonicalState: { ...checkpoint.canonicalState, simulationStep: undefined } }
        : checkpoint) } };
    const after = { ...passing, capturedAt: "2026-08-13T09:00:00.000Z",
      provenance: { ...passing.provenance, sourceIdentity: "c".repeat(64) } };
    expect(assessFullStoryComparison(before, after).reasons)
      .toContain("comparison-gameplay-state-mismatch:first-package");
  });
  it("keeps missing production and physical evidence incomplete", () => {
    expect(aggregateFullStoryReleaseGate({ localChromium: passing, localWebKit: passing }).status).toBe("incomplete");
  });
  it("rejects stale physical evidence from another artifact", () => {
    const physical = { passed: true, macBookM1ProChrome: { passed: true }, baselineAndroid: { passed: true },
      physicalIphoneSafari: { passed: true }, artifactIdentity: {
        sourceIdentity: "z".repeat(64), htmlSha256: "y".repeat(64),
        assetIdentities: [{ bytes: 10, sha256: "different" }]
      } };
    const report = aggregateFullStoryReleaseGate({ localChromium: passing, localWebKit: passing, physical });
    expect(report.gates.physical).toEqual(["physical-device-gates-incomplete"]);
  });
  it("publishes a controlled comparison report through the CLI seam", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-full-story-comparison-"));
    const beforePath = path.join(directory, "before.json");
    const afterPath = path.join(directory, "after.json");
    const reportPath = path.join(directory, "report.json");
    writeFileSync(beforePath, JSON.stringify(passing));
    writeFileSync(afterPath, JSON.stringify({ ...passing, capturedAt: "2026-08-13T09:00:00.000Z",
      provenance: { ...passing.provenance, sourceIdentity: "c".repeat(64), htmlSha256: "d".repeat(64) } }));
    execFileSync("node", ["scripts/compare-full-story-runtime.mjs", "--before", beforePath,
      "--after", afterPath, "--output", reportPath], { cwd: process.cwd() });
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    expect(report).toMatchObject({ schema: "amso-full-story-runtime-comparison-v1",
      status: "comparable", reasons: [], identity: { seed: 0x4d5a1202, inputTraceDigest: "trace-a" },
      deltas: { p95Ms: 0, over33Ms: 0 } });
  });
});
