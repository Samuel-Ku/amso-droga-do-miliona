import { describe, expect, it, vi } from "vitest";
import { BossDirector } from "../src/game/boss";
import { GROUND_Y } from "../src/game/constants";
import { createRunnerModel } from "../src/game/physics";
import { WarehouseRenderer } from "../src/game/renderer";
import { createObstaclePool } from "../src/game/spawning";
import type { RenderScene } from "../src/game/types";
import {
  WORLD_ARTWORK_CONTRACT,
  calculateWorldPlateTransform
} from "../src/visuals/world-plate-transform";

function scene(): RenderScene {
  const overhead = createObstaclePool(1)[0]!;
  Object.assign(overhead, {
    active: true,
    kind: "overhead",
    x: 420,
    y: 200,
    width: 76,
    height: 178
  });
  return {
    state: "running",
    runner: createRunnerModel(),
    obstacles: [overhead],
    packages: [],
    boss: new BossDirector().model,
    elapsedSeconds: 1,
    distancePixels: 100,
    speed: 280,
    reducedMotion: false,
    impact: false,
    epochIndex: 0,
    epochName: "",
    epochYear: "",
    themeIndex: 0,
    cutscene: null,
    activePowerUps: [],
    worldVisual: {
      worldId: "first-mile",
      stateId: "story.first_package",
      nextStateId: "story.first_package",
      progress: 0
    }
  };
}

describe("canonical world renderer geometry", () => {
  it("does not draw legacy generated obstacle replacements over authored worlds", () => {
    const renderTrace = (withLegacyReplacement: boolean): string[] => {
      const trace: string[] = [];
      const target: Record<PropertyKey, unknown> = {
        createLinearGradient: () => ({ addColorStop(): void {} })
      };
      const context = new Proxy(target, {
        get(record, key) {
          if (key in record) return record[key];
          return (...values: unknown[]) => trace.push(`${String(key)}:${JSON.stringify(values)}`);
        },
        set(record, key, value) { record[key] = value; return true; }
      }) as unknown as CanvasRenderingContext2D;
      const width = 1024;
      const height = 1024;
      const renderer = new WarehouseRenderer();
      renderer.applyGeometry(
        calculateWorldPlateTransform(width, height, WORLD_ARTWORK_CONTRACT)!,
        { width, height, dpr: 1 }
      );
      renderer.render(context, width, height, {
        ...scene(),
        obstacles: [],
        obstacleTransformations: withLegacyReplacement
          ? [{
              active: true,
              motif: "quality-mark",
              obstacleKind: "overhead",
              x: 360,
              y: 190,
              width: 76,
              height: 178,
              progress: 0.2
            }]
          : []
      });
      return trace;
    };

    expect(renderTrace(true)).toEqual(renderTrace(false));
  });

  it.each([
    [390, 844, 2],
    [1024, 1024, 1],
    [2560, 1080, 2]
  ] as const)("uses one clipped CSS-pixel transform at %s × %s DPR %s", (
    width,
    height,
    dpr
  ) => {
    const setTransforms: number[][] = [];
    const rects: number[][] = [];
    const translations: number[][] = [];
    const scales: number[][] = [];
    const moveTos: number[][] = [];
    const lineTos: number[][] = [];
    const fillRects: number[][] = [];
    const target: Record<PropertyKey, unknown> = {
      setTransform: (...values: number[]) => setTransforms.push(values),
      rect: (...values: number[]) => rects.push(values),
      translate: (...values: number[]) => translations.push(values),
      scale: (...values: number[]) => scales.push(values),
      moveTo: (...values: number[]) => moveTos.push(values),
      lineTo: (...values: number[]) => lineTos.push(values),
      fillRect: (...values: number[]) => fillRects.push(values),
      createLinearGradient: () => ({ addColorStop(): void {} })
    };
    const context = new Proxy(target, {
      get(record, key) { return key in record ? record[key] : vi.fn(); },
      set(record, key, value) { record[key] = value; return true; }
    }) as unknown as CanvasRenderingContext2D;
    const transform = calculateWorldPlateTransform(
      width,
      height,
      WORLD_ARTWORK_CONTRACT
    )!;
    const renderer = new WarehouseRenderer();
    renderer.applyGeometry(transform, { width, height, dpr });

    renderer.render(context, width * dpr, height * dpr, scene());

    expect(setTransforms.at(-1)).toEqual([dpr, 0, 0, dpr, 0, 0]);
    expect(rects[0]).toEqual([
      transform.clipRect.x,
      transform.clipRect.y,
      transform.clipRect.width,
      transform.clipRect.height
    ]);
    expect(translations[0]).toEqual([
      transform.worldOffsetX,
      transform.worldOffsetY
    ]);
    expect(scales[0]).toEqual([transform.worldScale, transform.worldScale]);
    expect(transform.worldOffsetY + GROUND_Y * transform.worldScale)
      .toBeCloseTo(transform.plateRect.y + 771 * transform.artScale, 8);
    expect(moveTos).toContainEqual([-12, GROUND_Y + 5]);
    expect(lineTos).toContainEqual([972, GROUND_Y + 5]);
    expect(fillRects).toContainEqual([412, 0, 10, 208]);
  });
});
