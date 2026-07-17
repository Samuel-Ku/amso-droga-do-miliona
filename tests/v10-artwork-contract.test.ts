import { describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import type { RenderScene, RunnerModel } from "../src/game/types";
import {
  COURIER_SPRITE_FRAME_COUNT,
  COURIER_SPRITE_PATH,
  COURIER_CROUCH_SPRITE_FRAME_COUNT,
  COURIER_CROUCH_SPRITE_PATH,
  OBSTACLE_ASSET_PATHS,
  ORDER_ASSET_PATHS,
  ORDER_VISUAL_TYPES,
  PARCEL_CELEBRATION_FRAME_PATHS,
  courierSpriteFrame,
  courierCrouchSpriteFrame,
  courierCrouchFrameOffsetX,
  parcelAnimationFrame
} from "../src/game/runner-artwork";
import { RunnerArtwork } from "../src/game/runner-artwork";

const runner: RunnerModel = {
  x: 110,
  y: 350,
  width: 62,
  height: 86,
  velocityY: 0,
  grounded: true,
  crouching: false,
  crouchElapsedSeconds: 0,
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

  it("ships one coherent raster asset for every obstacle kind", () => {
    expect(Object.keys(OBSTACLE_ASSET_PATHS)).toEqual([
      "box-stack",
      "pallet",
      "trolley",
      "overhead"
    ]);
    for (const path of Object.values(OBSTACLE_ASSET_PATHS)) {
      expect(existsSync(new URL(`../public${path}`, import.meta.url))).toBe(true);
    }
  });

  it("ships the selected Todd courier and preserves pose-state timing", () => {
    expect(existsSync(new URL(
      "../public/assets/milion-runner/courier/courier-reference.svg",
      import.meta.url
    ))).toBe(true);
    expect(COURIER_SPRITE_FRAME_COUNT).toBe(8);
    expect(COURIER_CROUCH_SPRITE_FRAME_COUNT).toBe(8);
    expect(COURIER_SPRITE_PATH).toBe("/assets/milion-runner/courier/courier-run-sheet.webp");
    expect(COURIER_CROUCH_SPRITE_PATH)
      .toBe("/assets/milion-runner/courier/courier-crouch-sheet.webp");
    expect(existsSync(new URL(
      "../public/assets/milion-runner/courier/courier-run-sheet.webp",
      import.meta.url
    ))).toBe(true);
    expect(existsSync(new URL(
      "../public/assets/milion-runner/courier/courier-crouch-sheet.webp",
      import.meta.url
    ))).toBe(true);
    expect(courierSpriteFrame(runner, scene({ elapsedSeconds: 0 }))).toBe(0);
    expect(courierSpriteFrame(runner, scene({ elapsedSeconds: 0.25 }))).toBeGreaterThan(0);
    expect(courierSpriteFrame({ ...runner, grounded: false, velocityY: -100 }, scene())).toBe(3);
    expect(courierCrouchSpriteFrame({
      ...runner,
      crouching: true,
      crouchElapsedSeconds: 0
    })).toBe(0);
    expect(courierCrouchSpriteFrame({
      ...runner,
      crouching: true,
      crouchElapsedSeconds: 0.5
    })).toBe(7);
    expect(courierCrouchFrameOffsetX(0)).toBe(0);
    expect(courierCrouchFrameOffsetX(7)).toBeCloseTo(-19.92, 1);
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
    }))).toBeGreaterThanOrEqual(0);
  });

  it("keeps the courier at one visual size while changing to a crouch pose", () => {
    const drawImage = vi.fn();
    const context = {
      drawImage,
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn()
    } as unknown as CanvasRenderingContext2D;
    const factory = () => ({
      complete: true,
      naturalWidth: 4096,
      naturalHeight: 512,
      decoding: "async",
      src: ""
    }) as unknown as HTMLImageElement;
    const artwork = new RunnerArtwork(factory);

    artwork.drawCourier(context, runner, scene());
    artwork.drawCourier(context, { ...runner, crouching: true }, scene());

    const courierDraws = drawImage.mock.calls.filter((call) => call.length === 9);
    expect(courierDraws).toHaveLength(2);
    expect(drawImage).toHaveBeenCalledTimes(2);
    const standingWidth = courierDraws[0]?.[7] as number;
    const standingHeight = courierDraws[0]?.[8] as number;
    expect(standingHeight / standingWidth).toBe(1);
    expect(courierDraws[0]?.[8]).toBe(courierDraws[1]?.[8]);
    expect(courierDraws[0]?.[7]).toBe(courierDraws[1]?.[7]);
  });

  it("animates the parcel through four authored perspectives", () => {
    expect([0, 0.2, 0.4, 0.6].map((time) => parcelAnimationFrame(time, 0, false)))
      .toEqual([0, 1, 2, 3]);
    expect(parcelAnimationFrame(2, 1, true)).toBe(0);
  });
});
