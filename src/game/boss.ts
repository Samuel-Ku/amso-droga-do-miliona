import { BOSS, GROUND_Y, WORLD_WIDTH } from "./constants";
import type { BossModel, ObstacleKind } from "./types";

export type BossCommand =
  | { type: "none" }
  | { type: "attack"; kind: ObstacleKind }
  | { type: "complete" };

const ATTACK_ORDER: readonly ObstacleKind[] = ["pallet", "trolley", "box-stack"];

function inactiveModel(): BossModel {
  return {
    phase: "inactive",
    cycle: 0,
    attacksLaunched: 0,
    attacksSurvived: 0,
    attackCount: BOSS.attackCount,
    phaseSecondsRemaining: 0,
    x: WORLD_WIDTH + 80,
    y: GROUND_Y - 176,
    width: 164,
    height: 176
  };
}

/**
 * A deterministic, one-button boss encounter. The player wins by surviving three
 * ordinary jump hazards; the boss itself stays outside the collision lane.
 */
export class BossDirector {
  public readonly model: BossModel = inactiveModel();
  private nextEncounterAt: number = BOSS.firstAtSeconds;
  private attackCooldown = 0;
  private awaitingResolution = false;
  private hazardSeen = false;

  public get blocksRegularSpawns(): boolean {
    return this.model.phase !== "inactive";
  }

  public reset(): void {
    Object.assign(this.model, inactiveModel());
    this.nextEncounterAt = BOSS.firstAtSeconds;
    this.attackCooldown = 0;
    this.awaitingResolution = false;
    this.hazardSeen = false;
  }

  /** Force the boss encounter to begin now (used by the epoch-5 narrative climax). */
  public forceEncounter(): void {
    if (this.model.phase !== "inactive") {
      return;
    }
    this.model.phase = "pending";
    this.model.cycle += 1;
    this.model.attacksLaunched = 0;
    this.model.attacksSurvived = 0;
    this.model.x = WORLD_WIDTH + 62;
  }

  public advance(
    deltaSeconds: number,
    elapsedSeconds: number,
    routeClear: boolean,
    bossHazardActive: boolean
  ): BossCommand {
    const delta = Math.max(0, deltaSeconds);

    if (this.model.phase === "inactive") {
      if (elapsedSeconds < this.nextEncounterAt) return { type: "none" };
      this.model.phase = "pending";
      this.model.cycle += 1;
      this.model.attacksLaunched = 0;
      this.model.attacksSurvived = 0;
      this.model.x = WORLD_WIDTH + 62;
    }

    if (this.model.phase === "pending") {
      if (!routeClear) return { type: "none" };
      this.model.phase = "warning";
      this.model.phaseSecondsRemaining = BOSS.warningSeconds;
      return { type: "none" };
    }

    if (this.model.phase === "warning") {
      this.model.phaseSecondsRemaining = Math.max(
        0,
        this.model.phaseSecondsRemaining - delta
      );
      const progress = 1 - this.model.phaseSecondsRemaining / BOSS.warningSeconds;
      this.model.x = WORLD_WIDTH + 62 - progress * 222;
      if (this.model.phaseSecondsRemaining > 0) return { type: "none" };
      this.model.phase = "attacking";
      this.model.x = WORLD_WIDTH - 160;
      this.attackCooldown = BOSS.firstAttackDelaySeconds;
      return { type: "none" };
    }

    if (this.model.phase === "attacking") {
      if (this.awaitingResolution) {
        if (bossHazardActive) this.hazardSeen = true;
        if (!bossHazardActive && this.hazardSeen) {
          this.awaitingResolution = false;
          this.hazardSeen = false;
          this.model.attacksSurvived += 1;
          if (this.model.attacksSurvived >= this.model.attackCount) {
            this.model.phase = "reward";
            this.model.phaseSecondsRemaining = BOSS.rewardSeconds;
            this.nextEncounterAt = elapsedSeconds + BOSS.intervalSeconds;
            return { type: "complete" };
          }
          this.attackCooldown = BOSS.betweenAttacksSeconds;
        }
        return { type: "none" };
      }

      this.attackCooldown = Math.max(0, this.attackCooldown - delta);
      if (this.attackCooldown > 0 || !routeClear) return { type: "none" };

      const orderIndex =
        (this.model.attacksLaunched + this.model.cycle - 1) % ATTACK_ORDER.length;
      const kind = ATTACK_ORDER[orderIndex] ?? "pallet";
      this.model.attacksLaunched += 1;
      this.awaitingResolution = true;
      this.hazardSeen = false;
      return { type: "attack", kind };
    }

    if (this.model.phase === "reward") {
      this.model.phaseSecondsRemaining = Math.max(
        0,
        this.model.phaseSecondsRemaining - delta
      );
      this.model.x += delta * 245;
      if (this.model.phaseSecondsRemaining <= 0) {
        this.model.phase = "inactive";
        this.model.x = WORLD_WIDTH + 80;
      }
    }

    return { type: "none" };
  }
}
