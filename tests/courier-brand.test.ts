import { describe, expect, it, vi } from "vitest";
import {
  COURIER_PALETTE,
  CourierBrandArtwork
} from "../src/game/courier-brand";
import { createRunnerModel } from "../src/game/physics";
import { WarehouseRenderer } from "../src/game/renderer";

describe("AMSO courier artwork", () => {
  it("uses the approved courier palette with an orange belt", () => {
    expect(COURIER_PALETTE).toEqual({
      capAndShirt: "#ff7a15",
      belt: "#f47100",
      trousers: "#171717",
      shoesAndMark: "#ffffff",
      scanner: "#44413d",
      scannerScreen: "#27b936"
    });
  });

  it("draws a crisp vector A inside the shirt bounds", () => {
    const artwork = new CourierBrandArtwork();
    const drawImage = vi.fn();
    const contextTarget: Record<PropertyKey, unknown> = { drawImage };
    const context = new Proxy(contextTarget, {
      get(target, key) { return key in target ? target[key] : vi.fn(); },
      set(target, key, value) { target[key] = value; return true; }
    }) as unknown as CanvasRenderingContext2D;

    artwork.drawMark(context, { x: 20, y: 30, width: 24, height: 16 });

    expect(drawImage).not.toHaveBeenCalled();
    expect(contextTarget.fillStyle).toBe("#ffffff");
    expect(contextTarget.lineJoin).toBe("round");
  });

  it("uses the same supplied mark for standing, jumping and crouching poses", () => {
    const artwork = new CourierBrandArtwork();
    const fill = vi.fn();
    const contextTarget: Record<PropertyKey, unknown> = {
      fill,
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

    expect(fill.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
