import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import { parseRunnerConfig } from "../src/config/schema";
import { StoryTimeline } from "../src/game/story-timeline";

function productionStory() {
  const config = parseRunnerConfig(productionConfig);
  if (!config) throw new Error("production config should parse");
  return config.story;
}

describe("story timeline", () => {
  it("exposes every configured beat and completes only after final.thanks", () => {
    const story = productionStory();
    const timeline = new StoryTimeline(story);
    const seen = new Set<string>();
    let thanksWasVisibleBeforeCompletion = false;

    for (let step = 0; step < story.durationSeconds * 20; step += 1) {
      const before = timeline.snapshot;
      for (const beat of before.activeBeats) seen.add(beat.id);
      if (before.activeBeats.some(({ id }) => id === "final.thanks")) {
        thanksWasVisibleBeforeCompletion = true;
      }
      timeline.advance(0.05);
      if (timeline.snapshot.completed) break;
    }

    const configuredIds = [
      ...story.prologue.beats,
      ...story.epochs.flatMap(({ beats }) => beats),
      ...story.finale.beats
    ].map(({ id }) => id);

    expect([...seen].sort()).toEqual([...configuredIds].sort());
    expect(thanksWasVisibleBeforeCompletion).toBe(true);
    expect(timeline.snapshot.completed).toBe(true);
    expect(timeline.snapshot.totalElapsedSeconds).toBeCloseTo(175, 5);
  });

  it("marks copy windows and their two-second handback as a safe corridor", () => {
    const timeline = new StoryTimeline(productionStory());
    expect(timeline.snapshot.trustCorridor).toBe(true);

    timeline.advance(9.5);
    expect(timeline.snapshot.activeBeats.some(({ id }) => id === "prolog.checked")).toBe(true);
    expect(timeline.snapshot.trustCorridor).toBe(true);

    timeline.advance(0.5);
    expect(timeline.snapshot.phase).toBe("epoch");
    expect(timeline.snapshot.epochIndex).toBe(0);
  });

  it("resumes from a persisted checkpoint without replaying earlier chapters", () => {
    const timeline = new StoryTimeline(productionStory(), "epoch_4");
    expect(timeline.snapshot.phase).toBe("epoch");
    expect(timeline.snapshot.epochIndex).toBe(3);
    expect(timeline.snapshot.sectionId).toBe("skala");
    expect(timeline.snapshot.totalElapsedSeconds).toBe(95);
  });

  it("counts eight unique collected symbols instead of deriving them from time", () => {
    const timeline = new StoryTimeline(productionStory(), "epoch_5");
    timeline.advance(10);
    expect(timeline.snapshot.symbolsCollected).toBe(0);

    for (let index = 0; index < 8; index += 1) {
      expect(timeline.collectStorySymbol(index)).toBe(true);
    }
    expect(timeline.collectStorySymbol(7)).toBe(false);
    expect(timeline.snapshot.symbolsCollected).toBe(8);
  });

  it("leaves a playable final-wave window between grouped story corridors", () => {
    const timeline = new StoryTimeline(productionStory(), "epoch_5");
    let currentPlayable = 0;
    let longestPlayable = 0;
    for (let step = 0; step < 200; step += 1) {
      if (timeline.snapshot.trustCorridor) currentPlayable = 0;
      else currentPlayable += 0.1;
      longestPlayable = Math.max(longestPlayable, currentPlayable);
      timeline.advance(0.1);
    }

    expect(longestPlayable).toBeGreaterThanOrEqual(8);
  });
});
