import { describe, expect, it } from "vitest";
import {
  collidesWithObstacle,
  obstacleHitbox,
  rectanglesOverlap
} from "../src/game/collision";
import { GROUND_Y, OVERHEAD, RUNNER_WIDTH, RUNNER_X } from "../src/game/constants";
import { getChallengeDifficulty } from "../src/game/difficulty";
import { createRunnerModel } from "../src/game/physics";
import { SeededRandom } from "../src/game/random";
import {
  createBossAttackWave,
  createAuthoredRewardWave,
  createObstaclePool,
  createPackagePool,
  activateWave,
  authoredRewardSpawnX,
  ChallengeRewardDirector,
  findSafeCollectibleX,
  FairSpawner,
  MIN_AUTHORED_REACTION_SECONDS,
  OBSTACLE_PATTERN_CATALOG,
  PACKAGE_PATTERN_HEIGHTS,
  PACKAGE_PATTERN_IDS,
  REWARD_ROUTE_FAMILIES,
  validateSpawnWaveGeometry,
  type SpawnWave
} from "../src/game/spawning";
import type { ObstacleModel, PackageKind } from "../src/game/types";

const CHALLENGE_DIFFICULTY = {
  speedStartMultiplier: 1.3,
  speedMaxMultiplier: 2.2
} as const;
const SPAWN_X = 1_032;
const PACKAGE_SIZE = 30;
const PACKAGE_HITBOX_INSET = PACKAGE_SIZE * 0.18;

function obstacleFromWave(wave: Readonly<SpawnWave>, x = wave.x): ObstacleModel {
  return {
    active: true,
    kind: wave.kind,
    source: wave.source,
    x,
    y: wave.y,
    width: wave.width,
    height: wave.height
  };
}

function isSpecial(kind: PackageKind): boolean {
  return kind !== "standard";
}

describe("challenge spawning fairness", () => {
  it("keeps three to six physical parcels when a story equipment reward is added", () => {
    for (const packageCount of [3, 4, 5, 6]) {
      const wave = createAuthoredRewardWave({
        action: packageCount % 2 === 0 ? "slide" : "jump",
        spawnX: SPAWN_X,
        speed: 280,
        packageCount,
        rewards: [{ kind: "standard", packageType: "pc", storyOrder: true }]
      });

      expect(wave).not.toBeNull();
      expect(wave?.packages.filter(({ collectibleClass }) => collectibleClass === "parcel"))
        .toHaveLength(packageCount);
      expect(wave?.packages.filter(({ collectibleClass }) => collectibleClass === "equipment"))
        .toMatchObject([{ packageType: "pc", storyOrder: true }]);
    }
  });

  it("builds deterministic challenge waves with five to eight parcels and separated equipment", () => {
    const first = new ChallengeRewardDirector(new SeededRandom(7821));
    const second = new ChallengeRewardDirector(new SeededRandom(7821));
    const signatures: string[] = [];
    let parcelTotal = 0;
    let equipmentTotal = 0;

    for (let index = 0; index < 80; index += 1) {
      const packageCount = 5 + (index % 4);
      const options = {
        action: index % 2 === 0 ? "jump" as const : "slide" as const,
        spawnX: authoredRewardSpawnX(420, SPAWN_X, 1.2),
        speed: 420,
        packageCount,
        patternIndex: index,
        minimumReactionSeconds: 1.2
      };
      const wave = first.createWave(options);
      const repeated = second.createWave(options);
      expect(wave).not.toBeNull();
      expect(repeated).toEqual(wave);
      if (!wave) continue;
      const parcels = wave.packages.filter(({ collectibleClass }) => collectibleClass === "parcel");
      const equipment = wave.packages.filter(({ collectibleClass }) => collectibleClass === "equipment");
      expect(parcels).toHaveLength(packageCount);
      expect(equipment.length).toBeGreaterThanOrEqual(1);
      expect(equipment.length).toBeLessThanOrEqual(2);
      parcelTotal += parcels.length;
      equipmentTotal += equipment.length;
      const ordered = [...wave.packages].sort((left, right) => left.x - right.x);
      for (let item = 1; item < ordered.length; item += 1) {
        expect(
          ordered[item - 1]?.collectibleClass === "equipment" &&
          ordered[item]?.collectibleClass === "equipment"
        ).toBe(false);
      }
      signatures.push(equipment.map(({ packageType }) => packageType).join("+"));
      for (let left = Math.floor(wave.packages[0]?.x ?? 0) - 960;
        left <= Math.ceil(wave.packages.at(-1)?.x ?? 0); left += 24) {
        const visible = wave.packages.filter(({ x }) => x + PACKAGE_SIZE > left && x < left + 960);
        expect(visible.length).toBeLessThanOrEqual(7);
      }
    }

    expect(new Set(signatures.join("+").split("+")))
      .toEqual(new Set(["notebook", "telefon", "pc", "lcd"]));
    expect(equipmentTotal / (parcelTotal + equipmentTotal)).toBeGreaterThan(0.17);
    expect(equipmentTotal / (parcelTotal + equipmentTotal)).toBeLessThan(0.23);
  });

  it("publishes the complete readable risk-reward route library", () => {
    expect(REWARD_ROUTE_FAMILIES).toEqual([
      "arc", "low-line", "rising-steps", "falling-steps", "split-groups",
      "premium-finale", "alternate-route"
    ]);
  });

  it("gives every challenge route family a materially distinct geometry", () => {
    const director = new ChallengeRewardDirector(new SeededRandom(913));
    const waves = REWARD_ROUTE_FAMILIES.map((family, index) => {
      const action = index % 2 === 0 ? "jump" as const : "slide" as const;
      const wave = director.createWave({
        action,
        obstacleKind: action === "jump" ? "pallet" : "overhead",
        spawnX: authoredRewardSpawnX(420, SPAWN_X, 1.2),
        speed: 420,
        packageCount: 6,
        patternIndex: index,
        minimumReactionSeconds: 1.2
      });
      expect(wave?.rewardRouteFamily).toBe(family);
      return wave!;
    });

    const ordered = waves.map((wave) => [...wave.packages].sort((left, right) => left.x - right.x));
    expect(new Set(ordered[0]!.map(({ y }) => Math.round(y))).size).toBeGreaterThan(2);
    expect(new Set(ordered[1]!
      .filter(({ collectibleClass }) => collectibleClass === "parcel")
      .map(({ y }) => Math.round(y)))).toHaveProperty("size", 1);

    const risingParcels = ordered[2]!.filter(({ collectibleClass }) => collectibleClass === "parcel");
    const fallingParcels = ordered[3]!.filter(({ collectibleClass }) => collectibleClass === "parcel");
    expect(risingParcels[0]!.y).toBeGreaterThan(risingParcels.at(-1)!.y);
    expect(fallingParcels[0]!.y).toBeLessThan(fallingParcels.at(-1)!.y);

    const ordinaryGaps = ordered[0]!.slice(1).map((item, index) => item.x - ordered[0]![index]!.x);
    const splitGaps = ordered[4]!.slice(1).map((item, index) => item.x - ordered[4]![index]!.x);
    expect(Math.max(...splitGaps)).toBeGreaterThan(Math.max(...ordinaryGaps));
    expect(ordered[5]!.at(-1)?.collectibleClass).toBe("equipment");

    const alternate = ordered[6]!;
    const equipmentY = alternate
      .filter(({ collectibleClass }) => collectibleClass === "equipment")
      .reduce((sum, item) => sum + item.y, 0) /
      alternate.filter(({ collectibleClass }) => collectibleClass === "equipment").length;
    const parcelY = alternate
      .filter(({ collectibleClass }) => collectibleClass === "parcel")
      .reduce((sum, item) => sum + item.y, 0) /
      alternate.filter(({ collectibleClass }) => collectibleClass === "parcel").length;
    expect(equipmentY).toBeLessThan(parcelY);
  });

  it("makes equipment reachable within eight seconds and never leaves a twelve-second gap", () => {
    const speed = 280 * CHALLENGE_DIFFICULTY.speedStartMultiplier;
    const director = new ChallengeRewardDirector(new SeededRandom(3719));
    const equipmentReachTimes: number[] = [];
    let nextSpawnSeconds = 0;

    for (let index = 0; index < 24; index += 1) {
      const wave = director.createWave({
        action: index % 2 === 0 ? "jump" : "slide",
        spawnX: authoredRewardSpawnX(speed, SPAWN_X, 1.2),
        speed,
        packageCount: 5 + (index % 4),
        patternIndex: index,
        minimumReactionSeconds: 1.2
      });
      expect(wave).not.toBeNull();
      if (!wave) continue;
      for (const equipment of wave.packages.filter(({ collectibleClass }) =>
        collectibleClass === "equipment"
      )) {
        equipmentReachTimes.push(nextSpawnSeconds + (equipment.x - RUNNER_X) / speed);
      }
      const lastX = Math.max(...wave.packages.map(({ x }) => x), wave.x + wave.width);
      nextSpawnSeconds += (lastX + PACKAGE_SIZE) / speed + 1.1;
    }

    expect(equipmentReachTimes[0]).toBeLessThanOrEqual(8);
    for (let index = 1; index < equipmentReachTimes.length; index += 1) {
      expect(equipmentReachTimes[index]! - equipmentReachTimes[index - 1]!).toBeLessThanOrEqual(12);
    }
  });

  it("validates every challenge obstacle family across seeds and the full speed range", () => {
    const variants = [
      ["jump", "pallet"], ["jump", "box-stack"], ["jump", "trolley"],
      ["slide", "overhead"]
    ] as const;
    for (const speed of [280 * 1.3, 280 * 2.2, 280 * 3.5]) {
      for (let seed = 1; seed <= 12; seed += 1) {
        const director = new ChallengeRewardDirector(new SeededRandom(seed));
        for (let index = 0; index < variants.length; index += 1) {
          const [action, obstacleKind] = variants[index]!;
          const wave = director.createWave({
            action,
            obstacleKind,
            spawnX: authoredRewardSpawnX(speed, SPAWN_X, 1.2),
            speed,
            packageCount: 5 + ((seed + index) % 4),
            patternIndex: index,
            minimumReactionSeconds: 1.2
          });
          expect(wave).not.toBeNull();
          if (wave) expect(validateSpawnWaveGeometry(wave, speed, 1.2)).toBeNull();
        }
      }
    }
  });

  it("rejects a premium route assembled from mutually exclusive jump timings", () => {
    const reward = (
      x: number,
      y: number,
      collectibleClass: "parcel" | "equipment",
      packageType: "notebook" | "telefon" = "notebook"
    ) => ({
      x, y, phase: 0, kind: "standard" as const, collectibleClass, packageType,
      orderVisualType: collectibleClass === "parcel" ? "parcel" as const : packageType,
      weightKg: 1
    });
    const impossiblePremiumRoute: SpawnWave = {
      kind: "pallet",
      source: "normal",
      pattern: "five-arc",
      obstaclePattern: "temporal-regression",
      x: 1_600,
      y: 382,
      width: 80,
      height: 50,
      gapPixels: 220,
      packages: [
        reward(2_200, 247, "equipment", "notebook"),
        reward(2_200, 400, "equipment", "telefon"),
        reward(2_400, 390, "parcel"),
        reward(2_550, 390, "parcel"),
        reward(2_700, 390, "parcel")
      ]
    };

    expect(validateSpawnWaveGeometry(impossiblePremiumRoute, 980, 1.2))
      .toBe("premium jump route is unreachable");
  });

  it("publishes fourteen parcel patterns from one to seven parcels", () => {
    expect(PACKAGE_PATTERN_IDS).toHaveLength(14);
    const counts = new Set(PACKAGE_PATTERN_IDS.map((id) => PACKAGE_PATTERN_HEIGHTS[id].length));
    expect([...counts].sort((left, right) => left - right)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("shuffle-bags eighteen real obstacle patterns before repeating", () => {
    expect(OBSTACLE_PATTERN_CATALOG).toHaveLength(18);
    expect(new Set(OBSTACLE_PATTERN_CATALOG.map(({ id }) => id)).size).toBe(18);
    expect(new Set(OBSTACLE_PATTERN_CATALOG.map(({ action }) => action))).toEqual(
      new Set(["jump", "slide"])
    );
    const initial = getChallengeDifficulty(0, CHALLENGE_DIFFICULTY);
    const spawner = new FairSpawner(new SeededRandom(71), initial.speed);
    const seen: string[] = [];
    for (let index = 0; index < 36; index += 1) {
      const wave = spawner.advance(100_000, initial.speed, initial, SPAWN_X);
      if (!wave) throw new Error("wave should spawn");
      seen.push(wave.obstaclePattern);
      expect(Math.min(wave.x, ...wave.packages.map(({ x }) => x))).toBeGreaterThanOrEqual(SPAWN_X);
    }
    expect(new Set(seen.slice(0, 18)).size).toBe(18);
    expect(new Set(seen.slice(18)).size).toBe(18);
    for (let index = 1; index < seen.length; index += 1) {
      expect(seen[index]).not.toBe(seen[index - 1]);
    }
  });

  it("keeps every generated parcel hitbox separate from its paired obstacle", () => {
    for (const narrative of [false, true]) {
      for (const speed of [280 * 0.85, 280 * 1.35, 280 * 2.2]) {
        const difficulty = getChallengeDifficulty(0, CHALLENGE_DIFFICULTY);
        const spawner = new FairSpawner(
          new SeededRandom(Math.round(speed) + (narrative ? 1 : 0)),
          speed,
          undefined
        );
        for (let index = 0; index < 36; index += 1) {
          const wave = spawner.advance(100_000, speed, difficulty, 390);
          if (!wave) throw new Error("wave should spawn");
          expect(Math.min(wave.x, ...wave.packages.map(({ x }) => x))).toBeGreaterThanOrEqual(390);
          const obstacle = obstacleHitbox(obstacleFromWave(wave));
          for (const parcel of wave.packages) {
            expect(rectanglesOverlap(obstacle, {
              x: parcel.x + PACKAGE_HITBOX_INSET,
              y: parcel.y + PACKAGE_HITBOX_INSET,
              width: PACKAGE_SIZE - PACKAGE_HITBOX_INSET * 2,
              height: PACKAGE_SIZE - PACKAGE_HITBOX_INSET * 2
            }), `${wave.obstaclePattern}:${wave.pattern}`).toBe(false);
          }
        }
      }
    }
  });
  it.each(["jump", "slide"] as const)(
    "authors one atomic %s reward pattern with a safe route and reaction window",
    (action) => {
      const speed = 280 * 1.15;
      const wave = createAuthoredRewardWave({
        action,
        spawnX: SPAWN_X,
        speed,
        patternIndex: action === "jump" ? 2 : 3,
        source: "story-reward",
        rewards: [{ kind: "podwojny_wynik" }, { kind: "gwarancja_48" }]
      });
      expect(wave).not.toBeNull();
      if (!wave) return;

      expect((wave.x - (RUNNER_X + RUNNER_WIDTH)) / speed)
        .toBeGreaterThanOrEqual(MIN_AUTHORED_REACTION_SECONDS);
      expect(wave.kind === "overhead").toBe(action === "slide");
      expect(wave.source).toBe("story-reward");
      expect(wave.packages.filter(({ kind }) => kind === "podwojny_wynik"))
        .toMatchObject([{ storyRewardPattern: true }]);
      expect(wave.packages.every(({ storyRewardPattern }) => storyRewardPattern)).toBe(true);

      const obstacle = obstacleHitbox(obstacleFromWave(wave));
      for (const parcel of wave.packages) {
        const inset = PACKAGE_SIZE * 0.18;
        expect(rectanglesOverlap(obstacle, {
          x: parcel.x + inset,
          y: parcel.y + inset,
          width: PACKAGE_SIZE - inset * 2,
          height: PACKAGE_SIZE - inset * 2
        })).toBe(false);
      }
    }
  );

  it("defers an authored reward pattern when there is no reaction window", () => {
    expect(createAuthoredRewardWave({
      action: "jump",
      spawnX: RUNNER_X + RUNNER_WIDTH + 20,
      speed: 280 * 1.15,
      rewards: [{ kind: "podwojny_wynik" }]
    })).toBeNull();
  });

  it("moves the challenge reward far enough right at the 2.2x speed cap", () => {
    const speed = 280 * 2.2;
    const spawnX = authoredRewardSpawnX(speed, SPAWN_X);
    const wave = createAuthoredRewardWave({
      action: "jump",
      spawnX,
      speed,
      rewards: [{ kind: "podwojny_wynik" }]
    });

    expect(spawnX).toBeGreaterThan(SPAWN_X);
    expect(wave).not.toBeNull();
    expect((spawnX - (RUNNER_X + RUNNER_WIDTH)) / speed)
      .toBeGreaterThanOrEqual(MIN_AUTHORED_REACTION_SECONDS);
  });

  it("marks one typed order unit without counting the surrounding reward trail as orders", () => {
    const wave = createAuthoredRewardWave({
      action: "jump",
      spawnX: SPAWN_X,
      speed: 280,
      rewards: [{ kind: "standard", packageType: "pc", storyOrder: true }]
    });
    expect(wave).not.toBeNull();
    expect(wave?.packages.filter(({ storyOrder }) => storyOrder)).toMatchObject([
      {
        kind: "standard",
        collectibleClass: "equipment",
        packageType: "pc",
        orderVisualType: "pc",
        storyOrder: true
      }
    ]);
    expect(wave?.packages.filter(({ storyOrder }) => storyOrder !== true)).toHaveLength(5);
  });

  it("keeps authored targets outside the paired hazard hitbox", () => {
    for (const action of ["jump", "slide"] as const) {
      const wave = createAuthoredRewardWave({
        action,
        spawnX: SPAWN_X,
        speed: 280 * 1.15,
        rewards: [{ kind: "podwojny_wynik" }]
      });
      if (!wave) throw new Error("authored wave should be safe");
      const runner = createRunnerModel();
      const obstacle = obstacleFromWave(wave, runner.x);
      const target = wave.packages.find(({ kind }) => kind === "podwojny_wynik");
      if (!target) throw new Error("target should exist");
      const parcel = {
        ...target,
        active: true,
        size: PACKAGE_SIZE,
        x: runner.x + (target.x - wave.x)
      };

      expect(collidesWithObstacle(runner, obstacle)).toBe(true);
      const obstacleRight = obstacle.x + obstacle.width;
      const parcelRight = parcel.x + parcel.size;
      const separated = parcelRight <= obstacle.x || parcel.x >= obstacleRight ||
        parcel.y + parcel.size <= obstacle.y || parcel.y >= obstacle.y + obstacle.height;
      expect(separated, `${action}: ${JSON.stringify(parcel)}`).toBe(true);
    }
  });

  it("keeps 100 authored variants fair across the full story speed range", () => {
    for (let variant = 0; variant < 100; variant += 1) {
      const speed = 280 * (0.8 + (variant / 99) * 0.35);
      const action = variant % 2 === 0 ? "jump" : "slide";
      const wave = createAuthoredRewardWave({
        action,
        spawnX: SPAWN_X,
        speed,
        patternIndex: variant,
        rewards: [{ kind: "podwojny_wynik" }]
      });
      expect(wave).not.toBeNull();
      if (!wave) continue;
      expect(wave.x).toBeGreaterThanOrEqual(SPAWN_X);
      expect(Math.min(...wave.packages.map(({ x }) => x))).toBeGreaterThanOrEqual(SPAWN_X);
      expect(wave.gapPixels / speed).toBeGreaterThanOrEqual(MIN_AUTHORED_REACTION_SECONDS);
      const obstacle = obstacleFromWave(wave);
      for (const parcel of wave.packages) {
        const inset = PACKAGE_HITBOX_INSET;
        expect(rectanglesOverlap(obstacleHitbox(obstacle), {
          x: parcel.x + inset,
          y: parcel.y + inset,
          width: PACKAGE_SIZE - inset * 2,
          height: PACKAGE_SIZE - inset * 2
        })).toBe(false);
      }
    }
  });

  it("carries the semantic authored variant into the activated obstacle", () => {
    const obstacles = createObstaclePool(1);
    const packages = createPackagePool(8);
    const wave = createAuthoredRewardWave({
      action: "jump",
      obstacleKind: "pallet",
      spawnX: 1_400,
      speed: 300,
      rewards: [{ kind: "standard" }],
      packageCount: 3,
      semanticVariant: "first-laptop"
    });
    expect(wave).not.toBeNull();
    expect(activateWave(wave!, obstacles, packages)).toBe(true);
    expect(obstacles[0]?.semanticVariant).toBe("first-laptop");
  });

  it("keeps overhead artwork varied and stable for each activated pattern", () => {
    const variants = ["beam-single", "beam-pair", "beam-triple"].map(
      (obstaclePattern) => {
        const obstacles = createObstaclePool(1);
        const packages = createPackagePool(8);
        const wave = {
          ...createBossAttackWave("overhead", 1_032),
          obstaclePattern
        };
        expect(activateWave(wave, obstacles, packages)).toBe(true);
        return obstacles[0]?.visualVariant;
      }
    );

    expect(variants).toEqual([0, 1, 2]);
  });

  it("moves a special package away from hazards and existing rewards before spawning", () => {
    const obstacle = obstacleFromWave(createBossAttackWave("box-stack", 810));
    const packages = [{
      active: true,
      kind: "standard" as const,
      collectibleClass: "equipment" as const,
      x: 750,
      y: GROUND_Y - 47,
      size: 30,
      phase: 0,
      packageType: "notebook" as const,
      orderVisualType: "notebook" as const,
      weightKg: 0
    }];

    const x = findSafeCollectibleX({
      preferredX: 810,
      y: GROUND_Y - 38,
      size: 30,
      minX: 520,
      maxX: 900,
      obstacles: [obstacle],
      packages
    });

    expect(x).not.toBeNull();
    expect(x).not.toBe(810);
    expect(x).not.toBe(750);
  });

  it("places an overhead boss attack at the crouch-passable beam height", () => {
    const runner = createRunnerModel();
    const wave = createBossAttackWave("overhead", runner.x);
    const obstacle = obstacleFromWave(wave, runner.x);

    expect(wave.y).toBe(OVERHEAD.topY);
    expect(wave.y + wave.height).toBe(GROUND_Y - OVERHEAD.clearance);
    expect(collidesWithObstacle(runner, obstacle)).toBe(true);

    runner.crouching = true;
    expect(collidesWithObstacle(runner, obstacle)).toBe(false);
  });

  it("keeps the generic challenge generator limited to ordinary orders", () => {
    const seen = new Set<PackageKind>();

    for (let seed = 0; seed < 24; seed += 1) {
      const initial = getChallengeDifficulty(0, CHALLENGE_DIFFICULTY);
      const spawner = new FairSpawner(new SeededRandom(seed), initial.speed);
      let elapsedSeconds = 0;
      let waves = 0;

      while (waves < 60) {
        const difficulty = getChallengeDifficulty(elapsedSeconds, CHALLENGE_DIFFICULTY);
        const deltaSeconds = 0.1;
        const wave = spawner.advance(
          difficulty.speed * deltaSeconds,
          difficulty.speed,
          difficulty,
          SPAWN_X
        );
        elapsedSeconds += deltaSeconds;
        if (!wave) continue;
        waves += 1;
        for (const parcel of wave.packages) seen.add(parcel.kind);
      }
    }

    expect(seen).toEqual(new Set(["standard"]));
  });

  it("keeps 100 seeded challenge generators within time and geometry rules", () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const initial = getChallengeDifficulty(0, CHALLENGE_DIFFICULTY);
      const spawner = new FairSpawner(new SeededRandom(seed), initial.speed);
      let elapsedSeconds = 0;
      let waves = 0;

      while (waves < 40) {
        const difficulty = getChallengeDifficulty(elapsedSeconds, CHALLENGE_DIFFICULTY);
        const deltaSeconds = 0.1;
        const wave = spawner.advance(
          difficulty.speed * deltaSeconds,
          difficulty.speed,
          difficulty,
          SPAWN_X
        );
        elapsedSeconds += deltaSeconds;
        if (!wave) continue;
        waves += 1;

        expect(wave.gapPixels / difficulty.speed).toBeGreaterThanOrEqual(
          difficulty.minimumGapSeconds
        );
        expect(wave.packages.map((parcel) => parcel.x)).toEqual(
          [...wave.packages].map((parcel) => parcel.x).sort((left, right) => left - right)
        );

        if (wave.kind === "overhead") {
          expect(wave.y).toBe(OVERHEAD.topY);
          expect(wave.y + wave.height).toBe(GROUND_Y - OVERHEAD.clearance);
          for (const parcel of wave.packages) {
            expect(parcel.y + PACKAGE_HITBOX_INSET).toBeGreaterThanOrEqual(
              wave.y + wave.height
            );
            expect(parcel.y + PACKAGE_SIZE - PACKAGE_HITBOX_INSET).toBeLessThanOrEqual(
              GROUND_Y
            );
          }

          const runner = createRunnerModel();
          const obstacle = obstacleFromWave(wave, runner.x);
          runner.crouching = true;
          expect(collidesWithObstacle(runner, obstacle)).toBe(false);
        } else {
          expect(wave.y + wave.height).toBe(GROUND_Y);
          for (const parcel of wave.packages) {
            if (!isSpecial(parcel.kind)) continue;
            throw new Error(`generic challenge wave emitted ${parcel.kind}`);
          }
        }
      }
    }

  });
});
