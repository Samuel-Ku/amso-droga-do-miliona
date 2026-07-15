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
      "epoch_1.order_backlog",
      "epoch_2.quality_series",
      "epoch_2.quality_trial",
      "epoch_3.matching_creative",
      "epoch_3.matching_growth",
      "epoch_3.matching_trust",
      "epoch_4.order_peak",
      "epoch_4.order_peak_final",
      "epoch_5.million_threshold"
    ]);

    const director = new StoryObjectiveDirector();
    expect(director.enterSegment("epoch_2.quality_series")).toBe(true);
    expect(director.snapshot.activeSegmentId).toBe("epoch_2.quality_series");
    expect(director.enterSegment("not-a-story-segment")).toBe(false);
    expect(director.snapshot.activeSegmentId).toBe("epoch_2.quality_series");
  });

  it("models the million threshold as 30 packages and 8 combinations without symbols", () => {
    const director = new StoryObjectiveDirector();
    director.enterSegment("epoch_5.million_threshold");
    expect(director.snapshot.epoch5.millionThreshold).toMatchObject({
      counterValue: 999_970, packageTarget: 30, combinationTarget: 8, completed: false
    });
    for (let index = 0; index < 30; index += 1) director.recordMillionPackage();
    for (let index = 0; index < 8; index += 1) director.recordMillionCombination();
    expect(director.snapshot.epoch5.millionThreshold).toMatchObject({
      packagesCollected: 30, combinationsCompleted: 8, counterValue: 1_000_000, completed: true
    });
    expect(director.snapshot.completedObjectiveIds).toContain("epoch_5.million_threshold");
  });

  it("tracks successful mixed patterns and alternating order-backlog clears", () => {
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

    director.enterSegment("epoch_1.order_backlog");
    for (const action of ["jump", "slide", "jump"] as const) {
      director.recordSuccessfulPattern(action);
    }
    director.recordError();
    expect(director.snapshot.epoch1.orderBacklog).toMatchObject({
      currentAlternation: 0,
      bestAlternation: 3,
      completed: false
    });

    for (const action of ["slide", "jump", "slide", "jump"] as const) {
      director.recordSuccessfulPattern(action);
    }
    expect(director.snapshot.epoch1.orderBacklog.completed).toBe(true);
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
    director.enterSegment("epoch_3.matching_creative");
    director.recordCreativePickup("notebook");
    director.recordCreativePickup("notebook");
    expect(director.recordCreativePickup("telefon").changed).toBe(false);
    director.recordCreativePickup("lcd");
    const creativeUpdate = director.recordCreativePickup("pc");
    expect(creativeUpdate.newlyCompletedObjectiveIds).toContain("epoch_3.matching_creative");
    expect(STORY_CREATIVE_EQUIPMENT_IDS).toEqual(["notebook", "lcd", "pc"]);
    expect(director.snapshot.epoch3.creative).toMatchObject({
      collected: 3,
      collectedIds: ["lcd", "notebook", "pc"],
      completed: true
    });

    director.enterSegment("epoch_3.matching_growth");
    director.recordCurrentCombo(5);
    director.recordCurrentCombo(3);
    expect(director.snapshot.epoch3.growth).toMatchObject({ currentCombo: 3, bestCombo: 5 });
    director.recordError();
    const growthUpdate = director.recordCurrentCombo(8);
    expect(growthUpdate.newlyCompletedObjectiveIds).toContain("epoch_3.matching_growth");
    expect(director.snapshot.epoch3.growth).toMatchObject({
      currentCombo: 8,
      bestCombo: 8,
      completed: true
    });

    director.enterSegment("epoch_3.matching_trust");
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

  it("separates six required orders from bonus orders and advances three peak phases", () => {
    const director = new StoryObjectiveDirector();
    director.enterSegment("epoch_4.order_peak", 45);
    for (const type of ["pc", "notebook", "lcd", "telefon", "pc", "notebook", "lcd", "telefon"] as const) {
      director.recordOrder(type);
    }
    expect(director.snapshot.epoch4.orders).toMatchObject({
      requiredCompleted: 6,
      bonusCompleted: 2,
      lastCompletedType: "telefon",
      completed: true
    });

    director.recordElapsed(24);
    expect(director.snapshot.epoch4.flow).toMatchObject({
      phase: "routing",
      phasesCompleted: 1,
      completed: false
    });
    director.enterSegment("epoch_4.order_peak_final", 48);
    const update = director.recordElapsed(48);
    expect(update.newlyCompletedObjectiveIds).toContain("epoch_4.order_peak_final");
    expect(director.snapshot.epoch4.flow).toMatchObject({
      phase: "completed",
      phasesCompleted: 3,
      completed: true
    });
  });

  it("keeps the two million goals independent and caps both targets", () => {
    const director = new StoryObjectiveDirector();
    director.enterSegment("epoch_5.million_threshold");
    for (let index = 0; index < 31; index += 1) director.recordMillionPackage();
    expect(director.snapshot.epoch5.millionThreshold).toMatchObject({
      packagesCollected: 30,
      combinationsCompleted: 0,
      counterValue: 1_000_000,
      completed: false
    });
    for (let index = 0; index < 9; index += 1) director.recordMillionCombination();
    expect(director.snapshot.epoch5.millionThreshold).toMatchObject({
      combinationsCompleted: 8,
      completed: true
    });
  });
});
