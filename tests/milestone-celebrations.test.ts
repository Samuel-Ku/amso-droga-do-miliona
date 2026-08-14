import { describe, expect, it, vi } from "vitest";
import {
  MILESTONE_CELEBRATION_KINDS,
  MILESTONE_CELEBRATION_PRESENTATION,
  MilestoneCelebrationDirector,
  nextOrderMilestone
} from "../src/game/milestone-celebration";
import { createRunnerModel } from "../src/game/physics";
import { WarehouseRenderer } from "../src/game/renderer";
import { renderWorld } from "./helpers/render-world";
import { CelebrationManager } from "../src/game/celebration-manager";
import type { RenderScene } from "../src/game/types";

function createCelebrationScene(
  reducedMotion: boolean,
  threshold: number,
  isRecord = false,
): RenderScene {
  const manager = new CelebrationManager();
  manager.trigger({ threshold, isRecord, playerX: 142, playerY: 400 });
  manager.update(0.15);

  return {
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
    celebration: manager.getState()
  };
}

describe("order milestone celebrations", () => {
  it("uses one recognizable celebration family with a proper fanfare", () => {
    expect(Object.keys(MILESTONE_CELEBRATION_PRESENTATION)).toEqual(MILESTONE_CELEBRATION_KINDS);
    expect(MILESTONE_CELEBRATION_KINDS).toEqual(["order-confetti"]);
    expect(Object.values(MILESTONE_CELEBRATION_PRESENTATION).every(
      ({ durationSeconds, audioNotes }) =>
        durationSeconds >= 1.2 && durationSeconds <= 1.5 && audioNotes.length >= 3
    )).toBe(true);
  });

  it("generates the open-ended 10, 50, 100, 500, 1 000 sequence", () => {
    const values = [10];
    for (let index = 0; index < 8; index += 1) {
      values.push(nextOrderMilestone(values.at(-1)!, index));
    }
    expect(values).toEqual([10, 50, 100, 500, 1_000, 5_000, 10_000, 50_000, 100_000]);
  });

  it("emits every crossed threshold once and makes the same celebration family richer", () => {
    const director = new MilestoneCelebrationDirector();
    const events = [
      ...director.recordOrders(10),
      ...director.recordOrders(10),
      ...director.recordOrders(50),
      ...director.recordOrders(100),
      ...director.recordOrders(500),
      ...director.recordOrders(1_000),
      ...director.recordOrders(5_000)
    ];

    expect(events.map(({ threshold }) => threshold)).toEqual([10, 50, 100, 500, 1_000, 5_000]);
    expect(new Set(events.map(({ kind }) => kind))).toEqual(new Set(MILESTONE_CELEBRATION_KINDS));
    expect(events[0]!.intensity).toBe(1);
    expect(events[4]!.intensity).toBeGreaterThan(events[0]!.intensity);
    expect(events[5]!.intensity).toBeGreaterThanOrEqual(events[4]!.intensity);
    expect(events[4]!.text).toBe("1 000 PACZEK!");
    expect(events.every(({ durationSeconds }) => durationSeconds >= 1.2 && durationSeconds <= 1.8))
      .toBe(true);
  });

  it("keeps queued celebrations through one run and resets them for a new run", () => {
    const director = new MilestoneCelebrationDirector();
    director.recordOrders(10);
    director.advance(0.5);
    expect(director.snapshot?.threshold).toBe(10);
    director.advance(2);
    expect(director.snapshot).toBeNull();

    director.reset();
    expect(director.recordOrders(10)[0]?.threshold).toBe(10);
    expect(director.nextThreshold).toBe(50);
  });

  it("merges a new record with a simultaneous round threshold", () => {
    const director = new MilestoneCelebrationDirector();
    const events = director.recordOrders(10, true, "NOWY REKORD");

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: "order-confetti",
      achievement: "record",
      text: "NOWY REKORD · 10 PACZEK!"
    });
    expect(director.snapshot?.text).toBe("NOWY REKORD · 10 PACZEK!");
  });

  it("presents a new record once even when no round threshold is crossed", () => {
    const director = new MilestoneCelebrationDirector();
    expect(director.recordAchievement(7, "NOWY REKORD")).toMatchObject({
      threshold: 7,
      kind: "order-confetti",
      achievement: "record",
      text: "NOWY REKORD"
    });
    expect(director.snapshot?.text).toBe("NOWY REKORD");
  });

  it("removes moving particles for reduced motion", () => {
    const animatedScene = createCelebrationScene(false, 100);
    const reducedScene = createCelebrationScene(true, 100);
    const renderer = new WarehouseRenderer();

    const rotate = vi.fn();
    const animatedTarget: Record<PropertyKey, unknown> = {
      rotate,
      createLinearGradient: () => ({ addColorStop(): void {} })
    };
    const animatedContext = new Proxy(animatedTarget, {
      get(record, key) { if (key in record) return record[key]; return (): void => {}; },
      set(record, key, value) { record[key] = value; return true; }
    }) as unknown as CanvasRenderingContext2D;

    const reducedRotate = vi.fn();
    const reducedTarget: Record<PropertyKey, unknown> = {
      rotate: reducedRotate,
      createLinearGradient: () => ({ addColorStop(): void {} })
    };
    const reducedContext = new Proxy(reducedTarget, {
      get(record, key) { if (key in record) return record[key]; return (): void => {}; },
      set(record, key, value) { record[key] = value; return true; }
    }) as unknown as CanvasRenderingContext2D;

    renderWorld(renderer, animatedContext, 960, 540, animatedScene);
    renderWorld(renderer, reducedContext, 960, 540, reducedScene);

    expect(rotate).toHaveBeenCalled();
    expect(reducedRotate).not.toHaveBeenCalled();
  });
});
