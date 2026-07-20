import { describe, expect, it } from "vitest";
import {
  SHIELD_APPEAR_SECONDS,
  SHIELD_BREAK_SECONDS,
  courierProtectionPresentation,
  courierShieldAnimation,
  runnerStrideCyclesPerSecond
} from "../src/game/courier-presentation";
import { createRunnerModel } from "../src/game/physics";
import { readFileSync } from "node:fs";

describe("courier presentation", () => {
  it("keeps the running gait between twelve and fifteen cycles per second", () => {
    expect(runnerStrideCyclesPerSecond(280)).toBe(12);
    expect(runnerStrideCyclesPerSecond(630)).toBeCloseTo(13.5, 1);
    expect(runnerStrideCyclesPerSecond(980)).toBe(15);
    expect(runnerStrideCyclesPerSecond(2_000)).toBe(15);
  });

  it("shows one energy bubble only while protection is active", () => {
    const runner = createRunnerModel();
    expect(courierProtectionPresentation(runner, null)).toBeNull();

    const warranty = courierProtectionPresentation(runner, "warranty");
    const start = courierProtectionPresentation(runner, "start");
    expect(warranty).toMatchObject({ breaking: false });
    expect(start).toMatchObject({ breaking: false });
    expect(warranty!.radiusY).toBeGreaterThan(warranty!.radiusX);
  });

  it("keeps the same large bubble while sliding and marks an absorbed impact", () => {
    const standing = courierProtectionPresentation(createRunnerModel(), "warranty")!;
    const runner = { ...createRunnerModel(), crouching: true };
    const presentation = courierProtectionPresentation(runner, "breaking")!;

    expect(presentation).toMatchObject({ breaking: true });
    expect(presentation.radiusX).toBe(standing.radiusX);
    expect(presentation.radiusY).toBe(standing.radiusY);
    expect(presentation.centerX).toBe(standing.centerX);
    expect(presentation.centerY).toBe(standing.centerY);
  });

  it("rotates the energy mesh and breathes within the agreed limits", () => {
    const brightest = courierShieldAnimation({
      elapsedSeconds: 0.45,
      activationSecondsRemaining: 0,
      breakSecondsRemaining: 0,
      reducedMotion: false
    });
    const softest = courierShieldAnimation({
      elapsedSeconds: 1.35,
      activationSecondsRemaining: 0,
      breakSecondsRemaining: 0,
      reducedMotion: false
    });
    const oneSecond = courierShieldAnimation({
      elapsedSeconds: 1,
      activationSecondsRemaining: 0,
      breakSecondsRemaining: 0,
      reducedMotion: false
    });

    expect(brightest.scale).toBeCloseTo(1.05, 3);
    expect(brightest.alpha).toBeCloseTo(1, 3);
    expect(softest.scale).toBeCloseTo(1, 3);
    expect(softest.alpha).toBeCloseTo(0.8, 3);
    expect(oneSecond.meshRotationRadians).toBeCloseTo(Math.PI / 15, 5);
  });

  it("appears with a short overshoot and bursts in under 140 milliseconds", () => {
    const firstFrame = courierShieldAnimation({
      elapsedSeconds: 0,
      activationSecondsRemaining: SHIELD_APPEAR_SECONDS,
      breakSecondsRemaining: 0,
      reducedMotion: false
    });
    const overshoot = courierShieldAnimation({
      elapsedSeconds: 0.15,
      activationSecondsRemaining: SHIELD_APPEAR_SECONDS * 0.3,
      breakSecondsRemaining: 0,
      reducedMotion: false
    });
    const halfBurst = courierShieldAnimation({
      elapsedSeconds: 1,
      activationSecondsRemaining: 0,
      breakSecondsRemaining: SHIELD_BREAK_SECONDS / 2,
      reducedMotion: false
    });

    expect(SHIELD_BREAK_SECONDS).toBeLessThanOrEqual(0.14);
    expect(firstFrame).toMatchObject({ scale: 0.72, alpha: 0, breakingProgress: 0 });
    expect(overshoot.scale).toBeGreaterThan(1);
    expect(halfBurst.breakingProgress).toBeCloseTo(0.5, 4);
    expect(halfBurst.alpha).toBeCloseTo(0.5, 4);
  });

  it("honors reduced motion without hiding the protection state", () => {
    expect(courierShieldAnimation({
      elapsedSeconds: 9,
      activationSecondsRemaining: 0,
      breakSecondsRemaining: 0,
      reducedMotion: true
    })).toMatchObject({
      scale: 1,
      alpha: 1,
      meshRotationRadians: 0,
      breakingProgress: 0
    });
  });

  it("moves the protection bubble with the courier during a jump", () => {
    const standing = courierProtectionPresentation(createRunnerModel(), "warranty")!;
    const airborneRunner = { ...createRunnerModel(), grounded: false, y: 250, velocityY: -200 };
    const airborne = courierProtectionPresentation(airborneRunner, "warranty")!;

    expect(airborne.centerY).toBeLessThan(standing.centerY);
    expect(airborne.centerY).toBe(airborneRunner.y + airborneRunner.height / 2);
  });

  it("does not draw the obsolete trust-corridor circle and check-line abstraction", () => {
    const renderer = readFileSync(new URL("../src/game/renderer.ts", import.meta.url), "utf8");
    expect(renderer).not.toContain("drawTrustCorridor(context, scene, theme)");
  });

  it("does not turn ordinary post-collision recovery into a warranty shield", () => {
    const runner = createRunnerModel();

    expect(courierProtectionPresentation(runner, null)).toBeNull();
    expect(courierProtectionPresentation(runner, "breaking")?.breaking).toBe(true);
  });
});
