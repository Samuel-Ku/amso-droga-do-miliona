import { describe, expect, it } from "vitest";
import { collidesWithObstacle } from "../src/game/collision";
import { GROUND_Y, OVERHEAD } from "../src/game/constants";
import { getChallengeDifficulty } from "../src/game/difficulty";
import { POWER_UP_VALUES } from "../src/game/narrative";
import { createRunnerModel } from "../src/game/physics";
import { SeededRandom } from "../src/game/random";
import {
  createBossAttackWave,
  FairSpawner,
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
