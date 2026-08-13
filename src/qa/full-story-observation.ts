import type {
  AuthoredWaveAction,
  AuthoredWaveProgressSnapshot,
  AuthoredWaveResult,
  StoryMicrolevelId
} from "../game/authored-wave";
import type { GameState } from "../game/contracts";
import type { StoryState } from "../game/story-timeline";
import type { CampaignWorldId } from "../visuals/scene-manifest";

export const FULL_STORY_QA_STEP_EVENT = "amso:full-story-qa-step-v1" as const;

export interface FullStoryQaTargetObservation {
  readonly kind: "obstacle" | "package";
  readonly x: number;
  readonly width: number;
}

/** Minimal immutable observation for the browser driver; deliberately contains no commands. */
export interface FullStoryQaObservation {
  readonly gameState: GameState;
  readonly storyState: StoryState | null;
  readonly sectionId: string;
  readonly sceneId: string | null;
  readonly controlsEnabled: boolean;
  readonly countdownValue: number | null;
  readonly simulationStep: number;
  readonly worldId: CampaignWorldId;
  readonly packagesCollected: number;
  readonly millionCounterValue: number;
  readonly canonicalCheckpoint: Readonly<{
    simulationStep: number;
    rngState: readonly number[];
    score: number;
    distance: number;
    worldIndex: number;
    collisionCount: number;
    pickupCount: number;
  }>;
  readonly runner: Readonly<{
    x: number;
    y: number;
    velocityY: number;
    grounded: boolean;
    crouching: boolean;
  }>;
  readonly authoredWave: Readonly<AuthoredWaveProgressSnapshot> | null;
  readonly lastCompletedWave: Readonly<{
    sequence: number;
    microlevelId: StoryMicrolevelId;
    result: Readonly<AuthoredWaveResult>;
    canonicalCheckpoint: FullStoryQaObservation["canonicalCheckpoint"];
  }> | null;
  readonly actionIndex: number | null;
  readonly action: AuthoredWaveAction | null;
  readonly actionToken: string | null;
  readonly target: Readonly<FullStoryQaTargetObservation> | null;
}
