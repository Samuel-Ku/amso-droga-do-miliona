import { describe, expect, it } from "vitest";
import { getChallengeDifficulty } from "../src/game/difficulty";

describe("v13 challenge speed curve (smootherstep)", () => {
  const settings = { speedStartMultiplier: 1.85, speedMaxMultiplier: 4 };

  it("starts at the configured 1.85×", () => {
    const d = getChallengeDifficulty(0, settings);
    expect(d.speedMultiplier).toBe(1.85);
  });

  it("is monotonically non-decreasing", () => {
    let prev = 0;
    for (let t = 0; t <= 300; t += 1) {
      const m = getChallengeDifficulty(t, settings).speedMultiplier;
      expect(m).toBeGreaterThanOrEqual(prev);
      prev = m;
    }
  });

  it("reaches approximately 4× at 240 seconds via smootherstep", () => {
    const d = getChallengeDifficulty(240, settings);
    expect(d.speedMultiplier).toBeCloseTo(4, 1);
  });

  it("does not exceed the maximum after 240 seconds", () => {
    for (const t of [240, 300, 600, 10_000]) {
      const d = getChallengeDifficulty(t, settings);
      expect(d.speedMultiplier).toBeLessThanOrEqual(4.001);
    }
  });

  it("has smooth derivatives at both ends (gentle start and gentle plateau)", () => {
    const delta = 0.5;
    const at0 = getChallengeDifficulty(0, settings).speedMultiplier;
    const atDelta = getChallengeDifficulty(delta, settings).speedMultiplier;
    const slope0 = (atDelta - at0) / delta;
    // smootherstep starts with zero derivative
    expect(slope0).toBeLessThan(0.05);

    const at240 = getChallengeDifficulty(240, settings).speedMultiplier;
    const at240Minus = getChallengeDifficulty(240 - delta, settings).speedMultiplier;
    const slopeEnd = (at240 - at240Minus) / delta;
    // smootherstep ends with zero derivative
    expect(slopeEnd).toBeLessThan(0.05);
  });

  it("is symmetric around the midpoint of the curve", () => {
    const mid = getChallengeDifficulty(120, settings).speedMultiplier;
    // midpoint should be close to the arithmetic mean of start and end
    const expected = (1.85 + 4) / 2;
    expect(mid).toBeCloseTo(expected, 0);
  });

  it("returns valid Difficulty fields at every integer second", () => {
    for (let t = 0; t <= 300; t += 1) {
      const d = getChallengeDifficulty(t, settings);
      expect(d.level).toBeGreaterThanOrEqual(1);
      expect(d.speed).toBeGreaterThan(0);
      expect(d.minimumGapSeconds).toBeGreaterThan(0);
    }
  });

  it("accepts configurable speed ranges within bounds", () => {
    const custom = { speedStartMultiplier: 2, speedMaxMultiplier: 3.5 };
    expect(getChallengeDifficulty(0, custom).speedMultiplier).toBe(2);
    expect(getChallengeDifficulty(240, custom).speedMultiplier).toBeCloseTo(3.5, 1);
  });
});
