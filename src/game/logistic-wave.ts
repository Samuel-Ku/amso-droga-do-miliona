import type { ObstacleKind } from "./types";

export type LogisticWavePhase = "inactive" | "warning" | "running" | "reward";

export type LogisticWaveCommand =
  | { type: "none" }
  | { type: "attack"; kind: ObstacleKind }
  | { type: "complete" };

export interface LogisticWaveSnapshot {
  phase: LogisticWavePhase;
  patternsCompleted: number;
  patternCount: number;
  nextWaveAtSeconds: number;
}

const ATTACKS: readonly ObstacleKind[] = ["pallet", "overhead", "trolley"];
const WARNING_SECONDS = 1.5;
const FIRST_ATTACK_DELAY_SECONDS = 0.35;
const BETWEEN_ATTACKS_SECONDS = 0.5;
const REWARD_SECONDS = 2.2;

/** Deterministic, boss-free three-pattern challenge wave. */
export class LogisticWaveDirector {
  private phase: LogisticWavePhase = "inactive";
  private patternsLaunched = 0;
  private patternsCompleted = 0;
  private nextWaveAtSeconds: number;
  private phaseSecondsRemaining = 0;
  private attackCooldown = 0;
  private awaitingResolution = false;
  private hazardSeen = false;
  private cycle = 0;

  public constructor(
    private readonly minimumIntervalSeconds = 45,
    private readonly maximumIntervalSeconds = 60
  ) {
    this.nextWaveAtSeconds = Math.max(1, minimumIntervalSeconds);
  }

  public get snapshot(): LogisticWaveSnapshot {
    return {
      phase: this.phase,
      patternsCompleted: this.patternsCompleted,
      patternCount: ATTACKS.length,
      nextWaveAtSeconds: this.nextWaveAtSeconds
    };
  }

  public get blocksRegularSpawns(): boolean {
    return this.phase !== "inactive";
  }

  public reset(): void {
    this.phase = "inactive";
    this.patternsLaunched = 0;
    this.patternsCompleted = 0;
    this.nextWaveAtSeconds = Math.max(1, this.minimumIntervalSeconds);
    this.phaseSecondsRemaining = 0;
    this.attackCooldown = 0;
    this.awaitingResolution = false;
    this.hazardSeen = false;
    this.cycle = 0;
  }

  public advance(
    deltaSeconds: number,
    elapsedSeconds: number,
    routeClear: boolean,
    waveHazardActive: boolean
  ): LogisticWaveCommand {
    const delta = Math.max(0, deltaSeconds);

    if (this.phase === "inactive") {
      if (elapsedSeconds < this.nextWaveAtSeconds) return { type: "none" };
      this.phase = "warning";
      this.phaseSecondsRemaining = WARNING_SECONDS;
      this.patternsLaunched = 0;
      this.patternsCompleted = 0;
      this.cycle += 1;
      return { type: "none" };
    }

    if (this.phase === "warning") {
      this.phaseSecondsRemaining = Math.max(0, this.phaseSecondsRemaining - delta);
      if (this.phaseSecondsRemaining > 0) return { type: "none" };
      this.phase = "running";
      this.attackCooldown = FIRST_ATTACK_DELAY_SECONDS;
      return { type: "none" };
    }

    if (this.phase === "running") {
      if (this.awaitingResolution) {
        if (waveHazardActive) this.hazardSeen = true;
        if (!waveHazardActive && this.hazardSeen) {
          this.awaitingResolution = false;
          this.hazardSeen = false;
          this.patternsCompleted += 1;
          if (this.patternsCompleted >= ATTACKS.length) {
            this.phase = "reward";
            this.phaseSecondsRemaining = REWARD_SECONDS;
            const range = Math.max(0, this.maximumIntervalSeconds - this.minimumIntervalSeconds);
            const cycleOffset = range * ((this.cycle * 0.61803398875) % 1);
            this.nextWaveAtSeconds = elapsedSeconds + this.minimumIntervalSeconds + cycleOffset;
            return { type: "complete" };
          }
          this.attackCooldown = BETWEEN_ATTACKS_SECONDS;
        }
        return { type: "none" };
      }

      this.attackCooldown = Math.max(0, this.attackCooldown - delta);
      if (this.attackCooldown > 0 || !routeClear) return { type: "none" };
      const kind = ATTACKS[this.patternsLaunched] ?? "pallet";
      this.patternsLaunched += 1;
      this.awaitingResolution = true;
      this.hazardSeen = false;
      return { type: "attack", kind };
    }

    this.phaseSecondsRemaining = Math.max(0, this.phaseSecondsRemaining - delta);
    if (this.phaseSecondsRemaining <= 0) this.phase = "inactive";
    return { type: "none" };
  }
}

