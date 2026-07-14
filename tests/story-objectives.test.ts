import { describe, expect, it } from "vitest";
import {
  STORY_CREATIVE_EQUIPMENT_IDS,
  STORY_OBJECTIVE_SEGMENT_IDS,
  StoryObjectiveDirector
} from "../src/game/story-objectives";

describe("StoryObjectiveDirector", () => {
  it("recognises every approved play segment without gating progression", () => {
    expect(STORY_OBJECTIVE_SEGMENT_IDS).toEqual([
      "epoch_1.training",
      "epoch_1.cable_chaos",
      "epoch_2.quality_series",
      "epoch_2.doubt_cloud",
      "epoch_3.creative_contract",
      "epoch_3.growth_contract",
      "epoch_3.trust_contract",
      "epoch_3.budget_eater",
      "epoch_4.orders",
      "epoch_4.logistic_hydra",
      "epoch_5.counter",
      "epoch_5.million_wave"
    ]);

    const director = new StoryObjectiveDirector();
    expect(director.enterSegment("epoch_2.quality_series")).toBe(true);
    expect(director.snapshot.activeSegmentId).toBe("epoch_2.quality_series");
    expect(director.enterSegment("not-a-story-segment")).toBe(false);
    expect(director.snapshot.activeSegmentId).toBe("epoch_2.quality_series");
  });

  it("tracks successful mixed patterns and alternating Cable Chaos clears", () => {
    const director = new StoryObjectiveDirector();
    director.enterSegment("epoch_1.training");
    for (let index = 0; index < 5; index += 1) {
      director.recordSuccessfulPattern("jump");
      director.recordSuccessfulPattern("slide");
    }

    expect(director.snapshot.epoch1.training).toMatchObject({
      jumps: 5,
      slides: 5,
      completed: true
    });

    director.enterSegment("epoch_1.cable_chaos");
    for (const action of ["jump", "slide", "jump"] as const) {
      director.recordSuccessfulPattern(action);
    }
    director.recordError();
    expect(director.snapshot.epoch1.cableChaos).toMatchObject({
      currentAlternation: 0,
      bestAlternation: 3,
      completed: false
    });

    for (const action of ["slide", "jump", "slide", "jump"] as const) {
      director.recordSuccessfulPattern(action);
    }
    expect(director.snapshot.epoch1.cableChaos.completed).toBe(true);
  });

  it("awards four quality stamps from cleared patterns and resets only the current series", () => {
    const director = new StoryObjectiveDirector();
    director.enterSegment("epoch_2.quality_series");

    director.recordSuccessfulPattern("jump");
    director.recordSuccessfulPattern("slide");
    director.recordCollision();
    expect(director.snapshot.epoch2).toMatchObject({ completedSeries: 0, currentSeries: 0 });

    for (let index = 0; index < 7; index += 1) {
      director.recordSuccessfulPattern(index % 2 === 0 ? "jump" : "slide");
    }
    expect(director.snapshot.epoch2).toMatchObject({ completedSeries: 2, currentSeries: 1 });

    director.recordError();
    for (let index = 0; index < 6; index += 1) {
      director.recordSuccessfulPattern("jump");
    }
    expect(director.snapshot.epoch2).toMatchObject({
      completedSeries: 4,
      currentSeries: 0,
      completed: true
    });
  });

  it("requires the marked creative set, consumes real combo, and preserves clean streaks", () => {
    const director = new StoryObjectiveDirector();
    director.enterSegment("epoch_3.creative_contract");
    director.recordCreativePickup("notebook");
    director.recordCreativePickup("notebook");
    expect(director.recordCreativePickup("telefon").changed).toBe(false);
    director.recordCreativePickup("lcd");
    const creativeUpdate = director.recordCreativePickup("pc");
    expect(creativeUpdate.newlyCompletedObjectiveIds).toContain("epoch_3.creative_contract");
    expect(STORY_CREATIVE_EQUIPMENT_IDS).toEqual(["notebook", "lcd", "pc"]);
    expect(director.snapshot.epoch3.creative).toMatchObject({
      collected: 3,
      collectedIds: ["lcd", "notebook", "pc"],
      completed: true
    });

    director.enterSegment("epoch_3.growth_contract");
    director.recordCurrentCombo(5);
    director.recordCurrentCombo(3);
    expect(director.snapshot.epoch3.growth).toMatchObject({ currentCombo: 3, bestCombo: 5 });
    director.recordError();
    const growthUpdate = director.recordCurrentCombo(8);
    expect(growthUpdate.newlyCompletedObjectiveIds).toContain("epoch_3.growth_contract");
    expect(director.snapshot.epoch3.growth).toMatchObject({
      currentCombo: 8,
      bestCombo: 8,
      completed: true
    });

    director.enterSegment("epoch_3.trust_contract");
    for (let index = 0; index < 7; index += 1) director.recordTrustCollection();
    director.recordCollision();
    for (let index = 0; index < 12; index += 1) {
      director.recordTrustCollection();
    }
    expect(director.snapshot.epoch3.trust).toMatchObject({
      currentClean: 12,
      longestClean: 12,
      completed: true
    });
    expect(director.snapshot.epoch3.completed).toBe(true);
  });

  it("keeps compatibility aliases on the stricter successful-pattern and marked-set paths", () => {
    const director = new StoryObjectiveDirector();
    director.enterSegment("epoch_1.training");
    director.recordAction("jump");
    expect(director.snapshot.epoch1.training.jumps).toBe(1);

    director.enterSegment("epoch_3.creative_contract");
    expect(director.recordPickup("telefon").changed).toBe(false);
    expect(director.recordPickup("notebook").changed).toBe(true);
    expect(director.snapshot.epoch3.creative.collectedIds).toEqual(["notebook"]);
  });

  it("separates six required orders from bonus orders and advances three Hydra phases by time", () => {
    const director = new StoryObjectiveDirector();
    director.enterSegment("epoch_4.orders", 45);
    for (const type of ["pc", "notebook", "lcd", "telefon", "pc", "notebook", "lcd", "telefon"] as const) {
      director.recordOrder(type);
    }
    expect(director.snapshot.epoch4.orders).toMatchObject({
      requiredCompleted: 6,
      bonusCompleted: 2,
      lastCompletedType: "telefon",
      completed: true
    });

    director.enterSegment("epoch_4.logistic_hydra", 20);
    director.recordElapsed(7);
    expect(director.snapshot.epoch4.hydra).toMatchObject({
      phase: "routing",
      phasesCompleted: 1,
      completed: false
    });
    const update = director.recordElapsed(13);
    expect(update.newlyCompletedObjectiveIds).toContain("epoch_4.logistic_hydra");
    expect(director.snapshot.epoch4.hydra).toMatchObject({
      phase: "completed",
      phasesCompleted: 3,
      completed: true
    });
  });

  it("exposes the million counter and three finale phases", () => {
    const director = new StoryObjectiveDirector();
    director.enterSegment("epoch_5.counter", 15);
    expect(director.snapshot.epoch5.counter.value).toBe(999_970);
    director.recordElapsed(10);
    expect(director.snapshot.epoch5.counter.value).toBe(999_990);
    director.recordElapsed(5);
    expect(director.snapshot.epoch5.counter).toMatchObject({ value: 999_999, completed: true });

    director.enterSegment("epoch_5.million_wave", 60);
    director.recordElapsed(39.9);
    expect(director.snapshot.epoch5.wave).toMatchObject({
      phase: "quality",
      guidedPhasesCompleted: 1,
      completed: false
    });
    director.recordElapsed(0.1);
    expect(director.snapshot.epoch5.wave).toMatchObject({
      phase: "logistics",
      guidedPhasesCompleted: 2
    });
    director.recordElapsed(20);
    expect(director.snapshot.epoch5.wave).toMatchObject({ phase: "completed", completed: true });
  });

  it("derives Hydra, counter and three finale phases from tuned segment durations", () => {
    const director = new StoryObjectiveDirector();

    director.enterSegment("epoch_4.logistic_hydra", 30);
    director.recordElapsed(20);
    expect(director.snapshot.epoch4.hydra).toMatchObject({
      elapsedSeconds: 20,
      phase: "dispatch",
      phasesCompleted: 2,
      completed: false
    });
    director.recordElapsed(10);
    expect(director.snapshot.epoch4.hydra.completed).toBe(true);

    director.enterSegment("epoch_5.counter", 20);
    director.recordElapsed(15);
    expect(director.snapshot.epoch5.counter).toMatchObject({
      value: 999_999,
      completed: false
    });
    director.recordElapsed(5);
    expect(director.snapshot.epoch5.counter.completed).toBe(true);

    director.enterSegment("epoch_5.million_wave", 70);
    director.recordElapsed(46.6);
    expect(director.snapshot.epoch5.wave).toMatchObject({
      phase: "quality",
      guidedPhasesCompleted: 1,
      completed: false
    });
    director.recordElapsed(0.1);
    expect(director.snapshot.epoch5.wave).toMatchObject({
      phase: "logistics",
      guidedPhasesCompleted: 2
    });
    director.recordElapsed(23.3);
    expect(director.snapshot.epoch5.wave.completed).toBe(true);
  });

  it("keeps missed symbols pending until each unique symbol is actually collected", () => {
    const director = new StoryObjectiveDirector();
    director.enterSegment("epoch_5.million_wave");

    director.recordSymbolMiss(3);
    director.recordSymbolMiss(3);
    expect(director.snapshot.epoch5.symbols.pendingIds).toContain(3);
    expect(director.snapshot.epoch5.symbols.misses).toBe(2);

    for (let index = 0; index < 8; index += 1) director.recordSymbol(index);
    director.recordSymbol(7);
    expect(director.snapshot.epoch5.symbols).toMatchObject({
      collectedIds: [0, 1, 2, 3, 4, 5, 6, 7],
      pendingIds: [],
      completed: true
    });
  });
});
