import type { GameState } from "./contracts";
import type { StoryPhase } from "./story-timeline";
import type { CampaignMode, PackageType, PowerUpKind } from "../shared/types";
import type { StoryClimaxModel } from "./story-climax";
import type { StoryObstacleTransformation } from "./story-effects";
import type { StoryObjectivesSnapshot } from "./story-objectives";
import type { CampaignWorldId } from "../visuals/scene-manifest";
import type { MilestoneCelebrationSnapshot } from "./milestone-celebration";
import type { AuthoredWaveProgressSnapshot } from "./authored-wave";
import type { SemanticObstacleVariant } from "./semantic-obstacle";

export type ObstacleKind = "box-stack" | "pallet" | "trolley" | "overhead";
export type ObstacleSource = "normal" | "boss" | "story-climax" | "story-reward";
export type PackageKind = "standard" | "golden" | PowerUpKind;
export type BossPhase = "inactive" | "pending" | "warning" | "attacking" | "reward";

export interface RunnerModel {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  grounded: boolean;
  crouching: boolean;
  coyoteRemaining: number;
  jumpBufferRemaining: number;
}

export interface ObstacleModel {
  active: boolean;
  kind: ObstacleKind;
  source: ObstacleSource;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Prevents one cleared pattern from being credited more than once. */
  objectiveCredited?: boolean;
  authoredWaveId?: string;
  authoredActionIndex?: number;
  /** Concrete authored object/process rendered on top of the collision shape. */
  semanticVariant?: SemanticObstacleVariant;
}

export interface PackageModel {
  active: boolean;
  kind: PackageKind;
  scoreValue: number;
  x: number;
  y: number;
  size: number;
  phase: number;
  /** Product category used by fact triggers (typed collectibles). */
  packageType: PackageType;
  /** Shipping weight in kilograms, accumulated for the collect_weight trigger. */
  weightKg: number;
  /** Keeps regular spawning reserved until the authored reward pattern leaves. */
  storyRewardPattern?: boolean;
  /** Marks the one typed unit that advances the epoch-four order queue. */
  storyOrder?: boolean;
  authoredWaveId?: string;
}

export interface BossModel {
  phase: BossPhase;
  encounterPhase: number;
  cycle: number;
  attacksLaunched: number;
  attacksSurvived: number;
  attackCount: number;
  phaseSecondsRemaining: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CutsceneInfo {
  title: string;
  subtitle: string;
}

export interface RenderScene {
  state: GameState;
  runner: Readonly<RunnerModel>;
  obstacles: readonly Readonly<ObstacleModel>[];
  packages: readonly Readonly<PackageModel>[];
  boss: Readonly<BossModel>;
  elapsedSeconds: number;
  distancePixels: number;
  speed: number;
  reducedMotion: boolean;
  impact: boolean;
  epochIndex: number;
  epochName: string;
  epochYear: string;
  themeIndex: number;
  worldVisual?: Readonly<{
    worldId: CampaignWorldId;
    stateId: string;
    nextStateId: string;
    progress: number;
  }>;
  cutscene: CutsceneInfo | null;
  activePowerUps: readonly PowerUpKind[];
  /** Campaign presentation hints used by story and challenge rendering. */
  mode?: CampaignMode;
  trustCorridor?: boolean;
  combo?: number;
  recoverySeconds?: number;
  startProtectionSeconds?: number;
  warrantyBreakSeconds?: number;
  storyPhase?: StoryPhase | null;
  storyProgress?: number;
  storyObjectives?: Readonly<StoryObjectivesSnapshot>;
  storyClimax?: Readonly<StoryClimaxModel>;
  obstacleTransformations?: readonly Readonly<StoryObstacleTransformation>[];
  milestoneCelebration?: Readonly<MilestoneCelebrationSnapshot> | null;
  authoredWave?: Readonly<AuthoredWaveProgressSnapshot> | null;
}
