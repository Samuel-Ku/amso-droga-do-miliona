import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import { parseRunnerConfig } from "../src/config/schema";
import type { GameSnapshot } from "../src/game/contracts";
import type { MilestoneCelebrationEvent } from "../src/game/milestone-celebration";
import { resolveCollision } from "../src/game/mode-rules";
import { RunnerGame } from "../src/game/RunnerGame";
import {
  STORY_REFRAME_SECONDS,
  type StoryTimelineSnapshot
} from "../src/game/story-timeline";
import type { StoryConfig } from "../src/shared/types";
import type { PackageModel } from "../src/game/types";

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
  const contextTarget: Record<PropertyKey, unknown> = {
    createLinearGradient: () => ({ addColorStop(): void {} })
  };
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
  const milestoneCelebrations: MilestoneCelebrationEvent[] = [];
  const milestoneModes: string[] = [];
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
      onMilestoneCelebration: (celebration) => {
        milestoneCelebrations.push(celebration);
        milestoneModes.push(snapshots.at(-1)?.mode ?? mode);
      },
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
        authoredWaveId?: string;
      }>;
      runner: { grounded: boolean; x: number };
      packages: PackageModel[];
      collectPackage(parcel: PackageModel): void;
    };
    for (const parcel of internals.packages) {
      if (parcel.active && parcel.authoredWaveId && parcel.x <= 330) {
        internals.collectPackage(parcel);
      }
    }
    const obstacle = internals.obstacles
      .filter(({ active, x, width }) => active && x + width >= internals.runner.x - 12)
      .sort((left, right) => left.x - right.x)[0];
    if (obstacle?.authoredWaveId && obstacle.x <= 330) {
      obstacle.active = false;
      jumpedObstacle = null;
      game.crouch(false, "keyboard");
      return;
    }
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
    milestoneCelebrations,
    milestoneModes,
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
    collectPackagesUntil(total: number): void {
      const internals = game as unknown as {
        packagesCollected: number;
        collectPackage(parcel: PackageModel): void;
      };
      while (internals.packagesCollected < total) {
        internals.collectPackage({
          active: true,
          kind: "standard",
          scoreValue: 100,
          x: 120,
          y: 400,
          size: 30,
          phase: 0,
          packageType: "notebook",
          weightKg: 1
        });
      }
    },
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
        this.advance(storySnapshot?.state === "countdown" ? 3.05 : 1, avoidObstacles);
      }
      const story = storyUpdates.at(-1);
      const snapshot = snapshots.at(-1);
      throw new Error(
        `story did not enter challenge: ${story?.playSegment?.id ?? story?.scene?.id ?? story?.state}; ` +
        `boss=${snapshot?.bossPhase}/${snapshot?.bossProgress ?? 0}; ` +
        `collisions=${snapshot?.collisions ?? 0}; recovery=${snapshot?.recoverySeconds ?? 0}; ` +
        `authored=${JSON.stringify(snapshot?.authoredWave ?? null)}`
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

  it("consumes one warranty charge in either mode", () => {
    expect(resolveCollision("story", true)).toEqual({
      finishRun: false,
      consumeWarranty: true,
      resetCombo: false,
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
    const harness = createGameHarness("story");
    harness.game.start("keyboard");
    harness.continueCurrentSceneFully();
    harness.advance(STORY_REFRAME_SECONDS + 3.05);
    const internals = harness.game as unknown as {
      obstacles: Array<{
        active: boolean; kind: "pallet"; source: "story-reward"; x: number; y: number;
        width: number; height: number; authoredWaveId?: string;
      }>;
      runner: { x: number; y: number };
    };
    Object.assign(internals.obstacles[0]!, {
      active: true,
      kind: "pallet",
      source: "story-reward",
      x: internals.runner.x,
      y: internals.runner.y + 20,
      width: 80,
      height: 80,
      authoredWaveId: "forced-retry"
    });
    harness.advance(0.2);

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

  it("lets a player clear the four authored onboarding waves inside the production window", () => {
    const harness = createGameHarness("story");
    harness.game.start("keyboard");
    harness.continueCurrentSceneFully();
    harness.advance(STORY_REFRAME_SECONDS + 3.05);
    expect(harness.storyUpdates.at(-1)?.state).toBe("play");

    harness.advance(35, harness.avoidObstacles);

    expect(harness.storyUpdates.at(-1)?.scene?.id).toBe("story.order_backlog");
    expect(harness.snapshots.some(({ authoredWave }) =>
      authoredWave?.microlevelId === "first-package" && authoredWave.wavesCompleted === 4
    )).toBe(true);
    harness.game.destroy();
  });

  it("holds the tutorial until the required jump and slide patterns are cleared", () => {
    const harness = createGameHarness("story");
    harness.game.start("keyboard");
    harness.continueCurrentSceneFully();
    harness.advance(STORY_REFRAME_SECONDS + 3.05);
    harness.advance(35);

    expect(harness.storyUpdates.at(-1)?.playSegment?.id).toBe("epoch_1.first_package");
    const internals = harness.game as unknown as {
      storyTimeline: { snapshot: StoryTimelineSnapshot };
    };
    expect(internals.storyTimeline.snapshot.sectionElapsedSeconds).toBeGreaterThanOrEqual(25);
    expect(harness.snapshots.at(-1)?.authoredWave?.completed).toBe(false);
    expect(harness.game.state).toBe("running");
    harness.game.destroy();
  });

  it("resolves Zator Zamówień into the process scene after its required actions", () => {
    const harness = createGameHarness("story");
    harness.game.start("keyboard");
    harness.continueCurrentSceneFully();
    harness.advance(STORY_REFRAME_SECONDS + 3.05);
    harness.advance(35, harness.avoidObstacles);
    expect(harness.storyUpdates.at(-1)?.scene?.id).toBe("story.order_backlog");
    harness.continueCurrentSceneFully();
    harness.advance(STORY_REFRAME_SECONDS + 3.05);
    expect(harness.storyUpdates.at(-1)?.playSegment?.id).toBe("epoch_1.order_backlog");

    harness.advance(55, harness.avoidObstacles);

    expect(harness.storyUpdates.at(-1)?.scene?.id).toBe("story.quality_promise");
    expect(harness.snapshots.some(({ authoredWave }) =>
      authoredWave?.microlevelId === "order-backlog" && authoredWave.completed
    )).toBe(true);
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
    harness.advance(3, harness.avoidObstacles);

    expect(harness.game.state).toBe("running");
    expect(harness.gameOvers).toBe(0);
    expect(harness.storyCompletions).toBe(1);
    expect(harness.modeChanges).toEqual(["challenge"]);
    expect(harness.milestoneCelebrations.length).toBeGreaterThan(0);
    expect(harness.milestoneCelebrations[0]).toMatchObject({
      threshold: 10,
      kind: "confetti",
      intensity: 1,
      text: "10 PACZEK!"
    });
    expect(new Set(harness.milestoneCelebrations.map(({ threshold }) => threshold)).size)
      .toBe(harness.milestoneCelebrations.length);
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
    expect(challengeSnapshot?.durationSeconds).toBeGreaterThanOrEqual(190);
    expect(challengeSnapshot?.score).toBeGreaterThanOrEqual(config.story.firstCompletionBonusScore);
    expect(challengeSnapshot?.challengeScore).toBe(0);
    expect(challengeSnapshot?.challengePackagesCollected).toBe(0);
    expect(harness.snapshots.some(({ authoredWave }) =>
      authoredWave?.microlevelId === "million-threshold" && authoredWave.completed
    )).toBe(true);
    expect(harness.snapshots.some(({ powerUpDemoRemaining }) => powerUpDemoRemaining > 0))
      .toBe(true);

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

    const finalStorySnapshot = harness.snapshots
      .filter(({ mode }) => mode === "story")
      .at(-1);
    expect(challengeSnapshot?.backgroundTravelPixels)
      .toBeGreaterThanOrEqual(finalStorySnapshot?.backgroundTravelPixels ?? 0);

    harness.collectPackagesUntil(1_000);
    expect(harness.milestoneCelebrations.map(({ threshold }) => threshold))
      .toEqual([10, 50, 100, 500, 1_000]);
    expect(harness.milestoneModes).toContain("story");
    expect(harness.milestoneModes).toContain("challenge");

    const eventsBeforeReset = harness.milestoneCelebrations.length;
    harness.game.reset();
    harness.game.start("keyboard");
    harness.collectPackagesUntil(10);
    expect(harness.milestoneCelebrations.slice(eventsBeforeReset).map(({ threshold }) => threshold))
      .toEqual([10]);
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

  it("completes all three order-scale zones without legacy peak objectives", () => {
    const config = parseRunnerConfig(productionConfig);
    if (!config) throw new Error("production config should parse");
    const harness = createGameHarness("story", config.story);
    harness.game.start("keyboard");
    harness.driveStory();

    expect(harness.snapshots.some(({ authoredWave }) =>
      authoredWave?.microlevelId === "order-scale" &&
      authoredWave.completed && authoredWave.wavesCompleted === 9
    )).toBe(true);
    harness.game.destroy();
  });

  it("runs a twelve-combination final with no boss", () => {
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
      bossesDefeated: 0
    });
    expect(harness.snapshots.at(-1)?.bossPhase).toBe("inactive");
    expect(harness.snapshots.at(-1)?.authoredWave?.waveTarget).toBe(12);
    harness.advance(80, harness.avoidObstacles);
    expect(harness.snapshots.some(({ authoredWave }) =>
      authoredWave?.microlevelId === "million-threshold" && authoredWave.completed
    )).toBe(true);
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
