import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import { parseRunnerConfig } from "../src/config/schema";
import type { GameSnapshot } from "../src/game/contracts";
import { resolveCollision } from "../src/game/mode-rules";
import { RunnerGame } from "../src/game/RunnerGame";
import type { StoryConfig } from "../src/shared/types";

function createGameHarness(
  mode: "story" | "challenge",
  storyOverride?: StoryConfig
) {
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrameId = 0;
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
    addEventListener(): void {},
    removeEventListener(): void {},
    matchMedia: () => ({ matches: false, addEventListener(): void {}, removeEventListener(): void {} })
  };
  const documentMock = {
    defaultView: view,
    visibilityState: "visible",
    addEventListener(): void {},
    removeEventListener(): void {}
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
  const activeBeatIds = new Set<string>();
  const checkpoints: string[] = [];
  let gameOvers = 0;
  let storyCompletions = 0;
  let outcome: string | null = null;
  const game = new RunnerGame(
    canvas,
    {
      onSnapshot: (snapshot) => snapshots.push(snapshot),
      onGameOver: (result) => {
        gameOvers += 1;
        outcome = result.outcome;
      },
      onStoryUpdate: ({ activeBeats }) => {
        for (const beat of activeBeats) activeBeatIds.add(beat.id);
      },
      onStoryCheckpoint: (checkpoint) => checkpoints.push(checkpoint),
      onStoryComplete: () => { storyCompletions += 1; }
    },
    {
      seed: 7,
      reducedMotion: true,
      mode,
      story: storyOverride ?? config.story,
      challenge: config.challenge
    }
  );

  return {
    game,
    snapshots,
    activeBeatIds,
    checkpoints,
    get gameOvers() { return gameOvers; },
    get storyCompletions() { return storyCompletions; },
    get outcome() { return outcome; },
    timestamp: 0,
    advance(seconds: number): void {
      const frameCount = Math.ceil(seconds * 60);
      for (let index = 0; index <= frameCount && game.state === "running"; index += 1) {
        const entry = frames.entries().next().value as [number, FrameRequestCallback] | undefined;
        if (!entry) break;
        frames.delete(entry[0]);
        this.timestamp += 1000 / 60;
        entry[1](this.timestamp);
      }
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

  it("consumes a warranty once instead of ending either mode", () => {
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
    harness.advance(10);
    expect(harness.snapshots.every(({ collisions }) => collisions === 0)).toBe(true);
    harness.advance(15);

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

  it("drives the complete configured story once and exposes every content id", () => {
    const config = parseRunnerConfig(productionConfig);
    if (!config) throw new Error("production config should parse");
    const configuredIds = [
      ...config.story.prologue.beats,
      ...config.story.epochs.flatMap(({ beats }) => beats),
      ...config.story.finale.beats
    ].map(({ id }) => id);
    const harness = createGameHarness("story");

    harness.game.start("keyboard");
    harness.advance(180);

    expect(harness.game.state).toBe("game_over");
    expect(harness.outcome).toBe("victory");
    expect(harness.storyCompletions).toBe(1);
    expect([...harness.activeBeatIds].sort()).toEqual([...configuredIds].sort());
    expect(harness.checkpoints).toEqual([
      "prologue",
      "epoch_1",
      "epoch_2",
      "epoch_3",
      "epoch_4",
      "epoch_5",
      "finale",
      "completed"
    ]);
    expect(harness.snapshots.some(({ activeStoryBeatIds }) =>
      activeStoryBeatIds.includes("final.thanks")
    )).toBe(true);
    expect(harness.snapshots.some(({ bossPhase }) => bossPhase === "attacking")).toBe(true);
    expect(Math.max(...harness.snapshots.map(({ bossProgress }) => bossProgress))).toBe(3);
    expect(harness.snapshots.some(({ bossesDefeated }) => bossesDefeated === 1)).toBe(true);
    expect(harness.snapshots.at(-1)).toMatchObject({
      storyPhase: "completed",
      storyProgress: 1,
      trustCorridor: false,
      storySymbols: 8
    });
    harness.game.destroy();
  });
});
