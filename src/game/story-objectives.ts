import type { PackageType } from "../shared/types";

export const STORY_OBJECTIVE_SEGMENT_IDS = [
  "epoch_1.training",
  "epoch_1.order_backlog",
  "epoch_2.quality_series",
  "epoch_2.quality_trial",
  "epoch_3.matching_creative",
  "epoch_3.matching_growth",
  "epoch_3.matching_trust",
  "epoch_4.order_peak",
  "epoch_4.order_peak_final",
  "epoch_5.million_threshold"
] as const;

export type StoryObjectiveSegmentId = typeof STORY_OBJECTIVE_SEGMENT_IDS[number];
export type StoryAction = "jump" | "slide";
export const STORY_CREATIVE_EQUIPMENT_IDS = ["notebook", "lcd", "pc"] as const;
export type StoryCreativeEquipmentId = typeof STORY_CREATIVE_EQUIPMENT_IDS[number];
export type StoryObjectiveId =
  | "epoch_1.training"
  | "epoch_1.order_backlog"
  | "epoch_2.quality_series"
  | "epoch_3.matching_creative"
  | "epoch_3.matching_growth"
  | "epoch_3.matching_trust"
  | "epoch_4.order_peak"
  | "epoch_4.order_peak_final"
  | "epoch_5.million_threshold";

export interface StoryObjectiveUpdate {
  changed: boolean;
  newlyCompletedObjectiveIds: readonly StoryObjectiveId[];
}

export interface StoryObjectivesSnapshot {
  activeSegmentId: StoryObjectiveSegmentId | null;
  completedObjectiveIds: readonly StoryObjectiveId[];
  epoch1: {
    training: { jumps: number; slides: number; targetEach: number; completed: boolean };
    orderBacklog: {
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
    flow: {
      elapsedSeconds: number;
      phase: "intake" | "routing" | "dispatch" | "completed";
      phasesCompleted: number;
      completed: boolean;
    };
    completed: boolean;
  };
  epoch5: {
    millionThreshold: {
      ordersCollected: number;
      orderTarget: number;
      counterStart: number;
      counterTarget: number;
      counterValue: number;
      completed: boolean;
    };
    completed: boolean;
  };
}

export const STORY_OBJECTIVE_TARGETS = {
  mixedActionsEach: 4,
  backlogAlternation: 4,
  qualitySeries: 4,
  qualityCombo: 3,
  creativePickups: STORY_CREATIVE_EQUIPMENT_IDS.length,
  growthCombo: 8,
  trustClean: 12,
  requiredOrders: 6,
  orderPeakSeconds: 60,
  millionOrders: 50
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

/** Pure, timeline-independent progress tracker for the five story epochs. */
export class StoryObjectiveDirector {
  private activeSegmentId: StoryObjectiveSegmentId | null = null;
  private trainingJumps = 0;
  private trainingSlides = 0;
  private backlogCurrent = 0;
  private backlogBest = 0;
  private backlogLastAction: StoryAction | null = null;
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
  private orderPeakElapsedSeconds = 0;
  private orderPeakDurationSeconds: number = TARGETS.orderPeakSeconds;
  private thresholdOrders = 0;

  public enterSegment(segmentId: string | null, _durationSeconds?: number): boolean {
    if (segmentId === null) {
      const changed = this.activeSegmentId !== null;
      this.activeSegmentId = null;
      return changed;
    }
    if (!SEGMENT_IDS.has(segmentId)) return false;
    const next = segmentId as StoryObjectiveSegmentId;
    const changed = next !== this.activeSegmentId;
    this.activeSegmentId = next;
    return changed;
  }

  /** Records an action only after its obstacle pattern has been cleared successfully. */
  public recordSuccessfulPattern(action: StoryAction): StoryObjectiveUpdate {
    return this.update(() => {
      switch (this.activeSegmentId) {
        case "epoch_1.training":
          if (action === "jump") this.trainingJumps += 1;
          else this.trainingSlides += 1;
          return true;
        case "epoch_1.order_backlog":
          this.backlogCurrent = this.backlogLastAction === null || this.backlogLastAction !== action
            ? this.backlogCurrent + 1
            : 1;
          this.backlogLastAction = action;
          this.backlogBest = Math.max(this.backlogBest, this.backlogCurrent);
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

  /** Synchronises the growth objective with the scoring engine's real combo value. */
  public recordCurrentCombo(combo: number): StoryObjectiveUpdate {
    return this.update(() => {
      if (this.activeSegmentId !== "epoch_3.matching_growth" || !Number.isFinite(combo)) {
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
        case "epoch_1.order_backlog": {
          const changed = this.backlogCurrent !== 0 || this.backlogLastAction !== null;
          this.backlogCurrent = 0;
          this.backlogLastAction = null;
          return changed;
        }
        case "epoch_2.quality_series": {
          const changed = this.qualityCurrentSeries !== 0;
          this.qualityCurrentSeries = 0;
          return changed;
        }
        case "epoch_3.matching_growth": {
          const changed = this.growthCurrent !== 0;
          this.growthCurrent = 0;
          return changed;
        }
        case "epoch_3.matching_trust": {
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
      if (this.activeSegmentId !== "epoch_3.matching_trust") return false;
      this.trustCurrent += 1;
      this.trustBest = Math.max(this.trustBest, this.trustCurrent);
      return true;
    });
  }

  /** Accepts only one of the three marked items required by the creative contract. */
  public recordCreativePickup(equipmentId: string): StoryObjectiveUpdate {
    return this.update(() => {
      if (this.activeSegmentId !== "epoch_3.matching_creative" ||
          !isCreativeEquipmentId(equipmentId) ||
          this.creativePickups.has(equipmentId)) return false;
      this.creativePickups.add(equipmentId);
      return true;
    });
  }

  public recordOrder(orderType: PackageType): StoryObjectiveUpdate {
    return this.update(() => {
      if (this.activeSegmentId !== "epoch_4.order_peak" ||
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
        case "epoch_4.order_peak":
        case "epoch_4.order_peak_final":
          if (this.orderPeakElapsedSeconds >= this.orderPeakDurationSeconds) return false;
          this.orderPeakElapsedSeconds = cappedElapsed(
            this.orderPeakElapsedSeconds, deltaSeconds, this.orderPeakDurationSeconds
          );
          return true;
        default:
          return false;
      }
    });
  }

  public recordMillionOrder(): StoryObjectiveUpdate {
    return this.update(() => {
      if (this.activeSegmentId !== "epoch_5.million_threshold" ||
          this.thresholdOrders >= TARGETS.millionOrders) return false;
      this.thresholdOrders += 1;
      return true;
    });
  }

  public get snapshot(): StoryObjectivesSnapshot {
    const trainingComplete = this.trainingJumps >= TARGETS.mixedActionsEach &&
      this.trainingSlides >= TARGETS.mixedActionsEach;
    const backlogComplete = this.backlogBest >= TARGETS.backlogAlternation;
    const creativeComplete = this.creativePickups.size >= TARGETS.creativePickups;
    const growthComplete = this.growthBest >= TARGETS.growthCombo;
    const trustComplete = this.trustBest >= TARGETS.trustClean;
    const ordersComplete = this.requiredOrders >= TARGETS.requiredOrders;
    const orderPeakComplete = this.orderPeakElapsedSeconds >= this.orderPeakDurationSeconds;
    const completedObjectiveIds = this.completedObjectiveIds();
    const orderPeakPhaseLength = this.orderPeakDurationSeconds / 3;
    const orderPeakPhasesCompleted = orderPeakComplete
      ? 3
      : Math.floor(this.orderPeakElapsedSeconds / orderPeakPhaseLength);

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
        orderBacklog: {
          currentAlternation: this.backlogCurrent,
          bestAlternation: this.backlogBest,
          target: TARGETS.backlogAlternation,
          completed: backlogComplete
        },
        completed: trainingComplete && backlogComplete
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
        flow: {
          elapsedSeconds: this.orderPeakElapsedSeconds,
          phase: orderPeakComplete
            ? "completed"
            : this.orderPeakElapsedSeconds < orderPeakPhaseLength
              ? "intake"
              : this.orderPeakElapsedSeconds < orderPeakPhaseLength * 2
                ? "routing"
                : "dispatch",
          phasesCompleted: orderPeakPhasesCompleted,
          completed: orderPeakComplete
        },
        completed: ordersComplete && orderPeakComplete
      },
      epoch5: {
        millionThreshold: {
          ordersCollected: this.thresholdOrders,
          orderTarget: TARGETS.millionOrders,
          counterStart: 1_000_000 - TARGETS.millionOrders,
          counterTarget: 1_000_000,
          counterValue: 1_000_000 - TARGETS.millionOrders + this.thresholdOrders,
          completed: this.thresholdOrders >= TARGETS.millionOrders
        },
        completed: this.thresholdOrders >= TARGETS.millionOrders
      }
    };
  }

  private completedObjectiveIds(): StoryObjectiveId[] {
    const ids: StoryObjectiveId[] = [];
    if (this.trainingJumps >= TARGETS.mixedActionsEach && this.trainingSlides >= TARGETS.mixedActionsEach) {
      ids.push("epoch_1.training");
    }
    if (this.backlogBest >= TARGETS.backlogAlternation) ids.push("epoch_1.order_backlog");
    if (this.qualityCompletedSeries >= TARGETS.qualitySeries) ids.push("epoch_2.quality_series");
    if (this.creativePickups.size >= TARGETS.creativePickups) ids.push("epoch_3.matching_creative");
    if (this.growthBest >= TARGETS.growthCombo) ids.push("epoch_3.matching_growth");
    if (this.trustBest >= TARGETS.trustClean) ids.push("epoch_3.matching_trust");
    if (this.requiredOrders >= TARGETS.requiredOrders) ids.push("epoch_4.order_peak");
    if (this.orderPeakElapsedSeconds >= this.orderPeakDurationSeconds) ids.push("epoch_4.order_peak_final");
    if (this.thresholdOrders >= TARGETS.millionOrders) {
      ids.push("epoch_5.million_threshold");
    }
    return ids;
  }

  private update(change: () => boolean): StoryObjectiveUpdate {
    const before = new Set(this.completedObjectiveIds());
    const changed = change();
    const newlyCompletedObjectiveIds = this.completedObjectiveIds()
      .filter((id) => !before.has(id));
    return { changed, newlyCompletedObjectiveIds };
  }

}
