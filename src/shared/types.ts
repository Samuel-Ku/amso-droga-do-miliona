export type RunnerSource = "homepage_logo" | "landing_hero" | "demo_logo" | "demo_hero" | string;

export interface RunnerFact {
  id: string;
  text: string;
  enabled: boolean;
  asOf?: string;
  validFrom?: string;
  validTo?: string | null;
}

export type PackageType = "notebook" | "telefon" | "pc" | "lcd";

export interface RecordBoardEntry {
  name: string;
  challengeScore: number;
  orders: number;
  updatedAt: number;
}
/** Visual form of one ordinary order. Physical facts still use PackageType. */
export type OrderVisualType = PackageType | "parcel";
export type CollectibleClass = "parcel" | "equipment";
export type PowerUpKind = "gwarancja_48" | "podwojny_wynik";
export type CampaignMode = "story" | "challenge";
export type StoryBeatKind = "title" | "dialogue" | "copy" | "stat" | "challenge";
export type StoryPerspective = "amso" | "client" | "challenge";

export interface StoryBeatConfig {
  id: string;
  text: string;
  maxExposureSeconds: number;
  kind: StoryBeatKind;
}

export interface StorySectionConfig {
  id: "prologue" | "finale";
  durationSeconds: number;
  beats: StoryBeatConfig[];
}

/**
 * A fact trigger describes the in-game condition that reveals a company fact.
 * Triggers are evaluated by the fact engine during a run.
 */
export type FactTrigger =
  | { type: "epoch_completed"; epochIndex: number }
  | { type: "epoch_completed_clean"; epochIndex: number }
  | { type: "collect_type"; packageType: PackageType; threshold: number }
  | { type: "collect_weight"; threshold: number };

export interface NarrativeFact {
  id: string;
  text: string;
  enabled: boolean;
  trigger: FactTrigger;
  asOf?: string;
  validFrom?: string;
  validTo?: string | null;
}

export interface EpochConfig {
  index: number;
  id: string;
  name: string;
  year: string;
  /** Index into the renderer's BACKGROUND_THEMES palette. */
  themeIndex: number;
  durationSeconds: number;
  /** Obstacle kinds available in this epoch (widening pool). */
  obstaclePool: string[];
  /** Speed multiplier at the start/end of the epoch ramp. */
  difficultyStart: number;
  difficultyEnd: number;
  challengeName?: string;
  powerUpDebut?: PowerUpKind;
  beats?: StoryBeatConfig[];
  /** Whether the scripted boss climax lands at the end of this epoch. */
  bossClimax?: boolean;
}

export interface StoryEpochConfig extends EpochConfig {
  challengeName: string;
  beats?: StoryBeatConfig[];
}

export type StoryChapterId =
  | "prologue"
  | "epoch_1"
  | "epoch_2"
  | "epoch_3"
  | "epoch_4"
  | "epoch_5"
  | "finale";

export type StoryVignette =
  | "first-package"
  | "small-warehouse"
  | "tested-device"
  | "order-process"
  | "quality-stamp"
  | "creative-desk"
  | "growing-business"
  | "long-trust"
  | "warehouse-scale"
  | "product-stream"
  | "delivery-map"
  | "million-counter"
  | "million-wave"
  | "million-package"
  | "thank-you";

export interface StorySceneConfig {
  id: string;
  chapter?: StoryChapterId;
  eyebrow: string;
  title: string;
  body: string[];
  vignette: StoryVignette;
  continueLabel: string;
  /** Explicit attribution used to distinguish AMSO, client and challenge scenes. */
  perspective?: StoryPerspective;
  /** Player-paced pages rendered inside one semantic scene. */
  steps?: StoryScenePageConfig[];
}

export interface StoryScenePageConfig {
  id: string;
  copyRef?: "game-introduction";
  title?: string;
  body: string[];
  continueLabel: string;
  /** Narrative pages are always hazard- and pickup-free. */
  safe: true;
  /** One verified statement this beat is allowed to communicate. */
  fact?: string;
  /** The single visible action performed during the beat. */
  action?: string;
  /** Stable composition left after the one-shot reveal. */
  finalFrame?: string;
}

export interface StorySceneStepConfig {
  type: "scene";
  sceneId: string;
}

export interface StoryPlayStepConfig {
  type: "play";
  id: string;
  epochIndex: number;
  durationSeconds: number;
}

export type StorySequenceStepConfig = StorySceneStepConfig | StoryPlayStepConfig;

export interface StoryModeHandoffConfig {
  id: string;
  from: "story";
  to: "challenge";
  safe: true;
  confirmationRequired: true;
  resumeCountdownSeconds: number;
}

export interface MillionThresholdConfig {
  counterStart: number;
  counterTarget: 1_000_000;
  orderTarget: number;
  combinationTarget: 12;
}

export interface StoryConfig {
  activeDurationSeconds: number;
  readingSpeedMultiplier: number;
  speedStartMultiplier: number;
  speedMaxMultiplier: number;
  resumeCountdownSeconds: number;
  firstCompletionBonusScore: number;
  scenes: StorySceneConfig[];
  sequence: StorySequenceStepConfig[];
  epochs: StoryEpochConfig[];
  /** Explicit, player-confirmed handoff from the story into the challenge. */
  modeHandoff: StoryModeHandoffConfig;
  /** Finale contract tying the physical counter to packages and combinations. */
  millionThreshold: MillionThresholdConfig;
}

export interface ChallengeConfig {
  mode: "challenge";
  speedStartMultiplier: number;
  speedMaxMultiplier: number;
  logisticWaveMinSeconds: number;
  logisticWaveMaxSeconds: number;
  warrantyOneUse: true;
}

export interface AudioConfig {
  enabled: boolean;
}

export type AssetBundleId =
  | "common"
  | "prologue"
  | "epoch_1"
  | "epoch_2"
  | "epoch_3"
  | "epoch_4"
  | "epoch_5"
  | "finale"
  | "challenge";

export type AssetResourceType = "procedural" | "image" | "audio";

/** A preloadable unit. Procedural entries declare renderer/audio resources generated in code. */
export interface AssetResourceConfig {
  id: string;
  type: AssetResourceType;
  source: string;
  critical: boolean;
}

export interface AssetBundleConfig {
  id: AssetBundleId;
  resources: AssetResourceConfig[];
}

export interface AssetsConfig {
  bundles: AssetBundleConfig[];
}

export interface NarrativeConfig {
  epochs: EpochConfig[];
  facts: NarrativeFact[];
}

export interface DiscountCodeConfig {
  code: string;
  label: string;
}

export interface RunnerConfig {
  schemaVersion: 4;
  enabled: boolean;
  gameVersion: string;
  claim: string;
  modulePath?: string;
  stylePath?: string;
  triggerSelector?: string;
  cta: {
    id: string;
    label: string;
    campaignLabel: string;
    challengeLabel: string;
    path: string;
  };
  facts: RunnerFact[];
  story: StoryConfig;
  challenge: ChallengeConfig;
  audio: AudioConfig;
  assets: AssetsConfig;
  /** Production page/UI copy; code-level strings are only fail-safe defaults. */
  ui?: Readonly<Record<string, string>>;
  /** Enables the 5-epoch narrative campaign instead of the legacy single run. */
  narrativeMode?: boolean;
  /** Optional promo code surfaced on the final screen; button hides when omitted. */
  discountCode?: DiscountCodeConfig;
  /** Narrative campaign definition (epochs + triggered facts). */
  narrative?: NarrativeConfig;
  /** Absolute URL of the records board API. Defaults to relative "/api/records"
   *  (same-origin Worker route). Set this when the API lives on another origin. */
  recordsApi?: string;
}

export interface RunnerOpenOptions {
  sourceLocation: RunnerSource;
  returnFocusTo?: HTMLElement | null;
  /** performance.now() captured when the trigger was activated. */
  requestedAt?: number;
  /** Internal loader flag preventing duplicate game_opened events. */
  openedTracked?: boolean;
}

export interface RunnerPublicApi {
  open(options: RunnerOpenOptions): void;
  close(reason?: string): void;
  destroy(): void;
}

export interface DataLayerEvent {
  event: string;
  [key: string]: string | number | boolean | undefined | (() => void);
}

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
    AMSOMillionRunner?: RunnerPublicApi;
    google_tag_manager?: Record<string, unknown>;
  }
}
