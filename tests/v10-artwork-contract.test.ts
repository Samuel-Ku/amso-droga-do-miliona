import { describe, expect, it } from "vitest";
import type { RenderScene, RunnerModel } from "../src/game/types";
import {
  COURIER_SPRITE_FRAME_COUNT,
  ORDER_VISUAL_TYPES,
  courierSpriteFrame
} from "../src/game/runner-artwork";

const runner: RunnerModel = {
  x: 110,
  y: 350,
  width: 62,
  height: 86,
  velocityY: 0,
  grounded: true,
  crouching: false,
  coyoteRemaining: 0,
  jumpBufferRemaining: 0
};

function scene(overrides: Partial<RenderScene> = {}): RenderScene {
  return {
    state: "running",
    runner,
    obstacles: [],
    packages: [],
    boss: { phase: "inactive", encounterPhase: 0, cycle: 0, attacksLaunched: 0, attacksSurvived: 0, attackCount: 0, phaseSecondsRemaining: 0, x: 0, y: 0, width: 0, height: 0 },
    elapsedSeconds: 0,
    distancePixels: 0,
    speed: 280,
    reducedMotion: false,
    impact: false,
    epochIndex: 0,
    epochName: "",
    epochYear: "",
    themeIndex: 0,
    cutscene: null,
    activePowerUps: [],
    ...overrides
  };
}

describe("v10 production artwork contract", () => {
  it("has five equal ordinary order visuals", () => {
    expect(ORDER_VISUAL_TYPES).toEqual(["notebook", "telefon", "pc", "lcd", "parcel"]);
  });

  it("maps run, jump, crouch and celebration into one 14-frame sheet", () => {
    expect(COURIER_SPRITE_FRAME_COUNT).toBe(14);
    expect(courierSpriteFrame(runner, scene({ elapsedSeconds: 0 }))).toBe(0);
    expect(courierSpriteFrame(runner, scene({ elapsedSeconds: 0.25 }))).toBeGreaterThan(0);
    expect(courierSpriteFrame({ ...runner, grounded: false, velocityY: -100 }, scene())).toBe(6);
    expect(courierSpriteFrame({ ...runner, crouching: true }, scene())).toBe(9);
    expect(courierSpriteFrame(runner, scene({
      milestoneCelebration: {
        threshold: 500,
        kind: "order-confetti",
        intensity: 3,
        durationSeconds: 1.6,
        text: "500 ZAMÓWIEŃ!",
        remainingSeconds: 1,
        progress: 0.4
      }
    }))).toBeGreaterThanOrEqual(11);
  });
});
