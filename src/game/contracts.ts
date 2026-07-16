import type { BossPhase } from "./types";
import type { PackageKind } from "./types";
import type {
  CampaignMode,
  ChallengeConfig,
  NarrativeConfig,
  PackageType,
  PowerUpKind,
  StoryConfig
} from "../shared/types";
import type {
  StoryPhase,
  StoryTimelineSnapshot
} from "./story-timeline";
import type { LogisticWavePhase } from "./logistic-wave";
import type { StoryClimaxPhase, StoryPositiveMotif } from "./story-climax";
import type { StoryObjectiveId, StoryObjectivesSnapshot } from "./story-objectives";
import type { CampaignWorldId } from "../visuals/scene-manifest";
import type {
  MilestoneCelebrationEvent,
  MilestoneCelebrationSnapshot
} from "./milestone-celebration";
import type { AuthoredWaveProgressSnapshot } from "./authored-wave";
import type { ActivePowerUpStatus } from "./power-ups";
import type { ChallengePressureAxis } from "./challenge-pressure";

export type GameState = "ready" | "running" | "paused" | "game_over" | "destroyed";
export type ControlMethod = "keyboard" | "pointer" | "touch";
export type RunOutcome = "victory" | "dropout";
export type GameMode = CampaignMode;

export interface GameSnapshot {
  mode: GameMode;
  visualWorldId: CampaignWorldId;
  visualStateId: string;
  visualNextStateId: string;
  visualProgress: number;
  visualWorldIndex: number;
  visualTransitionPending: boolean;
  score: number;
  packagesCollected: number;
  challengeScore: number;
  challengePackagesCollected: number;
  collisions: number;
  recoverySeconds: number;
  startProtectionSeconds: number;
  combo: number;
  bestCombo: number;
  warrantySaves: number;
  storyPhase: StoryPhase | null;
  storyProgress: number;
  activeStoryBeatIds: string[];
  trustCorridor: boolean;
  storyObjectiveSegmentId: string;
  storyObjectivesCompleted: StoryObjectiveId[];
  storyObjectives: StoryObjectivesSnapshot;
  activeStoryOrderTypes: PackageType[];
  storyClimaxName: string;
  storyClimaxPhase: StoryClimaxPhase;
  storyClimaxesCompleted: number[];
  storyTransformationMotifs: StoryPositiveMotif[];
  logisticWavePhase: LogisticWavePhase;
  logisticWaveProgress: number;
  challengePressureAxis: ChallengePressureAxis | null;
  bossesDefeated: number;
  bossPhase: BossPhase;
  bossEncounterPhase: number;
  bossProgress: number;
  bossAttackCount: number;
  distanceM: number;
  /** Absolute 10% parallax travel for the cyclic gameplay background. */
  backgroundTravelPixels?: number;
  reducedMotion?: boolean;
  durationSeconds: number;
  /** Rolling browser-frame estimate used only by the local, PII-free QA report. */
  frameRate?: number;
  /** Cumulative frames that missed a 60 Hz budget while the run was active. */
  droppedFrames?: number;
  /** Most recent collider category; no user or device identity is recorded. */
  lastCollisionType?: string | null;
  difficultyLevel: number;
  speed: number;
  epochIndex: number;
  epochName: string;
  epochYear: string;
  epochIndexMax: number;
  epochProgress: number;
  packageTypeCounts: Record<PackageType, number>;
  totalWeightKg: number;
  activePowerUps: PowerUpKind[];
  activePowerUpStatuses: ActivePowerUpStatus[];
  /** Natural onboarding pause shown once for each newly introduced story bonus. */
  powerUpDemoRemaining: number;
  factsUnlockedCount: number;
  milestoneCelebration?: MilestoneCelebrationSnapshot | null;
  authoredWave: AuthoredWaveProgressSnapshot | null;
  /** Musical cadence mirrors authored gameplay without affecting its rules. */
  authoredWavePhase?: "inactive" | "breath" | "burst";
  /** Semantic order counter; UI does not reconstruct finale domain rules. */
  millionCounterValue: number;
}

export interface GameResult extends GameSnapshot {
  collisionType: string;
  controlMethod: ControlMethod;
  outcome: RunOutcome;
  furthestEpochReached: number;
}

export interface RunnerGameCallbacks {
  onStateChange?: (state: GameState, previousState: GameState) => void;
  onSnapshot?: (snapshot: GameSnapshot) => void;
  onGameOver?: (result: GameResult) => void;
  onEpochCompleted?: (index: number, clean: boolean) => void;
  onFactUnlocked?: (factId: string) => void;
  onCutscene?: (epochIndex: number, title: string, subtitle: string) => void;
  onNarrativeEnd?: (outcome: RunOutcome) => void;
  onStoryUpdate?: (snapshot: StoryTimelineSnapshot) => void;
  onStoryComplete?: () => void;
  onStoryObjectiveCompleted?: (objectiveId: StoryObjectiveId) => void;
  onSpecialPickup?: (kind: Exclude<PackageKind, "standard">) => void;
  onMilestoneCelebration?: (celebration: MilestoneCelebrationEvent) => void;
  onModeChange?: (mode: GameMode, previousMode: GameMode) => void;
}

export interface RunnerGameOptions {
  seed?: number;
  reducedMotion?: boolean;
  mode?: GameMode;
  story?: StoryConfig | null;
  awardStoryCompletionBonus?: boolean;
  challenge?: ChallengeConfig | null;
  narrative?: NarrativeConfig | null;
  /** Configurable two-line labels rendered on procedural power-up parcels. */
  powerUpPackageCopy?: Partial<Readonly<Record<PowerUpKind, readonly [string, string]>>>;
}

export interface RunnerGameApi {
  readonly state: GameState;
  start(controlMethod?: ControlMethod): void;
  continueStoryScene(expectedSceneId: string): boolean;
  jump(controlMethod: ControlMethod): void;
  crouch(active: boolean, controlMethod: ControlMethod): void;
  pause(): void;
  resume(): void;
  reset(): void;
  destroy(): void;
}
