import { describe, expect, it } from "vitest";
import {
  assessWorldSeamPerformanceEvidence,
  WORLD_SEAM_DESTINATIONS,
  sameWorldSeamScenarioConfiguration
} from "../scripts/world-seam-performance-policy.mjs";

function evidence(engine = "chromium", target = { kind: "vercel-build", value: "dist-vercel" }) {
  const transitionWindows = WORLD_SEAM_DESTINATIONS.map((worldId, index) => ({
    worldId, atMs: index * 1_000, frameCount: 100,
    framesOver33Ms: 0, activeDecodeStarts: 0
  }));
  return {
    schema: "amso-performance-run-v1",
    capturePassed: true,
    target,
    artifact: { bytes: 2_000, sha256: "abc" },
    configuration: {
      scenarioId: "world-seam-performance-v1", scenarioConfigVersion: 1,
      seed: 424242, inputTraceDigest: "trace", challengeWorldDurationSeconds: 7,
      viewport: { width: 960, height: 540 }, dpr: 1, quality: "force-full",
      motion: "system", audioMode: "disabled"
    },
    environment: { browser: { engine } },
    frames: { sampleCount: 7_000, over33Ms: 0 },
    visualMotion: { sampleCount: 6_000, minVelocityRatio: 0.999, maxVelocityRatio: 1.001 },
    deployment: target.kind === "url" ? {
      finalUrl: target.value, server: "Vercel", vercelId: "arn1::qualification",
      provenancePassed: true
    } : { provenancePassed: true },
    transitionWindows,
    panelTransitions: transitionWindows.map(({ worldId, atMs }) => ({
      worldId, atMs, visual: {
        covered: true, phaseJumpPx: 0.2, tolerancePx: 1,
        panelContinuityResidualPx: 0.4, renderedPixelTolerancePx: 1
      }
    })),
    dom: { activeImageNodesAdded: 0, activeImageNodesCreated: 0 },
    diagnostics: { consoleErrors: [], externalRequests: [], failedResponses: [] },
    scenario: {
      checkpointsPassed: true, coveragePassed: true, digestPassed: true,
      replayValid: true, inputQueueOverflows: 0
    }
  };
}

describe("world seam performance release policy", () => {
  it("accepts a complete seven-transition browser qualification", () => {
    const qualified = evidence();
    qualified.frames.over33Ms = 3;
    expect(assessWorldSeamPerformanceEvidence(qualified, {
      engine: "chromium", targetKind: "vercel-build", targetValue: "dist-vercel"
    })).toEqual([]);
  });

  it("rejects a decode or dropped frame in a transition window", () => {
    const failed = evidence();
    failed.transitionWindows[6]!.activeDecodeStarts = 1;
    failed.transitionWindows[2]!.framesOver33Ms = 1;
    expect(assessWorldSeamPerformanceEvidence(failed, {
      engine: "chromium", targetKind: "vercel-build", targetValue: "dist-vercel"
    })).toEqual(expect.arrayContaining([
      "client-paths:frame-over-33ms", "first-mile:active-decode-start"
    ]));
  });

  it("rejects blank coverage, phase jumps, visual slowdown, and detached image allocation", () => {
    const failed = evidence();
    failed.panelTransitions[0]!.visual.covered = false;
    failed.panelTransitions[1]!.visual.phaseJumpPx = 2;
    failed.panelTransitions[2]!.visual.panelContinuityResidualPx = 1.1;
    failed.visualMotion.minVelocityRatio = 0.1;
    failed.dom.activeImageNodesCreated = 1;
    expect(assessWorldSeamPerformanceEvidence(failed, {
      engine: "chromium", targetKind: "vercel-build", targetValue: "dist-vercel"
    })).toEqual(expect.arrayContaining([
      "order-process:blank-frame-risk", "quality-service:phase-jump",
      "client-paths:panel-continuity-over-one-rendered-pixel",
      "visual-motion-outside-0.95-1.05",
      "active-image-node-created"
    ]));
  });

  it("requires production provenance and an identical scenario configuration", () => {
    const local = evidence();
    const production = evidence("webkit", {
      kind: "url", value: "https://game.amso.pl/"
    });
    expect(assessWorldSeamPerformanceEvidence(production, {
      engine: "webkit", targetKind: "url", targetValue: "https://game.amso.pl/"
    })).toEqual([]);
    expect(sameWorldSeamScenarioConfiguration(local, production)).toBe(true);
    production.deployment.server = "nginx";
    expect(assessWorldSeamPerformanceEvidence(production, {
      engine: "webkit", targetKind: "url", targetValue: "https://game.amso.pl/"
    })).toContain("vercel-deployment-provenance-failed");
    production.deployment.server = "Vercel";
    production.configuration.seed += 1;
    expect(sameWorldSeamScenarioConfiguration(local, production)).toBe(false);
  });
});
