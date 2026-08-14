import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  APPROVED_FULL_STORY_DIGEST,
  APPROVED_FULL_STORY_ROUTE
} from "../scripts/full-story-performance-policy.mjs";
import { assessFullStoryRuntimeProfile } from "../scripts/full-story-runtime-profile-policy.mjs";
import { contextForTimelineEntry } from "../scripts/full-story-runtime-profile-policy.mjs";

const sourceIdentity = "a".repeat(64);
const inputTrace = [{ command: "jump", token: "wave-1" }];
const inputTraceDigest = createHash("sha256").update(JSON.stringify(inputTrace)).digest("hex");

function evidence(target: "local-dist-vercel" | "https://game.amso.pl/", overrides: Record<string, unknown> = {}) {
  const origin = target === "local-dist-vercel" ? "http://127.0.0.1:4173" : "https://game.amso.pl";
  const assetIdentities = ["/assets/app.js", "/assets/app.css",
    ...Array.from({ length: 7 }, (_, index) =>
      `/assets/milion-runner/worlds/world-0${index + 1}-fixture.webp`)]
    .map((assetPath, index) => ({ url: `${origin}${assetPath}`, status: 200,
      bytes: 100 + index, sha256: `asset-${index}` }));
  return {
    schemaVersion: "full-story-reference-evidence-v2",
    browser: "webkit",
    target,
    configuration: {
      scenarioId: "full-story-reference-v1",
      scenarioConfigVersion: 1,
      seed: 0x4d5a1202,
      inputTraceDigest,
      audioMode: "enabled",
      quality: "force-full",
      motion: "full",
      requestedDpr: 1,
      stopAfterChapter: null
    },
    provenance: {
      finalUrl: target === "local-dist-vercel" ? "http://127.0.0.1:4173/" : "https://game.amso.pl/",
      vercelId: target === "local-dist-vercel" ? null : "fra1::profile",
      sourceIdentity,
      browserVersion: "26.5",
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
      hostDeviceClass: "darwin-arm64",
      htmlSha256: "b".repeat(64),
      assetIdentities
    },
    correctness: {
      completed: true,
      failure: null,
      resultVisible: true,
      inputTrace,
      seenMicrolevels: ["first-package", "order-backlog", "quality-process", "client-growth",
        "order-scale", "million-threshold"],
      waveResults: APPROVED_FULL_STORY_ROUTE.map((waveId) => ({ waveId, attempts: 1, passed: true })),
      finalDigest: APPROVED_FULL_STORY_DIGEST,
      manifest: { routeWaveIds: APPROVED_FULL_STORY_ROUTE, expectedFinalDigest: APPROVED_FULL_STORY_DIGEST },
      checkpoints: [
        ["first-package", "epoch_1.first_package", "first-mile", 11, 4],
        ["order-backlog", "epoch_1.order_backlog", "order-process", 31, 8],
        ["quality-process", "epoch_2.quality_process", "quality-service", 87, 12],
        ["client-growth", "epoch_3.client_growth", "client-paths", 106, 6],
        ["order-scale", "epoch_4.order_scale", "scale-logistics", 132, 9],
        ["million-threshold", "epoch_5.million_threshold", "million-approach", 160, 7]
      ].map(([microlevelId, segmentId, worldId, packagesCollected, completedWaves], index, rows) => ({
        microlevelId, segmentId, worldId, packagesCollected, completedWaves,
        millionCounterValue: index === rows.length - 1 ? 1_000_000 : 0
      })),
      storyScenes: ["story.first_package", "story.order_backlog", "story.quality_promise",
        "client.business_start", "client.business_growth", "story.matching_result", "story.scale",
        "story.million_approach", "challenge.million_wave", "story.million_finale", "story.challenge_handoff"],
      countdownTrace: ["prologue", "epoch_1", "epoch_2", "epoch_3", "epoch_3", "epoch_5", "finale"]
        .flatMap((sectionId) => [3, 2, 1].map((value) => ({ sectionId, value }))),
      finalPresentation: { worldId: "million-finale", ready: true, hidden: false,
        naturalWidth: 1920, readyDelayMs: 0 }
    },
    performance: {
      p95Ms: 20,
      p50Ms: 17,
      p99Ms: 28,
      maxMs: 60,
      over33Ms: 4,
      over100Ms: 0,
      emptyRafBaseline: { diagnosticOnly: true, sampleCount: 120, p50Ms: 16, p95Ms: 17,
        p99Ms: 18, maxMs: 19, over33Ms: 0 },
      collectorComparison: { mode: "alternating-active-trace-ab-v2",
        sampledIntervalP95Ms: 20, controlIntervalP95Ms: 19.9,
        sampledExecutionP95Ms: 0.1, controlExecutionP95Ms: 0,
        intervalDeltaP95Ms: 0.1, executionDeltaP95Ms: 0.1, controlLayoutReads: 0 },
      activeDecodeStarts: 0,
      hotPathImageNodesCreated: 0,
      blankFrameCount: 0,
      repeatedWorldDecodeSources: [],
      runtimeProfile: {
        schemaVersion: "full-story-runtime-profile-v1",
        sampledActiveFrames: 600,
        canvas: {
          support: "instrumented",
          totals: {
            calls: 18_000,
            durationMs: 900,
            shadowedPaintCalls: 4_000,
            shadowedPaintDurationMs: 540,
            gradientAllocations: 900
          },
          bySegment: {
            "epoch_2.quality_process": {
              calls: 4_000,
              durationMs: 260,
              shadowedPaintCalls: 1_500,
              shadowedPaintDurationMs: 180,
              gradientAllocations: 300
            }
          },
          byWorld: { "quality-service": { calls: 4_000, durationMs: 260,
            shadowedPaintCalls: 1_500, shadowedPaintDurationMs: 180, gradientAllocations: 300 } }
        },
        rendering: {
          support: "long-animation-frame",
          entries: 1,
          totalRenderDurationMs: 10,
          totalStyleAndLayoutDurationMs: 5,
          activeEntries: 1,
          activeRenderDurationMs: 10,
          activeStyleAndLayoutDurationMs: 5,
          bySegment: {},
          byWorld: {}
        },
        gc: { support: "unsupported", entries: 0, totalDurationMs: 0,
          activeEntries: 0, activeDurationMs: 0, bySegment: {}, byWorld: {} },
        heap: { support: "unsupported", samples: 0, growthBytes: null }
      },
      activeFrameCount: 1000,
      phaseAggregates: { "active-gameplay": {}, "story-scene": {}, countdown: {}, result: {} },
      activeSegments: Object.fromEntries(["epoch_1.first_package", "epoch_1.order_backlog",
        "epoch_2.quality_process", "epoch_3.client_growth", "epoch_4.order_scale",
        "epoch_5.million_threshold"].map((id) => [id, { frameCount: 100, p50Ms: 17,
          p95Ms: 20, p99Ms: 28, maxMs: 60, over33Ms: 1, over100Ms: 0 }])),
      activeWorlds: Object.fromEntries(["first-mile", "order-process", "quality-service", "client-paths",
        "scale-logistics", "million-approach"].map((id) => [id, { frameCount: 100, p50Ms: 17,
          p95Ms: 20, p99Ms: 28, maxMs: 60, over33Ms: 1, over100Ms: 0 }])),
      historyTruncations: {},
      longTasks: [],
      longAnimationFrames: [],
      transitions: [],
      transitionWindows: Array.from({ length: 5 }, () => ({ presentationReady: true,
        hidden: false, blankFrames: 0, phaseResidualPx: 0 }))
    },
    browserFailures: [],
    ...overrides
  };
}

describe("full story runtime profile policy", () => {
  it("attributes an observer entry to the frame interval that contains its start time", () => {
    const frames = [
      { at: 20, duration: 10, phase: "active-gameplay", segmentId: "first", worldId: "world-1" },
      { at: 30, duration: 10, phase: "story-scene", segmentId: "second", worldId: "world-2" }
    ];

    expect(contextForTimelineEntry(frames, 25, null)).toEqual({
      phase: "story-scene", segmentId: "second", worldId: "world-2"
    });
  });

  it("selects sampled Canvas effects when they dominate the red WebKit profile", () => {
    const result = assessFullStoryRuntimeProfile(
      evidence("local-dist-vercel"),
      evidence("https://game.amso.pl/")
    );

    expect(result).toMatchObject({
      eligible: true,
      reasons: [],
      primaryCandidate: {
        id: "canvas-effects",
        expectedMetric: "active WebKit p95 and frames over 33 ms"
      }
    });
    expect(result.rankedCandidates[0]).toMatchObject({ id: "canvas-effects" });
    expect(result.rankedCandidates[0]?.evidence).toContain("shadowed paint");
  });

  it("prefers compositor and paint evidence when Canvas timing is small", () => {
    const runtimeProfile = {
      ...evidence("local-dist-vercel").performance.runtimeProfile,
      canvas: {
        support: "instrumented",
        totals: { calls: 500, durationMs: 10, shadowedPaintCalls: 0,
          shadowedPaintDurationMs: 0, gradientAllocations: 0 },
        bySegment: {},
        byWorld: {}
      },
      rendering: {
        support: "long-animation-frame",
        entries: 14,
        totalRenderDurationMs: 840,
        totalStyleAndLayoutDurationMs: 500,
        activeEntries: 14,
        activeRenderDurationMs: 840,
        activeStyleAndLayoutDurationMs: 500,
        bySegment: { "epoch_4.order_scale": { entries: 8, renderDurationMs: 520,
          styleAndLayoutDurationMs: 360 } },
        byWorld: { "scale-logistics": { entries: 8, renderDurationMs: 520,
          styleAndLayoutDurationMs: 360 } }
      }
    };
    const local = evidence("local-dist-vercel", {
      performance: { ...evidence("local-dist-vercel").performance, runtimeProfile }
    });
    const production = evidence("https://game.amso.pl/", {
      performance: { ...evidence("https://game.amso.pl/").performance, runtimeProfile }
    });

    expect(assessFullStoryRuntimeProfile(local, production).primaryCandidate)
      .toMatchObject({ id: "compositor-paint" });
  });

  it("does not invent a runtime optimization when cadence explains the profile", () => {
    const runtimeProfile = {
      ...evidence("local-dist-vercel").performance.runtimeProfile,
      canvas: {
        support: "instrumented",
        totals: { calls: 20, durationMs: 1, shadowedPaintCalls: 0,
          shadowedPaintDurationMs: 0, gradientAllocations: 0 },
        bySegment: {},
        byWorld: {}
      },
      rendering: { support: "unsupported", entries: 0, totalRenderDurationMs: 0,
        totalStyleAndLayoutDurationMs: 0, activeEntries: 0, activeRenderDurationMs: 0,
        activeStyleAndLayoutDurationMs: 0, bySegment: {}, byWorld: {} }
    };
    const profileEvidence = (target: "local-dist-vercel" | "https://game.amso.pl/") => {
      const base = evidence(target);
      return { ...base, performance: { ...base.performance, p95Ms: 18.2,
        emptyRafBaseline: { diagnosticOnly: true, sampleCount: 120, p50Ms: 17, p95Ms: 18,
          p99Ms: 19, maxMs: 20, over33Ms: 0 }, runtimeProfile } };
    };

    expect(assessFullStoryRuntimeProfile(
      profileEvidence("local-dist-vercel"),
      profileEvidence("https://game.amso.pl/")
    )).toMatchObject({ eligible: true, primaryCandidate: null, diagnosis: "cadence-limited" });
  });

  it("does not mix cadence baselines across local and production runs", () => {
    const quietProfile = {
      ...evidence("local-dist-vercel").performance.runtimeProfile,
      canvas: { support: "instrumented", totals: { calls: 0, durationMs: 0,
        shadowedPaintCalls: 0, shadowedPaintDurationMs: 0, gradientAllocations: 0 },
        bySegment: {}, byWorld: {} },
      rendering: { support: "unsupported", entries: 0, totalRenderDurationMs: 0,
        totalStyleAndLayoutDurationMs: 0, activeEntries: 0, activeRenderDurationMs: 0,
        activeStyleAndLayoutDurationMs: 0, bySegment: {}, byWorld: {} }
    };
    const withCadence = (target: "local-dist-vercel" | "https://game.amso.pl/",
      activeP95Ms: number, emptyP95Ms: number) => {
      const base = evidence(target);
      return { ...base, performance: { ...base.performance, p95Ms: activeP95Ms,
        emptyRafBaseline: { ...base.performance.emptyRafBaseline, p95Ms: emptyP95Ms },
        runtimeProfile: quietProfile } };
    };

    expect(assessFullStoryRuntimeProfile(
      withCadence("local-dist-vercel", 18.6, 17.5),
      withCadence("https://game.amso.pl/", 18.5, 18.4)
    )).toMatchObject({ eligible: true, primaryCandidate: null, diagnosis: "inconclusive",
      cadence: { runs: { local: { residualMs: 1.1 }, production: { residualMs: 0.1 } } } });
  });

  it("does not rank story-only rendering work as an active gameplay hot path", () => {
    const base = evidence("local-dist-vercel");
    const storyOnlyProfile = { ...base.performance.runtimeProfile,
      canvas: { support: "instrumented", totals: { calls: 0, durationMs: 0,
        shadowedPaintCalls: 0, shadowedPaintDurationMs: 0, gradientAllocations: 0 },
        bySegment: {}, byWorld: {} },
      rendering: { support: "long-animation-frame", entries: 20, totalRenderDurationMs: 1_000,
        totalStyleAndLayoutDurationMs: 500, activeEntries: 0, activeRenderDurationMs: 0,
        activeStyleAndLayoutDurationMs: 0, bySegment: {}, byWorld: {} } };
    const withProfile = (target: "local-dist-vercel" | "https://game.amso.pl/") => {
      const run = evidence(target);
      return { ...run, performance: { ...run.performance, runtimeProfile: storyOnlyProfile } };
    };

    expect(assessFullStoryRuntimeProfile(withProfile("local-dist-vercel"),
      withProfile("https://game.amso.pl/"))).toMatchObject({
      eligible: true, primaryCandidate: null, diagnosis: "inconclusive"
    });
  });

  it("rejects incomplete or mismatched local and production evidence", () => {
    const production = evidence("https://game.amso.pl/", {
      provenance: { ...evidence("https://game.amso.pl/").provenance,
        sourceIdentity: "c".repeat(64) }
    });
    const result = assessFullStoryRuntimeProfile(evidence("local-dist-vercel"), production);

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("profile-source-identity-mismatch");
    expect(result.primaryCandidate).toBeNull();
  });

  it("publishes the ranked production profile through the CLI seam", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "amso-runtime-profile-"));
    const localPath = path.join(directory, "local.json");
    const productionPath = path.join(directory, "production.json");
    const outputPath = path.join(directory, "profile.json");
    writeFileSync(localPath, JSON.stringify(evidence("local-dist-vercel")));
    writeFileSync(productionPath, JSON.stringify(evidence("https://game.amso.pl/")));

    execFileSync("node", ["scripts/profile-full-story-runtime.mjs", "--local", localPath,
      "--production", productionPath, "--output", outputPath], { cwd: process.cwd() });

    expect(JSON.parse(readFileSync(outputPath, "utf8"))).toMatchObject({
      schema: "amso-full-story-runtime-profile-report-v1",
      status: "candidate-selected",
      primaryCandidate: { id: "canvas-effects" }
    });
  });
});
