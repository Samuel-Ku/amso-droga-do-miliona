import { describe, expect, it } from "vitest";
import { CelebrationManager } from "../src/game/celebration-manager";

describe("celebration adaptation", () => {
  it("uses shorter phase durations on small screens", () => {
    const m1 = new CelebrationManager({ screenWidthPx: 1024 });
    const m2 = new CelebrationManager({ screenWidthPx: 500 });

    m1.trigger({ threshold: 10, isRecord: false, playerX: 142, playerY: 400 });
    m2.trigger({ threshold: 10, isRecord: false, playerX: 142, playerY: 400 });

    const s1 = m1.getState();
    const s2 = m2.getState();

    expect(s1).not.toBeNull();
    expect(s2).not.toBeNull();
    expect(s2!.totalDurationMs).toBeLessThan(s1!.totalDurationMs);
  });

  it("marks small screen in state", () => {
    const m = new CelebrationManager({ screenWidthPx: 500 });
    m.trigger({ threshold: 10, isRecord: false, playerX: 142, playerY: 400 });
    expect(m.getState()?.isSmallScreen).toBe(true);
  });

  it("does not mark small screen for wide screens", () => {
    const m = new CelebrationManager({ screenWidthPx: 1024 });
    m.trigger({ threshold: 10, isRecord: false, playerX: 142, playerY: 400 });
    expect(m.getState()?.isSmallScreen).toBe(false);
  });

  it("uses only one phase for reduced motion", () => {
    const m = new CelebrationManager({ reducedMotion: true });
    m.trigger({ threshold: 500, isRecord: false, playerX: 142, playerY: 400 });

    // Impact has 2 phases (500+500=1000ms); reducedMotion collapses to 1 phase ≤1000ms
    const state = m.getState();
    expect(state).not.toBeNull();
    expect(state!.phaseIndex).toBe(0);

    // Advance halfway through the capped duration
    m.update(0.3);
    const after = m.getState();
    expect(after).not.toBeNull();
    expect(after!.phaseIndex).toBe(0);
    expect(after!.phaseProgress).toBeGreaterThan(0);
    expect(after!.phaseProgress).toBeLessThan(0.99);
  });

  it("caps reduced motion duration at 1000ms", () => {
    const m = new CelebrationManager({ reducedMotion: true });
    m.trigger({ threshold: 5000, isRecord: false, playerX: 142, playerY: 400 });
    const state = m.getState();
    expect(state).not.toBeNull();
    if (state !== null) {
      expect(state.totalDurationMs).toBeLessThanOrEqual(1000);
    }
  });

  it("setScreenWidth updates small screen flag", () => {
    const m = new CelebrationManager({ screenWidthPx: 500 });
    m.trigger({ threshold: 10, isRecord: false, playerX: 142, playerY: 400 });
    expect(m.getState()?.isSmallScreen).toBe(true);

    m.cancel();
    m.setScreenWidth(1024);
    m.trigger({ threshold: 10, isRecord: false, playerX: 142, playerY: 400 });
    expect(m.getState()?.isSmallScreen).toBe(false);
  });

  it("setReducedMotion updates effect on next trigger", () => {
    const m = new CelebrationManager();
    m.setReducedMotion(true);
    m.trigger({ threshold: 500, isRecord: false, playerX: 142, playerY: 400 });

    const state = m.getState();
    expect(state).not.toBeNull();
    if (state !== null) {
      expect(state.totalDurationMs).toBeLessThanOrEqual(1000);
    }
  });
});
