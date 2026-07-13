import type { BossPhase } from "./types";
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
  collisions: number;
  recoverySeconds: number;
  combo: number;
  bestCombo: number;
  warrantySaves: number;
  storyPhase: StoryPhase | null;
  storyProgress: number;
  activeStoryBeatIds: string[];
  trustCorridor: boolean;
  storySymbols: number;
  storyObjectiveSegmentId: string;
  storyObjectivesCompleted: StoryObjectiveId[];
  storyObjectives: StoryObjectivesSnapshot;
  activeStoryOrderTypes: PackageType[];
  activeStorySymbolIds: number[];
  storySymbolRespawns: number;
  storyClimaxName: string;
  storyClimaxPhase: StoryClimaxPhase;
  storyClimaxesCompleted: number[];
  storyTransformationMotifs: StoryPositiveMotif[];
  logisticWavePhase: LogisticWavePhase;
  logisticWaveProgress: number;
  bossesDefeated: number;
  bossPhase: BossPhase;
  bossProgress: number;
  bossAttackCount: number;
  distanceM: number;
  durationSeconds: number;
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
  factsUnlockedCount: number;
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
