import { describe, expect, it } from "vitest";
import {
  aggregateRuntimeReadiness,
  artifactFingerprint,
  assessSixtySecondEvidence,
  buildFourCycleQualification
} from "../scripts/runtime-readiness-policy.mjs";
import { REQUIRED_WORLD_SEAM_DESTINATIONS } from "../scripts/performance-transition-policy.mjs";

const assetIdentities = [
  { url: "https://game.amso.pl/assets/app.js", status: 200, bytes: 10, sha256: "a".repeat(64) },
  { url: "https://game.amso.pl/assets/app.css", status: 200, bytes: 10, sha256: "b".repeat(64) },
  ...Array.from({ length: 7 }, (_, index) => ({
    url: `https://game.amso.pl/assets/milion-runner/worlds/world-0${index + 1}.webp`,
    status: 200,
    bytes: 10,
    sha256: String(index + 1).repeat(64)
  }))
];

const provenance = {
  sourceIdentity: "c".repeat(64), htmlSha256: "d".repeat(64), assetIdentities,
  finalUrl: "https://game.amso.pl/?qa=performance", server: "Vercel", vercelId: "arn1::test"
};
const successfulCaptures = ["sixtySecond", "coldStart", "fourCycle"].map((name) => ({
  name, status: 0, signal: null, freshOutput: true, error: null
}));

function sixtySecondEvidence() {
  return {
    schema: "amso-performance-run-v1",
    capturedAt: new Date().toISOString(),
    provenance,
    capturePassed: true,
    configuration: { scenarioId: "performance-reference-v1" },
    frames: { sampleCount: 3_500, p95Ms: 18, p99Ms: 30, maxMs: 90, over100Ms: 0 },
    scenario: { checkpointsPassed: true, coveragePassed: true, digestPassed: true,
      replayValid: true, inputQueueOverflows: 0, session: { durationSeconds: 60 } },
    panelTransitions: [
      { worldId: "order-process", presentationReady: true, hidden: false },
      { worldId: "quality-service", presentationReady: true, hidden: false }
    ],
    diagnostics: { consoleErrors: [], externalRequests: [], failedResponses: [] },
    dom: { activeImageNodesAdded: 0, activeImageNodesCreated: 0 },
    decodeTimings: []
  };
}

function fourCycleRun() {
  const transitions = Array.from({ length: 4 }, (_, cycleIndex) =>
    REQUIRED_WORLD_SEAM_DESTINATIONS.map((worldId, destinationIndex) => ({
      worldId,
      atMs: 1_000 + (cycleIndex * 7 + destinationIndex) * 2_000,
      presentationReady: true,
      hidden: false,
      visual: { covered: true, panelContinuityResidualPx: 0.1, renderedPixelTolerancePx: 1 }
    }))).flat();
  return {
    schema: "amso-performance-run-v1",
    capturedAt: new Date().toISOString(),
    provenance,
    configuration: { scenarioId: "four-cycle-memory-v1", requestedCycles: 4 },
    cycleResults: Array.from({ length: 4 }, (_, index) => ({
      index: index + 1,
      startedAtMs: index * 60_000,
      completedAtMs: (index + 1) * 60_000,
      scenarioValidation: { passed: true },
      finalDigest: "fnv1a32:842f4bbe"
    })),
    capturePassed: true,
    frames: { sampleCount: 3_500, p95Ms: 18, p99Ms: 30, maxMs: 90, over100Ms: 0 },
    frameTimeline: Array.from({ length: 4 }, (_, cycleIndex) =>
      Array.from({ length: 120 }, (_, frameIndex) => ({
        atMs: cycleIndex * 60_000 + frameIndex * 500,
        intervalMs: 8 + cycleIndex * 0.1
      }))).flat(),
    panelTransitions: transitions,
    decodeTimings: REQUIRED_WORLD_SEAM_DESTINATIONS.flatMap((worldId, index) => [
      { source: `/world-${index + 1}.webp`, worldId, panel: null, panelRole: "asset",
        active: false, status: "fulfilled" },
      { source: `/world-${index + 1}.webp`, worldId, panel: "staged", panelRole: "staged",
        active: false, status: "fulfilled" }
    ]),
    dom: { activeImageNodesAdded: 0, activeImageNodesCreated: 0 },
    diagnostics: { consoleErrors: [], externalRequests: [], failedResponses: [] },
    memory: {
      available: false,
      reason: "physical-device-process-memory-required",
      timeline: transitions.map((transition, index) => ({ atMs: transition.atMs, usedJsHeapSize: 100_000_000 + index * 100_000 }))
    },
    lifecycleChecks: { visibilityResumePassed: true, resizePassed: true,
      orientationPassed: true, fullscreenPassed: true },
    lifecycleObservations: {
      visibility: [{ hidden: true }, { hidden: false }],
      orientation: [{ portrait: true }, { portrait: false }],
      fullscreen: [{ entered: true }, { entered: false }]
    }
  };
}

describe("runtime readiness policy", () => {
  it("accepts the approved complete 60-second workload at the public evidence seam", () => {
    expect(assessSixtySecondEvidence(sixtySecondEvidence(), provenance)).toEqual([]);
  });

  it("compares only the contracted HTML, JS/CSS and seven world assets", () => {
    const withRouteSpecificAsset = {
      ...provenance,
      assetIdentities: [...provenance.assetIdentities, {
        url: "https://game.amso.pl/assets/milion-runner/orders/parcel-01.webp",
        status: 200,
        bytes: 10,
        sha256: "f".repeat(64)
      }]
    };
    expect(artifactFingerprint(withRouteSpecificAsset)).toBe(artifactFingerprint(provenance));
  });

  it("rejects malformed source and HTML identities", () => {
    expect(artifactFingerprint({ ...provenance, sourceIdentity: "" })).toBeNull();
    expect(artifactFingerprint({ ...provenance, htmlSha256: "not-a-sha256" })).toBeNull();
  });

  it("requires one contracted asset for each world number from 01 through 07", () => {
    const repeatedWorldOne = {
      ...provenance,
      assetIdentities: [
        ...assetIdentities.filter(({ url }) => !url.includes("/worlds/")),
        ...Array.from({ length: 7 }, (_, index) => ({
          url: `https://game.amso.pl/assets/milion-runner/worlds/world-01-variant-${index}.webp`,
          status: 200,
          bytes: 10,
          sha256: String(index + 1).repeat(64)
        }))
      ]
    };
    expect(artifactFingerprint(repeatedWorldOne)).toBeNull();
  });

  it("requires four ordered seven-world cycles and rejects a missing 7 to 1 destination", () => {
    const qualified = buildFourCycleQualification(fourCycleRun(), provenance);
    expect(qualified.cycles).toHaveLength(4);
    expect(qualified.releaseGate).toMatchObject({ status: "incomplete",
      reasons: ["physical-process-memory-evidence-unavailable"] });

    const shortened = fourCycleRun();
    shortened.panelTransitions.splice(6, 1);
    expect(buildFourCycleQualification(shortened, provenance).releaseGate.reasons)
      .toContain("four-cycle-route-incomplete");
  });

  it("fails repeated world decode and hot-path image allocations", () => {
    const run = fourCycleRun();
    run.decodeTimings.push({ ...run.decodeTimings[1]! });
    run.dom.activeImageNodesCreated = 1;
    expect(buildFourCycleQualification(run, provenance).releaseGate.reasons).toEqual(
      expect.arrayContaining(["four-cycle-repeated-decode", "four-cycle-active-image-node"]));
  });

  it("requires observed lifecycle state transitions, not geometry-only booleans", () => {
    const run = fourCycleRun();
    run.lifecycleObservations.fullscreen = [];
    expect(buildFourCycleQualification(run, provenance).releaseGate).toMatchObject({
      status: "incomplete",
      reasons: expect.arrayContaining(["four-cycle-lifecycle-observation-incomplete:fullscreen"])
    });
  });

  it("fails a lifecycle check that was observed but did not preserve geometry", () => {
    const run = fourCycleRun();
    run.lifecycleChecks.fullscreenPassed = false;
    expect(buildFourCycleQualification(run, provenance).releaseGate).toMatchObject({
      status: "failed",
      reasons: expect.arrayContaining(["four-cycle-lifecycle-failed:fullscreenPassed"])
    });
  });

  it("allows the one asset and first presentation decode per source and role", () => {
    expect(buildFourCycleQualification(fourCycleRun(), provenance).repeatedDecodeCount).toBe(0);
  });

  it("rejects a later cycle whose local frame distribution regresses", () => {
    const run = fourCycleRun();
    run.frameTimeline = run.frameTimeline.map((frame) => frame.atMs >= 180_000
      ? { ...frame, intervalMs: 40 }
      : frame);
    expect(buildFourCycleQualification(run, provenance).releaseGate.reasons)
      .toEqual(expect.arrayContaining([
        "four-cycle-frame-budget-invalid:4",
        "four-cycle-frame-trend-regressed:4"
      ]));
  });

  it("fails closed on stale identities and missing qualification evidence", () => {
    const stale = sixtySecondEvidence();
    stale.provenance = { ...provenance, htmlSha256: "e".repeat(64) };
    expect(assessSixtySecondEvidence(stale, provenance)).toContain("sixty-second-artifact-mismatch");
    expect(aggregateRuntimeReadiness({
      expectedProvenance: provenance,
      sixtySecond: sixtySecondEvidence(),
      coldStart: null,
      fourCycle: buildFourCycleQualification(fourCycleRun(), provenance),
      captureProcesses: successfulCaptures
    })).toMatchObject({ status: "incomplete" });
  });

  it("surfaces an unavailable physical-memory measurement as incomplete", () => {
    const result = aggregateRuntimeReadiness({
      expectedProvenance: provenance,
      sixtySecond: sixtySecondEvidence(),
      coldStart: {
        schema: "amso-cold-start-qualification-v1",
        capturedAt: new Date().toISOString(),
        provenance,
        comparable: true,
        releaseGate: { status: "pass", reasons: [] },
        automatedChecks: {
          captureProcessesPassed: true,
          startBudgetsPassed: true,
          startupDecodeOrderPassed: true,
          sequentialWarmupPassed: true,
          audioGestureLifecyclePassed: true,
          diagnosticsPassed: true
        }
      },
      fourCycle: buildFourCycleQualification(fourCycleRun(), provenance),
      captureProcesses: successfulCaptures
    });
    expect(result).toMatchObject({
      status: "incomplete",
      gates: { fourCycle: ["physical-process-memory-evidence-unavailable"] }
    });
  });

  it("rejects a cold-start report whose cross-profile comparison failed", () => {
    const result = aggregateRuntimeReadiness({
      expectedProvenance: provenance,
      sixtySecond: sixtySecondEvidence(),
      coldStart: {
        schema: "amso-cold-start-qualification-v1",
        capturedAt: new Date().toISOString(),
        provenance,
        comparable: false,
        releaseGate: { status: "fail", reasons: ["qualification-identity-incomplete-or-mismatched"] },
        automatedChecks: {
          captureProcessesPassed: true,
          startBudgetsPassed: true,
          startupDecodeOrderPassed: true,
          sequentialWarmupPassed: true,
          audioGestureLifecyclePassed: true,
          diagnosticsPassed: true
        }
      },
      fourCycle: buildFourCycleQualification(fourCycleRun(), provenance),
      captureProcesses: successfulCaptures
    });
    expect(result.status).toBe("failed");
    expect(result.gates.coldStart).toContain("cold-start-comparison-invalid");
  });

  it("fails when a capture process exits nonzero even if it wrote fresh JSON", () => {
    const result = aggregateRuntimeReadiness({
      expectedProvenance: provenance,
      sixtySecond: sixtySecondEvidence(),
      coldStart: null,
      fourCycle: buildFourCycleQualification(fourCycleRun(), provenance),
      captureProcesses: successfulCaptures.map((capture) => capture.name === "fourCycle"
        ? { ...capture, status: 1 }
        : capture)
    });
    expect(result.status).toBe("failed");
    expect(result.gates.captureProcesses).toContain("capture-process-failed:fourCycle");
  });
});
