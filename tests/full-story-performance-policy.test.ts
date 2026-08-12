import { describe, expect, it } from "vitest";
import { APPROVED_FULL_STORY_DIGEST, APPROVED_FULL_STORY_ROUTE,
  aggregateFullStoryReleaseGate, assessFullStoryEvidence } from "../scripts/full-story-performance-policy.mjs";

const checkpointDefinitions = [
  ["first-package", "epoch_1.first_package", "first-mile", 11, 4],
  ["order-backlog", "epoch_1.order_backlog", "order-process", 31, 8],
  ["quality-process", "epoch_2.quality_process", "quality-service", 87, 12],
  ["client-growth", "epoch_3.client_growth", "client-paths", 106, 6],
  ["order-scale", "epoch_4.order_scale", "scale-logistics", 132, 9],
  ["million-threshold", "epoch_5.million_threshold", "million-approach", 160, 7]
] as const;

const passing = {
  schemaVersion: "full-story-reference-evidence-v1",
  configuration: { scenarioId: "full-story-reference-v1", audioMode: "enabled", quality: "force-full", motion: "full", requestedDpr: 1 },
  provenance: { finalUrl: "https://game.amso.pl/", vercelId: "fra1::abc",
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
    checkpoints: checkpointDefinitions.map(([microlevelId, segmentId, worldId, packagesCollected, completedWaves], index) =>
      ({ microlevelId, segmentId, completedWaves, worldId, packagesCollected,
        ...(index === checkpointDefinitions.length - 1 ? { millionCounterValue: 1_000_000 } : {}),
        canonicalState: { simulationStep: 10 + index, rngState: [1, 2], score: index,
          distance: index, worldIndex: index, collisionCount: 0, pickupCount: packagesCollected } })),
    finalDigest: APPROVED_FULL_STORY_DIGEST
  },
  performance: {
    activeFrameCount: 10, p95Ms: 18, p99Ms: 33, maxMs: 100, activeDecodeStarts: 0,
    hotPathImageNodesCreated: 0, blankFrameCount: 0, repeatedWorldDecodeSources: [], collectorCostP95Ms: 0.1,
    collectorComparison: { sampledP95Ms: 0.1, unsampledP95Ms: 0.05, deltaP95Ms: 0.05 },
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
});
