import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import { parseRunnerConfig } from "../src/config/schema";
import type { GameResult } from "../src/game/contracts";
import { RunnerGame } from "../src/game/RunnerGame";
import { exactDeterminismArtifact } from "../src/qa/determinism";
import {
  PERFORMANCE_REFERENCE_V1,
  WORLD_SEAM_PERFORMANCE_V1,
  checkpointMatches,
  validateScenarioRun,
  type PerformanceScenarioManifest
} from "../src/qa/performance-reference-v1";
import {
  WORLD_ARTWORK_CONTRACT,
  calculateWorldPlateTransform
} from "../src/visuals/world-plate-transform";

function createScenarioHarness(
  reducedMotion = false,
  scenario: PerformanceScenarioManifest = PERFORMANCE_REFERENCE_V1
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
    matchMedia: () => ({
      matches: false,
      addEventListener(): void {},
      removeEventListener(): void {}
    })
  };
  const documentMock = {
    defaultView: view,
    visibilityState: "visible",
    hasFocus: () => true,
    addEventListener(): void {},
    removeEventListener(): void {}
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
    style: { width: "", height: "" },
    ownerDocument: documentMock,
    getContext: () => context
  } as unknown as HTMLCanvasElement;
  const config = parseRunnerConfig(productionConfig);
  if (!config) throw new Error("production config should parse");

  const gameOvers: GameResult[] = [];
  const checkpointResults: Array<{
    completedThroughStep: number;
    passed: boolean;
  }> = [];
  let completedThroughStep: number | null = null;
  const game = new RunnerGame(
    canvas,
    {
      onGameOver: (result) => gameOvers.push(result)
    },
    {
      seed: scenario.seed,
      reducedMotion,
      mode: "challenge",
      challenge: config.challenge,
      qaScenarioActive: true,
      replayInputs: scenario.inputs,
      scenarioDurationSteps: scenario.durationSteps,
      challengeWorldDurationSeconds:
        scenario.challengeWorldDurationSeconds,
      scenarioCheckpointSteps: scenario.expectedCheckpoints
        .map(({ completedThroughStep: step }) => step)
        .filter((step) => step >= 0),
      onScenarioCheckpoint: (step, canonicalState) => {
        const checkpoint = scenario.expectedCheckpoints.find(
          ({ completedThroughStep: expectedStep }) => expectedStep === step
        );
        checkpointResults.push({
          completedThroughStep: step,
          passed: checkpoint !== undefined &&
            checkpointMatches(checkpoint, canonicalState)
        });
      },
      onScenarioComplete: (step) => {
        completedThroughStep = step;
      }
    }
  );
  game.applyGeometry(
    calculateWorldPlateTransform(960, 540, WORLD_ARTWORK_CONTRACT)!,
    { width: 960, height: 540, dpr: 1 }
  );

  return {
    game,
    gameOvers,
    checkpointResults,
    get completedThroughStep(): number | null {
      return completedThroughStep;
    },
    run(): void {
      game.start("pointer");
      let timestamp = 0;
      for (let guard = 0; guard < 4_000 && game.state === "running"; guard += 1) {
        const entry = frames.entries().next().value as
          | [number, FrameRequestCallback]
          | undefined;
        if (!entry) break;
        frames.delete(entry[0]);
        timestamp += 1000 / 60;
        entry[1](timestamp);
      }
    }
  };
}

describe("performance-reference-v1 production gameplay flow", () => {
  it("completes all 7200 steps through the real challenge input boundary", () => {
    const harness = createScenarioHarness();
    const initialCheckpoint = PERFORMANCE_REFERENCE_V1.expectedCheckpoints[0];
    harness.checkpointResults.push({
      completedThroughStep: -1,
      passed: initialCheckpoint !== undefined &&
        checkpointMatches(
          initialCheckpoint,
          harness.game.canonicalDeterministicState()
        )
    });

    harness.run();

    expect(harness.gameOvers).toEqual([]);
    expect(harness.completedThroughStep).toBe(
      PERFORMANCE_REFERENCE_V1.durationSteps - 1
    );
    expect(harness.game.isReplayValid).toBe(true);
    const coverage = harness.game.scenarioCoverage();
    expect(coverage.jump).toBeGreaterThanOrEqual(10);
    expect(coverage.crouch).toBeGreaterThanOrEqual(8);
    expect(coverage.pickup).toBeGreaterThanOrEqual(1);
    expect(coverage["power-up:gwarancja_48"]).toBeGreaterThanOrEqual(1);
    expect(coverage.celebration).toBeGreaterThanOrEqual(1);
    expect(coverage.milestone).toBeGreaterThanOrEqual(1);
    expect(coverage.guarantee).toBeGreaterThanOrEqual(1);
    expect(coverage["world-change"]).toBeGreaterThanOrEqual(2);
    expect(coverage["max-approved-density"]).toBeGreaterThanOrEqual(120);

    const artifact = exactDeterminismArtifact(
      harness.game.canonicalDeterministicState()
    );
    expect(artifact.digest).toBe(PERFORMANCE_REFERENCE_V1.expectedFinalDigest);
    expect(validateScenarioRun(PERFORMANCE_REFERENCE_V1, {
      completedThroughStep: harness.completedThroughStep ?? -1,
      checkpointResults: harness.checkpointResults,
      coverage,
      finalDigest: artifact.digest,
      expectedFinalDigest: PERFORMANCE_REFERENCE_V1.expectedFinalDigest,
      inputQueueOverflows: 0
    }).passed).toBe(true);
    harness.game.destroy();
  });

  it("completes the deterministic all-world seam scenario through 7→1", () => {
    const scenario = WORLD_SEAM_PERFORMANCE_V1;
    const harness = createScenarioHarness(false, scenario);
    const initialCheckpoint = scenario.expectedCheckpoints[0];
    harness.checkpointResults.push({
      completedThroughStep: -1,
      passed: initialCheckpoint !== undefined && checkpointMatches(
        initialCheckpoint,
        harness.game.canonicalDeterministicState()
      )
    });

    harness.run();

    const coverage = harness.game.scenarioCoverage();
    const artifact = exactDeterminismArtifact(harness.game.canonicalDeterministicState());
    expect(coverage["world-change"]).toBeGreaterThanOrEqual(8);
    expect(artifact.digest).toBe(scenario.expectedFinalDigest);
    expect(validateScenarioRun(scenario, {
      completedThroughStep: harness.completedThroughStep ?? -1,
      checkpointResults: harness.checkpointResults,
      coverage,
      finalDigest: artifact.digest,
      expectedFinalDigest: scenario.expectedFinalDigest,
      inputQueueOverflows: 0
    }).passed).toBe(true);
    harness.game.destroy();
  });

});
