import type { ObstacleKind } from "./types";

export type StoryClimaxIdentity =
  | "order-backlog"
  | "quality-trial"
  | "matching-challenge"
  | "order-peak";

export type StoryPositiveMotif =
  | "process-zones"
  | "quality-mark"
  | "matched-order"
  | "dispatch-flow";

export type StoryClimaxPhase =
  | "inactive"
  | "warning"
  | "challenge"
  | "transforming"
  | "completed";

export interface StoryClimaxModel {
  epochIndex: number;
  challengeName: string;
  identity: StoryClimaxIdentity | null;
  positiveMotif: StoryPositiveMotif | null;
  phase: StoryClimaxPhase;
  attacksLaunched: number;
  attacksResolved: number;
  attackCount: number;
  completed: boolean;
}

export type StoryClimaxCommand =
  | { type: "none" }
  | { type: "attack"; kind: ObstacleKind }
  | { type: "complete" };

interface StoryClimaxDefinition {
  identity: StoryClimaxIdentity;
  positiveMotif: StoryPositiveMotif;
  attacks: readonly ObstacleKind[];
}

const DEFINITIONS: readonly StoryClimaxDefinition[] = [
  {
    identity: "order-backlog",
    positiveMotif: "process-zones",
    attacks: ["pallet", "overhead", "box-stack", "overhead"]
  },
  {
    identity: "quality-trial",
    positiveMotif: "quality-mark",
    attacks: ["overhead"]
  },
  {
    identity: "matching-challenge",
    positiveMotif: "matched-order",
    attacks: ["trolley"]
  },
  {
    identity: "order-peak",
    positiveMotif: "dispatch-flow",
    attacks: ["box-stack", "overhead", "trolley"]
  }
];

const WARNING_SECONDS = 0.7;
const TRANSFORMATION_SECONDS = 1.2;

function inactiveModel(): StoryClimaxModel {
  return {
    epochIndex: -1,
    challengeName: "",
    identity: null,
    positiveMotif: null,
    phase: "inactive",
    attacksLaunched: 0,
    attacksResolved: 0,
    attackCount: 0,
    completed: false
  };
}

/**
 * A compact director for the four story micro-climaxes. It emits ordinary,
 * readable runner hazards but always resolves into the epoch's positive motif;
 * missing a hazard or marker can never hold the timeline open.
 */
export class StoryClimaxDirector {
  public readonly model: StoryClimaxModel = inactiveModel();
  private definition: StoryClimaxDefinition | null = null;
  private durationSeconds = 0;
  private warningRemaining = 0;
  private awaitingResolution = false;
  private retryPending = false;
  private hazardSeen = false;
  private completionEmitted = false;

  public get blocksRegularSpawns(): boolean {
    return this.model.phase === "warning" || this.model.phase === "challenge";
  }

  public reset(): void {
    Object.assign(this.model, inactiveModel());
    this.definition = null;
    this.durationSeconds = 0;
    this.warningRemaining = 0;
    this.awaitingResolution = false;
    this.retryPending = false;
    this.hazardSeen = false;
    this.completionEmitted = false;
  }

  /** Requeues only the unfinished telegraphed action after a story collision. */
  public retryCurrentAttack(): void {
    if (!this.awaitingResolution || this.model.phase !== "challenge") return;
    this.awaitingResolution = false;
    this.retryPending = true;
    this.hazardSeen = false;
    this.model.attacksLaunched = Math.max(
      this.model.attacksResolved,
      this.model.attacksLaunched - 1
    );
  }

  public enterEpoch(
    epochIndex: number,
    challengeName: string,
    durationSeconds: number
  ): void {
    this.reset();
    const definition = DEFINITIONS[epochIndex];
    if (!definition) return;
    this.definition = definition;
    this.durationSeconds = Math.max(1, durationSeconds);
    Object.assign(this.model, {
      epochIndex,
      challengeName,
      identity: definition.identity,
      positiveMotif: definition.positiveMotif,
      attackCount: definition.attacks.length
    } satisfies Partial<StoryClimaxModel>);
  }

  public advance(
    deltaSeconds: number,
    sectionElapsedSeconds: number,
    trustCorridor: boolean,
    routeClear: boolean,
    climaxHazardActive: boolean
  ): StoryClimaxCommand {
    if (!this.definition) return { type: "none" };
    const elapsed = Math.max(0, sectionElapsedSeconds);
    const forcedTransformationAt = Math.max(
      this.durationSeconds * 0.72,
      this.durationSeconds - TRANSFORMATION_SECONDS
    );

    if (elapsed + Number.EPSILON >= this.durationSeconds &&
        !this.awaitingResolution && !this.retryPending) {
      this.model.completed = true;
      this.model.phase = "completed";
      if (!this.completionEmitted) {
        this.completionEmitted = true;
        return { type: "complete" };
      }
      return { type: "none" };
    }

    // Once a telegraphed attack is on the route, let the player finish it. Cutting
    // it off here makes the final Cable Chaos alternation impossible to earn.
    if (elapsed >= forcedTransformationAt &&
        !this.awaitingResolution && !this.retryPending) {
      return this.completeIntoTransformation();
    }

    if (this.model.phase === "inactive" && elapsed >= this.durationSeconds * 0.08) {
      this.model.phase = "warning";
      this.warningRemaining = WARNING_SECONDS;
    }

    if (this.model.phase === "warning") {
      this.warningRemaining = Math.max(0, this.warningRemaining - Math.max(0, deltaSeconds));
      if (this.warningRemaining <= 0) this.model.phase = "challenge";
      return { type: "none" };
    }

    if (this.model.phase !== "challenge") return { type: "none" };

    if (this.awaitingResolution) {
      if (climaxHazardActive) this.hazardSeen = true;
      if (!climaxHazardActive && this.hazardSeen) {
        this.awaitingResolution = false;
        this.hazardSeen = false;
        this.model.attacksResolved += 1;
        if (this.model.attacksResolved >= this.model.attackCount) {
          return this.completeIntoTransformation();
        }
      }
      return { type: "none" };
    }

    if (trustCorridor || !routeClear) return { type: "none" };
    const kind = this.definition.attacks[this.model.attacksLaunched];
    if (!kind) return this.completeIntoTransformation();
    this.model.attacksLaunched += 1;
    this.awaitingResolution = true;
    this.retryPending = false;
    this.hazardSeen = false;
    return { type: "attack", kind };
  }

  private completeIntoTransformation(): StoryClimaxCommand {
    this.model.completed = true;
    this.model.phase = "transforming";
    if (this.completionEmitted) return { type: "none" };
    this.completionEmitted = true;
    return { type: "complete" };
  }
}
