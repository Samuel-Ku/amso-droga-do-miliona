import { describe, expect, it } from "vitest";
import {
  recoverStoryGapAssist,
  resolveCollision,
  storyGapAssistAfterCollision
} from "../src/game/mode-rules";
import {
  ActivePowerUps,
  AUDIT_SPAWN_RATE,
  spawnTravelDistance,
  storyPowerUpsForEpoch
} from "../src/game/power-ups";
import {
  MAX_COMBO_MULTIPLIER,
  resolvePackageCollection
} from "../src/game/scoring";

describe("package collection and scoring rules", () => {
  it("does not count finale symbols as ordinary packages", () => {
    expect(resolvePackageCollection("story-symbol", 500, 4, true)).toEqual({
      countsAsPackage: false,
      pointsAwarded: 0,
      bonusScoreAwarded: 0,
      nextCombo: 4
    });
  });

  it("does not count power-ups as delivered packages", () => {
    for (const kind of ["gwarancja_48", "audyt_jakosci", "drugie_zycie"] as const) {
      expect(resolvePackageCollection(kind, 0, 3, false)).toEqual({
        countsAsPackage: false,
        pointsAwarded: 0,
        bonusScoreAwarded: 0,
        nextCombo: 3
      });
    }
  });

  it("awards ordinary and golden package points through combo and Drugie Życie", () => {
    expect(resolvePackageCollection("standard", 100, 1, false)).toMatchObject({
      countsAsPackage: true,
      pointsAwarded: 100,
      bonusScoreAwarded: 0,
      nextCombo: 2
    });
    expect(resolvePackageCollection("standard", 100, 1, true).pointsAwarded).toBe(200);
    expect(resolvePackageCollection("golden", 350, 2, false).pointsAwarded).toBe(700);
    expect(resolvePackageCollection("golden", 350, 2, true).pointsAwarded).toBe(1_400);
  });

  it("grows combo to a cap and resets only on an unprotected collision", () => {
    expect(resolvePackageCollection("standard", 100, MAX_COMBO_MULTIPLIER, false).nextCombo)
      .toBe(MAX_COMBO_MULTIPLIER);
    expect(resolveCollision("story", false).resetCombo).toBe(true);
    expect(resolveCollision("challenge", false).resetCombo).toBe(true);
    expect(resolveCollision("story", true).resetCombo).toBe(false);
    expect(resolveCollision("challenge", true).resetCombo).toBe(false);
  });
});

describe("power-up lifetime and pacing rules", () => {
  it("keeps one non-stacking warranty charge until it is consumed", () => {
    const powerUps = new ActivePowerUps();
    powerUps.activate("gwarancja_48");
    powerUps.activate("gwarancja_48");

    expect(powerUps.keys()).toEqual(["gwarancja_48"]);
    powerUps.tick(60 * 60);
    expect(powerUps.has("gwarancja_48")).toBe(true);
    expect(powerUps.consumeWarranty()).toBe(true);
    expect(powerUps.has("gwarancja_48")).toBe(false);
    expect(powerUps.consumeWarranty()).toBe(false);
  });

  it("slows only distance fed to the spawner during Audyt jakości", () => {
    const worldTravel = 340 / 60;
    expect(spawnTravelDistance(worldTravel, false)).toBe(worldTravel);
    expect(spawnTravelDistance(worldTravel, true)).toBeCloseTo(worldTravel * AUDIT_SPAWN_RATE);
  });

  it("widens story gaps after the second epoch collision and eases back after clean play", () => {
    expect(storyGapAssistAfterCollision(0, 1)).toBe(0);
    expect(storyGapAssistAfterCollision(0, 2)).toBeGreaterThan(0);
    expect(recoverStoryGapAssist(0.35, 10)).toBeLessThan(0.35);
    expect(recoverStoryGapAssist(0.35, 60)).toBe(0);
  });

  it("introduces story power-ups only in their approved epochs", () => {
    expect(storyPowerUpsForEpoch(0)).toEqual([]);
    expect(storyPowerUpsForEpoch(1)).toEqual(["audyt_jakosci"]);
    expect(storyPowerUpsForEpoch(2)).toEqual(["audyt_jakosci", "drugie_zycie"]);
    expect(storyPowerUpsForEpoch(3)).toEqual([
      "audyt_jakosci",
      "drugie_zycie",
      "gwarancja_48"
    ]);
  });
});
