import { describe, expect, it } from "vitest";
import { BossDirector } from "../src/game/boss";
import { SHIELD_BREAK_SECONDS } from "../src/game/courier-presentation";
import { createRunnerModel } from "../src/game/physics";
import { WarehouseRenderer } from "../src/game/renderer";
import type { RenderScene } from "../src/game/types";

interface ShieldRenderTrace {
  readonly alphas: readonly number[];
  readonly colors: readonly string[];
  readonly ellipses: readonly (readonly number[])[];
  readonly filledPartialEllipses: readonly (readonly number[])[];
  readonly rotations: readonly number[];
  readonly scales: readonly (readonly [number, number])[];
}

function createShieldScene(
  kind: "start" | "warranty",
  overrides: Partial<RenderScene> = {}
): RenderScene {
  return {
    state: "running",
    runner: createRunnerModel(),
    obstacles: [],
    packages: [],
    boss: new BossDirector().model,
    elapsedSeconds: 0.45,
    distancePixels: 100,
    speed: 280,
    reducedMotion: false,
    impact: false,
    epochIndex: 0,
    epochName: "",
    epochYear: "",
    themeIndex: 0,
    cutscene: null,
    activePowerUps: kind === "warranty" ? ["gwarancja_48"] : [],
    startProtectionSeconds: kind === "start" ? 1 : 0,
    shieldActivationSeconds: 0,
    worldVisual: {
      worldId: "first-mile",
      stateId: "story.first_package",
      nextStateId: "story.first_package",
      progress: 0
    },
    ...overrides
  };
}

function renderShieldTrace(
  kind: "start" | "warranty",
  overrides: Partial<RenderScene> = {}
): ShieldRenderTrace {
  const alphas: number[] = [];
  const colors: string[] = [];
  const ellipses: number[][] = [];
  const filledPartialEllipses: number[][] = [];
  const rotations: number[] = [];
  const scales: Array<[number, number]> = [];
  let currentEllipses: number[][] = [];
  const target: Record<PropertyKey, unknown> = {
    createLinearGradient: () => ({ addColorStop(): void {} }),
    createRadialGradient: () => ({
      addColorStop(_offset: number, color: string): void {
        colors.push(color);
      }
    }),
    beginPath(): void {
      currentEllipses = [];
    },
    ellipse(...args: number[]): void {
      currentEllipses.push(args);
      ellipses.push(args);
    },
    fill(): void {
      for (const ellipse of currentEllipses) {
        const startAngle = ellipse[5] ?? 0;
        const endAngle = ellipse[6] ?? 0;
        if (Math.abs(endAngle - startAngle) < Math.PI * 2 - 0.001) {
          filledPartialEllipses.push(ellipse);
        }
      }
    },
    rotate(radians: number): void {
      rotations.push(radians);
    },
    scale(x: number, y: number): void {
      scales.push([x, y]);
    }
  };
  const context = new Proxy(target, {
    get(object, key) {
      if (key in object) return object[key];
      return (): void => {};
    },
    set(object, key, value) {
      object[key] = value;
      if ((key === "fillStyle" || key === "strokeStyle" || key === "shadowColor") &&
          typeof value === "string") {
        colors.push(value);
      }
      if (key === "globalAlpha" && typeof value === "number") alphas.push(value);
      return true;
    }
  }) as unknown as CanvasRenderingContext2D;

  new WarehouseRenderer().render(context, 960, 540, createShieldScene(kind, overrides));
  return {
    alphas,
    colors: colors.filter((color) => color.includes("244,113,0") || color.includes("235,50,164")),
    ellipses: ellipses.filter(([, , radiusX = 0]) => radiusX >= 70),
    filledPartialEllipses,
    rotations,
    scales
  };
}

describe("shield rendering", () => {
  it("renders start protection and AMSO Care as the same orange shield without a filled chord", () => {
    const start = renderShieldTrace("start");
    const warranty = renderShieldTrace("warranty");

    expect(warranty.colors).toEqual(start.colors);
    expect(warranty.alphas).toEqual(start.alphas);
    expect(warranty.colors.some((color) => color.includes("235,50,164"))).toBe(false);
    expect(warranty.ellipses).toEqual(start.ellipses);
    expect(start.ellipses.some(([, , radiusX, radiusY]) => radiusX === 79 && radiusY === 87))
      .toBe(true);
    expect(start.filledPartialEllipses).toEqual([]);
    expect(warranty.filledPartialEllipses).toEqual([]);
    expect(start.rotations.some((radians) => radians !== 0)).toBe(true);
    expect(warranty.rotations).toEqual(start.rotations);
  });

  it("keeps the shield readable without rotating its mesh in reduced motion", () => {
    const start = renderShieldTrace("start", { reducedMotion: true });
    const warranty = renderShieldTrace("warranty", { reducedMotion: true });

    expect(start.rotations.every((radians) => radians === 0)).toBe(true);
    expect(warranty.rotations).toEqual(start.rotations);
    expect(warranty.colors).toEqual(start.colors);
    expect(warranty.alphas).toEqual(start.alphas);
  });

  it("keeps activation and breathing subtle while preserving the breaking motion", () => {
    const firstFrame = renderShieldTrace("warranty", {
      elapsedSeconds: 0,
      shieldActivationSeconds: 0.22
    });
    const peak = renderShieldTrace("warranty", {
      elapsedSeconds: 0.154,
      shieldActivationSeconds: 0.066
    });
    const settled = renderShieldTrace("warranty", {
      elapsedSeconds: 0.22,
      shieldActivationSeconds: 0.000_001
    });
    const brightestBreath = renderShieldTrace("warranty", { elapsedSeconds: 0.45 });
    const softestBreath = renderShieldTrace("warranty", { elapsedSeconds: 1.35 });
    const breakStart = renderShieldTrace("start", {
      startProtectionSeconds: 0,
      elapsedSeconds: 1,
      warrantyBreakSeconds: SHIELD_BREAK_SECONDS - 0.000_001
    });
    const halfBreak = renderShieldTrace("start", {
      startProtectionSeconds: 0,
      elapsedSeconds: 1,
      warrantyBreakSeconds: SHIELD_BREAK_SECONDS / 2
    });
    const breakEnd = renderShieldTrace("start", {
      startProtectionSeconds: 0,
      elapsedSeconds: 1,
      warrantyBreakSeconds: 0.000_001
    });

    expect(firstFrame.scales[1]).toEqual([0.9, 0.9]);
    expect(peak.scales[1]?.[0]).toBeCloseTo(1.03, 3);
    expect(peak.alphas[1]).toBeLessThanOrEqual(0.82);
    expect(settled.scales[1]?.[0]).toBeCloseTo(1, 3);
    expect(settled.alphas[1]).toBeLessThanOrEqual(0.82);
    expect(brightestBreath.scales[1]).toEqual([1.01, 1.01]);
    expect(softestBreath.scales[1]).toEqual([0.99, 0.99]);
    expect(brightestBreath.alphas[1]).toBeCloseTo(0.82, 3);
    expect(softestBreath.alphas[1]).toBeCloseTo(0.72, 3);
    expect(halfBreak.scales[1]?.[0]).toBeCloseTo(1.04, 3);
    expect(halfBreak.alphas[1]).toBeCloseTo(0.5, 3);
    expect(breakStart.scales[1]?.[0]).toBeCloseTo(1, 3);
    expect(breakStart.alphas[1]).toBeCloseTo(1, 3);
    expect(breakEnd.scales[1]?.[0]).toBeCloseTo(1.08, 3);
    expect(breakEnd.alphas[1]).toBeCloseTo(0, 3);
  });
});
