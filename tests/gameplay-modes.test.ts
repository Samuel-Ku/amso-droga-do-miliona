import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import { parseRunnerConfig } from "../src/config/schema";
import type { GameSnapshot } from "../src/game/contracts";
import { resolveCollision } from "../src/game/mode-rules";
import { RunnerGame } from "../src/game/RunnerGame";
import {
  STORY_REFRAME_SECONDS,
  type StoryTimelineSnapshot
} from "../src/game/story-timeline";
import type { StoryConfig } from "../src/shared/types";

function createGameHarness(
  mode: "story" | "challenge",
  storyOverride?: StoryConfig,
  awardStoryCompletionBonus = true
) {
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrameId = 0;
  let visibilityState: DocumentVisibilityState = "visible";
  let visibilityListener: (() => void) | null = null;
  let blurListener: (() => void) | null = null;
  const view = {
    devicePixelRatio: 1,
    requestAnimationFrame(callback: FrameRequestCallback): number {
      nextFrameId += 1;
      frames.set(nextFrameId, callback);
      return nextFrameId;
    },
    cancelAnimationFrame(id: number): void {
      frames.delete(id);
    },
    addEventListener(type: string, listener: () => void): void {
      if (type === "blur") blurListener = listener;
    },
    removeEventListener(type: string): void {
      if (type === "blur") blurListener = null;
    },
    matchMedia: () => ({ matches: false, addEventListener(): void {}, removeEventListener(): void {} })
  };
  const documentMock = {
    defaultView: view,
    get visibilityState(): DocumentVisibilityState { return visibilityState; },
    addEventListener(type: string, listener: () => void): void {
      if (type === "visibilitychange") visibilityListener = listener;
    },
    removeEventListener(type: string): void {
      if (type === "visibilitychange") visibilityListener = null;
    }
  };
  const contextTarget: Record<PropertyKey, unknown> = {};
  const context = new Proxy(contextTarget, {
    get(target, key) {
      if (key in target) return target[key];
      return (): void => {};
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    }
  }) as unknown as CanvasRenderingContext2D;
  const canvas = {
    width: 960,
    height: 540,
    clientWidth: 960,
    clientHeight: 540,
    ownerDocument: documentMock,
    getContext: () => context,
    getBoundingClientRect: () => ({ width: 960, height: 540 })
  } as unknown as HTMLCanvasElement;
  const config = parseRunnerConfig(productionConfig);
  if (!config) throw new Error("production config should parse");
  const snapshots: GameSnapshot[] = [];
  const storyUpdates: StoryTimelineSnapshot[] = [];
  const modeChanges: string[] = [];
  let gameOvers = 0;
  let storyCompletions = 0;
  let narrativeEnds = 0;
  let outcome: string | null = null;
  const game = new RunnerGame(
    canvas,
    {
      onSnapshot: (snapshot) => snapshots.push(snapshot),
      onGameOver: (result) => {
        gameOvers += 1;
        outcome = result.outcome;
      },
      onStoryUpdate: (snapshot) => storyUpdates.push(snapshot),
      onModeChange: (mode) => modeChanges.push(mode),
      onNarrativeEnd: () => { narrativeEnds += 1; },
      onStoryComplete: () => { storyCompletions += 1; }
    },
    {
      seed: 7,
      reducedMotion: true,
      mode,
      story: storyOverride ?? config.story,
      challenge: config.challenge,
      awardStoryCompletionBonus
    }
  );
  let jumpedObstacle: object | null = null;
  const avoidObstacles = (): void => {
    const internals = game as unknown as {
      obstacles: Array<{
        active: boolean;
        kind: "overhead" | "pallet" | "box-stack" | "trolley";
        x: number;
        width: number;
      }>;
      runner: { grounded: boolean; x: number };
    };
    const obstacle = internals.obstacles
      .filter(({ active, x, width }) => active && x + width >= internals.runner.x - 12)
      .sort((left, right) => left.x - right.x)[0];
    if (!obstacle) {
      jumpedObstacle = null;
      game.crouch(false, "keyboard");
    } else if (obstacle.kind === "overhead") {
      jumpedObstacle = null;
      game.crouch(obstacle.x <= 330, "keyboard");
    } else {
      game.crouch(false, "keyboard");
      if (obstacle !== jumpedObstacle && obstacle.x <= 220 && internals.runner.grounded) {
        jumpedObstacle = obstacle;
        game.jump("keyboard");
      }
    }
  };

  return {
    game,
    snapshots,
    storyUpdates,
    modeChanges,
    get gameOvers() { return gameOvers; },
    get storyCompletions() { return storyCompletions; },
    get narrativeEnds() { return narrativeEnds; },
    get outcome() { return outcome; },
    blurWindow(): void {
      blurListener?.();
    },
    hideDocument(): void {
      visibilityState = "hidden";
      visibilityListener?.();
    },
    avoidObstacles,
    continueCurrentSceneFully(): void {
      const sceneId = storyUpdates.at(-1)?.scene?.id;
      if (!sceneId) throw new Error("story should be waiting on a scene");
      for (let guard = 0; guard < 20 && storyUpdates.at(-1)?.scene?.id === sceneId; guard += 1) {
        if (!game.continueStoryScene(sceneId)) break;
      }
    },
    timestamp: 0,
    advance(seconds: number, beforeFrame?: (elapsedSeconds: number) => void): void {
      const frameCount = Math.ceil(seconds * 60);
      for (let index = 0; index <= frameCount && game.state === "running"; index += 1) {
        const entry = frames.entries().next().value as [number, FrameRequestCallback] | undefined;
        if (!entry) break;
        frames.delete(entry[0]);
        beforeFrame?.(index / 60);
        this.timestamp += 1000 / 60;
        entry[1](this.timestamp);
      }
    },
    driveStory(): void {
      for (let guard = 0; guard < 500; guard += 1) {
        const gameSnapshot = snapshots.at(-1);
        if (gameSnapshot?.mode === "challenge") return;
        const storySnapshot = storyUpdates.at(-1);
        if (storySnapshot?.state === "scene" && storySnapshot.scene) {
          game.continueStoryScene(storySnapshot.scene.id);
          continue;
        }
        if (storySnapshot?.playSegment?.id === "epoch_5.million_threshold" &&
            (snapshots.at(-1)?.bossesDefeated ?? 0) === 0) {
          const internals = game as unknown as { completeBossEncounter(): void };
          internals.completeBossEncounter();
        }
        this.advance(storySnapshot?.state === "countdown" ? 3.05 : 1, avoidObstacles);
      }
      const story = storyUpdates.at(-1);
      const snapshot = snapshots.at(-1);
      throw new Error(
        `story did not enter challenge: ${story?.playSegment?.id ?? story?.scene?.id ?? story?.state}; ` +
        `boss=${snapshot?.bossPhase}/${snapshot?.bossProgress ?? 0}; ` +
        `collisions=${snapshot?.collisions ?? 0}; recovery=${snapshot?.recoverySeconds ?? 0}`
      );
    }
  };
}

describe("campaign collision contract", () => {
  it("maps story collisions to recovery and challenge collisions to game over", () => {
    expect(resolveCollision("story", false)).toEqual({
      finishRun: false,
      consumeWarranty: false,
      resetCombo: true,
      recoverySeconds: 2
    });
    expect(resolveCollision("challenge", false).finishRun).toBe(true);
  });

  it("preserves warranty in story and consumes it only in challenge", () => {
    expect(resolveCollision("story", true)).toEqual({
      finishRun: false,
      consumeWarranty: false,
      resetCombo: true,
      recoverySeconds: 2
    });
    expect(resolveCollision("challenge", true)).toEqual({
      finishRun: false,
      consumeWarranty: true,
      resetCombo: false,
      recoverySeconds: 2
    });
  });

  it("keeps an unassisted story run alive after its first collision", () => {
    const config = parseRunnerConfig(productionConfig);
    if (!config) throw new Error("production config should parse");
    const collisionStory: StoryConfig = {
      ...config.story,
      epochs: config.story.epochs.map((epoch, index) =>
        index === 0 ? { ...epoch, beats: [], durationSeconds: 40 } : epoch
      )
    };
    const harness = createGameHarness("story", collisionStory);
    harness.game.start("keyboard");
    harness.continueCurrentSceneFully();
    harness.advance(4);
    harness.advance(25);

    expect(harness.game.state).toBe("running");
    expect(harness.gameOvers).toBe(0);
    expect(harness.snapshots.some(({ collisions }) => collisions > 0)).toBe(true);
    expect(harness.snapshots.some(({ recoverySeconds }) => recoverySeconds > 0)).toBe(true);
    harness.game.destroy();
  });

  it("ends an unassisted challenge run on its first collision", () => {
    const harness = createGameHarness("challenge");
    harness.game.start("keyboard");
    harness.advance(12);

    expect(harness.game.state).toBe("game_over");
    expect(harness.gameOvers).toBe(1);
    harness.game.destroy();
  });

  it("lets a player clear all eight tutorial actions inside the production training window", () => {
    const harness = createGameHarness("story");
    harness.game.start("keyboard");
    harness.continueCurrentSceneFully();
    harness.advance(STORY_REFRAME_SECONDS + 3.05);
    expect(harness.storyUpdates.at(-1)?.state).toBe("play");

    let jumpedObstacle: object | null = null;
    harness.advance(45, () => {
      const internals = harness.game as unknown as {
        obstacles: Array<{
          active: boolean;
          kind: "overhead" | "pallet" | "box-stack" | "trolley";
          source: string;
          x: number;
          width: number;
        }>;
        runner: { grounded: boolean; x: number };
      };
      const obstacle = internals.obstacles
        .filter(({ active, source, x, width }) =>
          active && source === "story-reward" && x + width >= internals.runner.x - 12
        )
        .sort((left, right) => left.x - right.x)[0];
      if (!obstacle) {
        jumpedObstacle = null;
        harness.game.crouch(false, "keyboard");
      } else if (obstacle.kind === "overhead") {
        jumpedObstacle = null;
        harness.game.crouch(obstacle.x <= 330, "keyboard");
      } else {
        harness.game.crouch(false, "keyboard");
        if (obstacle !== jumpedObstacle && obstacle.x <= 220 && internals.runner.grounded) {
          jumpedObstacle = obstacle;
          harness.game.jump("keyboard");
        }
      }
    });

    expect(harness.storyUpdates.at(-1)?.scene?.id).toBe("story.order_backlog");
    expect(harness.snapshots.at(-1)?.storyObjectives.epoch1.training).toMatchObject({
      jumps: 4,
      slides: 4,
      completed: true
    });
    expect(harness.snapshots.at(-1)?.storyObjectivesCompleted).toContain("epoch_1.training");
    harness.game.destroy();
  });

  it("holds the tutorial until the required jump and slide patterns are cleared", () => {
    const harness = createGameHarness("story");
    harness.game.start("keyboard");
    harness.continueCurrentSceneFully();
    harness.advance(STORY_REFRAME_SECONDS + 3.05);
    harness.advance(35);

    expect(harness.storyUpdates.at(-1)?.playSegment?.id).toBe("epoch_1.training");
    const internals = harness.game as unknown as {
      storyTimeline: { snapshot: StoryTimelineSnapshot };
    };
    expect(internals.storyTimeline.snapshot.sectionElapsedSeconds).toBe(25);
    expect(harness.snapshots.at(-1)?.storyObjectives.epoch1.training.completed).toBe(false);
    expect(harness.game.state).toBe("running");
    harness.game.destroy();
  });

  it("resolves Zator Zamówień into the process scene after its required actions", () => {
    const harness = createGameHarness("story");
    harness.game.start("keyboard");
    harness.continueCurrentSceneFully();
    harness.advance(STORY_REFRAME_SECONDS + 3.05);
    harness.advance(45, harness.avoidObstacles);
    expect(harness.storyUpdates.at(-1)?.scene?.id).toBe("story.order_backlog");
    harness.continueCurrentSceneFully();
    harness.advance(STORY_REFRAME_SECONDS + 3.05);
    expect(harness.storyUpdates.at(-1)?.playSegment?.id).toBe("epoch_1.order_backlog");

    harness.advance(45, harness.avoidObstacles);

    expect(harness.storyUpdates.at(-1)?.scene?.id).toBe("story.first_process");
    expect(harness.snapshots.at(-1)?.storyObjectives.epoch1.orderBacklog.bestAlternation)
      .toBeGreaterThanOrEqual(1);
    expect(harness.snapshots.at(-1)?.storyClimaxesCompleted).toContain(0);
    harness.game.destroy();
  });

  it("holds story scenes indefinitely, then keeps one score while entering challenge", () => {
    const config = parseRunnerConfig(productionConfig);
    if (!config) throw new Error("production config should parse");
    const harness = createGameHarness("story");

    harness.game.start("keyboard");
    harness.advance(60);
    expect(harness.storyUpdates.at(-1)?.scene?.id).toBe("story.first_package");
    expect(harness.snapshots.at(-1)).toMatchObject({
      mode: "story",
      score: 0,
      durationSeconds: 0,
      trustCorridor: true,
      visualWorldId: "first-mile",
      visualStateId: "story.first_package"
    });

    harness.driveStory();

    expect(harness.game.state).toBe("running");
    expect(harness.gameOvers).toBe(0);
    expect(harness.storyCompletions).toBe(1);
    expect(harness.modeChanges).toEqual(["challenge"]);
    expect(harness.storyUpdates.filter(({ state }) => state === "scene")
      .map(({ scene }) => scene?.id)
      .filter((id, index, ids) => index === 0 || id !== ids[index - 1]))
      .toEqual(config.story.sequence
        .filter((step): step is Extract<(typeof config.story.sequence)[number], { type: "scene" }> =>
          step.type === "scene")
        .map(({ sceneId }) => sceneId));
    const challengeSnapshot = harness.snapshots.find(({ mode }) => mode === "challenge");
    expect(challengeSnapshot).toMatchObject({
      mode: "challenge",
      storyPhase: null,
      storyObjectiveSegmentId: "",
      epochName: "",
      epochYear: "",
      epochIndex: 0,
      epochIndexMax: 0,
      visualWorldId: "million-finale",
      visualStateId: "story.million_finale"
    });
    expect(challengeSnapshot?.durationSeconds).toBeGreaterThanOrEqual(250);
    expect(challengeSnapshot?.score).toBeGreaterThanOrEqual(config.story.firstCompletionBonusScore);
    expect(challengeSnapshot?.challengeScore).toBe(0);
    expect(challengeSnapshot?.challengePackagesCollected).toBe(0);
    expect(challengeSnapshot?.storyObjectivesCompleted).toEqual(expect.arrayContaining([
      "epoch_4.order_peak_final",
      "epoch_5.million_threshold"
    ]));

    harness.advance(1);
    expect(harness.game.state).toBe("running");
    expect(harness.gameOvers).toBe(0);
    expect(harness.snapshots.at(-1)).toMatchObject({
      mode: "challenge",
      bossPhase: "inactive",
      logisticWavePhase: "inactive"
    });
    expect(harness.snapshots.at(-1)?.challengeScore).toBeGreaterThan(0);
    expect(harness.snapshots.at(-1)!.score - challengeSnapshot!.score)
      .toBe(harness.snapshots.at(-1)!.challengeScore);
    harness.game.destroy();
  });

  it("starts a direct challenge in the first-mile gameplay world", () => {
    const harness = createGameHarness("challenge");
    harness.game.start("keyboard");

    expect(harness.snapshots.at(-1)).toMatchObject({
      mode: "challenge",
      visualWorldId: "first-mile",
      visualStateId: "story.first_package",
      visualWorldIndex: 0
    });
    harness.game.destroy();
  });

  it("adds the configured completion bonus only when the profile marks this as the first pass", () => {
    const config = parseRunnerConfig(productionConfig);
    if (!config) throw new Error("production config should parse");
    const firstPass = createGameHarness("story", undefined, true);
    const replay = createGameHarness("story", undefined, false);

    firstPass.game.start("keyboard");
    replay.game.start("keyboard");
    firstPass.driveStory();
    replay.driveStory();

    expect(firstPass.snapshots.at(-1)!.score - replay.snapshots.at(-1)!.score)
      .toBe(config.story.firstCompletionBonusScore);
    firstPass.game.destroy();
    replay.game.destroy();
  }, 15_000);

  it("does not emit a legacy narrative ending when the seamless challenge ends", () => {
    const harness = createGameHarness("story");
    harness.game.start("keyboard");
    harness.driveStory();
    harness.advance(90);

    expect(harness.gameOvers).toBe(1);
    expect(harness.narrativeEnds).toBe(0);
    harness.game.destroy();
  });

  it("resets a completed seamless run as a pure challenge without reviving story state", () => {
    const harness = createGameHarness("story");
    harness.game.start("keyboard");
    harness.driveStory();

    harness.game.reset();

    expect(harness.snapshots.at(-1)).toMatchObject({
      mode: "challenge",
      storyPhase: null,
      durationSeconds: 0,
      score: 0
    });
    expect(harness.game.continueStoryScene("story.first_package")).toBe(false);
    harness.game.destroy();
  });

  it("derives three peak phases from the configured 24 + 48 seconds", () => {
    const config = parseRunnerConfig(productionConfig);
    if (!config) throw new Error("production config should parse");
    const harness = createGameHarness("story", config.story);
    harness.game.start("keyboard");
    harness.driveStory();

    expect(harness.snapshots.at(-1)?.storyObjectivesCompleted)
      .toContain("epoch_4.order_peak_final");
    expect(harness.snapshots.at(-1)?.storyObjectives.epoch4.flow)
      .toMatchObject({ elapsedSeconds: 72, completed: true, phasesCompleted: 3 });
    harness.game.destroy();
  });

  it("starts the three-phase, eight-combination boss with the final wave", () => {
    const harness = createGameHarness("story");
    harness.game.start("keyboard");
    for (let guard = 0; guard < 2_000; guard += 1) {
      const story = harness.storyUpdates.at(-1);
      if (story?.state === "scene" && story.scene?.id === "challenge.million_wave") break;
      if (story?.state === "scene" && story.scene) {
        harness.game.continueStoryScene(story.scene.id);
      } else {
        harness.advance(story?.state === "countdown" ? 3.05 : 1, harness.avoidObstacles);
      }
    }
    expect(harness.storyUpdates.at(-1)?.scene?.id).toBe("challenge.million_wave");

    harness.continueCurrentSceneFully();
    harness.advance(STORY_REFRAME_SECONDS + 3.05);
    harness.advance(0.1);
    expect(harness.snapshots.at(-1)).toMatchObject({
      mode: "story",
      storyObjectiveSegmentId: "epoch_5.million_threshold",
      bossEncounterPhase: 1,
      bossAttackCount: 8,
      bossesDefeated: 0
    });
    expect(harness.snapshots.at(-1)?.bossPhase).not.toBe("inactive");
    harness.advance(50);
    expect(harness.storyUpdates.at(-1)?.playSegment?.id).toBe("epoch_5.million_threshold");
    harness.game.destroy();
  });
});

describe("story lifecycle pauses", () => {
  it("ignores blur and visibility while a story scene or countdown owns focus", () => {
    const harness = createGameHarness("story");
    harness.game.start("keyboard");

    harness.blurWindow();
    expect(harness.game.state).toBe("running");
    harness.continueCurrentSceneFully();

    harness.hideDocument();
    expect(harness.game.state).toBe("running");
    harness.advance(STORY_REFRAME_SECONDS + 3.05);
    expect(harness.storyUpdates.at(-1)?.state).toBe("play");

    harness.blurWindow();
    expect(harness.game.state).toBe("paused");
    harness.game.destroy();
  });
});
