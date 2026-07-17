import type { EpochConfig, FactTrigger, NarrativeFact, PackageType, PowerUpKind } from "../shared/types";
import type { ObstacleKind } from "./types";

export const BASE_EPOCH_SPEED = 280;

export const OBSTACLE_KIND_VALUES: readonly ObstacleKind[] = [
  "box-stack",
  "pallet",
  "trolley",
  "overhead"
];

export function asObstacleKind(value: string): ObstacleKind | null {
  return (OBSTACLE_KIND_VALUES as readonly string[]).includes(value)
    ? (value as ObstacleKind)
    : null;
}

/** Approximate shipping weight (kg) per product category, used by the weight trigger. */
export const PACKAGE_TYPE_WEIGHT: Readonly<Record<PackageType, number>> = {
  notebook: 2,
  telefon: 0.25,
  pc: 9,
  lcd: 6
};

export const PACKAGE_TYPE_VALUES: readonly PackageType[] = ["notebook", "telefon", "pc", "lcd"];

export const POWER_UP_VALUES: readonly PowerUpKind[] = [
  "gwarancja_48",
  "podwojny_wynik"
];

/** Timed effects expire; warranty is a persistent one-use charge. */
export const POWER_UP_DURATION: Readonly<Record<PowerUpKind, number>> = {
  gwarancja_48: Number.POSITIVE_INFINITY,
  podwojny_wynik: 7
};

export const POWER_UP_SCORE_MULTIPLIER = 2;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * clamp01(progress);
}

/** Per-epoch speed ramp: lerp difficultyStart..difficultyEnd across the epoch duration. */
export function epochSpeed(epoch: EpochConfig, elapsedInEpoch: number): number {
  const progress = epoch.durationSeconds > 0 ? elapsedInEpoch / epoch.durationSeconds : 1;
  return BASE_EPOCH_SPEED * lerp(epoch.difficultyStart, epoch.difficultyEnd, progress);
}

export const MAX_FACTS_PER_RUN = 6;

/**
 * Tracks in-run state for narrative fact triggers and reports which facts should
 * fire. Each fact fires at most once per run; the run is capped at MAX_FACTS_PER_RUN.
 */
export class FactEngine {
  private readonly facts: readonly NarrativeFact[];
  private readonly fired = new Set<string>();
  private readonly typeCounts: Record<PackageType, number> = {
    notebook: 0,
    telefon: 0,
    pc: 0,
    lcd: 0
  };
  private totalWeight = 0;
  private completedEpochs = new Set<number>();
  private cleanEpochs = new Set<number>();

  public constructor(facts: readonly NarrativeFact[]) {
    this.facts = facts.filter((fact) => fact.enabled);
  }

  public get unlockedCount(): number {
    return this.fired.size;
  }

  public recordPackage(packageType: PackageType, weightKg: number): void {
    this.typeCounts[packageType] += 1;
    this.totalWeight += weightKg;
  }

  public recordEpochCompleted(index: number, clean: boolean): void {
    this.completedEpochs.add(index);
    if (clean) this.cleanEpochs.add(index);
  }

  /** Returns fact ids that newly satisfy their trigger and have not fired yet. */
  public evaluate(): string[] {
    const unlocked: string[] = [];
    if (this.fired.size >= MAX_FACTS_PER_RUN) {
      return unlocked;
    }
    for (const fact of this.facts) {
      if (this.fired.has(fact.id)) continue;
      if (this.triggerMet(fact.trigger)) {
        this.fired.add(fact.id);
        unlocked.push(fact.id);
        if (this.fired.size >= MAX_FACTS_PER_RUN) break;
      }
    }
    return unlocked;
  }

  private triggerMet(trigger: FactTrigger): boolean {
    switch (trigger.type) {
      case "epoch_completed":
        return this.completedEpochs.has(trigger.epochIndex);
      case "epoch_completed_clean":
        return this.cleanEpochs.has(trigger.epochIndex);
      case "collect_type":
        return this.typeCounts[trigger.packageType] >= trigger.threshold;
      case "collect_weight":
        return this.totalWeight >= trigger.threshold;
    }
  }
}
