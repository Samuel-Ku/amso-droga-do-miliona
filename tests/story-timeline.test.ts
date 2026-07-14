import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import { parseRunnerConfig } from "../src/config/schema";
import { STORY_REFRAME_SECONDS, StoryTimeline } from "../src/game/story-timeline";
import type { StoryConfig } from "../src/shared/types";

function playerPacedStory(): StoryConfig {
  return {
    activeDurationSeconds: 4,
    readingSpeedMultiplier: 0.3,
    speedStartMultiplier: 0.8,
    speedMaxMultiplier: 1.15,
    resumeCountdownSeconds: 3,
    firstCompletionBonusScore: 10_000,
    scenes: [
      {
        id: "intro.ready",
        eyebrow: "Pierwsza paczka",
        title: "Dobra. Pierwsza gotowa.",
        body: ["Zaczynamy od jednej paczki."],
        vignette: "first-package",
        continueLabel: "Dalej"
      },
      {
        id: "intro.promise",
        eyebrow: "AMSO",
        title: "Dobry sprzęt musi być sprawdzony.",
        body: ["To obietnica całej drogi."],
        vignette: "tested-device",
        continueLabel: "Zaczynamy"
      },
      {
        id: "final.thanks",
        eyebrow: "1 000 000",
        title: "Dziękujemy.",
        body: ["Jedziemy dalej."],
        vignette: "million-package",
        continueLabel: "Jedziemy dalej — Próba Miliona"
      }
    ],
    sequence: [
      { type: "scene", sceneId: "intro.ready" },
      { type: "scene", sceneId: "intro.promise" },
      { type: "play", id: "first-route", epochIndex: 0, durationSeconds: 4 },
      { type: "scene", sceneId: "final.thanks" }
    ],
    epochs: []
  };
}

describe("player-paced story timeline", () => {
  it("keeps a complete scene stable until the player continues", () => {
    const timeline = new StoryTimeline(playerPacedStory());

    expect(timeline.snapshot.state).toBe("scene");
    expect(timeline.snapshot.scene?.id).toBe("intro.ready");
    expect(timeline.snapshot.trustCorridor).toBe(true);

    timeline.advance(60);

    expect(timeline.snapshot.scene?.id).toBe("intro.ready");
    expect(timeline.snapshot.totalActiveElapsedSeconds).toBe(0);

    expect(timeline.continueScene("intro.ready")).toBe(true);
    expect(timeline.snapshot.scene?.id).toBe("intro.promise");
  });

  it("rejects a stale scene acknowledgement and owns the 3-2-1 handoff", () => {
    const timeline = new StoryTimeline(playerPacedStory());

    expect(timeline.continueScene("intro.promise")).toBe(false);
    expect(timeline.snapshot.scene?.id).toBe("intro.ready");
    timeline.continueScene("intro.ready");
    timeline.continueScene("intro.promise");

    expect(timeline.snapshot.state).toBe("reframe");
    expect(timeline.snapshot.countdownValue).toBeNull();
    timeline.advance(STORY_REFRAME_SECONDS - 0.01);
    expect(timeline.snapshot.state).toBe("reframe");
    timeline.advance(0.01);
    expect(timeline.snapshot.state).toBe("countdown");
    expect(timeline.snapshot.countdownValue).toBe(3);
    expect(timeline.snapshot.controlsEnabled).toBe(false);
    timeline.advance(1.01);
    expect(timeline.snapshot.countdownValue).toBe(2);
    timeline.advance(1);
    expect(timeline.snapshot.countdownValue).toBe(1);
    timeline.advance(1);
    expect(timeline.snapshot.state).toBe("play");
    expect(timeline.snapshot.controlsEnabled).toBe(true);
    expect(timeline.snapshot.totalActiveElapsedSeconds).toBeCloseTo(0.01, 5);
  });

  it("holds a timed play boundary until its required encounter is complete", () => {
    const timeline = new StoryTimeline(playerPacedStory());
    timeline.continueScene("intro.ready");
    timeline.continueScene("intro.promise");
    timeline.advance(STORY_REFRAME_SECONDS);
    timeline.advance(3);

    timeline.advance(4, { allowPlayCompletion: false });
    expect(timeline.snapshot.state).toBe("play");
    expect(timeline.snapshot.sectionElapsedSeconds).toBe(4);
    expect(timeline.snapshot.totalActiveElapsedSeconds).toBe(4);

    timeline.advance(0.01);
    expect(timeline.snapshot.state).toBe("scene");
    expect(timeline.snapshot.scene?.id).toBe("final.thanks");
    expect(timeline.snapshot.totalActiveElapsedSeconds).toBe(4);
  });

  it("presents the approved 10-stop story once within 250 active seconds", () => {
    const config = parseRunnerConfig(productionConfig);
    if (!config) throw new Error("production config should parse");
    const timeline = new StoryTimeline(config.story);
    const seen: string[] = [];

    for (let guard = 0; guard < 100 && !timeline.snapshot.completed; guard += 1) {
      const snapshot = timeline.snapshot;
      if (snapshot.state === "scene" && snapshot.scene) {
        seen.push(snapshot.scene.id);
        expect(timeline.continueScene(snapshot.scene.id)).toBe(true);
      } else if (snapshot.state === "reframe") {
        timeline.advance(STORY_REFRAME_SECONDS);
      } else if (snapshot.state === "countdown") {
        timeline.advance(snapshot.countdownSecondsRemaining);
      } else if (snapshot.state === "play" && snapshot.playSegment) {
        timeline.advance(snapshot.playSegment.durationSeconds - snapshot.sectionElapsedSeconds);
      }
    }

    expect(seen).toEqual([
      "story.first_package",
      "story.quality_promise",
      "story.first_process",
      "client.creative_start",
      "client.business_growth",
      "client.b2b_trust",
      "story.scale",
      "story.million_approach",
      "challenge.million_wave",
      "story.million_finale"
    ]);
    expect(new Set(seen).size).toBe(10);
    expect(timeline.snapshot.totalActiveElapsedSeconds).toBe(250);
    expect(timeline.snapshot.progress).toBe(1);
    expect(timeline.snapshot.completed).toBe(true);
  });
});
