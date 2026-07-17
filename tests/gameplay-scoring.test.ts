import { describe, expect, it } from "vitest";
import { resolveCollision } from "../src/game/mode-rules";
import {
  ActivePowerUps,
  ChallengePowerUpSchedule,
  storyPowerUpsForEpoch
} from "../src/game/power-ups";
import {
  MAX_COMBO_MULTIPLIER,
  resolvePackageCollection
} from "../src/game/scoring";

describe("package collection and scoring rules", () => {
  it("schedules 2× WYNIK every 35–50 orders and never repeats active warranty", () => {
    const schedule = new ChallengePowerUpSchedule();
    const doubleAt: number[] = [];
    for (let orders = 0; orders <= 240; orders += 1) {
      const due = schedule.dueAt(orders, false);
      if (due === "podwojny_wynik") doubleAt.push(orders);
    }
    expect(doubleAt.length).toBeGreaterThanOrEqual(5);
    for (let index = 1; index < doubleAt.length; index += 1) {
      expect(doubleAt[index]! - doubleAt[index - 1]!).toBeGreaterThanOrEqual(35);
      expect(doubleAt[index]! - doubleAt[index - 1]!).toBeLessThanOrEqual(50);
    }

    const protectedSchedule = new ChallengePowerUpSchedule();
    expect(protectedSchedule.dueAt(70, true)).not.toBe("gwarancja_48");
  });

  it("does not count power-ups as delivered packages", () => {
    for (const kind of ["gwarancja_48", "podwojny_wynik"] as const) {
      expect(resolvePackageCollection(kind, 0, 3, false)).toEqual({
        countsAsPackage: false,
        pointsAwarded: 0,
        bonusScoreAwarded: 0,
        nextCombo: 3
      });
    }
  });

  it("uses one ordinary order value with SERIA and 2× WYNIK", () => {
    expect(resolvePackageCollection("standard", 100, 1, false)).toMatchObject({
      countsAsPackage: true,
      pointsAwarded: 100,
      bonusScoreAwarded: 0,
      nextCombo: 2
    });
    expect(resolvePackageCollection("standard", 100, 1, true).pointsAwarded).toBe(200);
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
    expect(storyPowerUpsForEpoch(1)).toEqual(["podwojny_wynik"]);
    expect(storyPowerUpsForEpoch(2)).toEqual(["podwojny_wynik", "gwarancja_48"]);
    expect(storyPowerUpsForEpoch(3)).toEqual(["podwojny_wynik", "gwarancja_48"]);
  });
});
