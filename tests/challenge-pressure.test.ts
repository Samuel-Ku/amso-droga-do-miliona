import { describe, expect, it } from "vitest";
import {
  challengeAtomAt,
  challengeBreathSeconds,
  challengePatternTuning,
  challengePressureAt,
  VALIDATED_CHALLENGE_ATOMS
} from "../src/game/challenge-pressure";

describe("v7 challenge pressure", () => {
  it("uses one named axis per deterministic 20–30 second cycle", () => {
    expect(challengePressureAt(0).axis).toBe("speed");
    expect(challengePressureAt(20).axis).toBe("density");
    for (let second = 0; second < 600; second += 3) {
      const phase = challengePressureAt(second);
      expect(phase.cycleDurationSeconds).toBeGreaterThanOrEqual(20);
      expect(phase.cycleDurationSeconds).toBeLessThanOrEqual(30);
      expect(phase.cycleProgress).toBeGreaterThanOrEqual(0);
      expect(phase.cycleProgress).toBeLessThan(1);
    }
  });

  it("assembles only the approved jump and slide atoms without immediate repeats", () => {
    expect(VALIDATED_CHALLENGE_ATOMS.length).toBeGreaterThanOrEqual(6);
    for (let index = 0; index < 100; index += 1) {
      const current = challengeAtomAt(index);
      const next = challengeAtomAt(index + 1);
      expect(next.id).not.toBe(current.id);
      expect(current.action === "slide" ? current.obstacleKind : "jump").toBe(
        current.action === "slide" ? "overhead" : "jump"
      );
    }
  });

  it("always gives a breath after a four-pattern burst", () => {
    expect(challengeBreathSeconds(3, 180)).toBe(1.1);
    expect(challengeBreathSeconds(2, 180)).toBeLessThan(1.1);
  });

  it("turns each pressure axis into a distinct gameplay parameter", () => {
    const speed = challengePatternTuning(0, 1, 3);
    const density = challengePatternTuning(21, 1, 3);
    const complexity = challengePatternTuning(45, 1, 3);
    const precision = challengePatternTuning(72, 1, 5);
    const pressure = challengePatternTuning(94, 1, 3);

    expect(density.packageCount).toBeGreaterThan(speed.packageCount);
    expect(complexity.breathSeconds).toBeLessThan(speed.breathSeconds);
    expect(complexity.sequenceLength).toBe(2);
    for (const tuning of [speed, density, complexity, precision, pressure]) {
      expect(tuning.packageCount).toBeGreaterThanOrEqual(5);
      expect(tuning.packageCount).toBeLessThanOrEqual(8);
    }
    expect(pressure.breathSeconds).toBeLessThan(speed.breathSeconds);
    expect(pressure.sequenceLength).toBe(3);
    expect(pressure.sequenceGapSeconds).toBeGreaterThanOrEqual(0.55);
    expect(pressure.sequenceGapSeconds).toBeLessThanOrEqual(0.75);
    expect(new Set([speed.axis, density.axis, complexity.axis, precision.axis, pressure.axis]).size)
      .toBe(5);
  });
});
