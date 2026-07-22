import { describe, expect, it, vi } from "vitest";
import { parseQaBootConfig, QaBootConfigError } from "../src/qa/boot-config";
import { GameplayInputQueue } from "../src/game/input-queue";
import { FrameWindowTelemetry } from "../src/performance/frame-window-telemetry";
import { VisualQualityCoordinator } from "../src/performance/visual-quality-coordinator";
import { resolveVisualPolicy } from "../src/performance/visual-policy";
import { compareSemanticState, exactDeterminismArtifact } from "../src/qa/determinism";
import { PERFORMANCE_REFERENCE_V1 } from "../src/qa/performance-reference-v1";
import { DecodedImageStore } from "../src/assets/DecodedImageStore";
import { evaluatePerformanceReleaseGate } from "../src/qa/release-gate";

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

  it("fails closed when performance parameters are invalid", () => {
    expect(() => parseQaBootConfig(new URL("https://example.test/?qa=performance&scenario=performance-reference-v1&quality=low&motion=system&audio=enabled&dpr=3")))
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

  it("keeps final sign-off incomplete without the physical minimum profile", () => {
    expect(evaluatePerformanceReleaseGate({
      checkpointsPassed: true,
      digestPassed: true,
      inputQueueOverflows: 0,
      requiredCoveragePassed: true,
      reportMetadataComplete: true,
      minimumProfileDeviceAvailable: false
    })).toMatchObject({ status: "incomplete", reasons: ["minimum-profile-device-unavailable"] });
  });
});
