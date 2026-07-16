import { existsSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  COURIER_MARK_ASSET_PATH,
  COURIER_PALETTE,
  CourierBrandArtwork
} from "../src/game/courier-brand";
import { createRunnerModel } from "../src/game/physics";
import { WarehouseRenderer } from "../src/game/renderer";

describe("AMSO courier artwork", () => {
  it("ships the supplied transparent A mark and the approved courier palette", () => {
    expect(existsSync(new URL(`../public${COURIER_MARK_ASSET_PATH}`, import.meta.url)))
      .toBe(true);
    expect(COURIER_PALETTE).toEqual({
      capAndShirt: "#ff7a15",
      belt: "#3f8fce",
      trousers: "#171717",
      shoesAndMark: "#ffffff",
      scanner: "#44413d",
      scannerScreen: "#27b936"
    });
  });

  it("draws the exact mark inside the shirt bounds without hiding the shirt", () => {
    const image = {
      complete: true,
      naturalWidth: 518,
      naturalHeight: 326,
      src: ""
    } as unknown as HTMLImageElement;
    const artwork = new CourierBrandArtwork(() => image);
    const drawImage = vi.fn();
    const context = { drawImage } as unknown as CanvasRenderingContext2D;

    artwork.drawMark(context, { x: 20, y: 30, width: 24, height: 16 });

    expect(image.src).toBe(COURIER_MARK_ASSET_PATH);
    expect(drawImage).toHaveBeenCalledOnce();
    const [, x, y, width, height] = drawImage.mock.calls[0]!;
    expect(x).toBeGreaterThanOrEqual(20);
    expect(y).toBeGreaterThanOrEqual(30);
    expect(x + width).toBeLessThanOrEqual(44);
    expect(y + height).toBeLessThanOrEqual(46);
    expect(width / height).toBeCloseTo(518 / 326, 4);
  });

  it("uses the same supplied mark for standing, jumping and crouching poses", () => {
    const image = {
      complete: true,
      naturalWidth: 518,
      naturalHeight: 326,
      src: ""
    } as unknown as HTMLImageElement;
    const artwork = new CourierBrandArtwork(() => image);
    const drawImage = vi.fn();
    const contextTarget: Record<PropertyKey, unknown> = {
      drawImage,
      createLinearGradient: () => ({ addColorStop(): void {} })
    };
    const context = new Proxy(contextTarget, {
      get(target, key) {
        if (key in target) return target[key];
        return (): void => {};
      },
      set(target, key, value) {
        target[key] = value;
        return true;
      }
    }) as unknown as CanvasRenderingContext2D;
    const runner = createRunnerModel();
    const renderer = new WarehouseRenderer(artwork);
    const scene = {
      state: "running" as const,
      runner,
      obstacles: [],
      packages: [],
      boss: {
        phase: "inactive" as const,
        encounterPhase: 0,
        cycle: 0,
        attacksLaunched: 0,
        attacksSurvived: 0,
        attackCount: 0,
        phaseSecondsRemaining: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      elapsedSeconds: 1,
      distancePixels: 0,
      speed: 240,
      reducedMotion: false,
      impact: false,
      epochIndex: 0,
      epochName: "",
      epochYear: "",
      themeIndex: -1,
      worldVisual: { worldId: "first-mile" as const, stateId: "story.first_package", nextStateId: "story.first_package", progress: 0 },
      cutscene: null,
      activePowerUps: []
    };

    renderer.render(context, 960, 540, scene);
    runner.grounded = false;
    renderer.render(context, 960, 540, scene);
    runner.crouching = true;
    renderer.render(context, 960, 540, scene);

    expect(drawImage).toHaveBeenCalledTimes(3);
  });
});
