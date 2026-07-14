import type { PackageType } from "../shared/types";

export const STORY_OBJECTIVE_SEGMENT_IDS = [
  "epoch_1.training",
  "epoch_1.cable_chaos",
  "epoch_2.quality_series",
  "epoch_2.doubt_cloud",
  "epoch_3.creative_contract",
  "epoch_3.growth_contract",
  "epoch_3.trust_contract",
  "epoch_3.budget_eater",
  "epoch_4.orders",
  "epoch_4.logistic_hydra",
  "epoch_5.counter",
  "epoch_5.million_wave"
] as const;

export type StoryObjectiveSegmentId = typeof STORY_OBJECTIVE_SEGMENT_IDS[number];
export type StoryAction = "jump" | "slide";
export const STORY_CREATIVE_EQUIPMENT_IDS = ["notebook", "lcd", "pc"] as const;
export type StoryCreativeEquipmentId = typeof STORY_CREATIVE_EQUIPMENT_IDS[number];
export type StoryObjectiveId =
  | "epoch_1.training"
  | "epoch_1.cable_chaos"
  | "epoch_2.quality_series"
  | "epoch_3.creative_contract"
  | "epoch_3.growth_contract"
  | "epoch_3.trust_contract"
  | "epoch_4.orders"
  | "epoch_4.logistic_hydra"
  | "epoch_5.counter"
  | "epoch_5.million_wave"
  | "epoch_5.symbols";

export interface StoryObjectiveUpdate {
  changed: boolean;
  newlyCompletedObjectiveIds: readonly StoryObjectiveId[];
}

export interface StoryObjectivesSnapshot {
  activeSegmentId: StoryObjectiveSegmentId | null;
  completedObjectiveIds: readonly StoryObjectiveId[];
  epoch1: {
    training: { jumps: number; slides: number; targetEach: number; completed: boolean };
    cableChaos: {
      currentAlternation: number;
      bestAlternation: number;
      target: number;
      completed: boolean;
    };
    completed: boolean;
  };
  epoch2: {
    completedSeries: number;
    currentSeries: number;
    seriesTarget: number;
    comboTarget: number;
    completed: boolean;
  };
  epoch3: {
    creative: {
      collected: number;
      collectedIds: readonly string[];
      target: number;
      completed: boolean;
    };
    growth: { currentCombo: number; bestCombo: number; target: number; completed: boolean };
    trust: { currentClean: number; longestClean: number; target: number; completed: boolean };
    completed: boolean;
  };
  epoch4: {
    orders: {
      requiredCompleted: number;
      requiredTarget: number;
      bonusCompleted: number;
      lastCompletedType: PackageType | null;
      completed: boolean;
    };
    hydra: {
      elapsedSeconds: number;
      phase: "intake" | "routing" | "dispatch" | "completed";
      phasesCompleted: number;
      completed: boolean;
    };
    completed: boolean;
  };
  epoch5: {
    counter: { elapsedSeconds: number; value: number; completed: boolean };
    wave: {
      elapsedSeconds: number;
      phase: "order" | "quality" | "choice" | "logistics" | "final_wave" | "completed";
      guidedPhasesCompleted: number;
      completed: boolean;
    };
    symbols: {
      collectedIds: readonly number[];
      pendingIds: readonly number[];
      misses: number;
      completed: boolean;
    };
    completed: boolean;
  };
}

export const STORY_OBJECTIVE_TARGETS = {
  mixedActionsEach: 4,
  cableAlternation: 4,
  qualitySeries: 4,
  qualityCombo: 3,
  creativePickups: STORY_CREATIVE_EQUIPMENT_IDS.length,
  growthCombo: 8,
  trustClean: 12,
  requiredOrders: 6,
  hydraSeconds: 20,
  counterSeconds: 15,
  millionPhaseSeconds: 12,
  millionGuidedPhases: 3,
  symbolCount: 8
} as const;

const TARGETS = STORY_OBJECTIVE_TARGETS;

const SEGMENT_IDS = new Set<string>(STORY_OBJECTIVE_SEGMENT_IDS);
const CREATIVE_EQUIPMENT_IDS: ReadonlySet<string> = new Set(STORY_CREATIVE_EQUIPMENT_IDS);

function isCreativeEquipmentId(value: string): value is StoryCreativeEquipmentId {
  return CREATIVE_EQUIPMENT_IDS.has(value);
}

function validDelta(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function cappedElapsed(current: number, delta: number, target: number): number {
  const next = current + delta;
  return next + 1e-6 >= target ? target : Math.min(target, next);
}

function sortedNumbers(values: ReadonlySet<number>): number[] {
  return [...values].sort((left, right) => left - right);
}

/** Pure, timeline-independent progress tracker for the five story epochs. */
export class StoryObjectiveDirector {
  private activeSegmentId: StoryObjectiveSegmentId | null = null;
  private trainingJumps = 0;
  private trainingSlides = 0;
  private cableCurrent = 0;
  private cableBest = 0;
  private cableLastAction: StoryAction | null = null;
  private qualityCompletedSeries = 0;
  private qualityCurrentSeries = 0;
  private readonly creativePickups = new Set<StoryCreativeEquipmentId>();
  private growthCurrent = 0;
  private growthBest = 0;
  private trustCurrent = 0;
  private trustBest = 0;
  private requiredOrders = 0;
  private bonusOrders = 0;
  private lastCompletedOrderType: PackageType | null = null;
  private hydraElapsedSeconds = 0;
  private counterElapsedSeconds = 0;
  private millionWaveElapsedSeconds = 0;
  private hydraDurationSeconds: number = TARGETS.hydraSeconds;
  private counterDurationSeconds: number = TARGETS.counterSeconds;
  private millionWaveDurationSeconds: number =
    TARGETS.millionPhaseSeconds * TARGETS.millionGuidedPhases;
  private readonly collectedSymbols = new Set<number>();
  private symbolMisses = 0;

  public enterSegment(segmentId: string | null, durationSeconds?: number): boolean {
    if (segmentId === null) {
      const changed = this.activeSegmentId !== null;
      this.activeSegmentId = null;
      return changed;
    }
    if (!SEGMENT_IDS.has(segmentId)) return false;
    const next = segmentId as StoryObjectiveSegmentId;
    const changed = next !== this.activeSegmentId;
    this.activeSegmentId = next;
    const durationChanged = this.captureDuration(next, durationSeconds);
    return changed || durationChanged;
  }

  /** Records an action only after its obstacle pattern has been cleared successfully. */
  public recordSuccessfulPattern(action: StoryAction): StoryObjectiveUpdate {
    return this.update(() => {
      switch (this.activeSegmentId) {
        case "epoch_1.training":
          if (action === "jump") this.trainingJumps += 1;
          else this.trainingSlides += 1;
          return true;
        case "epoch_1.cable_chaos":
          this.cableCurrent = this.cableLastAction === null || this.cableLastAction !== action
            ? this.cableCurrent + 1
            : 1;
          this.cableLastAction = action;
          this.cableBest = Math.max(this.cableBest, this.cableCurrent);
          return true;
        case "epoch_2.quality_series":
          if (this.qualityCompletedSeries >= TARGETS.qualitySeries) return false;
          this.qualityCurrentSeries += 1;
          if (this.qualityCurrentSeries >= TARGETS.qualityCombo) {
            this.qualityCompletedSeries += 1;
            this.qualityCurrentSeries = 0;
          }
          return true;
        default:
          return false;
      }
    });
  }

  /** @deprecated Prefer recordSuccessfulPattern after a confirmed clear. */
  public recordAction(action: StoryAction): StoryObjectiveUpdate {
    return this.recordSuccessfulPattern(action);
  }

  /** Synchronises the growth objective with the scoring engine's real combo value. */
  public recordCurrentCombo(combo: number): StoryObjectiveUpdate {
    return this.update(() => {
      if (this.activeSegmentId !== "epoch_3.growth_contract" || !Number.isFinite(combo)) {
        return false;
      }
      const current = Math.max(0, Math.floor(combo));
      const best = Math.max(this.growthBest, current);
      const changed = current !== this.growthCurrent || best !== this.growthBest;
      this.growthCurrent = current;
      this.growthBest = best;
      return changed;
    });
  }

  public recordError(): StoryObjectiveUpdate {
    return this.update(() => {
      switch (this.activeSegmentId) {
        case "epoch_1.cable_chaos": {
          const changed = this.cableCurrent !== 0 || this.cableLastAction !== null;
          this.cableCurrent = 0;
          this.cableLastAction = null;
          return changed;
        }
        case "epoch_2.quality_series": {
          const changed = this.qualityCurrentSeries !== 0;
          this.qualityCurrentSeries = 0;
          return changed;
        }
        case "epoch_3.growth_contract": {
          const changed = this.growthCurrent !== 0;
          this.growthCurrent = 0;
          return changed;
        }
        case "epoch_3.trust_contract": {
          const changed = this.trustCurrent !== 0;
          this.trustCurrent = 0;
          return changed;
        }
        default:
          return false;
      }
    });
  }

  public recordCollision(): StoryObjectiveUpdate {
    return this.recordError();
  }

  /** A clean trust action is one deliberately collected parcel; a collision resets the streak. */
  public recordTrustCollection(): StoryObjectiveUpdate {
    return this.update(() => {
      if (this.activeSegmentId !== "epoch_3.trust_contract") return false;
      this.trustCurrent += 1;
      this.trustBest = Math.max(this.trustBest, this.trustCurrent);
      return true;
    });
  }

  /** Accepts only one of the three marked items required by the creative contract. */
  public recordCreativePickup(equipmentId: string): StoryObjectiveUpdate {
    return this.update(() => {
      if (this.activeSegmentId !== "epoch_3.creative_contract" ||
          !isCreativeEquipmentId(equipmentId) ||
          this.creativePickups.has(equipmentId)) return false;
      this.creativePickups.add(equipmentId);
      return true;
    });
  }

  /** @deprecated Prefer recordCreativePickup with a marked equipment id. */
  public recordPickup(pickupId: string): StoryObjectiveUpdate {
    return this.recordCreativePickup(pickupId);
  }

  public recordOrder(orderType: PackageType): StoryObjectiveUpdate {
    return this.update(() => {
      if (this.activeSegmentId !== "epoch_4.orders" ||
          !(["pc", "notebook", "lcd", "telefon"] as const).includes(orderType)) return false;
      if (this.requiredOrders < TARGETS.requiredOrders) this.requiredOrders += 1;
      else this.bonusOrders += 1;
      this.lastCompletedOrderType = orderType;
      return true;
    });
  }

  public recordElapsed(deltaSeconds: number): StoryObjectiveUpdate {
    return this.update(() => {
      if (!validDelta(deltaSeconds)) return false;
      switch (this.activeSegmentId) {
        case "epoch_4.logistic_hydra":
          if (this.hydraElapsedSeconds >= this.hydraDurationSeconds) return false;
          this.hydraElapsedSeconds = cappedElapsed(
            this.hydraElapsedSeconds, deltaSeconds, this.hydraDurationSeconds
          );
          return true;
        case "epoch_5.counter":
          if (this.counterElapsedSeconds >= this.counterDurationSeconds) return false;
          this.counterElapsedSeconds = cappedElapsed(
            this.counterElapsedSeconds, deltaSeconds, this.counterDurationSeconds
          );
          return true;
        case "epoch_5.million_wave":
          if (this.millionWaveElapsedSeconds >= this.millionWaveDurationSeconds) return false;
          this.millionWaveElapsedSeconds = cappedElapsed(
            this.millionWaveElapsedSeconds,
            deltaSeconds,
            this.millionWaveDurationSeconds
          );
          return true;
        default:
          return false;
      }
    });
  }

  public recordSymbol(index: number): StoryObjectiveUpdate {
    return this.update(() => {
      if (this.activeSegmentId !== "epoch_5.million_wave" || !this.validSymbol(index) ||
          this.collectedSymbols.has(index)) return false;
      this.collectedSymbols.add(index);
      return true;
    });
  }

  public recordSymbolMiss(index: number): StoryObjectiveUpdate {
    return this.update(() => {
      if (this.activeSegmentId !== "epoch_5.million_wave" || !this.validSymbol(index) ||
          this.collectedSymbols.has(index)) return false;
      this.symbolMisses += 1;
      return true;
    });
  }

  public get snapshot(): StoryObjectivesSnapshot {
    const trainingComplete = this.trainingJumps >= TARGETS.mixedActionsEach &&
      this.trainingSlides >= TARGETS.mixedActionsEach;
    const cableComplete = this.cableBest >= TARGETS.cableAlternation;
    const creativeComplete = this.creativePickups.size >= TARGETS.creativePickups;
    const growthComplete = this.growthBest >= TARGETS.growthCombo;
    const trustComplete = this.trustBest >= TARGETS.trustClean;
    const ordersComplete = this.requiredOrders >= TARGETS.requiredOrders;
    const hydraComplete = this.hydraElapsedSeconds >= this.hydraDurationSeconds;
    const counterComplete = this.counterElapsedSeconds >= this.counterDurationSeconds;
    const waveSeconds = this.millionWaveDurationSeconds;
    const waveComplete = this.millionWaveElapsedSeconds >= waveSeconds;
    const symbolsComplete = this.collectedSymbols.size >= TARGETS.symbolCount;
    const completedObjectiveIds = this.completedObjectiveIds();
    const hydraPhaseLength = this.hydraDurationSeconds / 3;
    const hydraPhasesCompleted = hydraComplete
      ? 3
      : Math.floor(this.hydraElapsedSeconds / hydraPhaseLength);
    const millionPhaseSeconds = this.millionWaveDurationSeconds / TARGETS.millionGuidedPhases;
    const guidedPhasesCompleted = Math.min(
      TARGETS.millionGuidedPhases,
      Math.floor(this.millionWaveElapsedSeconds / millionPhaseSeconds)
    );

    return {
      activeSegmentId: this.activeSegmentId,
      completedObjectiveIds,
      epoch1: {
        training: {
          jumps: this.trainingJumps,
          slides: this.trainingSlides,
          targetEach: TARGETS.mixedActionsEach,
          completed: trainingComplete
        },
        cableChaos: {
          currentAlternation: this.cableCurrent,
          bestAlternation: this.cableBest,
          target: TARGETS.cableAlternation,
          completed: cableComplete
        },
        completed: trainingComplete && cableComplete
      },
      epoch2: {
        completedSeries: this.qualityCompletedSeries,
        currentSeries: this.qualityCurrentSeries,
        seriesTarget: TARGETS.qualitySeries,
        comboTarget: TARGETS.qualityCombo,
        completed: this.qualityCompletedSeries >= TARGETS.qualitySeries
      },
      epoch3: {
        creative: {
          collected: this.creativePickups.size,
          collectedIds: [...this.creativePickups].sort(),
          target: TARGETS.creativePickups,
          completed: creativeComplete
        },
        growth: {
          currentCombo: this.growthCurrent,
          bestCombo: this.growthBest,
          target: TARGETS.growthCombo,
          completed: growthComplete
        },
        trust: {
          currentClean: this.trustCurrent,
          longestClean: this.trustBest,
          target: TARGETS.trustClean,
          completed: trustComplete
        },
        completed: creativeComplete && growthComplete && trustComplete
      },
      epoch4: {
        orders: {
          requiredCompleted: this.requiredOrders,
          requiredTarget: TARGETS.requiredOrders,
          bonusCompleted: this.bonusOrders,
          lastCompletedType: this.lastCompletedOrderType,
          completed: ordersComplete
        },
        hydra: {
          elapsedSeconds: this.hydraElapsedSeconds,
          phase: hydraComplete
            ? "completed"
            : this.hydraElapsedSeconds < hydraPhaseLength
              ? "intake"
              : this.hydraElapsedSeconds < hydraPhaseLength * 2
                ? "routing"
                : "dispatch",
          phasesCompleted: hydraPhasesCompleted,
          completed: hydraComplete
        },
        completed: ordersComplete && hydraComplete
      },
      epoch5: {
        counter: {
          elapsedSeconds: this.counterElapsedSeconds,
          value: [999_970, 999_980, 999_990, 999_999][Math.min(
            3,
            Math.floor(this.counterElapsedSeconds / (this.counterDurationSeconds / 4))
          )]!,
          completed: counterComplete
        },
        wave: {
          elapsedSeconds: this.millionWaveElapsedSeconds,
          phase: waveComplete
            ? "completed"
            : (["order", "quality", "logistics"] as const)[Math.min(
                2,
                Math.floor(this.millionWaveElapsedSeconds / millionPhaseSeconds)
              )]!,
          guidedPhasesCompleted,
          completed: waveComplete
        },
        symbols: {
          collectedIds: sortedNumbers(this.collectedSymbols),
          pendingIds: Array.from({ length: TARGETS.symbolCount }, (_, index) => index)
            .filter((index) => !this.collectedSymbols.has(index)),
          misses: this.symbolMisses,
          completed: symbolsComplete
        },
        completed: counterComplete && waveComplete && symbolsComplete
      }
    };
  }

  private completedObjectiveIds(): StoryObjectiveId[] {
    const ids: StoryObjectiveId[] = [];
    if (this.trainingJumps >= TARGETS.mixedActionsEach && this.trainingSlides >= TARGETS.mixedActionsEach) {
      ids.push("epoch_1.training");
    }
    if (this.cableBest >= TARGETS.cableAlternation) ids.push("epoch_1.cable_chaos");
    if (this.qualityCompletedSeries >= TARGETS.qualitySeries) ids.push("epoch_2.quality_series");
    if (this.creativePickups.size >= TARGETS.creativePickups) ids.push("epoch_3.creative_contract");
    if (this.growthBest >= TARGETS.growthCombo) ids.push("epoch_3.growth_contract");
    if (this.trustBest >= TARGETS.trustClean) ids.push("epoch_3.trust_contract");
    if (this.requiredOrders >= TARGETS.requiredOrders) ids.push("epoch_4.orders");
    if (this.hydraElapsedSeconds >= this.hydraDurationSeconds) ids.push("epoch_4.logistic_hydra");
    if (this.counterElapsedSeconds >= this.counterDurationSeconds) ids.push("epoch_5.counter");
    if (this.millionWaveElapsedSeconds >= this.millionWaveDurationSeconds) {
      ids.push("epoch_5.million_wave");
    }
    if (this.collectedSymbols.size >= TARGETS.symbolCount) ids.push("epoch_5.symbols");
    return ids;
  }

  private update(change: () => boolean): StoryObjectiveUpdate {
    const before = new Set(this.completedObjectiveIds());
    const changed = change();
    const newlyCompletedObjectiveIds = this.completedObjectiveIds()
      .filter((id) => !before.has(id));
    return { changed, newlyCompletedObjectiveIds };
  }

  private validSymbol(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < TARGETS.symbolCount;
  }

  private captureDuration(
    segmentId: StoryObjectiveSegmentId,
    durationSeconds: number | undefined
  ): boolean {
    if (!validDelta(durationSeconds ?? 0)) return false;
    const duration = durationSeconds as number;
    switch (segmentId) {
      case "epoch_4.logistic_hydra": {
        const changed = duration !== this.hydraDurationSeconds;
        this.hydraDurationSeconds = duration;
        return changed;
      }
      case "epoch_5.counter": {
        const changed = duration !== this.counterDurationSeconds;
        this.counterDurationSeconds = duration;
        return changed;
      }
      case "epoch_5.million_wave": {
        const changed = duration !== this.millionWaveDurationSeconds;
        this.millionWaveDurationSeconds = duration;
        return changed;
      }
      default:
        return false;
    }
  }
}
