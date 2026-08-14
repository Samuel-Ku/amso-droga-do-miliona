import { describe, expect, it, vi } from "vitest";
import { CelebrationManager } from "../src/game/celebration-manager";
import { WarehouseRenderer } from "../src/game/renderer";
import { createRunnerModel } from "../src/game/physics";
import type { RenderScene } from "../src/game/types";
import { renderWorld } from "./helpers/render-world";

function renderCelebration(
  threshold: number,
  isRecord = false,
  reducedMotion = false,
): {
  context: CanvasRenderingContext2D;
  scene: RenderScene;
} {
  const manager = new CelebrationManager();
  manager.trigger({ threshold, isRecord, playerX: 142, playerY: 400 });
  manager.update(0.2);

  const target: Record<PropertyKey, unknown> = {
    createLinearGradient: () => ({ addColorStop(): void {} }),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    ellipse: vi.fn(),
  };
  const context = new Proxy(target, {
    get(record, key) { if (key in record) return record[key]; return (): void => {}; },
    set(record, key, value) { record[key] = value; return true; }
  }) as unknown as CanvasRenderingContext2D;

  const scene: RenderScene = {
    state: "running",
    runner: createRunnerModel(),
    obstacles: [],
    packages: [],
    boss: {
      phase: "inactive", encounterPhase: 0, cycle: 0, attacksLaunched: 0,
      attacksSurvived: 0, attackCount: 0, phaseSecondsRemaining: 0,
      x: 0, y: 0, width: 0, height: 0
    },
    elapsedSeconds: 3,
    distancePixels: 500,
    speed: 260,
    reducedMotion,
    impact: false,
    epochIndex: 0,
    epochName: "",
    epochYear: "",
    themeIndex: -1,
    worldVisual: {
      worldId: "first-mile", stateId: "story.first_package",
      nextStateId: "story.first_package", progress: 0
    },
    cutscene: null,
    activePowerUps: [],
    decorationQuality: "full",
    celebration: manager.getState(),
  };

  return { context, scene };
}

describe("celebration effects", () => {
  it("renders a Spark celebration without throwing", () => {
    const { context, scene } = renderCelebration(10);
    const renderer = new WarehouseRenderer();
    expect(() => renderWorld(renderer, context, 960, 540, scene)).not.toThrow();
  });

  it("renders all stages without throwing", () => {
    const renderer = new WarehouseRenderer();
    for (const threshold of [10, 100, 500, 1000, 5000]) {
      for (const rm of [false, true]) {
        const { context, scene } = renderCelebration(threshold, false, rm);
        expect(() => renderWorld(renderer, context, 960, 540, scene)).not.toThrow();
      }
    }
  });

  it("renders record celebration without throwing", () => {
    const { context, scene } = renderCelebration(10, true);
    const renderer = new WarehouseRenderer();
    expect(() => renderWorld(renderer, context, 960, 540, scene)).not.toThrow();
  });

  it("renders multiple effect types in a single celebration", () => {
    const { context, scene } = renderCelebration(5000); // Legendary has multi-effect phases
    const renderer = new WarehouseRenderer();
    expect(() => renderWorld(renderer, context, 960, 540, scene)).not.toThrow();
  });
});
