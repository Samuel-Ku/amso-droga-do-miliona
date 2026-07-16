import { describe, expect, it } from "vitest";
import {
  AuthoredWaveDirector,
  STORY_MICROLEVELS,
  availablePackages,
  requiredPackages,
  validateAllStoryMicrolevels,
  validateStoryMicrolevel
} from "../src/game/authored-wave";
import { getAuthoredStoryDifficulty, getChallengeDifficulty } from "../src/game/difficulty";

describe("v7 authored story waves", () => {
  it("offers exactly 50 packages across the twelve finale combinations", () => {
    const finale = STORY_MICROLEVELS.find(({ id }) => id === "million-threshold");
    expect(finale).toBeDefined();
    expect(finale!.waves.reduce((sum, item) => sum + availablePackages(item), 0)).toBe(50);
  });

  it("supports 40, 50, and 60 package finale targets with package-only recovery", () => {
    const finale = STORY_MICROLEVELS.find(({ id }) => id === "million-threshold")!;
    for (const target of [40, 50, 60]) {
      const director = new AuthoredWaveDirector({ ...finale, finalePackageTarget: target });
      for (const item of finale.waves) {
        for (let count = 0; count < availablePackages(item); count += 1) director.recordPackage();
        director.resolve(true);
      }
      if (target === 60) {
        expect(director.currentWave?.obstacleVariant).toBe("recovery-route");
        for (let recovery = 0; recovery < 5; recovery += 1) {
          director.recordPackage();
          director.recordPackage();
          director.resolve(true);
        }
      }
      director.advance(finale.minimumDurationSeconds);
      expect(director.snapshot.totalPackageTarget).toBe(target);
      expect(director.completed).toBe(true);
    }
  });

  it("publishes six valid microlevels with the approved speed curve", () => {
    expect(validateAllStoryMicrolevels()).toEqual([]);
    expect(STORY_MICROLEVELS.map(({ id, speedStartMultiplier, speedEndMultiplier }) => ({
      id,
      speedStartMultiplier,
      speedEndMultiplier
    }))).toEqual([
      { id: "first-package", speedStartMultiplier: 0.95, speedEndMultiplier: 1.15 },
      { id: "order-backlog", speedStartMultiplier: 1.1, speedEndMultiplier: 1.35 },
      { id: "quality-process", speedStartMultiplier: 1.22, speedEndMultiplier: 1.48 },
      { id: "client-growth", speedStartMultiplier: 1.34, speedEndMultiplier: 1.58 },
      { id: "order-scale", speedStartMultiplier: 1.45, speedEndMultiplier: 1.7 },
      { id: "million-threshold", speedStartMultiplier: 1.55, speedEndMultiplier: 1.85 }
    ]);
  });

  it("keeps client-growth waves inside the three HUD phases they describe", () => {
    const growth = STORY_MICROLEVELS.find(({ id }) => id === "client-growth")!;
    expect(growth.waves).toHaveLength(6);
    expect(growth.waves.slice(0, 2).map(({ obstacleVariant }) => obstacleVariant))
      .toEqual(["first-laptop", "first-laptop"]);
    expect(growth.waves.slice(2, 4).map(({ obstacleVariant }) => obstacleVariant))
      .toEqual(["growing-team", "growing-team"]);
    expect(growth.waves.slice(4, 6).map(({ obstacleVariant }) => obstacleVariant))
      .toEqual(["established-office", "established-office"]);
  });

  it("keeps each order-scale HUD zone aligned with its three authored waves", () => {
    const scale = STORY_MICROLEVELS.find(({ id }) => id === "order-scale")!;
    expect(scale.waves).toHaveLength(9);
    expect(scale.waves.slice(0, 3).map(({ obstacleVariant }) => obstacleVariant))
      .toEqual(["intake", "intake", "intake"]);
    expect(scale.waves.slice(3, 6).map(({ obstacleVariant }) => obstacleVariant))
      .toEqual(["routing", "routing", "routing"]);
    expect(scale.waves.slice(6, 9).map(({ obstacleVariant }) => obstacleVariant))
      .toEqual(["dispatch", "dispatch", "dispatch"]);
  });

  it("requires sixty percent of every package route", () => {
    expect(requiredPackages(2)).toBe(2);
    expect(requiredPackages(3)).toBe(2);
    expect(requiredPackages(4)).toBe(3);
    expect(requiredPackages(5)).toBe(3);
  });

  it("repeats an unchanged wave after failure and advances only after action plus packages", () => {
    const definition = STORY_MICROLEVELS[0]!;
    const director = new AuthoredWaveDirector(definition);
    const firstId = director.snapshot.currentWaveId;
    director.recordPackage();
    expect(director.resolve(true)).toMatchObject({ passed: false, perfect: false });
    expect(director.snapshot).toMatchObject({
      currentWaveId: firstId,
      attemptsOnCurrentWave: 2,
      wavesCompleted: 0
    });

    director.recordPackage();
    director.recordPackage();
    expect(director.resolve(true)).toMatchObject({ passed: true, perfect: false });
    expect(director.snapshot.wavesCompleted).toBe(1);
    expect(director.snapshot.currentWaveId).not.toBe(firstId);
  });

  it("does not complete on waves alone before the minimum duration", () => {
    const definition = STORY_MICROLEVELS[0]!;
    const director = new AuthoredWaveDirector(definition);
    for (const wave of definition.waves) {
      const availablePackages = wave.packageCount * wave.actions.length;
      for (let index = 0; index < availablePackages; index += 1) director.recordPackage();
      director.resolve(true);
    }
    expect(director.completed).toBe(false);
    director.advance(definition.minimumDurationSeconds);
    expect(director.completed).toBe(true);
  });

  it("reports the exact microlevel and wave for an invalid action mapping", () => {
    const invalid = {
      ...STORY_MICROLEVELS[0]!,
      waves: [{
        ...STORY_MICROLEVELS[0]!.waves[0]!,
        id: "broken-slide",
        actions: ["slide" as const],
        obstacleKinds: ["pallet" as const]
      }]
    };
    expect(validateStoryMicrolevel(invalid)).toContainEqual(expect.objectContaining({
      code: "action_obstacle_mismatch",
      microlevelId: "first-package",
      waveId: "broken-slide"
    }));
  });

  it("reports an unknown visual obstacle variant before gameplay", () => {
    const invalid = {
      ...STORY_MICROLEVELS[0]!,
      waves: [{ ...STORY_MICROLEVELS[0]!.waves[0]!, obstacleVariant: "mystery-shape" }]
    };
    expect(validateStoryMicrolevel(invalid)).toContainEqual(expect.objectContaining({
      code: "unknown_obstacle_variant",
      waveId: "guided-parcel-arc"
    }));
  });

  it("defines twelve distinct finale combinations and derives the million counter", () => {
    const finale = STORY_MICROLEVELS.at(-1)!;
    expect(finale.waves).toHaveLength(12);
    expect(new Set(finale.waves.map(({ id }) => id)).size).toBe(12);
    expect(finale.finalePackageTarget).toBe(50);
    expect(1_000_000 - finale.finalePackageTarget!).toBe(999_950);
  });

  it("follows the approved story and challenge speed points", () => {
    expect(getAuthoredStoryDifficulty(0, 25, 0.95, 1.15).speedMultiplier).toBe(0.95);
    expect(getAuthoredStoryDifficulty(25, 25, 0.95, 1.15).speedMultiplier).toBe(1.15);
    const challenge = { speedStartMultiplier: 1.85, speedMaxMultiplier: 3.5 };
    expect(getChallengeDifficulty(0, challenge).speedMultiplier).toBe(1.85);
    expect(getChallengeDifficulty(60, challenge).speedMultiplier).toBe(2.4);
    expect(getChallengeDifficulty(120, challenge).speedMultiplier).toBe(3);
    expect(getChallengeDifficulty(180, challenge).speedMultiplier).toBe(3.5);
    expect(getChallengeDifficulty(300, challenge).speedMultiplier).toBe(3.5);
  });
});
