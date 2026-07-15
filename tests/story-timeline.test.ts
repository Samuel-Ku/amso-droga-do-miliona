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
    epochs: [],
    modeHandoff: {
      id: "story.challenge_handoff",
      from: "story",
      to: "challenge",
      safe: true,
      confirmationRequired: true,
      resumeCountdownSeconds: 3
    },
    millionThreshold: {
      counterStart: 999_970,
      counterTarget: 1_000_000,
      packageTarget: 30,
      combinationTarget: 8
    }
  };
}

describe("player-paced story timeline", () => {
  it("advances authored pages inside one safe scene only on explicit continuation", () => {
    const story = playerPacedStory();
    story.scenes[0]!.steps = [
      { id: "origin", body: ["Mały sklep."], continueLabel: "Dalej", safe: true },
      { id: "packing", title: "Pierwsza paczka", body: ["Pakowana ręcznie."], continueLabel: "Gotowe", safe: true }
    ];
    const timeline = new StoryTimeline(story);

    expect(timeline.snapshot.scenePageId).toBe("origin");
    expect(timeline.snapshot.scenePageIndex).toBe(0);
    expect(timeline.snapshot.scene?.body).toEqual(["Mały sklep."]);
    timeline.advance(60);
    expect(timeline.snapshot.scenePageId).toBe("origin");

    expect(timeline.continueScene("intro.ready")).toBe(true);
    expect(timeline.snapshot.state).toBe("scene");
    expect(timeline.snapshot.scenePageId).toBe("packing");
    expect(timeline.snapshot.scenePageIndex).toBe(1);
    expect(timeline.snapshot.scene?.title).toBe("Pierwsza paczka");
    expect(timeline.continueScene("intro.ready")).toBe(true);
    expect(timeline.snapshot.scene?.id).toBe("intro.promise");
  });
  it("publishes explicit safe narrative and active-play states", () => {
    const timeline = new StoryTimeline(playerPacedStory());
    expect(timeline.snapshot.safety).toEqual({
      kind: "narrative_safe", hazardsEnabled: false, pickupsEnabled: false, controlsEnabled: false
    });
    timeline.continueScene("intro.ready");
    timeline.continueScene("intro.promise");
    expect(timeline.snapshot.safety?.kind).toBe("narrative_safe");
    timeline.advance(STORY_REFRAME_SECONDS + 3);
    expect(timeline.snapshot.safety).toEqual({
      kind: "active_play", hazardsEnabled: true, pickupsEnabled: true, controlsEnabled: true
    });
  });
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

  it("presents the approved 15-stop story once within 276 active seconds", () => {
    const config = parseRunnerConfig(productionConfig);
    if (!config) throw new Error("production config should parse");
    const timeline = new StoryTimeline(config.story);
    const seen: string[] = [];
    const presentations: string[] = [];

    for (let guard = 0; guard < 100 && !timeline.snapshot.completed; guard += 1) {
      const snapshot = timeline.snapshot;
      if (snapshot.state === "scene" && snapshot.scene) {
        seen.push(snapshot.scene.id);
        presentations.push(`${snapshot.scene.id}:${snapshot.scenePageId ?? "default"}`);
        expect(timeline.continueScene(snapshot.scene.id)).toBe(true);
      } else if (snapshot.state === "reframe") {
        timeline.advance(STORY_REFRAME_SECONDS);
      } else if (snapshot.state === "countdown") {
        timeline.advance(snapshot.countdownSecondsRemaining);
      } else if (snapshot.state === "play" && snapshot.playSegment) {
        timeline.advance(snapshot.playSegment.durationSeconds - snapshot.sectionElapsedSeconds);
      }
    }

    expect([...new Set(seen)]).toEqual([
      "story.first_package",
      "story.order_backlog",
      "story.first_process",
      "story.quality_promise",
      "story.quality_result",
      "client.creative_start",
      "client.business_growth",
      "client.b2b_trust",
      "story.matching_result",
      "story.scale",
      "story.order_peak_result",
      "story.million_approach",
      "challenge.million_wave",
      "story.million_finale",
      "story.challenge_handoff"
    ]);
    expect(seen).toHaveLength(42);
    expect(new Set(presentations).size).toBe(42);
    expect(timeline.snapshot.totalActiveElapsedSeconds).toBe(276);
    expect(timeline.snapshot.progress).toBe(1);
    expect(timeline.snapshot.completed).toBe(true);
  });
});
