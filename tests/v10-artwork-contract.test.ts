import { describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import type { RenderScene, RunnerModel } from "../src/game/types";
import {
  COURIER_SPRITE_FRAME_COUNT,
  COURIER_SPRITE_PATH,
  COURIER_CROUCH_SPRITE_FRAME_COUNT,
  COURIER_CROUCH_SPRITE_PATH,
  COURIER_JUMP_SPRITE_FRAME_COUNT,
  COURIER_JUMP_SPRITE_PATH,
  OBSTACLE_ASSET_PATHS,
  OVERHEAD_VARIANT_ASSET_PATHS,
  ORDER_ASSET_PATHS,
  ORDER_VISUAL_TYPES,
  PARCEL_CELEBRATION_FRAME_PATHS,
  courierSpriteFrame,
  courierCrouchSpriteFrame,
  courierJumpSpriteFrame,
  courierCrouchFrameOffsetX,
  parcelAnimationFrame
} from "../src/game/runner-artwork";
import { RunnerArtwork } from "../src/game/runner-artwork";
import { GROUND_Y, OVERHEAD } from "../src/game/constants";

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
  it("warms every unique critical canvas asset once and releases the scratch canvas", () => {
    const image = () => ({
      complete: true,
      naturalWidth: 512,
      naturalHeight: 512
    }) as HTMLImageElement;
    const assets = {
      orders: image(),
      powerUps: image(),
      courier: image(),
      courierCrouch: image(),
      courierJump: image(),
      obstacles: {
        "box-stack": image(),
        pallet: image(),
        trolley: image(),
        overhead: image()
      },
      overheadVariants: [] as HTMLImageElement[]
    };
    assets.overheadVariants = [assets.obstacles.overhead, image(), image()];
    const artwork = new RunnerArtwork(assets);
    const drawImage = vi.fn();
    const clearRect = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage, clearRect }))
    } as unknown as HTMLCanvasElement;

    artwork.prepareForFirstFrame(() => canvas);
    artwork.prepareForFirstFrame(() => canvas);
    const restartedArtwork = new RunnerArtwork(assets);
    const restartedCanvasFactory = vi.fn(() => canvas);
    restartedArtwork.prepareForFirstFrame(restartedCanvasFactory);

    expect(drawImage).toHaveBeenCalledTimes(11);
    expect(new Set(drawImage.mock.calls.map(([drawn]) => drawn))).toEqual(new Set([
      assets.orders,
      assets.powerUps,
      assets.courier,
      assets.courierCrouch,
      assets.courierJump,
      ...Object.values(assets.obstacles),
      ...assets.overheadVariants
    ]));
    expect(clearRect).toHaveBeenCalledTimes(11);
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
    expect(restartedCanvasFactory).not.toHaveBeenCalled();
  });

  it("keeps the controlled critical error when first-frame artwork is incomplete", () => {
    const image = {
      complete: true,
      naturalWidth: 512,
      naturalHeight: 512
    } as HTMLImageElement;
    const artwork = new RunnerArtwork({
      orders: image,
      powerUps: image,
      courier: image,
      courierCrouch: image,
      courierJump: image,
      obstacles: {
        "box-stack": image,
        pallet: image,
        trolley: image,
        overhead: undefined
      },
      overheadVariants: [image]
    });

    expect(() => artwork.prepareForFirstFrame())
      .toThrowError("critical_runner_artwork_missing");
  });

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
    expect(OVERHEAD_VARIANT_ASSET_PATHS).toHaveLength(3);
    for (const path of OVERHEAD_VARIANT_ASSET_PATHS) {
      expect(existsSync(new URL(`../public${path}`, import.meta.url))).toBe(true);
    }
  });

  it("sets the overhead artwork low enough to require the settled crouch pose", () => {
    const visibleUndersideY = GROUND_Y - OVERHEAD.clearance - OVERHEAD.visualLift;

    expect(visibleUndersideY).toBe(344);
  });

  it("starts raster overhead rails at the visible world plate ceiling", () => {
    const moveTo = vi.fn();
    const context = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo,
      lineTo: vi.fn(),
      stroke: vi.fn(),
      drawImage: vi.fn()
    } as unknown as CanvasRenderingContext2D;
    const factory = () => ({
      complete: true,
      naturalWidth: 768,
      naturalHeight: 185,
      decoding: "async",
      src: ""
    }) as unknown as HTMLImageElement;
    const artwork = new RunnerArtwork(factory);
    const ceilingY = 16.247;

    artwork.drawObstacle(context, {
      active: true,
      kind: "overhead",
      source: "normal",
      x: 420,
      y: 200,
      width: 76,
      height: 178,
      visualVariant: 0
    }, ceilingY);

    expect(moveTo.mock.calls.map(([, y]) => y)).toEqual([ceilingY, ceilingY]);
  });

  it("aligns the door overhead rails with its outer artwork mounts", () => {
    const moveTo = vi.fn();
    const context = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo,
      lineTo: vi.fn(),
      stroke: vi.fn(),
      drawImage: vi.fn()
    } as unknown as CanvasRenderingContext2D;
    const image = (naturalWidth: number, naturalHeight: number) => ({
      complete: true,
      naturalWidth,
      naturalHeight
    }) as HTMLImageElement;
    const ordinary = image(768, 185);
    const artwork = new RunnerArtwork({
      obstacles: { overhead: ordinary },
      overheadVariants: [ordinary, image(768, 251), image(768, 201)]
    });
    const obstacle = {
      active: true,
      kind: "overhead" as const,
      source: "normal" as const,
      x: 420,
      y: 200,
      width: 76,
      height: 178,
      visualVariant: 1
    };
    const drawWidth = obstacle.width + 18;
    const drawX = obstacle.x - (drawWidth - obstacle.width) / 2;

    artwork.drawObstacle(context, obstacle, 0);

    expect(moveTo.mock.calls.map(([x]) => x)).toEqual([
      drawX + drawWidth * 0.05,
      drawX + drawWidth * 0.95
    ]);
  });

  it("ships the selected Todd courier and preserves pose-state timing", () => {
    expect(existsSync(new URL(
      "../public/assets/milion-runner/courier/courier-reference.svg",
      import.meta.url
    ))).toBe(true);
    expect(COURIER_SPRITE_FRAME_COUNT).toBe(8);
    expect(COURIER_CROUCH_SPRITE_FRAME_COUNT).toBe(8);
    expect(COURIER_JUMP_SPRITE_FRAME_COUNT).toBe(8);
    expect(COURIER_SPRITE_PATH).toBe("/assets/milion-runner/courier/courier-run-sheet.webp");
    expect(COURIER_CROUCH_SPRITE_PATH)
      .toBe("/assets/milion-runner/courier/courier-crouch-sheet.webp");
    expect(COURIER_JUMP_SPRITE_PATH)
      .toBe("/assets/milion-runner/courier/courier-jump-sheet.webp");
    expect(existsSync(new URL(
      "../public/assets/milion-runner/courier/courier-run-sheet.webp",
      import.meta.url
    ))).toBe(true);
    expect(existsSync(new URL(
      "../public/assets/milion-runner/courier/courier-crouch-sheet.webp",
      import.meta.url
    ))).toBe(true);
    expect(existsSync(new URL(
      "../public/assets/milion-runner/courier/courier-jump-sheet.webp",
      import.meta.url
    ))).toBe(true);
    expect(courierSpriteFrame(runner, scene({ elapsedSeconds: 0 }))).toBe(0);
    expect(courierSpriteFrame(runner, scene({ elapsedSeconds: 0.25 }))).toBeGreaterThan(0);
    expect(courierSpriteFrame({ ...runner, grounded: false, velocityY: -100 }, scene())).toBe(3);
    expect(courierJumpSpriteFrame({ ...runner, grounded: false, velocityY: -760 })).toBe(0);
    expect(courierJumpSpriteFrame({ ...runner, grounded: false, velocityY: 0 })).toBe(4);
    expect(courierJumpSpriteFrame({ ...runner, grounded: false, velocityY: 760 })).toBe(7);
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
        text: "500 PACZEK!",
        remainingSeconds: 1,
        progress: 0.4
      }
    }))).toBeGreaterThanOrEqual(0);
  });

  it("keeps courier motion sheets free of an automatically overlaid A", () => {
    const builder = readFileSync(
      new URL("../scripts/build-run-sprite.py", import.meta.url),
      "utf8"
    );

    expect(builder).not.toContain("brand_backpack");
    expect(builder).not.toContain("BACKPACK_MARK_TRANSFORMS");
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
    const crouchWidth = courierDraws[1]?.[7] as number;
    const crouchHeight = courierDraws[1]?.[8] as number;
    // Standing and crouch sheets keep a square cell so the silhouette is not distorted.
    expect(standingHeight / standingWidth).toBe(1);
    expect(crouchHeight / crouchWidth).toBe(1);
    // Crouching renders slightly smaller (0.9 scale) so the courier reads larger
    // once the asset's empty margin is accounted for.
    expect(crouchHeight).toBeLessThan(standingHeight);
  });

  it("uses the dedicated jump sheet while the courier is airborne", () => {
    const drawImage = vi.fn();
    const context = { drawImage } as unknown as CanvasRenderingContext2D;
    const factory = () => ({
      complete: true,
      naturalWidth: 4096,
      naturalHeight: 512,
      decoding: "async",
      src: ""
    }) as unknown as HTMLImageElement;
    const artwork = new RunnerArtwork(factory);

    artwork.drawCourier(context, {
      ...runner,
      grounded: false,
      velocityY: 0
    }, scene());

    const [image, sourceX] = drawImage.mock.calls[0] ?? [];
    expect((image as HTMLImageElement).src).toBe(COURIER_JUMP_SPRITE_PATH);
    expect(sourceX).toBe(4 * 512);
  });

  it("animates the parcel through four authored perspectives", () => {
    expect([0, 0.2, 0.4, 0.6].map((time) => parcelAnimationFrame(time, 0, false)))
      .toEqual([0, 1, 2, 3]);
    expect(parcelAnimationFrame(2, 1, true)).toBe(0);
  });
});
