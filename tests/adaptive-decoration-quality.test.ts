import { describe, expect, it } from "vitest";
import { AdaptiveDecorationQuality } from "../src/game/adaptive-decoration-quality";

describe("adaptive decoration quality", () => {
  it("reacts only after a sustained slow window and recovers slowly", () => {
    const quality = new AdaptiveDecorationQuality();
    for (let index = 0; index < 100; index += 1) quality.observe(1 / 40);
    expect(quality.level).toBe("reduced");
    for (let index = 0; index < 60; index += 1) quality.observe(1 / 60);
    expect(quality.level).toBe("reduced");
    for (let index = 0; index < 300; index += 1) quality.observe(1 / 60);
    expect(quality.level).toBe("full");
  });

  it("does not change gameplay time or expose a speed multiplier", () => {
    const quality = new AdaptiveDecorationQuality();
    quality.observe(0.5);
    expect(quality.level).toBe("full");
    expect(Object.keys(quality)).not.toContain("speedMultiplier");
  });
});
