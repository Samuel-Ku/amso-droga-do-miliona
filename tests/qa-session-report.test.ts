import { describe, expect, it } from "vitest";
import { QaSessionReportCollector } from "../src/qa/session-report";
import type { GameResult, GameSnapshot } from "../src/game/contracts";

describe("local QA session report", () => {
  it("deduplicates snapshots and exports only balance metrics", () => {
    const collector = new QaSessionReportCollector();
    const snapshot = {
      mode: "story",
      durationSeconds: 25,
      ordersCollected: 7,
      collisions: 1,
      bestCombo: 3,
      speed: 322,
      frameRate: 58.4,
      droppedFrames: 3,
      lastCollisionType: "box-stack",
      storyObjectiveSegmentId: "epoch_1.first_package",
      challengePressureAxis: null,
      authoredWave: {
        microlevelId: "first-package",
        lastResult: {
          waveId: "guided-low-stack",
          attempts: 2,
          actionSucceeded: false,
          passed: true,
          perfect: false,
          collectionRatio: 2 / 3
        }
      }
    } as GameSnapshot;
    collector.record(snapshot);
    collector.record(snapshot);

    expect(collector.snapshot()).toMatchObject({
      frameRate: 58.4,
      lowestFrameRate: 58.4,
      droppedFrames: 3,
      retries: 1,
      actionErrors: 1,
      firstAttemptRate: 0,
      lastCollisionType: "box-stack"
    });
    expect(collector.snapshot().segments).toEqual([expect.objectContaining({
      segmentId: "epoch_1.first_package",
      resolvedWaves: 1,
      firstAttemptPasses: 0,
      retries: 1
    })]);
    expect(collector.snapshot().waves).toEqual([expect.objectContaining({
      actionSucceeded: false
    })]);
    expect(collector.text()).not.toMatch(/name|email|userId/i);
  });

  it("records the challenge death without adding identity data", () => {
    const collector = new QaSessionReportCollector();
    collector.recordResult({
      mode: "challenge",
      durationSeconds: 74.2,
      challengeScore: 8_200,
      challengeOrdersCollected: 19,
      speed: 672,
      collisionType: "overhead",
      controlMethod: "keyboard",
      outcome: "dropout",
      furthestEpochReached: 4
    } as GameResult);

    expect(collector.snapshot().challengeDeath).toEqual({
      timeSeconds: 74.2,
      speed: 672,
      reason: "overhead",
      challengeScore: 8_200,
      ordersCollected: 19
    });
    expect(collector.text()).not.toMatch(/name|email|userId/i);
  });
});
