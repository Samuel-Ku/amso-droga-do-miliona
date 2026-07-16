import { describe, expect, it, vi } from "vitest";
import {
  MILESTONE_CELEBRATION_KINDS,
  MILESTONE_CELEBRATION_PRESENTATION,
  MilestoneCelebrationDirector,
  nextPackageMilestone
} from "../src/game/milestone-celebration";
import { createRunnerModel } from "../src/game/physics";
import { WarehouseRenderer } from "../src/game/renderer";
import type { RenderScene } from "../src/game/types";

function renderingHarness(reducedMotion: boolean): {
  context: CanvasRenderingContext2D;
  bezierCurveTo: ReturnType<typeof vi.fn>;
  scene: RenderScene;
} {
  const bezierCurveTo = vi.fn();
  const target: Record<PropertyKey, unknown> = {
    bezierCurveTo,
    createLinearGradient: () => ({ addColorStop(): void {} })
  };
  const context = new Proxy(target, {
    get(record, key) {
      if (key in record) return record[key];
      return (): void => {};
    },
    set(record, key, value) {
      record[key] = value;
      return true;
    }
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
    milestoneCelebration: {
      threshold: 100,
      kind: "ribbons",
      intensity: 1,
      durationSeconds: 1.35,
      remainingSeconds: 0.8,
      progress: 0.4,
      text: "100 PACZEK!"
    }
  };
  return { context, bezierCurveTo, scene };
}

describe("package milestone celebrations", () => {
  it("defines duration and audio presentation for every rotating variant", () => {
    expect(Object.keys(MILESTONE_CELEBRATION_PRESENTATION)).toEqual(MILESTONE_CELEBRATION_KINDS);
    expect(Object.values(MILESTONE_CELEBRATION_PRESENTATION).every(
      ({ durationSeconds, audioNotes }) =>
        durationSeconds >= 1.2 && durationSeconds <= 1.5 && audioNotes.length >= 3
    )).toBe(true);
  });

  it("generates the open-ended 10, 50, 100, 500, 1 000 sequence", () => {
    const values = [10];
    for (let index = 0; index < 8; index += 1) {
      values.push(nextPackageMilestone(values.at(-1)!, index));
    }
    expect(values).toEqual([10, 50, 100, 500, 1_000, 5_000, 10_000, 50_000, 100_000]);
  });

  it("emits every crossed threshold exactly once with rotating variants", () => {
    const director = new MilestoneCelebrationDirector();
    const events = [
      ...director.recordPackages(10),
      ...director.recordPackages(10),
      ...director.recordPackages(50),
      ...director.recordPackages(100),
      ...director.recordPackages(500),
      ...director.recordPackages(1_000),
      ...director.recordPackages(5_000)
    ];

    expect(events.map(({ threshold }) => threshold)).toEqual([10, 50, 100, 500, 1_000, 5_000]);
    expect(events.slice(0, 5).map(({ kind }) => kind)).toEqual(MILESTONE_CELEBRATION_KINDS);
    expect(events[0]!.intensity).toBe(1);
    expect(events[4]!.intensity).toBe(1);
    expect(events[5]!.intensity).toBe(2);
    expect(events[4]!.text).toBe("1 000 PACZEK!");
    expect(events.every(({ durationSeconds }) => durationSeconds >= 1.2 && durationSeconds <= 1.5))
      .toBe(true);
  });

  it("keeps queued celebrations through one run and resets them for a new run", () => {
    const director = new MilestoneCelebrationDirector();
    director.recordPackages(10);
    director.advance(0.5);
    expect(director.snapshot?.threshold).toBe(10);
    director.advance(2);
    expect(director.snapshot).toBeNull();

    director.reset();
    expect(director.recordPackages(10)[0]?.threshold).toBe(10);
    expect(director.nextThreshold).toBe(50);
  });

  it("removes moving particles for reduced motion", () => {
    const animated = renderingHarness(false);
    const reduced = renderingHarness(true);
    const renderer = new WarehouseRenderer();

    renderer.render(animated.context, 960, 540, animated.scene);
    renderer.render(reduced.context, 960, 540, reduced.scene);

    expect(animated.bezierCurveTo).toHaveBeenCalled();
    expect(reduced.bezierCurveTo).not.toHaveBeenCalled();
  });
});
