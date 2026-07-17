import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import type { RenderScene, RunnerModel } from "../src/game/types";
import {
  COURIER_SPRITE_FRAME_COUNT,
  COURIER_BRAND_MARK_PATH,
  ORDER_ASSET_PATHS,
  ORDER_VISUAL_TYPES,
  PARCEL_CELEBRATION_FRAME_PATHS,
  courierSpriteFrame,
  parcelAnimationFrame
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
    expect(Object.keys(ORDER_ASSET_PATHS)).toEqual(ORDER_VISUAL_TYPES);
    for (const path of [...Object.values(ORDER_ASSET_PATHS), ...PARCEL_CELEBRATION_FRAME_PATHS]) {
      expect(existsSync(new URL(`../public${path}`, import.meta.url))).toBe(true);
    }
  });

  it("maps run, jump, crouch and celebration into one 14-frame sheet", () => {
    expect(existsSync(new URL(
      "../public/assets/milion-runner/courier/courier-reference.svg",
      import.meta.url
    ))).toBe(true);
    expect(COURIER_BRAND_MARK_PATH.endsWith("/A.webp")).toBe(true);
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

  it("animates the parcel through four authored perspectives", () => {
    expect([0, 0.2, 0.4, 0.6].map((time) => parcelAnimationFrame(time, 0, false)))
      .toEqual([0, 1, 2, 3]);
    expect(parcelAnimationFrame(2, 1, true)).toBe(0);
  });
});
