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

  it("keeps the same large circle while sliding and marks an absorbed impact", () => {
    const standing = courierProtectionPresentation(createRunnerModel(), "warranty")!;
    const runner = { ...createRunnerModel(), crouching: true, height: 52, y: 380 };
    const presentation = courierProtectionPresentation(runner, "breaking")!;

    expect(presentation).toMatchObject({ breaking: true });
    expect(presentation.radiusY).toBe(presentation.radiusX);
    expect(presentation.radiusX).toBe(standing.radiusX);
    expect(presentation.centerX).toBe(standing.centerX);
    expect(presentation.centerY).toBe(standing.centerY);
  });

  it("does not turn ordinary post-collision recovery into a warranty shield", () => {
    const runner = createRunnerModel();

    expect(courierProtectionPresentation(runner, null)).toBeNull();
    expect(courierProtectionPresentation(runner, "breaking")?.breaking).toBe(true);
  });
});
