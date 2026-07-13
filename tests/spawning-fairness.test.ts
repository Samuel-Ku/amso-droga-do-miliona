import { describe, expect, it } from "vitest";
import {
  collidesWithObstacle,
  collectsPackage,
  obstacleHitbox,
  rectanglesOverlap
} from "../src/game/collision";
import { GROUND_Y, OVERHEAD, RUNNER_WIDTH, RUNNER_X } from "../src/game/constants";
import { getChallengeDifficulty } from "../src/game/difficulty";
import { POWER_UP_VALUES } from "../src/game/narrative";
import { createRunnerModel } from "../src/game/physics";
import { SeededRandom } from "../src/game/random";
import {
  createBossAttackWave,
  createAuthoredRewardWave,
  findSafeCollectibleX,
  FairSpawner,
  MIN_AUTHORED_REACTION_SECONDS,
  type SpawnWave
} from "../src/game/spawning";
import type { ObstacleModel, PackageKind } from "../src/game/types";

const CHALLENGE_DIFFICULTY = {
  speedStartMultiplier: 1.15,
  speedMaxMultiplier: 1.55
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
        rewards: [
          { kind: "story-symbol", storySymbolIndex: 4 },
          { kind: "gwarancja_48" }
        ]
      });
      expect(wave).not.toBeNull();
      if (!wave) return;

      expect((wave.x - (RUNNER_X + RUNNER_WIDTH)) / speed)
        .toBeGreaterThanOrEqual(MIN_AUTHORED_REACTION_SECONDS);
      expect(wave.kind === "overhead").toBe(action === "slide");
      expect(wave.source).toBe("story-reward");
      expect(wave.packages.filter(({ kind }) => kind === "story-symbol"))
        .toMatchObject([{ storySymbolIndex: 4, storyRewardPattern: true }]);
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
      rewards: [{ kind: "golden" }]
    })).toBeNull();
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
      { kind: "standard", packageType: "pc", storyOrder: true }
    ]);
    expect(wave?.packages.filter(({ storyOrder }) => storyOrder !== true)).toHaveLength(4);
  });

  it("keeps authored targets out of an idle runner's path before the paired hazard", () => {
    for (const action of ["jump", "slide"] as const) {
      const wave = createAuthoredRewardWave({
        action,
        spawnX: SPAWN_X,
        speed: 280 * 1.15,
        rewards: [{ kind: "story-symbol", storySymbolIndex: 2 }]
      });
      if (!wave) throw new Error("authored wave should be safe");
      const runner = createRunnerModel();
      const obstacle = obstacleFromWave(wave, runner.x);
      const target = wave.packages.find(({ kind }) => kind === "story-symbol");
      if (!target) throw new Error("target should exist");
      const parcel = {
        ...target,
        active: true,
        size: PACKAGE_SIZE,
        x: runner.x + (target.x - wave.x)
      };

      expect(collidesWithObstacle(runner, obstacle)).toBe(true);
      expect(collectsPackage(runner, parcel), `${action}: ${JSON.stringify(parcel)}`).toBe(false);
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
        rewards: [{ kind: "story-symbol", storySymbolIndex: variant % 8 }]
      });
      expect(wave).not.toBeNull();
      if (!wave) continue;
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

  it("moves a story symbol away from hazards and existing rewards before spawning", () => {
    const obstacle = obstacleFromWave(createBossAttackWave("box-stack", 810));
    const packages = [{
      active: true,
      kind: "golden" as const,
      scoreValue: 250,
      x: 750,
      y: GROUND_Y - 47,
      size: 30,
      phase: 0,
      packageType: "notebook" as const,
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

  it("can spawn golden parcels and every v3 power-up in deterministic challenge waves", () => {
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

    expect(seen.has("golden")).toBe(true);
    expect(POWER_UP_VALUES.every((kind) => seen.has(kind))).toBe(true);
  });

  it("keeps 100 seeded challenge generators within time and geometry rules", () => {
    const seenPowerUps = new Set<PackageKind>();

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
          for (const [index, parcel] of wave.packages.entries()) {
            if (!isSpecial(parcel.kind)) continue;
            seenPowerUps.add(parcel.kind);
            expect(index).toBeGreaterThan(0);
            expect(index).toBeLessThan(wave.packages.length - 1);
            expect(parcel.y + PACKAGE_SIZE - PACKAGE_HITBOX_INSET).toBeLessThanOrEqual(
              wave.y
            );
          }
        }
      }
    }

    expect(POWER_UP_VALUES.every((kind) => seenPowerUps.has(kind))).toBe(true);
  });
});
