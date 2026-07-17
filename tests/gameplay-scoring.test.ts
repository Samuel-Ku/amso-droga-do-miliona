import { describe, expect, it } from "vitest";
import { resolveCollision } from "../src/game/mode-rules";
import {
  ActivePowerUps,
  storyPowerUpsForEpoch
} from "../src/game/power-ups";
import {
  MAX_COMBO_MULTIPLIER,
  resolvePackageCollection
} from "../src/game/scoring";

describe("package collection and scoring rules", () => {
  it("does not count power-ups as delivered packages", () => {
    for (const kind of ["gwarancja_48", "drugie_zycie"] as const) {
      expect(resolvePackageCollection(kind, 0, 3, false)).toEqual({
        countsAsPackage: false,
        pointsAwarded: 0,
        bonusScoreAwarded: 0,
        nextCombo: 3
      });
    }
  });

  it("keeps BONUS at 350 points while ordinary parcels use SERIA and 2× PUNKTY", () => {
    expect(resolvePackageCollection("standard", 100, 1, false)).toMatchObject({
      countsAsPackage: true,
      pointsAwarded: 100,
      bonusScoreAwarded: 0,
      nextCombo: 2
    });
    expect(resolvePackageCollection("standard", 100, 1, true).pointsAwarded).toBe(200);
    expect(resolvePackageCollection("golden", 350, 2, false).pointsAwarded).toBe(350);
    expect(resolvePackageCollection("golden", 350, 2, true).pointsAwarded).toBe(700);
  });

  it("grows combo to a cap and resets only on an unprotected collision", () => {
    expect(resolvePackageCollection("standard", 100, MAX_COMBO_MULTIPLIER, false).nextCombo)
      .toBe(MAX_COMBO_MULTIPLIER);
    expect(resolveCollision("story", false).resetCombo).toBe(true);
    expect(resolveCollision("challenge", false).resetCombo).toBe(true);
    expect(resolveCollision("story", true).resetCombo).toBe(false);
    expect(resolveCollision("story", true).consumeWarranty).toBe(true);
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

  it("introduces only immediately legible story power-ups", () => {
    expect(storyPowerUpsForEpoch(0)).toEqual([]);
    expect(storyPowerUpsForEpoch(1)).toEqual(["drugie_zycie"]);
    expect(storyPowerUpsForEpoch(2)).toEqual(["drugie_zycie", "gwarancja_48"]);
    expect(storyPowerUpsForEpoch(3)).toEqual(["drugie_zycie", "gwarancja_48"]);
  });
});
