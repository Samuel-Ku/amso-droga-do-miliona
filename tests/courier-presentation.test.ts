import { describe, expect, it } from "vitest";
import {
  courierProtectionPresentation,
  runnerStrideCyclesPerSecond
} from "../src/game/courier-presentation";
import { createRunnerModel } from "../src/game/physics";

describe("courier presentation", () => {
  it("keeps the running gait between two and four cycles per second", () => {
    expect(runnerStrideCyclesPerSecond(280)).toBe(2);
    expect(runnerStrideCyclesPerSecond(630)).toBe(3);
    expect(runnerStrideCyclesPerSecond(980)).toBe(4);
    expect(runnerStrideCyclesPerSecond(2_000)).toBe(4);
  });

  it("shows one orange protection shape only when a collision is actually absorbed", () => {
    const runner = createRunnerModel();
    expect(courierProtectionPresentation(runner, null)).toBeNull();

    const warranty = courierProtectionPresentation(runner, "warranty");
    const start = courierProtectionPresentation(runner, "start");
    expect(warranty).toMatchObject({ color: "#f47100", breaking: false });
    expect(start).toMatchObject({ color: "#f47100", breaking: false });
  });

  it("follows the courier into a lower oval while sliding and marks an absorbed impact", () => {
    const runner = { ...createRunnerModel(), crouching: true, height: 52 };
    const presentation = courierProtectionPresentation(runner, "breaking");

    expect(presentation).toMatchObject({ breaking: true });
    expect(presentation!.radiusY).toBeLessThan(presentation!.radiusX);
    expect(presentation!.centerX - presentation!.radiusX).toBeGreaterThanOrEqual(runner.x - 3);
  });

  it("does not turn ordinary post-collision recovery into a warranty shield", () => {
    const runner = createRunnerModel();

    expect(courierProtectionPresentation(runner, null)).toBeNull();
    expect(courierProtectionPresentation(runner, "breaking")?.breaking).toBe(true);
  });
});
