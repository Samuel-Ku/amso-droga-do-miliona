import type { GameSnapshot } from "../game/contracts";

export interface QaWaveRecord {
  microlevelId: string;
  waveId: string;
  attempts: number;
  passed: boolean;
  perfect: boolean;
  collectionRatio: number;
}

export interface QaSessionSnapshot {
  schema: "amso-runner-qa-v1";
  durationSeconds: number;
  mode: GameSnapshot["mode"];
  packagesCollected: number;
  collisions: number;
  bestCombo: number;
  speed: number;
  challengePressureAxis: GameSnapshot["challengePressureAxis"];
  waves: QaWaveRecord[];
}

/** In-memory, PII-free balance report for local playtests. */
export class QaSessionReportCollector {
  private latest: GameSnapshot | null = null;
  private readonly waves = new Map<string, QaWaveRecord>();

  public record(snapshot: GameSnapshot): void {
    this.latest = snapshot;
    const result = snapshot.authoredWave?.lastResult;
    if (!result || !snapshot.authoredWave) return;
    const key = `${snapshot.authoredWave.microlevelId}:${result.waveId}:${result.attempts}`;
    this.waves.set(key, {
      microlevelId: snapshot.authoredWave.microlevelId,
      waveId: result.waveId,
      attempts: result.attempts,
      passed: result.passed,
      perfect: result.perfect,
      collectionRatio: result.collectionRatio
    });
  }

  public snapshot(): QaSessionSnapshot {
    const latest = this.latest;
    return {
      schema: "amso-runner-qa-v1",
      durationSeconds: latest?.durationSeconds ?? 0,
      mode: latest?.mode ?? "story",
      packagesCollected: latest?.packagesCollected ?? 0,
      collisions: latest?.collisions ?? 0,
      bestCombo: latest?.bestCombo ?? 1,
      speed: latest?.speed ?? 0,
      challengePressureAxis: latest?.challengePressureAxis ?? null,
      waves: [...this.waves.values()]
    };
  }

  public text(): string {
    return JSON.stringify(this.snapshot(), null, 2);
  }
}
