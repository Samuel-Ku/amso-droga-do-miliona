import { describe, expect, it, vi } from "vitest";
import { parseQaBootConfig, QaBootConfigError } from "../src/qa/boot-config";
import { GameplayInputQueue } from "../src/game/input-queue";
import { FrameWindowTelemetry } from "../src/performance/frame-window-telemetry";
import { VisualQualityCoordinator } from "../src/performance/visual-quality-coordinator";
import { resolveVisualPolicy } from "../src/performance/visual-policy";
import { compareSemanticState, exactDeterminismArtifact } from "../src/qa/determinism";
import {
  PERFORMANCE_REFERENCE_V1,
  WORLD_SEAM_PERFORMANCE_V1,
  performanceScenario,
  validateScenarioRun
} from "../src/qa/performance-reference-v1";
import { DecodedImageStore } from "../src/assets/DecodedImageStore";
import { evaluatePerformanceReleaseGate } from "../src/qa/release-gate";
import { validateVisualFixture, visualBaselineKey, type VisualRegressionFixture } from "../src/qa/visual-regression";

describe("performance contracts", () => {
  it("strictly parses an ephemeral performance URL", () => {
    const result = parseQaBootConfig(new URL("https://example.test/?qa=performance&scenario=performance-reference-v1&quality=force-full&motion=system&audio=enabled&dpr=2"));
    expect(result).toEqual({
      kind: "performance",
      config: {
        mode: "performance",
        scenarioId: "performance-reference-v1",
        quality: "force-full",
        motion: "system",
        audio: "enabled",
        dpr: 2
      }
    });
  });

  it("strictly parses the bounded all-world seam scenario", () => {
    const result = parseQaBootConfig(new URL("https://example.test/?qa=performance&scenario=world-seam-performance-v1&quality=force-full&motion=system&audio=disabled&dpr=1"));
    expect(result.kind).toBe("performance");
    if (result.kind !== "performance") return;
    expect(result.config.scenarioId).toBe("world-seam-performance-v1");
    expect(performanceScenario(result.config.scenarioId)).toBe(WORLD_SEAM_PERFORMANCE_V1);
    expect(WORLD_SEAM_PERFORMANCE_V1.challengeWorldDurationSeconds).toBeLessThanOrEqual(7);
    expect(WORLD_SEAM_PERFORMANCE_V1.requiredCoverage).toContainEqual({
      type: "world-change",
      minCount: 8
    });
  });

  it("fails closed when performance parameters are invalid", () => {
    expect(() => parseQaBootConfig(new URL("https://example.test/?qa=performance&scenario=performance-reference-v1&quality=low&motion=system&audio=enabled&dpr=3")))
      .toThrow(QaBootConfigError);
    expect(() => parseQaBootConfig(new URL("https://example.test/?qa=performnce")))
      .toThrow(QaBootConfigError);
    expect(parseQaBootConfig(new URL("https://example.test/?quality=force-full")))
      .toEqual({ kind: "production" });
  });

  it("queues step-indexed inputs without overwriting and gives jump priority", () => {
    const queue = new GameplayInputQueue(4);
    expect(queue.push(0, "crouch", true, "keyboard")).toBe(true);
    expect(queue.push(0, "jump", true, "keyboard")).toBe(true);
    const input = queue.consume(0);
    expect(input.jumpPressed).toBe(true);
    expect(input.crouchHeld).toBe(true);
    expect(input.appliedCrouch).toBe(false);
    expect(queue.count).toBe(0);
  });

  it("rejects the newest event on queue overflow", () => {
    const queue = new GameplayInputQueue(2);
    expect(queue.push(0, "jump", true, "keyboard")).toBe(true);
    expect(queue.push(0, "crouch", true, "keyboard")).toBe(true);
    expect(queue.push(0, "crouch", false, "keyboard")).toBe(false);
    expect(queue.overflowed).toBe(true);
    expect(queue.droppedEvents).toBe(1);
  });

  it("uses conservative frame histogram percentiles", () => {
    const telemetry = new FrameWindowTelemetry();
    for (let index = 0; index < 29; index += 1) telemetry.observe(17.99);
    telemetry.observe(18.01);
    const summary = telemetry.closeWindow();
    expect(summary.classification).toBe("stable");
    expect(summary.p95FrameTimeMs).toBe(18);
    expect(summary.maxFrameTimeMs).toBe(18.01);
  });

  it("requires two slow windows and commits only at a safe boundary", () => {
    const quality = new VisualQualityCoordinator("full");
    quality.observe({ classification: "slow", sampledDurationMs: 2_000 }, 10, 2);
    quality.observe({ classification: "slow", sampledDurationMs: 2_000 }, 20, 4);
    expect(quality.snapshot.pending?.target).toBe("reduced");
    expect(quality.tryCommit({ panelBoundarySafe: true, assetSwapComplete: true, celebrationActive: true, cutsceneOverlayActive: false }, 21, 5)).toBe(false);
    expect(quality.tryCommit({ panelBoundarySafe: true, assetSwapComplete: true, celebrationActive: false, cutsceneOverlayActive: false }, 22, 6)).toBe(true);
    expect(quality.snapshot.committed).toBe("reduced");
  });

  it("resolves motion and quality as independent axes", () => {
    const policy = resolveVisualPolicy("reduced-motion", "full");
    expect(policy.allowScreenShake).toBe(false);
    expect(policy.particleBudget).toBeGreaterThan(resolveVisualPolicy("reduced-motion", "reduced").particleBudget);
  });

  it("creates stable exact artifacts and explainable semantic diffs", () => {
    const left = { simulationStep: 3, score: 10, runner: { x: 1, velocityY: 2 }, rngState: [1, 2] };
    expect(exactDeterminismArtifact(left)).toEqual(exactDeterminismArtifact({ ...left }));
    const result = compareSemanticState(left, { ...left, runner: { x: 1.00005, velocityY: 2 } });
    expect(result.semanticMatch).toBe(true);
    expect(compareSemanticState(left, { ...left, score: 11 }).semanticMatch).toBe(false);
  });

  it("ships a versioned 60-second production-path manifest", () => {
    expect(PERFORMANCE_REFERENCE_V1.durationSteps).toBe(7200);
    expect(PERFORMANCE_REFERENCE_V1.inputs.length).toBeGreaterThan(0);
    expect(PERFORMANCE_REFERENCE_V1.requiredCoverage.map(({ type }) => type)).toContain("world-change");
    expect(PERFORMANCE_REFERENCE_V1.inputs).toEqual([...PERFORMANCE_REFERENCE_V1.inputs]
      .sort((left, right) => left.stepIndex - right.stepIndex || left.sequence - right.sequence));
  });

  it("does not auto-approve a missing scenario digest", () => {
    const coverage = Object.fromEntries(PERFORMANCE_REFERENCE_V1.requiredCoverage.map((requirement) => [
      requirement.type === "power-up" ? `power-up:${requirement.id}` : requirement.type,
      "minCount" in requirement ? requirement.minCount : requirement.minDurationSteps
    ]));
    const result = validateScenarioRun(PERFORMANCE_REFERENCE_V1, {
      completedThroughStep: 7199,
      checkpointResults: [{ completedThroughStep: -1, passed: true }],
      coverage,
      finalDigest: "fnv1a32:12345678",
      expectedFinalDigest: null,
      inputQueueOverflows: 0
    });
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain("expected-digest-unapproved");
  });

  it("records quality request, cancellation and commit diagnostics", () => {
    const quality = new VisualQualityCoordinator("full");
    quality.observe({ classification: "slow", sampledDurationMs: 2_000 }, 1, 1);
    quality.observe({ classification: "slow", sampledDurationMs: 2_000 }, 2, 2);
    quality.observe({ classification: "stable", sampledDurationMs: 15_000 }, 3, 3);
    expect(quality.diagnostics.map(({ type }) => type)).toEqual([
      "quality-requested", "quality-request-cancelled"
    ]);
    quality.observe({ classification: "slow", sampledDurationMs: 2_000 }, 4, 4);
    quality.observe({ classification: "slow", sampledDurationMs: 2_000 }, 5, 5);
    expect(quality.tryCommit({
      panelBoundarySafe: true,
      assetSwapComplete: true,
      celebrationActive: false,
      cutsceneOverlayActive: false
    }, 6, 6)).toBe(true);
    expect(quality.diagnostics.at(-1)?.type).toBe("quality-committed");
  });

  it("validates protected visual regions and configuration-specific baseline keys", () => {
    const fixture: VisualRegressionFixture = {
      id: "shield",
      completedThroughStep: 100,
      interpolationAlpha: 0.5,
      viewport: { width: 960, height: 540 },
      effectiveDpr: 2,
      motionPreference: "reduced-motion",
      qualityLevel: "reduced",
      protectedRegions: [{
        id: "runner-shield", rect: { x: 0, y: 0, width: 100, height: 100 },
        requiredElements: ["runner", "shield"]
      }]
    };
    expect(visualBaselineKey(fixture, "chrome-127-linux")).toContain("alpha-0.5");
    expect(validateVisualFixture(fixture, {
      presentElements: ["runner"], semanticOcclusionViolations: [], panelCanvasSynchronized: true
    })).toMatchObject({ passed: false, reasons: ["missing:runner-shield:shield"] });
  });

  it("reserves image nodes before active loading and reuses them", async () => {
    const images: HTMLImageElement[] = [];
    const store = new DecodedImageStore({ imageFactory: () => {
      const image = {
        dataset: {}, decoding: "auto", src: "", complete: true, naturalWidth: 1780,
        onload: null, onerror: null, decode: vi.fn().mockResolvedValue(undefined)
      } as unknown as HTMLImageElement;
      images.push(image);
      return image;
    } });
    store.reserve("world-a", "/world-a.webp");
    expect(images).toHaveLength(1);
    await store.load("world-a", "/world-a.webp");
    expect(images).toHaveLength(1);
  });

  it("deduplicates the canonical image decode promise", async () => {
    const decode = vi.fn(async () => undefined);
    const image = { decode, decoding: "auto", src: "", complete: true, naturalWidth: 10, onload: null, onerror: null } as unknown as HTMLImageElement;
    const store = new DecodedImageStore({ imageFactory: () => image });
    const first = store.load("runner", "/runner.webp");
    const second = store.load("runner", "/runner.webp");
    expect(first).toBe(second);
    await first;
    expect(decode).toHaveBeenCalledOnce();
  });

  it("waits for Safari-style late image readiness after decode resolves", async () => {
    let complete = false;
    let naturalWidth = 0;
    const image = Object.assign(new EventTarget(), {
      decoding: "auto",
      src: "",
      decode: vi.fn(async () => undefined),
      onload: null,
      onerror: null
    }) as unknown as HTMLImageElement;
    Object.defineProperty(image, "complete", { configurable: true, get: () => complete });
    Object.defineProperty(image, "naturalWidth", { configurable: true, get: () => naturalWidth });
    const store = new DecodedImageStore({ imageFactory: () => image, maxAttempts: 1 });
    const pending = store.load("parcel", "/parcel.webp");
    let settled = false;
    void pending.finally(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    complete = true;
    naturalWidth = 256;
    image.dispatchEvent(new Event("load"));
    await expect(pending).resolves.toMatchObject({ assetId: "parcel", image });
  });

  it("keeps final sign-off incomplete without the physical minimum profile", () => {
    expect(evaluatePerformanceReleaseGate({
      checkpointsPassed: true,
      digestPassed: true,
      inputQueueOverflows: 0,
      requiredCoveragePassed: true,
      reportMetadataComplete: true,
      minimumProfileDeviceAvailable: false
    })).toMatchObject({ status: "incomplete" });
    expect(evaluatePerformanceReleaseGate({
      checkpointsPassed: true,
      digestPassed: true,
      inputQueueOverflows: 0,
      requiredCoveragePassed: true,
      reportMetadataComplete: true,
      minimumProfileDeviceAvailable: false
    }).reasons).toContain("minimum-profile-device-unavailable");
  });

  it("passes the integrated gate only with every automated and physical evidence field", () => {
    expect(evaluatePerformanceReleaseGate({
      checkpointsPassed: true,
      digestPassed: true,
      inputQueueOverflows: 0,
      requiredCoveragePassed: true,
      reportMetadataComplete: true,
      minimumProfileDeviceAvailable: true,
      configurationPassed: true,
      consoleErrorCount: 0,
      vercelDeploymentPassed: true,
      visualRegressionPassed: true,
      coldStartPassed: true,
      worldTransitionsPassed: true,
      onePlusReportPassed: true,
      nokiaReportPassed: true,
      iphoneSafariReportPassed: true,
      minimumProfileReportPassed: true,
      androidMemoryMb: 210,
      androidCycleGrowthMb: 8
    })).toEqual({ status: "pass", reasons: [] });
  });
});
