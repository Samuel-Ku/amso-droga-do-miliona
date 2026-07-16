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
    expect(courierProtectionPresentation(runner, false, 0, false)).toBeNull();

    const warranty = courierProtectionPresentation(runner, true, 0, false);
    const recovery = courierProtectionPresentation(runner, false, 1.2, false);
    expect(warranty).toMatchObject({ color: "#f47100", breaking: false, shape: "circle" });
    expect(recovery).toMatchObject({ color: "#f47100", breaking: false, shape: "circle" });
  });

  it("follows the courier into a lower oval while sliding and marks an absorbed impact", () => {
    const runner = { ...createRunnerModel(), crouching: true, height: 52 };
    const presentation = courierProtectionPresentation(runner, false, 1.8, true);

    expect(presentation).toMatchObject({ shape: "oval", breaking: true });
    expect(presentation!.radiusY).toBeLessThan(presentation!.radiusX);
    expect(presentation!.centerX).toBe(runner.x + runner.width / 2);
  });
});
