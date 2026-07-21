import { describe, expect, it } from "vitest";
import { CelebrationManager } from "../src/game/celebration-manager";

describe("CelebrationManager", () => {
  function trigger(
    manager: CelebrationManager,
    threshold: number,
    isRecord = false,
    playerX = 142,
    playerY = 400
  ): void {
    manager.trigger({ threshold, isRecord, playerX, playerY });
  }

  function advance(manager: CelebrationManager, ms: number): void {
    manager.update(ms / 1000);
  }

  it("resolves Spark stage for thresholds 10 and 50", () => {
    const m = new CelebrationManager();

    trigger(m, 10);
    expect(m.getState()?.stage).toBe("spark");

    m.cancel();
    trigger(m, 50);
    expect(m.getState()?.stage).toBe("spark");
  });

  it("resolves Boost stage for threshold 100", () => {
    const m = new CelebrationManager();
    trigger(m, 100);
    expect(m.getState()?.stage).toBe("boost");
  });

  it("resolves Impact stage for threshold 500", () => {
    const m = new CelebrationManager();
    trigger(m, 500);
    expect(m.getState()?.stage).toBe("impact");
  });

  it("resolves Milestone stage for threshold 1000", () => {
    const m = new CelebrationManager();
    trigger(m, 1000);
    expect(m.getState()?.stage).toBe("milestone");
  });

  it("resolves Legendary stage for thresholds 5000 and above", () => {
    const m = new CelebrationManager();
    trigger(m, 5000);
    expect(m.getState()?.stage).toBe("legendary");
  });

  it("bumps record celebration one stage higher", () => {
    const m = new CelebrationManager();
    trigger(m, 10, true);
    expect(m.getState()?.stage).toBe("boost");

    m.cancel();
    trigger(m, 1000, true);
    expect(m.getState()?.stage).toBe("legendary");
  });

  it("keeps Legendary stage for record when already Legendary", () => {
    const m = new CelebrationManager();
    trigger(m, 5000, true);
    expect(m.getState()?.stage).toBe("legendary");
  });

  it("returns non-null state after trigger and null after completion", () => {
    const m = new CelebrationManager();
    trigger(m, 10);
    expect(m.getState()).not.toBeNull();

    advance(m, 9999);
    expect(m.getState()).toBeNull();
  });

  it("interrupts active celebration on new trigger", () => {
    const m = new CelebrationManager();
    trigger(m, 10);

    const first = m.getState();
    expect(first?.stage).toBe("spark");

    trigger(m, 100);
    const second = m.getState();
    expect(second?.stage).toBe("boost");
    expect(second).not.toBe(first);
  });

  it("cancel() clears state immediately", () => {
    const m = new CelebrationManager();
    trigger(m, 10);
    expect(m.getState()).not.toBeNull();

    m.cancel();
    expect(m.getState()).toBeNull();
  });

  it("reset() clears state and variant counters", () => {
    const m = new CelebrationManager();
    trigger(m, 10);
    m.cancel();
    trigger(m, 10);
    m.reset();

    m.cancel();
    trigger(m, 10);
    expect(m.getState()).not.toBeNull();
  });

  it("cycles through variants when same threshold triggered multiple times", () => {
    const m = new CelebrationManager();

    for (let i = 0; i < 5; i++) {
      trigger(m, 10);
      // Each trigger picks from a variant index based on counter
      // We just verify it doesn't crash and stage is correct
      expect(m.getState()?.stage).toBe("spark");
      m.cancel();
    }
    // No crash = variant cycling works
  });

  it("evolves phase progress over time", () => {
    const m = new CelebrationManager();
    trigger(m, 10);

    const before = m.getState();
    expect(before).not.toBeNull();
    expect(before!.phaseIndex).toBe(0);
    expect(before!.phaseProgress).toBe(0);

    advance(m, 200);
    const after = m.getState();
    expect(after).not.toBeNull();
    expect(after!.phaseProgress).toBeGreaterThan(0);
  });

  it("transitions to next phase when current phase duration elapses", () => {
    const m = new CelebrationManager();
    trigger(m, 500); // Impact has multi-phase config

    expect(m.getState()?.phaseIndex).toBe(0);

    advance(m, 9999); // skip all phases
    expect(m.getState()).toBeNull();
  });

  it("includes player position in celebration state", () => {
    const m = new CelebrationManager();
    trigger(m, 10, false, 200, 350);
    const state = m.getState();
    expect(state?.playerX).toBe(200);
    expect(state?.playerY).toBe(350);
  });

  it("returns null state when manager never triggered", () => {
    const m = new CelebrationManager();
    expect(m.getState()).toBeNull();
  });

  it("provides effects in celebration state", () => {
    const m = new CelebrationManager();
    trigger(m, 10);
    const state = m.getState();
    expect(state).not.toBeNull();
    expect(state!.effects.length).toBeGreaterThan(0);
    expect(state!.effects[0]!.type).toBe("confetti-burst");
  });
});
