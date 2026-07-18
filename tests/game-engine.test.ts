import { describe, expect, it } from "vitest";
import { BossDirector } from "../src/game/boss";
import { collectsPackage, collidesWithObstacle, rectanglesOverlap } from "../src/game/collision";
import { BOSS, GAMEPLAY, GROUND_Y } from "../src/game/constants";
import { getDifficulty, getStoryDifficulty } from "../src/game/difficulty";
import { createRunnerModel, queueJump, stepRunnerPhysics } from "../src/game/physics";
import { SeededRandom } from "../src/game/random";
import { RunnerGame } from "../src/game/RunnerGame";
import { WarehouseRenderer } from "../src/game/renderer";
import { SEMANTIC_OBSTACLE_PRESENTATION } from "../src/game/semantic-obstacle";
import { calculateScore, distanceInMeters, packageBonusScore } from "../src/game/scoring";
import {
  activateWave,
  calculateSpawnGap,
  createObstaclePool,
  createPackagePool,
  FairSpawner
} from "../src/game/spawning";
import type { SpawnWave } from "../src/game/spawning";
import type { ObstacleModel, PackageModel } from "../src/game/types";
import { calculateCanvasBuffer } from "../src/game/viewport";

describe("game random and spawning", () => {
  it("produces repeatable seeded sequences", () => {
    const first = new SeededRandom(2026);
    const second = new SeededRandom(2026);
    expect(Array.from({ length: 8 }, () => first.next())).toEqual(
      Array.from({ length: 8 }, () => second.next())
    );
  });

  it("keeps every obstacle gap above the difficulty floor", () => {
    const difficulty = getDifficulty(120);
    const speed = difficulty.speed;
    for (const randomUnit of [0, 0.25, 0.5, 0.99, 1]) {
      const gap = calculateSpawnGap(speed, difficulty, randomUnit);
      expect(gap / speed).toBeGreaterThanOrEqual(difficulty.minimumGapSeconds);
    }
  });

  it("creates the same fair waves for the same seed", () => {
    const difficulty = getDifficulty(35);
    const collect = () => {
      const spawner = new FairSpawner(new SeededRandom(44), difficulty.speed);
      const waves: Array<{
        kind: string;
        gapPixels: number;
        pattern: string;
        packages: string[];
      }> = [];
      for (let index = 0; index < 2_000 && waves.length < 6; index += 1) {
        const wave = spawner.advance(6, difficulty.speed, difficulty, 1_032);
        if (wave) {
          waves.push({
            kind: wave.kind,
            gapPixels: wave.gapPixels,
            pattern: wave.pattern,
            packages: wave.packages.map(
              (parcel) => `${parcel.kind}:${parcel.collectibleClass}:${parcel.x}:${parcel.y}`
            )
          });
        }
      }
      return waves;
    };

    expect(collect()).toEqual(collect());
    expect(collect()).toHaveLength(6);
  });

  it("mixes package layouts and all five ordinary order visuals without golden parcels", () => {
    const difficulty = getDifficulty(35);
    const spawner = new FairSpawner(new SeededRandom(44), difficulty.speed);
    const patterns = new Set<string>();
    const orderVisuals = new Set<string>();
    let waves = 0;

    for (let index = 0; index < 20_000 && waves < 80; index += 1) {
      const wave = spawner.advance(8, difficulty.speed, difficulty, 1_032);
      if (!wave) continue;
      waves += 1;
      patterns.add(wave.pattern);
      wave.packages.filter(({ kind }) => kind === "standard")
        .forEach(({ orderVisualType, collectibleClass, packageType }) => {
          orderVisuals.add(orderVisualType);
          if (orderVisualType === "parcel") {
            expect(collectibleClass).toBe("parcel");
          } else {
            expect(collectibleClass).toBe("equipment");
            expect(packageType).toBe(orderVisualType);
          }
        });
    }

    expect(waves).toBe(80);
    expect(patterns.size).toBe(14);
    expect(orderVisuals).toEqual(new Set(["notebook", "telefon", "pc", "lcd", "parcel"]));
  });

  it("does not partially activate a wave when the package pool is exhausted", () => {
    const difficulty = getDifficulty(35);
    const spawner = new FairSpawner(new SeededRandom(91), difficulty.speed);
    let wave: SpawnWave | null = null;
    for (let index = 0; index < 1_000 && wave === null; index += 1) {
      wave = spawner.advance(8, difficulty.speed, difficulty, 1_032);
    }
    if (!wave) throw new Error("wave was not generated");

    const obstacles = createObstaclePool(1);
    const packages = createPackagePool(2);
    expect(activateWave(wave, obstacles, packages)).toBe(false);
    expect(obstacles.some((obstacle) => obstacle.active)).toBe(false);
    expect(packages.some((parcel) => parcel.active)).toBe(false);
  });
});

describe("boss encounter", () => {
  it("paces the authored encounter for a 45–60 second finale", () => {
    const boss = new BossDirector();
    const stepSeconds = 0.1;
    const hazardTravelSeconds = 2.9;
    let elapsed = 0;
    let hazardRemaining = 0;
    boss.forceEncounter();

    for (let guard = 0; guard < 1_000; guard += 1) {
      elapsed += stepSeconds;
      const hazardActive = hazardRemaining > 0;
      const command = boss.advance(stepSeconds, elapsed, !hazardActive, hazardActive);
      hazardRemaining = Math.max(0, hazardRemaining - stepSeconds);
      if (command.type === "attack") hazardRemaining = hazardTravelSeconds;
      if (command.type === "complete") break;
    }

    expect(boss.model.attacksSurvived).toBe(BOSS.attackCount);
    expect(elapsed).toBeGreaterThanOrEqual(45);
    expect(elapsed).toBeLessThanOrEqual(60);
  });

  it("runs eight combinations across three phases before the reward", () => {
    const boss = new BossDirector();
    let elapsed = BOSS.firstAtSeconds - 0.1;
    expect(boss.advance(0.1, elapsed, true, false).type).toBe("none");
    expect(boss.model.phase).toBe("inactive");

    elapsed = BOSS.firstAtSeconds;
    boss.advance(0.1, elapsed, true, false);
    expect(boss.model.phase).toBe("warning");
    expect(boss.blocksRegularSpawns).toBe(true);

    while (boss.model.phase === "warning") {
      elapsed += 0.1;
      boss.advance(0.1, elapsed, true, false);
    }

    const attackKinds: string[] = [];
    let completionCount = 0;
    for (let step = 0; step < 500 && boss.model.phase !== "reward"; step += 1) {
      elapsed += 0.1;
      const command = boss.advance(0.1, elapsed, true, false);
      if (command.type !== "attack") continue;
      attackKinds.push(command.kind);
      elapsed += 0.1;
      boss.advance(0.1, elapsed, false, true);
      elapsed += 0.1;
      const resolution = boss.advance(0.1, elapsed, true, false);
      if (resolution.type === "complete") completionCount += 1;
    }

    expect(attackKinds).toEqual([
      "pallet",
      "overhead",
      "trolley",
      "pallet",
      "overhead",
      "trolley",
      "pallet",
      "overhead"
    ]);
    expect(boss.model.encounterPhase).toBe(3);
    expect(boss.model.attacksSurvived).toBe(8);
    expect(boss.model.phase).toBe("reward");
    expect(completionCount).toBe(1);

    const completedAt = elapsed;
    boss.advance(BOSS.rewardSeconds + 0.1, completedAt + BOSS.rewardSeconds + 0.1, true, false);
    expect(boss.model.phase).toBe("inactive");
    boss.advance(0.1, completedAt + BOSS.intervalSeconds - 0.1, true, false);
    expect(boss.model.phase).toBe("inactive");
    boss.advance(0.1, completedAt + BOSS.intervalSeconds, true, false);
    expect(boss.model.phase).toBe("warning");
  });

  it("repeats an unfinished combination after a story collision", () => {
    const boss = new BossDirector();
    boss.forceEncounter();
    boss.advance(0, 0, true, false);
    boss.advance(BOSS.warningSeconds, BOSS.warningSeconds, true, false);

    const first = boss.advance(BOSS.firstAttackDelaySeconds, 2, true, false);
    expect(first).toEqual({ type: "attack", kind: "pallet" });
    expect(boss.model.attacksSurvived).toBe(0);

    boss.resolveCollision();
    expect(boss.model.attacksSurvived).toBe(0);
    const retry = boss.advance(BOSS.betweenAttacksSeconds, 3, true, false);
    expect(retry).toEqual({ type: "attack", kind: "pallet" });
  });

  it("waits for a clear route and resets the full encounter state", () => {
    const boss = new BossDirector();
    boss.advance(0.1, BOSS.firstAtSeconds, false, false);
    expect(boss.model.phase).toBe("pending");
    boss.advance(2, BOSS.firstAtSeconds + 2, false, false);
    expect(boss.model.phase).toBe("pending");

    boss.advance(0.1, BOSS.firstAtSeconds + 2.1, true, false);
    expect(boss.model.phase).toBe("warning");
    boss.reset();
    expect(boss.model.phase).toBe("inactive");
    expect(boss.model.attacksLaunched).toBe(0);
    expect(boss.model.attacksSurvived).toBe(0);
    expect(boss.blocksRegularSpawns).toBe(false);
  });
});

describe("runner physics", () => {
  it("jumps, reaches the air and lands back on the exact floor", () => {
    const runner = createRunnerModel();
    const floorY = runner.y;
    queueJump(runner);

    let minimumY = runner.y;
    for (let index = 0; index < 240; index += 1) {
      stepRunnerPhysics(runner, 1 / 120);
      minimumY = Math.min(minimumY, runner.y);
    }

    expect(minimumY).toBeLessThan(floorY - 100);
    expect(runner.grounded).toBe(true);
    expect(runner.y).toBe(floorY);
    expect(runner.velocityY).toBe(0);
  });

  it("honours a buffered jump just before landing", () => {
    const runner = createRunnerModel();
    runner.grounded = false;
    runner.coyoteRemaining = 0;
    runner.y = GROUND_Y - runner.height - 0.5;
    runner.velocityY = 180;
    queueJump(runner);

    stepRunnerPhysics(runner, 1 / 120);
    expect(runner.grounded).toBe(true);
    stepRunnerPhysics(runner, 1 / 120);
    expect(runner.grounded).toBe(false);
    expect(runner.velocityY).toBeLessThan(0);
  });
});

describe("collision and scoring", () => {
  it("uses forgiving hitboxes while still detecting a direct collision", () => {
    const runner = createRunnerModel();
    const obstacle: ObstacleModel = {
      active: true,
      kind: "box-stack",
      source: "normal",
      x: runner.x + 28,
      y: GROUND_Y - 62,
      width: 52,
      height: 62
    };

    expect(collidesWithObstacle(runner, obstacle)).toBe(true);
    obstacle.x = runner.x + runner.width;
    expect(collidesWithObstacle(runner, obstacle)).toBe(false);
    expect(rectanglesOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 2, height: 2 })).toBe(false);
  });

  it("collects active packages and ignores inactive ones", () => {
    const runner = createRunnerModel();
    const parcel: PackageModel = {
      active: true,
      kind: "standard",
      collectibleClass: "equipment",
      x: runner.x + 18,
      y: runner.y + 30,
      size: 30,
      phase: 0,
      packageType: "notebook",
      orderVisualType: "notebook",
      weightKg: 0
    };
    expect(collectsPackage(runner, parcel)).toBe(true);
    parcel.active = false;
    expect(collectsPackage(runner, parcel)).toBe(false);
  });

  it("adds 100 points per parcel to full metres", () => {
    expect(distanceInMeters(349)).toBe(9);
    expect(calculateScore(349, 3)).toBe(309);
    expect(calculateScore(349, 3, 250)).toBe(559);
    expect(packageBonusScore(GAMEPLAY.packageScore)).toBe(0);
    expect(packageBonusScore(GAMEPLAY.packageScore + 250)).toBe(250);
    expect(calculateScore(0, 0, BOSS.scoreBonus)).toBe(BOSS.scoreBonus);
  });
});

describe("difficulty and responsive canvas", () => {
  it("ramps the story from 0.85x to 1.35x using active play only", () => {
    const settings = { speedStartMultiplier: 0.85, speedMaxMultiplier: 1.35 };
    expect(getStoryDifficulty(0, 210, settings).speedMultiplier).toBe(0.85);
    expect(getStoryDifficulty(105, 210, settings).speedMultiplier).toBeCloseTo(1.1);
    expect(getStoryDifficulty(210, 210, settings).speedMultiplier).toBe(1.35);
    expect(getStoryDifficulty(600, 210, settings).speedMultiplier).toBe(1.35);
  });

  it("follows the intended speed plateaus without exceeding 1.55x", () => {
    expect(getDifficulty(0).speedMultiplier).toBe(1);
    expect(getDifficulty(15).speedMultiplier).toBe(1);
    expect(getDifficulty(40).speedMultiplier).toBeCloseTo(1.2);
    expect(getDifficulty(75).speedMultiplier).toBeCloseTo(1.4);
    expect(getDifficulty(1_000).speedMultiplier).toBeCloseTo(1.55);
  });

  it("caps DPR, backing pixels and maximum texture dimensions", () => {
    const regular = calculateCanvasBuffer(960, 540, 3);
    expect(regular.dpr).toBeLessThanOrEqual(2);
    expect(regular.width * regular.height).toBeLessThanOrEqual(2_100_000);

    const oversized = calculateCanvasBuffer(6_000, 4_000, 2);
    expect(oversized.width).toBeLessThanOrEqual(2_048);
    expect(oversized.height).toBeLessThanOrEqual(2_048);
    expect(oversized.width * oversized.height).toBeLessThanOrEqual(2_100_000);
  });
});

describe("boss rendering", () => {
  it("keeps every obstacle family free of overlay copy while package labels stay visible", () => {
    const drawnText: string[] = [];
    const contextTarget: Record<PropertyKey, unknown> = {
      createLinearGradient: () => ({ addColorStop(): void {} }),
      fillText: (value: string) => drawnText.push(value)
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
    const semanticVariants = Object.keys(SEMANTIC_OBSTACLE_PRESENTATION) as Array<
      keyof typeof SEMANTIC_OBSTACLE_PRESENTATION
    >;
    const obstacles = createObstaclePool(semanticVariants.length);
    const obstacleFixtures = [
      { kind: "pallet", y: 410, width: 92, height: 72 },
      { kind: "trolley", y: 395, width: 78, height: 88 },
      { kind: "overhead", y: 318, width: 76, height: 70 },
      { kind: "box-stack", y: 386, width: 76, height: 96 }
    ] as const;
    obstacles.forEach((obstacle, index) => {
      const fixture = obstacleFixtures[index % obstacleFixtures.length]!;
      obstacle.active = true;
      obstacle.kind = fixture.kind;
      obstacle.semanticVariant = semanticVariants[index]!;
      obstacle.x = 420 + index * 24;
      obstacle.y = fixture.y;
      obstacle.width = fixture.width;
      obstacle.height = fixture.height;
    });
    const parcel = createPackagePool(1)[0]!;
    parcel.active = true;
    parcel.storyOrder = true;
    parcel.packageType = "pc";
    parcel.x = 420;
    parcel.y = 380;

    new WarehouseRenderer().render(context, 960, 540, {
      state: "running",
      runner: createRunnerModel(),
      obstacles,
      packages: [parcel],
      boss: new BossDirector().model,
      elapsedSeconds: 1,
      distancePixels: 100,
      speed: 280,
      reducedMotion: false,
      impact: false,
      epochIndex: 0,
      epochName: "",
      epochYear: "",
      themeIndex: -1,
      cutscene: null,
      activePowerUps: []
    });

    expect(drawnText).toContain("PC");
    const obstacleLabels = Object.values(SEMANTIC_OBSTACLE_PRESENTATION)
      .map(({ label }) => label);
    expect(drawnText).not.toEqual(expect.arrayContaining(obstacleLabels));
  });

  it("uses configurable labels on power-up parcels", () => {
    const drawnText: string[] = [];
    const contextTarget: Record<PropertyKey, unknown> = {
      createLinearGradient: () => ({ addColorStop(): void {} }),
      fillText: (value: string) => drawnText.push(value)
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
    const parcel = createPackagePool(1)[0]!;
    parcel.active = true;
    parcel.kind = "gwarancja_48";
    parcel.x = 420;
    parcel.y = 380;

    new WarehouseRenderer().render(context, 960, 540, {
      state: "running",
      runner: createRunnerModel(),
      obstacles: [],
      packages: [parcel],
      boss: new BossDirector().model,
      elapsedSeconds: 1,
      distancePixels: 100,
      speed: 280,
      reducedMotion: false,
      impact: false,
      epochIndex: 0,
      epochName: "",
      epochYear: "",
      themeIndex: -1,
      cutscene: null,
      activePowerUps: [],
      powerUpCopy: {
        gwarancja_48: ["TESTOWA", "ETYKIETA"]
      }
    });

    expect(drawnText).toEqual(expect.arrayContaining(["TESTOWA", "ETYKIETA"]));
    expect(drawnText).not.toContain("GWARANCJA");
  });

  it("renders warning, attack and reward states with an ordinary order", () => {
    const contextTarget: Record<PropertyKey, unknown> = {
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
    const packages = createPackagePool();
    const order = packages[0];
    if (!order) throw new Error("package pool is empty");
    order.active = true;
    order.kind = "standard";
    order.x = 560;
    order.y = 350;
    const renderer = new WarehouseRenderer();

    for (const phase of ["warning", "attacking", "reward"] as const) {
      expect(() => renderer.render(context, 960, 540, {
        state: "running",
        runner: createRunnerModel(),
        obstacles: createObstaclePool(),
        packages,
        boss: {
          phase,
          encounterPhase: phase === "reward" ? 3 : 1,
          cycle: 1,
          attacksLaunched: 1,
          attacksSurvived: phase === "reward" ? 8 : 1,
          attackCount: 8,
          phaseSecondsRemaining: 1,
          x: 800,
          y: 256,
          width: 164,
          height: 176
        },
        elapsedSeconds: 34,
        distancePixels: 8_400,
        speed: 340,
        reducedMotion: false,
        impact: false,
        epochIndex: 0,
        epochName: "",
        epochYear: "",
        themeIndex: -1,
        cutscene: null,
        activePowerUps: []
      })).not.toThrow();
    }
  });
});

describe("RunnerGame lifecycle", () => {
  it("implements ready, run, pause, reset and destroy without leaking a frame", () => {
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrameId = 0;
    const view = {
      devicePixelRatio: 2,
      requestAnimationFrame(callback: FrameRequestCallback): number {
        nextFrameId += 1;
        frames.set(nextFrameId, callback);
        return nextFrameId;
      },
      cancelAnimationFrame(id: number): void {
        frames.delete(id);
      },
      addEventListener(): void {},
      removeEventListener(): void {}
    };
    const documentMock = {
      defaultView: view,
      visibilityState: "visible",
      addEventListener(): void {},
      removeEventListener(): void {}
    };
    const contextTarget: Record<PropertyKey, unknown> = {
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
    const canvas = {
      width: 960,
      height: 540,
      clientWidth: 960,
      clientHeight: 540,
      ownerDocument: documentMock,
      getContext: () => context,
      getBoundingClientRect: () => ({ width: 960, height: 540 })
    } as unknown as HTMLCanvasElement;
    const states: string[] = [];
    const snapshots: number[] = [];
    const game = new RunnerGame(
      canvas,
      {
        onStateChange: (state) => states.push(state),
        onSnapshot: (snapshot) => snapshots.push(snapshot.score)
      },
      { seed: 7, reducedMotion: true }
    );

    expect(game.state).toBe("ready");
    expect(canvas.width).toBe(1_920);
    game.start("pointer");
    expect(game.state).toBe("running");
    expect(frames.size).toBe(1);
    game.pause();
    expect(frames.size).toBe(0);
    game.resume();
    expect(frames.size).toBe(1);
    game.reset();
    expect(game.state).toBe("ready");
    expect(frames.size).toBe(0);
    game.destroy();
    expect(game.state).toBe("destroyed");
    expect(states).toEqual(["running", "paused", "running", "ready", "destroyed"]);
    expect(snapshots.length).toBeGreaterThanOrEqual(2);
  });
});
