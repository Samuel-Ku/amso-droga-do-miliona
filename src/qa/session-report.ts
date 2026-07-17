import type { GameResult, GameSnapshot } from "../game/contracts";

export interface QaWaveRecord {
  segmentId: string;
  microlevelId: string;
  waveId: string;
  completionIndex: number;
  attempts: number;
  actionSucceeded: boolean;
  passed: boolean;
  perfect: boolean;
  collectionRatio: number;
}

export interface QaSegmentRecord {
  segmentId: string;
  durationSeconds: number;
  resolvedWaves: number;
  firstAttemptPasses: number;
  retries: number;
  averageCollectionRatio: number;
}

export interface QaChallengeDeathRecord {
  timeSeconds: number;
  speed: number;
  reason: string;
  challengeScore: number;
  ordersCollected: number;
}

export interface QaSessionSnapshot {
  schema: "amso-runner-qa-v1";
  durationSeconds: number;
  mode: GameSnapshot["mode"];
  ordersCollected: number;
  collisions: number;
  bestCombo: number;
  speed: number;
  frameRate: number;
  lowestFrameRate: number | null;
  droppedFrames: number;
  lastCollisionType: string | null;
  challengePressureAxis: GameSnapshot["challengePressureAxis"];
  retries: number;
  actionErrors: number;
  firstAttemptRate: number | null;
  segments: QaSegmentRecord[];
  waves: QaWaveRecord[];
  challengeDeath: QaChallengeDeathRecord | null;
}

/** In-memory, PII-free balance report for local playtests. */
export class QaSessionReportCollector {
  private latest: GameSnapshot | null = null;
  private readonly waves = new Map<string, QaWaveRecord>();
  private readonly segmentTimes = new Map<string, { start: number; end: number }>();
  private lowestFrameRate: number | null = null;
  private challengeDeath: QaChallengeDeathRecord | null = null;

  public record(snapshot: GameSnapshot): void {
    this.latest = snapshot;
    const frameRate = snapshot.frameRate ?? 0;
    if (frameRate > 0) {
      this.lowestFrameRate = this.lowestFrameRate === null
        ? frameRate
        : Math.min(this.lowestFrameRate, frameRate);
    }
    const segmentId = snapshot.storyObjectiveSegmentId;
    if (segmentId) {
      const timing = this.segmentTimes.get(segmentId);
      if (timing) timing.end = Math.max(timing.end, snapshot.durationSeconds);
      else this.segmentTimes.set(segmentId, {
        start: snapshot.durationSeconds,
        end: snapshot.durationSeconds
      });
    }
    const result = snapshot.authoredWave?.lastResult;
    if (!result || !snapshot.authoredWave) return;
    const key = `${snapshot.authoredWave.microlevelId}:${snapshot.authoredWave.wavesCompleted}:` +
      `${result.waveId}:${result.attempts}:${result.passed}`;
    this.waves.set(key, {
      segmentId,
      microlevelId: snapshot.authoredWave.microlevelId,
      waveId: result.waveId,
      completionIndex: snapshot.authoredWave.wavesCompleted,
      attempts: result.attempts,
      actionSucceeded: result.actionSucceeded,
      passed: result.passed,
      perfect: result.perfect,
      collectionRatio: result.collectionRatio
    });
  }

  public recordResult(result: GameResult): void {
    this.record(result);
    if (result.mode !== "challenge") return;
    this.challengeDeath = {
      timeSeconds: result.durationSeconds,
      speed: result.speed,
      reason: result.collisionType,
      challengeScore: result.challengeScore,
      ordersCollected: result.challengeOrdersCollected
    };
  }

  public snapshot(): QaSessionSnapshot {
    const latest = this.latest;
    const waves = [...this.waves.values()];
    const completedWaves = waves.filter(({ passed }) => passed);
    const retries = completedWaves.reduce(
      (total, { attempts }) => total + Math.max(0, attempts - 1),
      0
    );
    const firstAttemptPasses = completedWaves.filter(({ attempts }) => attempts === 1).length;
    const segments = [...this.segmentTimes.entries()].map(([segmentId, timing]) => {
      const resolved = completedWaves.filter((wave) => wave.segmentId === segmentId);
      const collectionTotal = resolved.reduce(
        (total, wave) => total + wave.collectionRatio,
        0
      );
      return {
        segmentId,
        durationSeconds: Math.max(0, timing.end - timing.start),
        resolvedWaves: resolved.length,
        firstAttemptPasses: resolved.filter(({ attempts }) => attempts === 1).length,
        retries: resolved.reduce(
          (total, { attempts }) => total + Math.max(0, attempts - 1),
          0
        ),
        averageCollectionRatio: resolved.length === 0 ? 0 : collectionTotal / resolved.length
      };
    });
    return {
      schema: "amso-runner-qa-v1",
      durationSeconds: latest?.durationSeconds ?? 0,
      mode: latest?.mode ?? "story",
      ordersCollected: latest?.ordersCollected ?? 0,
      collisions: latest?.collisions ?? 0,
      bestCombo: latest?.bestCombo ?? 1,
      speed: latest?.speed ?? 0,
      frameRate: latest?.frameRate ?? 0,
      lowestFrameRate: this.lowestFrameRate,
      droppedFrames: latest?.droppedFrames ?? 0,
      lastCollisionType: latest?.lastCollisionType ?? null,
      challengePressureAxis: latest?.challengePressureAxis ?? null,
      retries,
      actionErrors: waves.filter(({ actionSucceeded }) => !actionSucceeded).length,
      firstAttemptRate: completedWaves.length === 0
        ? null
        : firstAttemptPasses / completedWaves.length,
      segments,
      waves,
      challengeDeath: this.challengeDeath
    };
  }

  public text(): string {
    return JSON.stringify(this.snapshot(), null, 2);
  }
}
