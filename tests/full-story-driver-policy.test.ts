import { describe, expect, it } from "vitest";
import { nextFullStoryDriverCommand } from "../scripts/full-story-driver-policy.mjs";

const base = {
  controlsEnabled: true,
  actionToken: "first-package:guided-low-stack:1:0",
  action: "jump",
  runner: { x: 132, grounded: true, crouching: false },
  target: { kind: "obstacle", x: 240, width: 64 },
  authoredWave: { attemptsOnCurrentWave: 1, ordersCollectedOnCurrentWave: 0 }
} as const;

describe("full story browser input policy", () => {
  it("emits one jump only when the observed target enters the input window", () => {
    expect(nextFullStoryDriverCommand({ ...base, target: { ...base.target, x: 500 } }, {})).toBeNull();
    expect(nextFullStoryDriverCommand(base, {})).toEqual({ type: "jump", token: base.actionToken });
    expect(nextFullStoryDriverCommand(base, { actedToken: base.actionToken })).toBeNull();
  });

  it("waits for the low leading parcel before jumping through the authored arc", () => {
    const parcel = { ...base, target: { kind: "package" as const, x: 250, width: 30 } };
    expect(nextFullStoryDriverCommand(parcel, {})).toBeNull();
    expect(nextFullStoryDriverCommand({
      ...parcel,
      authoredWave: { attemptsOnCurrentWave: 1, ordersCollectedOnCurrentWave: 1 }
    }, {})).toEqual({ type: "jump", token: base.actionToken });
  });

  it("holds and releases slide through keyboard boundaries", () => {
    const slide = { ...base, action: "slide" as const, actionToken: "slide:1", target: { ...base.target, x: 330 } };
    expect(nextFullStoryDriverCommand(slide, {})).toEqual({ type: "slide-start", token: "slide:1" });
    expect(nextFullStoryDriverCommand({ ...slide, actionToken: "next:1" }, { slideToken: "slide:1" }))
      .toEqual({ type: "slide-end", token: "slide:1" });
  });

  it("fails strict replay on a retry and never acts while controls are blocked", () => {
    expect(nextFullStoryDriverCommand({ ...base, authoredWave: { attemptsOnCurrentWave: 2 } }, {}))
      .toEqual({ type: "fail", reason: "authored-wave-retry" });
    expect(nextFullStoryDriverCommand({ ...base, controlsEnabled: false }, {})).toBeNull();
  });
});
