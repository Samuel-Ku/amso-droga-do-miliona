import { collidesWithObstacle, collectsPackage } from "./collision";
import { BossDirector } from "./boss";
import { BOSS, CANVAS_LIMITS, GAMEPLAY, GROUND_Y, WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import type {
  ControlMethod,
  GameResult,
  GameMode,
  GameSnapshot,
  GameState,
  RunnerGameApi,
  RunnerGameCallbacks,
  RunnerGameOptions
} from "./contracts";
import {
  getAuthoredStoryDifficulty,
  getChallengeDifficulty,
  getDifficulty,
  getStoryDifficulty
} from "./difficulty";
import { createRunnerModel, queueJump, stepRunnerPhysics } from "./physics";
import { mixSeed, normalizeSeed, SeededRandom } from "./random";
import { WarehouseRenderer } from "./renderer";
import {
  calculateScore,
  distanceInMeters,
  resolvePackageCollection,
  resolveWaveCombo
} from "./scoring";
import {
  activateTutorialPackages,
  activateWave,
  authoredRewardSpawnX,
  createAuthoredRewardWave,
  createBossAttackWave,
  createObstaclePool,
  createPackagePool,
  FairSpawner,
  type SpawnWave
} from "./spawning";
import {
  asObstacleKind,
  epochSpeed,
  FactEngine
} from "./narrative";
import type { NarrativeConfig, PackageType, PowerUpKind, StoryConfig } from "../shared/types";
import type { ObstacleKind, ObstacleModel, PackageModel, RenderScene, RunnerModel } from "./types";
import { calculateCanvasBuffer } from "./viewport";
import { resolveCollision, START_PROTECTION_SECONDS } from "./mode-rules";
import {
  ActivePowerUps,
  ChallengePowerUpSchedule
} from "./power-ups";
import {
  StoryTimeline,
  type StoryTimelineSnapshot
} from "./story-timeline";
import { LogisticWaveDirector } from "./logistic-wave";
import {
  StoryClimaxDirector,
  type StoryPositiveMotif
} from "./story-climax";
import { StoryObstacleTransformer } from "./story-effects";
import {
  STORY_CREATIVE_EQUIPMENT_IDS,
  StoryObjectiveDirector,
  type StoryObjectiveUpdate
} from "./story-objectives";
import {
  CAMPAIGN_WORLD_IDS,
  ChallengeWorldDirector,
  resolvePlaySegmentVisual,
  sceneVisualState,
  type CampaignWorldId
} from "../visuals/scene-manifest";
import { backgroundTravelPixels } from "../visuals/background-parallax";
import { MilestoneCelebrationDirector } from "./milestone-celebration";
import {
  AuthoredWaveDirector,
  STORY_WAVE_COLLECTION_RATIO,
  storyMicrolevelForSegment,
  type AuthoredWaveDefinition
} from "./authored-wave";
import {
  challengeAtomAt,
  challengePatternTuning,
  challengePressureAt
} from "./challenge-pressure";
import { AdaptiveDecorationQuality } from "./adaptive-decoration-quality";
import {
  SHIELD_APPEAR_SECONDS,
  SHIELD_BREAK_SECONDS
} from "./courier-presentation";

const CUTSCENE_SECONDS = 2.6;
export const STORY_FINALE_CELEBRATION_SECONDS = 3.5;
export const STORY_FINALE_REWARD_RUN_SECONDS = 4;
export const STORY_POWER_UP_DEMO_SECONDS = 2.8;
const OFFSCREEN_SPAWN_X = WORLD_WIDTH + GAMEPLAY.spawnPadding;
const STORY_CLIMAX_SPAWN_X = OFFSCREEN_SPAWN_X;
const STORY_ORDER_TYPES: readonly PackageType[] = ["pc", "notebook", "lcd", "telefon"];
const FINALE_POWER_UPS: readonly PowerUpKind[] = [
  "podwojny_wynik",
  "gwarancja_48"
];
const STORY_CLIMAX_SEGMENTS = new Map<string, number>([
  ["epoch_1.order_backlog", 0],
  ["epoch_2.quality_trial", 1],
  ["epoch_4.order_peak_final", 3]
]);

function runtimeSeed(): number {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const value = new Uint32Array(1);
    cryptoApi.getRandomValues(value);
    return value[0] ?? 0x6d2b79f5;
  }
  return normalizeSeed(Date.now() ^ Math.floor(Math.random() * 0xffffffff));
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export class RunnerGame implements RunnerGameApi {
  private _state: GameState = "ready";
  private readonly context: CanvasRenderingContext2D;
  private readonly renderer = new WarehouseRenderer();
  private readonly callbacks: RunnerGameCallbacks;
  private readonly document: Document;
  private readonly view: Window | null;
  private readonly baseSeed: number;
  private readonly obstacles: ObstacleModel[] = createObstaclePool();
  private readonly packages: PackageModel[] = createPackagePool();
  private readonly bossDirector = new BossDirector();
  private readonly storyClimaxDirector = new StoryClimaxDirector();
  private readonly storyObstacleTransformer = new StoryObstacleTransformer();
  private readonly milestoneCelebrationDirector = new MilestoneCelebrationDirector();
  private readonly decorationQuality = new AdaptiveDecorationQuality();
  private storyObjectiveDirector = new StoryObjectiveDirector();
  private authoredWaveDirector: AuthoredWaveDirector | null = null;
  private authoredActionIndex = 0;
  private authoredActionSpawned = false;
  private authoredBreathRemaining = 0;
  private finaleRewardRunRemaining = 0;
  private authoredFinaleCelebrated = false;
  private challengePatternIndex = 0;
  private challengeSpawnCooldown = 0;
  private challengeOnboardingPending = false;
  private readonly challengeWaves = new Map<string, { available: number; collected: number }>();
  private challengeSequenceRemaining = 0;
  private challengeSequencePackagesAvailable = 0;
  private challengeSequencePackagesCollected = 0;
  private challengeSequenceBreathSeconds = 0;
  private readonly storyClimaxesCompleted = new Set<number>();
  private runner: RunnerModel = createRunnerModel();
  private spawner!: FairSpawner;
  private runIndex = 0;
  private elapsedSeconds = 0;
  private visualElapsedSeconds = 0;
  private challengeElapsedSeconds = 0;
  private distancePixels = 0;
  private visualDistancePixels = 0;
  private packagesCollected = 0;
  private ordersCollected = 0;
  private bonusScore = 0;
  private challengeStartScore = 0;
  private challengeStartOrders = 0;
  private personalRecordCelebrated = false;
  private recordEmphasisRemaining = 0;
  private bossesDefeated = 0;
  private speed = getDifficulty(0).speed;
  private difficultyLevel = 1;
  private controlMethod: ControlMethod = "keyboard";
  private mode: GameMode;
  private readonly story: StoryConfig | null;
  private readonly challenge: RunnerGameOptions["challenge"];
  private readonly bestChallengeOrdersAtStart: number;
  private readonly awardStoryCompletionBonus: boolean;
  private readonly powerUpCopy: NonNullable<RunnerGameOptions["powerUpCopy"]>;
  private narrative: NarrativeConfig | null;
  private storyTimeline: StoryTimeline | null = null;
  private lastStorySignal = "";
  private storyCompleteEmitted = false;
  private finaleCelebrationRemaining = 0;
  private lastTrustCorridor = false;
  private creativeEquipmentCursor = 0;
  private storyOrderPatternIndex = 0;
  private storyObjectivePatternIndex = 0;
  private readonly logisticWaveDirector: LogisticWaveDirector;
  private readonly challengeWorldDirector = new ChallengeWorldDirector("direct");
  private currentEpoch = 0;
  private epochElapsed = 0;
  private cutsceneRemaining = 0;
  private pendingEpoch = 0;
  private cutscene: { title: string; subtitle: string } | null = null;
  private epochHit = false;
  private bossStarted = false;
  private furthestEpochReached = 0;
  private factsUnlockedCount = 0;
  private readonly packageTypeCounts: Record<PackageType, number> = {
    notebook: 0,
    telefon: 0,
    pc: 0,
    lcd: 0
  };
  private readonly equipmentTypeCounts: Record<PackageType, number> = {
    notebook: 0,
    telefon: 0,
    pc: 0,
    lcd: 0
  };
  private totalWeightKg = 0;
  private readonly activePowerUps = new ActivePowerUps();
  private readonly challengePowerUps = new ChallengePowerUpSchedule();
  private readonly seenPowerUpDemos = new Set<PowerUpKind>();
  private powerUpDemoRemaining = 0;
  private pendingPowerUpReward: PowerUpKind | null = null;
  private collisions = 0;
  private epochCollisions = 0;
  private recoverySeconds = 0;
  private startProtectionSeconds = 0;
  private warrantyBreakSeconds = 0;
  private shieldActivationSeconds = 0;
  private combo = 1;
  private bestCombo = 1;
  private warrantySaves = 0;
  private factEngine: FactEngine | null = null;
  private crouchHeld = false;
  private crouchInputHeld = false;
  private accumulator = 0;
  private lastFrameTime: number | null = null;
  private performanceFrameCount = 0;
  private performanceSampleSeconds = 0;
  private estimatedFrameRate = 0;
  private droppedFrames = 0;
  private lastCollisionType: string | null = null;
  private nextSnapshotAt = 0;
  private frameId: number | null = null;
  private frameUsesTimeout = false;
  private impact = false;
  private impactSeconds = 0;
  private reducedMotion: boolean;
  private bufferWidth = 1;
  private bufferHeight = 1;
  private resizeObserver: ResizeObserver | null = null;
  private motionQuery: MediaQueryList | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    callbacks: RunnerGameCallbacks = {},
    options: RunnerGameOptions = {}
  ) {
    const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) throw new Error("RunnerGame requires a Canvas 2D context.");

    this.context = context;
    this.callbacks = callbacks;
    this.document = canvas.ownerDocument;
    this.view = this.document.defaultView;
    this.baseSeed = normalizeSeed(options.seed ?? runtimeSeed());
    this.mode = options.mode ?? (options.story || options.narrative ? "story" : "challenge");
    this.story = this.mode === "story" ? options.story ?? null : null;
    this.challenge = options.challenge ?? null;
    this.bestChallengeOrdersAtStart = Math.max(
      0,
      Math.floor(options.bestChallengeOrdersAtStart ?? 0)
    );
    this.awardStoryCompletionBonus = options.awardStoryCompletionBonus ?? true;
    this.powerUpCopy = options.powerUpCopy ?? {};
    this.logisticWaveDirector = new LogisticWaveDirector(
      this.challenge?.logisticWaveMinSeconds ?? 45,
      this.challenge?.logisticWaveMaxSeconds ?? 60
    );
    this.narrative = this.mode === "story"
      ? this.story
        ? { epochs: this.story.epochs, facts: options.narrative?.facts ?? [] }
        : options.narrative ?? null
      : null;

    if (options.reducedMotion === undefined) {
      this.motionQuery = this.view?.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
      this.reducedMotion = this.motionQuery?.matches ?? false;
      this.motionQuery?.addEventListener?.("change", this.handleMotionPreferenceChange);
    } else {
      this.reducedMotion = options.reducedMotion;
    }

    this.resetModels();
    this.installLifecycleListeners();
    this.resizeCanvas();
    this.render();
  }

  get state(): GameState {
    return this._state;
  }

  start(controlMethod: ControlMethod = "keyboard"): void {
    if (this._state === "destroyed" || this._state === "running") return;
    if (this._state === "paused") {
      this.controlMethod = controlMethod;
      this.resume();
      return;
    }
    if (this._state === "game_over") this.reset();

    this.controlMethod = controlMethod;
    this.accumulator = 0;
    this.lastFrameTime = null;
    this.performanceFrameCount = 0;
    this.performanceSampleSeconds = 0;
    this.estimatedFrameRate = 0;
    this.droppedFrames = 0;
    this.decorationQuality.reset();
    this.lastCollisionType = null;
    this.impact = false;
    this.impactSeconds = 0;
    this.crouchHeld = false;
    this.crouchInputHeld = false;
    this.setState("running");
    this.emitStorySignals(true);
    this.emitSnapshot();
    this.render();
    this.scheduleFrame();
  }

  continueStoryScene(expectedSceneId: string): boolean {
    if (this._state !== "running" || this.mode !== "story" || !this.storyTimeline) return false;
    const previous = this.storyTimeline.snapshot;
    if (!this.storyTimeline.continueScene(expectedSceneId)) return false;
    const next = this.storyTimeline.snapshot;
    this.syncStorySection(previous, next);
    this.clearInteractiveWorld();
    this.emitStorySignals(true);
    this.emitSnapshot();
    this.render();
    return true;
  }

  jump(controlMethod: ControlMethod): void {
    if (this._state === "destroyed" || this._state === "paused" || this._state === "game_over") {
      return;
    }
    if (this._state === "ready") {
      this.start(controlMethod);
      return;
    }
    if (this._state !== "running") return;
    if (this.storyTimeline?.snapshot.trustCorridor) return;
    this.controlMethod = controlMethod;
    this.crouchHeld = false;
    this.crouchInputHeld = false;
    this.runner.crouching = false;
    queueJump(this.runner);
  }

  crouch(active: boolean, controlMethod: ControlMethod): void {
    if (this._state === "destroyed" || this._state === "game_over") {
      return;
    }
    if (this._state === "ready") this.start(controlMethod);
    if (this._state !== "running") return;
    if (this.storyTimeline?.snapshot.trustCorridor) {
      this.crouchHeld = false;
      this.crouchInputHeld = false;
      return;
    }
    this.controlMethod = controlMethod;
    this.crouchInputHeld = active;
    if (active) {
      if (this.runner.grounded) {
        if (!this.runner.crouching) this.runner.crouchElapsedSeconds = 0;
        this.crouchHeld = true;
        this.runner.crouching = true;
      }
    } else {
      this.crouchHeld = false;
      this.runner.crouching = false;
      this.runner.crouchElapsedSeconds = 0;
    }
  }

  pause(): void {
    if (this._state !== "running") return;
    this.cancelFrame();
    this.lastFrameTime = null;
    this.setState("paused");
    this.render();
  }

  resume(): void {
    if (this._state !== "paused") return;
    this.accumulator = 0;
    this.lastFrameTime = null;
    this.setState("running");
    this.render();
    this.scheduleFrame();
  }

  reset(): void {
    if (this._state === "destroyed") return;
    this.cancelFrame();
    this.runIndex += 1;
    this.resetModels();
    this.setState("ready");
    this.emitSnapshot();
    this.render();
  }

  destroy(): void {
    if (this._state === "destroyed") return;
    this.cancelFrame();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.view?.removeEventListener("resize", this.handleResize);
    this.view?.removeEventListener("blur", this.handleWindowBlur);
    this.document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.motionQuery?.removeEventListener?.("change", this.handleMotionPreferenceChange);
    this.motionQuery = null;
    this.setState("destroyed");
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private resetModels(): void {
    this.runner = createRunnerModel();
    for (const obstacle of this.obstacles) obstacle.active = false;
    for (const parcel of this.packages) parcel.active = false;
    if (this.mode === "challenge") activateTutorialPackages(this.packages);

    const random = new SeededRandom(mixSeed(this.baseSeed, this.runIndex));
    this.elapsedSeconds = 0;
    this.visualElapsedSeconds = 0;
    this.resetChallengeRunState();
    this.challengeWorldDirector.reset("direct");
    this.distancePixels = 0;
    this.visualDistancePixels = 0;
    this.packagesCollected = 0;
    this.ordersCollected = 0;
    this.bonusScore = 0;
    this.challengeStartScore = 0;
    this.challengeStartOrders = 0;
    this.personalRecordCelebrated = false;
    this.recordEmphasisRemaining = 0;
    this.bossesDefeated = 0;
    this.bossDirector.reset();
    this.storyClimaxDirector.reset();
    this.storyObstacleTransformer.reset();
    this.milestoneCelebrationDirector.reset();
    this.storyObjectiveDirector = new StoryObjectiveDirector();
    this.authoredWaveDirector = null;
    this.authoredActionIndex = 0;
    this.authoredActionSpawned = false;
    this.authoredBreathRemaining = 0;
    this.finaleRewardRunRemaining = 0;
    this.authoredFinaleCelebrated = false;
    this.powerUpDemoRemaining = 0;
    this.pendingPowerUpReward = null;
    this.storyClimaxesCompleted.clear();
    this.logisticWaveDirector.reset();
    this.bossStarted = false;
    this.crouchHeld = false;
    this.crouchInputHeld = false;
    this.accumulator = 0;
    this.lastFrameTime = null;
    this.performanceFrameCount = 0;
    this.performanceSampleSeconds = 0;
    this.estimatedFrameRate = 0;
    this.droppedFrames = 0;
    this.lastCollisionType = null;
    this.nextSnapshotAt = 0;
    this.impact = false;
    this.impactSeconds = 0;

    this.currentEpoch = 0;
    this.epochElapsed = 0;
    this.cutsceneRemaining = 0;
    this.cutscene = null;
    this.epochHit = false;
    this.furthestEpochReached = 0;
    this.factsUnlockedCount = 0;
    this.totalWeightKg = 0;
    this.collisions = 0;
    this.epochCollisions = 0;
    this.recoverySeconds = 0;
    this.startProtectionSeconds = START_PROTECTION_SECONDS;
    this.warrantyBreakSeconds = 0;
    this.shieldActivationSeconds = SHIELD_APPEAR_SECONDS;
    this.combo = 1;
    this.bestCombo = 1;
    this.warrantySaves = 0;
    this.activePowerUps.clear();
    this.storyTimeline = this.mode === "story" && this.story
      ? new StoryTimeline(this.story)
      : null;
    this.lastStorySignal = "";
    this.storyCompleteEmitted = false;
    this.finaleCelebrationRemaining = 0;
    this.lastTrustCorridor = this.storyTimeline?.snapshot.trustCorridor ?? false;
    this.creativeEquipmentCursor = 0;
    this.storyOrderPatternIndex = 0;
    this.storyObjectivePatternIndex = 0;
    for (const type of Object.keys(this.packageTypeCounts) as PackageType[]) {
      this.packageTypeCounts[type] = 0;
      this.equipmentTypeCounts[type] = 0;
    }
    this.factEngine = this.mode === "story" && this.narrative
      ? new FactEngine(this.narrative.facts)
      : null;

    if (this.mode === "story" && this.narrative && this.narrative.epochs.length > 0) {
      this.currentEpoch = this.storyTimeline?.snapshot.epochIndex ?? 0;
      this.furthestEpochReached = this.currentEpoch;
      const epoch = this.narrative.epochs[this.currentEpoch] ?? this.narrative.epochs[0]!;
      const allowed = epoch.obstaclePool
        .map((kind) => asObstacleKind(kind))
        .filter((kind): kind is ObstacleKind => kind !== null);
      this.spawner = new FairSpawner(
        random,
        this.story
          ? getStoryDifficulty(0, this.story.activeDurationSeconds, this.story).speed
          : epochSpeed(epoch, 0),
        allowed
      );
      this.speed = this.story
        ? getStoryDifficulty(0, this.story.activeDurationSeconds, this.story).speed
        : epochSpeed(epoch, 0);
      if (this.story === null) {
        this.storyClimaxDirector.enterEpoch(
          this.currentEpoch,
          epoch.challengeName ?? epoch.name,
          epoch.durationSeconds
        );
      }
      const storyPhase = this.storyTimeline?.snapshot.phase;
      const completedBefore = storyPhase === "finale" || storyPhase === "completed"
        ? 4
        : storyPhase === "epoch"
          ? Math.min(4, this.currentEpoch)
          : 0;
      for (let index = 0; index < completedBefore; index += 1) {
        this.storyClimaxesCompleted.add(index);
      }
      this.difficultyLevel = 1;
      this.pendingEpoch = this.currentEpoch;
      if (this.storyTimeline === null) {
        this.cutscene = { title: epoch.name, subtitle: epoch.year };
        this.cutsceneRemaining = CUTSCENE_SECONDS;
      }
    } else {
      const initialDifficulty = this.mode === "challenge" && this.challenge
        ? getChallengeDifficulty(0, this.challenge)
        : getDifficulty(0);
      this.spawner = new FairSpawner(random, initialDifficulty.speed);
      this.speed = initialDifficulty.speed;
      this.difficultyLevel = initialDifficulty.level;
    }
  }

  private readonly handleFrame = (timestamp: number): void => {
    this.frameId = null;
    if (this._state !== "running") return;

    if (this.lastFrameTime === null) {
      this.lastFrameTime = timestamp;
    } else {
      const rawDeltaSeconds = Math.max(0, (timestamp - this.lastFrameTime) / 1_000);
      this.observeFramePerformance(rawDeltaSeconds);
      const deltaSeconds = Math.min(
        GAMEPLAY.maxFrameSeconds,
        rawDeltaSeconds
      );
      this.lastFrameTime = timestamp;
      this.accumulator += deltaSeconds;

      let steps = 0;
      while (
        this.accumulator >= GAMEPLAY.fixedStepSeconds &&
        steps < GAMEPLAY.maxFixedStepsPerFrame &&
        this._state === "running"
      ) {
        this.update(GAMEPLAY.fixedStepSeconds);
        this.accumulator -= GAMEPLAY.fixedStepSeconds;
        steps += 1;
      }
      if (steps === GAMEPLAY.maxFixedStepsPerFrame) this.accumulator = 0;
    }

    this.render();
    if (this._state === "running") this.scheduleFrame();
  };

  private observeFramePerformance(deltaSeconds: number): void {
    if (deltaSeconds <= 0) return;
    this.decorationQuality.observe(deltaSeconds);
    this.performanceFrameCount += 1;
    this.performanceSampleSeconds += deltaSeconds;
    const frameBudgetSeconds = 1 / 60;
    if (deltaSeconds > frameBudgetSeconds * 1.5) {
      this.droppedFrames += Math.max(1, Math.round(deltaSeconds / frameBudgetSeconds) - 1);
    }
    if (this.performanceSampleSeconds < 1) return;
    this.estimatedFrameRate = this.performanceFrameCount / this.performanceSampleSeconds;
    this.performanceFrameCount = 0;
    this.performanceSampleSeconds = 0;
  }

  private update(deltaSeconds: number): void {
    let storyCompletedThisStep = false;
    let activeDeltaSeconds = deltaSeconds;
    if (this.storyTimeline !== null) {
      const previousStory = this.storyTimeline.snapshot;
      const presentingMillion = this.finaleCelebrationRemaining > 0;
      const presentingPowerUp = this.powerUpDemoRemaining > 0;
      const millionTransitionActive = presentingMillion || this.finaleRewardRunRemaining > 0;
      const waitingForFinaleGoals = previousStory.playSegment?.id === "epoch_5.million_threshold" &&
        ((this.authoredWaveDirector
          ? !this.authoredWaveDirector.completed
          : !this.storyObjectiveDirector.snapshot.epoch5.millionThreshold.completed) ||
          millionTransitionActive);
      const waitingForTutorialActions = previousStory.playSegment?.id === "epoch_1.training" &&
        !this.storyObjectiveDirector.snapshot.epoch1.training.completed;
      const waitingForQualitySeries = previousStory.playSegment?.id === "epoch_2.quality_series" &&
        !this.storyObjectiveDirector.snapshot.epoch2.completed;
      const matchingSegmentId = previousStory.playSegment?.id;
      const waitingForBacklog = matchingSegmentId === "epoch_1.order_backlog" &&
        !this.storyObjectiveDirector.snapshot.epoch1.orderBacklog.completed;
      const waitingForMatching =
        (matchingSegmentId === "epoch_3.matching_creative" &&
          !this.storyObjectiveDirector.snapshot.epoch3.creative.completed) ||
        (matchingSegmentId === "epoch_3.matching_growth" &&
          !this.storyObjectiveDirector.snapshot.epoch3.growth.completed) ||
        (matchingSegmentId === "epoch_3.matching_trust" &&
          !this.storyObjectiveDirector.snapshot.epoch3.trust.completed);
      const waitingForGameplayResolution = presentingPowerUp || (this.authoredWaveDirector !== null
        ? !this.authoredWaveDirector.completed || millionTransitionActive
        : waitingForFinaleGoals || waitingForTutorialActions || waitingForQualitySeries ||
          waitingForBacklog || waitingForMatching);
      const nextStory = this.storyTimeline.advance(deltaSeconds, {
        allowPlayCompletion: !waitingForGameplayResolution
      });
      const creditedActiveDelta = Math.max(
        0,
        nextStory.totalActiveElapsedSeconds - previousStory.totalActiveElapsedSeconds
      );
      activeDeltaSeconds = presentingMillion
        ? 0
        : waitingForGameplayResolution &&
          nextStory.sectionElapsedSeconds >= nextStory.sectionDurationSeconds
        ? deltaSeconds
        : creditedActiveDelta;
      const previousSegment = previousStory.playSegment;
      const nextSegment = nextStory.playSegment;
      if (previousSegment && activeDeltaSeconds > 0) {
        const stayedInSegment = previousSegment.id === nextSegment?.id;
        const creditedSeconds = stayedInSegment
          ? nextStory.sectionElapsedSeconds - previousStory.sectionElapsedSeconds
          : previousSegment.durationSeconds - previousStory.sectionElapsedSeconds;
        this.storyObjectiveDirector.enterSegment(
          previousSegment.id,
          previousSegment.durationSeconds
        );
        this.handleStoryObjectiveUpdate(
          this.storyObjectiveDirector.recordElapsed(Math.max(0, creditedSeconds))
        );
      }
      if (nextSegment && nextSegment.id !== previousSegment?.id &&
          nextStory.sectionElapsedSeconds > 0) {
        this.storyObjectiveDirector.enterSegment(nextSegment.id, nextSegment.durationSeconds);
        this.handleStoryObjectiveUpdate(
          this.storyObjectiveDirector.recordElapsed(nextStory.sectionElapsedSeconds)
        );
      }
      this.syncStorySection(previousStory, nextStory);
      this.authoredWaveDirector?.advance(activeDeltaSeconds);
      this.beginFinaleRewardRunIfReady();
      this.storyObjectiveDirector.enterSegment(
        nextStory.playSegment?.id ?? null,
        nextStory.playSegment?.durationSeconds
      );
      this.emitStorySignals();
      storyCompletedThisStep = nextStory.completed;
    }

    if (this.recordEmphasisRemaining > 0) {
      this.recordEmphasisRemaining = Math.max(0, this.recordEmphasisRemaining - deltaSeconds);
      activeDeltaSeconds *= 0.72;
    }

    if (this.storyTimeline === null && this.cutsceneRemaining > 0) {
      this.cutsceneRemaining -= deltaSeconds;
      if (this.cutsceneRemaining <= 0) {
        this.cutsceneRemaining = 0;
        this.enterEpoch(this.pendingEpoch);
      }
      return;
    }

    this.visualElapsedSeconds += deltaSeconds;
    if (this.powerUpDemoRemaining > 0) {
      this.powerUpDemoRemaining = Math.max(0, this.powerUpDemoRemaining - deltaSeconds);
    }
    this.elapsedSeconds += activeDeltaSeconds;
    const milestoneSafe = !this.obstacles.some(({ active, x }) =>
      active && x >= this.runner.x
    );
    this.milestoneCelebrationDirector.advance(activeDeltaSeconds, milestoneSafe);
    if (this.mode === "challenge") this.challengeElapsedSeconds += activeDeltaSeconds;
    this.recoverySeconds = Math.max(0, this.recoverySeconds - activeDeltaSeconds);
    this.startProtectionSeconds = Math.max(0, this.startProtectionSeconds - activeDeltaSeconds);
    this.warrantyBreakSeconds = Math.max(0, this.warrantyBreakSeconds - activeDeltaSeconds);
    this.shieldActivationSeconds = Math.max(
      0,
      this.shieldActivationSeconds - activeDeltaSeconds
    );
    this.impactSeconds = Math.max(0, this.impactSeconds - activeDeltaSeconds);
    this.impact = this.impactSeconds > 0;
    this.storyObstacleTransformer.advance(deltaSeconds);
    if (this.finaleRewardRunRemaining > 0) {
      this.finaleRewardRunRemaining = Math.max(
        0,
        this.finaleRewardRunRemaining - activeDeltaSeconds
      );
      if (this.finaleRewardRunRemaining === 0 && this.authoredFinaleCelebrated) {
        this.finaleCelebrationRemaining = STORY_FINALE_CELEBRATION_SECONDS;
        this.clearInteractiveWorld();
      }
    }
    if (this.finaleCelebrationRemaining > 0) {
      this.finaleCelebrationRemaining = Math.max(
        0,
        this.finaleCelebrationRemaining - deltaSeconds
      );
      this.crouchHeld = false;
      this.runner.crouching = false;
      this.clearInteractiveWorld();
      this.emitSnapshot();
      return;
    }
    if (storyCompletedThisStep) {
      this.completeStoryAndEnterChallenge();
      return;
    }

    const trustCorridor = this.storyTimeline?.snapshot.trustCorridor ?? false;
    const enteredTrustCorridor = trustCorridor && !this.lastTrustCorridor;
    if (enteredTrustCorridor) {
      const activeObstacles = this.obstacles.filter(({ active }) => active);
      if (activeObstacles.length > 0) {
        this.storyObstacleTransformer.begin(
          activeObstacles,
          this.positiveMotifForEpoch(this.currentEpoch)
        );
      }
    }
    this.lastTrustCorridor = trustCorridor;
    if (trustCorridor) {
      this.crouchHeld = false;
      this.crouchInputHeld = false;
      this.runner.crouching = false;
      this.clearInteractiveWorld();
    }

    let difficulty = getDifficulty(this.elapsedSeconds);
    if (this.mode === "story" && this.storyTimeline && this.story) {
      const storySnapshot = this.storyTimeline.snapshot;
      this.epochElapsed = this.storyEpochElapsed(
        storySnapshot.totalActiveElapsedSeconds,
        this.currentEpoch
      );
      const authored = this.authoredWaveDirector?.definition;
      difficulty = authored
        ? getAuthoredStoryDifficulty(
            storySnapshot.sectionElapsedSeconds,
            storySnapshot.sectionDurationSeconds,
            authored.speedStartMultiplier,
            authored.speedEndMultiplier
          )
        : getStoryDifficulty(
            storySnapshot.totalActiveElapsedSeconds,
            this.story.activeDurationSeconds,
            this.story
          );
      this.speed = difficulty.speed;
      this.difficultyLevel = difficulty.level;
    } else if (this.mode === "story" && this.narrative && this.narrative.epochs.length > 0) {
      const epoch = this.narrative.epochs[this.currentEpoch] ?? this.narrative.epochs[0]!;
      this.epochElapsed += activeDeltaSeconds;
      this.speed = epochSpeed(epoch, this.epochElapsed);
      this.difficultyLevel = 1 + Math.floor(this.epochElapsed / 12);
      difficulty = this.difficultyFromSpeed(this.speed);
    } else {
      difficulty = this.mode === "challenge" && this.challenge
        ? getChallengeDifficulty(this.challengeElapsedSeconds, this.challenge)
        : getDifficulty(this.elapsedSeconds);
      this.speed = difficulty.speed;
      this.difficultyLevel = difficulty.level;
    }

    const worldScale = this.storyTimeline?.snapshot.worldSpeedScale ?? 1;
    const visualTravelledPixels = this.speed * (
      activeDeltaSeconds > 0 ? activeDeltaSeconds : deltaSeconds * worldScale
    );
    this.visualDistancePixels += visualTravelledPixels;
    const travelledPixels = this.speed * activeDeltaSeconds;
    this.distancePixels += travelledPixels;

    if (trustCorridor || activeDeltaSeconds <= 0) {
      if (enteredTrustCorridor) this.emitSnapshot();
      return;
    }

    stepRunnerPhysics(this.runner, activeDeltaSeconds);
    if (this.runner.grounded && this.crouchInputHeld) {
      this.crouchHeld = true;
    }
    if (!this.crouchInputHeld) this.crouchHeld = false;
    this.runner.crouching = this.crouchHeld && this.runner.grounded;
    this.runner.crouchElapsedSeconds = this.runner.crouching
      ? this.runner.crouchElapsedSeconds + activeDeltaSeconds
      : 0;
    this.tickPowerUps(activeDeltaSeconds);
    this.authoredBreathRemaining = Math.max(0, this.authoredBreathRemaining - activeDeltaSeconds);
    this.challengeSpawnCooldown = Math.max(0, this.challengeSpawnCooldown - activeDeltaSeconds);

    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;
      obstacle.x -= travelledPixels;
      if (!obstacle.objectiveCredited && obstacle.x + obstacle.width < this.runner.x) {
        obstacle.objectiveCredited = true;
        this.handleStoryObjectiveUpdate(
          this.storyObjectiveDirector.recordSuccessfulPattern(
            obstacle.kind === "overhead" ? "slide" : "jump"
          )
        );
        if (obstacle.source === "boss") {
          this.handleStoryObjectiveUpdate(
            this.storyObjectiveDirector.recordMillionCombination()
          );
        }
      }
      if (obstacle.x + obstacle.width < -40) obstacle.active = false;
    }
    for (const parcel of this.packages) {
      if (!parcel.active) continue;
      parcel.x -= travelledPixels;
      if (parcel.x + parcel.size < -40) parcel.active = false;
    }
    if (this.challengeOnboardingPending && !this.packages.some(({ active, authoredWaveId }) =>
      active && authoredWaveId === "challenge-onboarding"
    )) {
      this.challengeOnboardingPending = false;
      this.challengeSpawnCooldown = Math.max(this.challengeSpawnCooldown, 1.35);
    }

    this.advanceAuthoredWaveIfClear();
    this.resolveChallengeWaveIfClear();

    const bossHazardActive = this.obstacles.some(
      (obstacle) =>
        obstacle.active &&
        obstacle.source === "boss" &&
        obstacle.x + obstacle.width >= this.runner.x
    );
    const climaxHazardActive = this.obstacles.some(
      (obstacle) =>
        obstacle.active &&
        obstacle.source === "story-climax" &&
        obstacle.x + obstacle.width >= this.runner.x
    );
    const routeClear = !this.obstacles.some(
      (obstacle) => obstacle.active && obstacle.x + obstacle.width >= this.runner.x
    );

    const epoch = this.narrative?.epochs[this.currentEpoch];
    const activeStorySegment = this.storyTimeline?.snapshot.playSegment;
    const millionThresholdActive = activeStorySegment?.id === "epoch_5.million_threshold";
    const storyOrdersActive = activeStorySegment?.id === "epoch_4.order_peak";
    const scriptedObjectiveActive = activeStorySegment?.id === "epoch_1.training" ||
      activeStorySegment?.id === "epoch_2.quality_series";
    const authoredProgramActive = this.authoredWaveDirector !== null;
    const climaxCommand = activeStorySegment &&
        STORY_CLIMAX_SEGMENTS.has(activeStorySegment.id) &&
        this.currentEpoch < 4
      && !authoredProgramActive
      ? this.storyClimaxDirector.advance(
          activeDeltaSeconds,
          this.storyTimeline?.snapshot.sectionElapsedSeconds ?? 0,
          trustCorridor,
          routeClear,
          climaxHazardActive
        )
      : { type: "none" } as const;

    if (climaxCommand.type === "attack") {
      activateWave(
        {
          ...createBossAttackWave(climaxCommand.kind, STORY_CLIMAX_SPAWN_X),
          source: "story-climax"
        },
        this.obstacles,
        this.packages
      );
    } else if (climaxCommand.type === "complete") {
      this.storyClimaxesCompleted.add(this.currentEpoch);
      const climaxObstacles = this.obstacles.filter(
        ({ active, source }) => active && source === "story-climax"
      );
      if (climaxObstacles.length > 0) {
        this.storyObstacleTransformer.begin(
          climaxObstacles,
          this.positiveMotifForEpoch(this.currentEpoch)
        );
      }
      for (const obstacle of climaxObstacles) obstacle.active = false;
    }

    if (storyOrdersActive) {
      this.spawnStoryOrderPattern(routeClear);
    }

    if (scriptedObjectiveActive && activeStorySegment) {
      this.spawnScriptedObjectivePattern(routeClear, activeStorySegment.id);
    }


    if (this.pendingPowerUpReward && routeClear && this.recoverySeconds <= 0 &&
        this.milestoneCelebrationDirector.snapshot === null &&
        !this.hasPendingPowerUpParcel()) {
      this.spawnPendingPowerUpReward();
    } else if (authoredProgramActive && !this.pendingPowerUpReward && routeClear &&
        this.recoverySeconds <= 0 &&
        this.authoredBreathRemaining <= 0 && !this.hasAuthoredRuntimeObjects()) {
      this.spawnCurrentAuthoredAction();
    }

    const legacyBossReady = this.storyTimeline === null && epoch !== undefined &&
      this.epochElapsed >= epoch.durationSeconds * 0.55;
    const timelineBossReady = false;
    if (this.mode === "story" && epoch?.bossClimax && !this.bossStarted &&
        (legacyBossReady || timelineBossReady)) {
      this.bossDirector.forceEncounter();
      this.bossStarted = true;
    }

    const runBoss = this.mode === "story" && (this.storyTimeline === null
      ? (!this.narrative || epoch?.bossClimax === true)
      : false);
    const bossCanWarnInCorridor = this.storyTimeline !== null &&
      (this.bossDirector.model.phase === "pending" || this.bossDirector.model.phase === "warning");
    const bossCommand = runBoss && (!trustCorridor || bossCanWarnInCorridor) &&
        this.recoverySeconds <= 0
      ? this.bossDirector.advance(activeDeltaSeconds, this.elapsedSeconds, routeClear, bossHazardActive)
      : { type: "none" } as const;

    if (this.mode === "challenge") {
      const visualRouteClear = routeClear && this.bossDirector.model.phase === "inactive";
      this.challengeWorldDirector.advance(activeDeltaSeconds, visualRouteClear);
      const activeChallengeObstacles = this.obstacles.filter(({ active, authoredWaveId }) =>
        active && authoredWaveId?.startsWith("challenge-")
      ).length;
      const startingSequence = this.challengeSequenceRemaining === 0 &&
        this.challengeWaves.size === 0 && routeClear && !this.challengeOnboardingPending;
      const continuingSequence = this.challengeSequenceRemaining > 0 &&
        activeChallengeObstacles < 3;
      if (this.recoverySeconds <= 0 && this.challengeSpawnCooldown <= 0 &&
          (startingSequence || continuingSequence)) {
        this.spawnChallengePattern();
      }
    }

    if (bossCommand.type === "attack") {
      // Survived combinations, unlike launched attempts, stay stable across a retry.
      const attackIndex = Math.max(0, this.bossDirector.model.attacksSurvived);
      const finalePowerUp = FINALE_POWER_UPS[attackIndex];
      const finaleRewards = [{ kind: finalePowerUp ?? "standard" } as const];
      const authoredBossWave = millionThresholdActive
        ? createAuthoredRewardWave({
            action: bossCommand.kind === "overhead" ? "slide" : "jump",
            spawnX: authoredRewardSpawnX(
              this.speed,
              WORLD_WIDTH + GAMEPLAY.spawnPadding
            ),
            speed: this.speed,
            patternIndex: attackIndex,
            source: "boss",
            rewards: finaleRewards
          })
        : null;
      activateWave(
        authoredBossWave ?? createBossAttackWave(bossCommand.kind, OFFSCREEN_SPAWN_X),
        this.obstacles,
        this.packages
      );
    } else if (bossCommand.type === "complete") {
      this.completeBossEncounter();
      if (this.storyTimeline === null && this.narrative && epoch?.bossClimax) {
        this.emitUnlockedFacts();
        this.finishRun("boss", "victory", this.currentEpoch);
        return;
      }
    }

    const finaleNeedsPackages = millionThresholdActive && !authoredProgramActive && this.bossesDefeated > 0 &&
      this.storyObjectiveDirector.snapshot.epoch5.millionThreshold.ordersCollected <
        this.storyObjectiveDirector.snapshot.epoch5.millionThreshold.orderTarget;
    if (finaleNeedsPackages && routeClear && !this.bossDirector.blocksRegularSpawns) {
      this.spawnScriptedObjectivePattern(true, "epoch_5.million_threshold");
    }

    if (!trustCorridor && this.recoverySeconds <= 0 &&
        !this.bossDirector.blocksRegularSpawns &&
        !this.logisticWaveDirector.blocksRegularSpawns &&
        !this.storyClimaxDirector.blocksRegularSpawns &&
        !this.hasAuthoredRewardPattern() &&
        !storyOrdersActive &&
        !scriptedObjectiveActive &&
        !authoredProgramActive &&
        !millionThresholdActive &&
        this.mode !== "challenge") {
      const wave = this.spawner.advance(
        travelledPixels,
        this.speed,
        difficulty,
        WORLD_WIDTH + GAMEPLAY.spawnPadding
      );
      if (wave) {
        activateWave(
          this.prepareStoryWave(wave, activeStorySegment?.id ?? null),
          this.obstacles,
          this.packages
        );
      }
    }

    for (const parcel of this.packages) {
      if (!collectsPackage(this.runner, parcel)) continue;
      this.collectPackage(parcel);
    }

    for (const obstacle of this.obstacles) {
      if (!collidesWithObstacle(this.runner, obstacle)) continue;
      if (this.startProtectionSeconds > 0) continue;
      const resolution = resolveCollision(
        this.mode,
        this.activePowerUps.has("gwarancja_48")
      );
      this.collisions += 1;
      this.lastCollisionType = obstacle.source === "boss"
        ? `boss-${obstacle.kind}`
        : obstacle.kind;
      this.epochCollisions += 1;
      this.epochHit = true;
      this.impactSeconds = 0.13;
      this.impact = true;
      this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordCollision());

      if (resolution.consumeWarranty) {
        if (this.activePowerUps.consumeWarranty()) {
          this.challengePowerUps.recordWarrantyConsumption(
            Math.max(0, this.ordersCollected - this.challengeStartOrders)
          );
          this.warrantySaves += 1;
          this.shieldActivationSeconds = 0;
          this.warrantyBreakSeconds = SHIELD_BREAK_SECONDS;
        }
      }
      if (resolution.resetCombo) {
        this.combo = 1;
      }
      if (resolution.finishRun) {
        this.finishRun(
          obstacle.source === "boss" ? `boss-${obstacle.kind}` : obstacle.kind,
          "dropout",
          this.currentEpoch
        );
        return;
      }

      this.recoverySeconds = resolution.recoverySeconds;
      if (obstacle.authoredWaveId && this.authoredWaveDirector?.currentWave?.id === obstacle.authoredWaveId) {
        this.resolveCurrentAuthoredWave(false);
      }
      if (obstacle.authoredWaveId && this.challengeWaves.has(obstacle.authoredWaveId)) {
        this.challengeWaves.clear();
        this.resetChallengeSequence();
        this.challengeSpawnCooldown = Math.max(this.challengeSpawnCooldown, 1.1);
      }
      for (const activeObstacle of this.obstacles) activeObstacle.active = false;
      if (obstacle.source === "story-reward" ||
          (obstacle.source === "boss" && this.storyTimeline !== null)) {
        for (const parcel of this.packages) {
          if (parcel.storyRewardPattern) parcel.active = false;
        }
      }
      if (obstacle.source === "boss" && this.storyTimeline !== null) {
        this.bossDirector.resolveCollision();
      } else if (obstacle.source === "story-climax") {
        this.storyClimaxDirector.retryCurrentAttack();
      }
      this.emitSnapshot();
      break;
    }

    if (this.storyTimeline === null && this.narrative && this.narrative.epochs.length > 0) {
      const activeEpoch = this.narrative.epochs[this.currentEpoch]!;
      const epochDone = this.epochElapsed >= activeEpoch.durationSeconds;
      if (epochDone && !activeEpoch.bossClimax) {
        this.factEngine?.recordEpochCompleted(this.currentEpoch, !this.epochHit);
        this.emitUnlockedFacts();
        this.callbacks.onEpochCompleted?.(this.currentEpoch, !this.epochHit);
        if (this.currentEpoch >= this.narrative.epochs.length - 1) {
          this.finishRun("completion", "victory", this.currentEpoch);
          return;
        }
        this.startCutscene(this.currentEpoch + 1);
      }
    }

    if (this.elapsedSeconds >= this.nextSnapshotAt) {
      this.nextSnapshotAt = this.elapsedSeconds + GAMEPLAY.snapshotIntervalSeconds;
      this.emitSnapshot();
    }
  }

  private collectPackage(parcel: PackageModel): void {
    parcel.active = false;
    const collection = resolvePackageCollection(
      parcel.kind,
      parcel.collectibleClass,
      this.combo,
      this.activePowerUps.has("podwojny_wynik")
    );
    if (parcel.kind === "standard") {
      if (parcel.authoredWaveId &&
          this.authoredWaveDirector?.currentWave?.id === parcel.authoredWaveId) {
        this.authoredWaveDirector.recordPackage();
      } else if (parcel.authoredWaveId) {
        const challengeWave = this.challengeWaves.get(parcel.authoredWaveId);
        if (challengeWave !== undefined) challengeWave.collected += 1;
      }
      this.ordersCollected += 1;
      if (collection.countsAsPackage) {
        this.packagesCollected += 1;
      } else {
        this.equipmentTypeCounts[parcel.packageType] += 1;
      }
      const challengeOrders = Math.max(0, this.ordersCollected - this.challengeStartOrders);
      if (this.mode === "challenge" && this.pendingPowerUpReward === null) {
        this.pendingPowerUpReward = this.challengePowerUps.dueAt(
          challengeOrders,
          this.activePowerUps.has("gwarancja_48")
        );
      }
      const newPersonalRecord = this.mode === "challenge" &&
        !this.personalRecordCelebrated &&
        challengeOrders > this.bestChallengeOrdersAtStart;
      if (newPersonalRecord) this.personalRecordCelebrated = true;
      const safeToCelebrate = !this.obstacles.some(({ active, x }) =>
        active && x >= this.runner.x
      );
      if (newPersonalRecord && safeToCelebrate && !this.reducedMotion) {
        this.recordEmphasisRemaining = 0.25;
      }
      const celebrations = collection.countsAsPackage
        ? this.milestoneCelebrationDirector.recordOrders(
            this.packagesCollected,
            safeToCelebrate,
            newPersonalRecord ? "NOWY REKORD" : undefined
          )
        : [];
      if (newPersonalRecord && celebrations.length === 0) {
        celebrations.push(this.milestoneCelebrationDirector.recordAchievement(
          challengeOrders,
          "NOWY REKORD",
          safeToCelebrate
        ));
      }
      for (const celebration of celebrations) {
        try {
          this.callbacks.onMilestoneCelebration?.(celebration);
        } catch {
          // Host callbacks are isolated from package collection.
        }
      }
      this.bonusScore += collection.bonusScoreAwarded;
      if (!parcel.authoredWaveId) {
        this.combo = collection.nextCombo;
        this.bestCombo = Math.max(this.bestCombo, this.combo);
      }
      this.packageTypeCounts[parcel.packageType] += 1;
      this.totalWeightKg += parcel.weightKg;
      this.factEngine?.recordPackage(parcel.packageType, parcel.weightKg);
      if (parcel.collectibleClass === "equipment") {
        this.handleStoryObjectiveUpdate(
          this.storyObjectiveDirector.recordCreativePickup(parcel.packageType)
        );
      }
      this.handleStoryObjectiveUpdate(
        this.storyObjectiveDirector.recordCurrentCombo(this.combo)
      );
      this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordTrustCollection());
      this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordMillionOrder());
      if (parcel.storyOrder === true && parcel.collectibleClass === "equipment") {
        this.handleStoryObjectiveUpdate(
          this.storyObjectiveDirector.recordOrder(parcel.packageType)
        );
      }
    } else {
      if (parcel.authoredWaveId === "safe-power-up") this.pendingPowerUpReward = null;
      if (this.activatePowerUp(parcel.kind)) this.callbacks.onSpecialPickup?.(parcel.kind);
    }
    this.emitUnlockedFacts();
  }

  private spawnStoryOrderPattern(routeClear: boolean): void {
    if (!routeClear) return;
    const orderType = STORY_ORDER_TYPES[
      this.storyOrderPatternIndex % STORY_ORDER_TYPES.length
    ] ?? "pc";
    const wave = createAuthoredRewardWave({
      action: this.storyOrderPatternIndex % 2 === 0 ? "jump" : "slide",
      spawnX: authoredRewardSpawnX(
        this.speed,
        WORLD_WIDTH + GAMEPLAY.spawnPadding
      ),
      speed: this.speed,
      patternIndex: this.storyOrderPatternIndex,
      source: "story-reward",
      rewards: [{
        kind: "standard",
        packageType: orderType,
        storyOrder: true
      }]
    });
    if (!wave || !activateWave(wave, this.obstacles, this.packages)) return;
    this.storyOrderPatternIndex += 1;
  }

  private spawnScriptedObjectivePattern(routeClear: boolean, segmentId: string): void {
    if (!routeClear) return;
    const wave = createAuthoredRewardWave({
      action: this.storyObjectivePatternIndex % 2 === 0 ? "jump" : "slide",
      spawnX: authoredRewardSpawnX(this.speed, STORY_CLIMAX_SPAWN_X),
      speed: this.speed,
      patternIndex: this.storyObjectivePatternIndex,
      source: "story-reward",
      rewards: [{ kind: "standard" }]
    });
    if (!wave || !activateWave(
      this.prepareStoryWave(wave, segmentId),
      this.obstacles,
      this.packages
    )) return;
    this.storyObjectivePatternIndex += 1;
  }

  private hasAuthoredRewardPattern(): boolean {
    return this.obstacles.some(({ active, source }) => active && source === "story-reward") ||
      this.packages.some(({ active, storyRewardPattern }) =>
        active && storyRewardPattern === true
      );
  }

  private hasAuthoredRuntimeObjects(): boolean {
    const waveId = this.authoredWaveDirector?.currentWave?.id;
    if (!waveId) return false;
    return this.obstacles.some(({ active, authoredWaveId }) => active && authoredWaveId === waveId) ||
      this.packages.some(({ active, authoredWaveId }) => active && authoredWaveId === waveId);
  }

  private packagesForAuthoredAction(
    wave: Readonly<AuthoredWaveDefinition>,
    _actionIndex: number
  ): number {
    return wave.packageCount;
  }

  private spawnCurrentAuthoredAction(): void {
    const director = this.authoredWaveDirector;
    const wave = director?.currentWave;
    if (!director || !wave || this.authoredActionSpawned) return;
    const action = wave.actions[this.authoredActionIndex];
    const kind = wave.obstacleKinds[this.authoredActionIndex];
    if (!action || !kind) return;
    const packageCount = this.packagesForAuthoredAction(wave, this.authoredActionIndex);
    const reactionSeconds = wave.telegraphSeconds + (this.controlMethod === "touch" ? 0.1 : 0);
    if ((wave.obstacleVariant === "parcel-arc" || wave.obstacleVariant === "recovery-route") &&
        this.authoredActionIndex === 0) {
      const free = this.packages.filter(({ active }) => !active).slice(0, packageCount);
      if (free.length < packageCount) return;
      const startX = authoredRewardSpawnX(this.speed, STORY_CLIMAX_SPAWN_X, reactionSeconds);
      const heights = [28, 78, 118, 78, 28];
      free.forEach((parcel, index) => {
        parcel.active = true;
        parcel.kind = "standard";
        parcel.collectibleClass = "parcel";
        parcel.x = startX + index * 66;
        parcel.y = GROUND_Y - parcel.size - (heights[index] ?? 28);
        parcel.phase = index * 0.72;
        parcel.packageType = "notebook";
        parcel.orderVisualType = "parcel";
        parcel.weightKg = 0;
        parcel.storyRewardPattern = true;
        parcel.authoredWaveId = wave.id;
      });
      this.authoredActionSpawned = true;
      return;
    }
    const runtimeWave = createAuthoredRewardWave({
      action,
      obstacleKind: kind,
      spawnX: authoredRewardSpawnX(this.speed, STORY_CLIMAX_SPAWN_X),
      speed: this.speed,
      packageCount,
      patternIndex: director.snapshot.wavesCompleted + this.authoredActionIndex,
      source: "story-reward",
      authoredWaveId: wave.id,
      authoredActionIndex: this.authoredActionIndex,
      semanticVariant: wave.obstacleVariant,
      minimumReactionSeconds: reactionSeconds,
      rewards: [{ kind: "standard" }]
    });
    if (!runtimeWave || !activateWave(runtimeWave, this.obstacles, this.packages)) return;
    this.authoredActionSpawned = true;
  }

  private advanceAuthoredWaveIfClear(): void {
    const director = this.authoredWaveDirector;
    const wave = director?.currentWave;
    if (!director || !wave || !this.authoredActionSpawned || this.hasAuthoredRuntimeObjects()) return;
    if (this.authoredActionIndex + 1 < wave.actions.length) {
      this.authoredActionIndex += 1;
      this.authoredActionSpawned = false;
      this.authoredBreathRemaining = 0.25;
      return;
    }
    this.resolveCurrentAuthoredWave(true);
  }

  private resolveCurrentAuthoredWave(actionSucceeded: boolean): void {
    const director = this.authoredWaveDirector;
    const wave = director?.currentWave;
    if (!director || !wave) return;
    const result = director.resolve(actionSucceeded);
    if (director.definition.id !== "first-package") {
      const combo = resolveWaveCombo(this.combo, result.passed, result.perfect);
      this.combo = combo.nextCombo;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.bonusScore += combo.perfectBonus;
    }
    if (result.passed && wave.reward) {
      const powerUp: PowerUpKind | undefined = wave.reward === "double-score"
          ? "podwojny_wynik"
          : wave.reward === "warranty"
            ? "gwarancja_48"
            : undefined;
      if (powerUp) this.pendingPowerUpReward = powerUp;
    }
    this.beginFinaleRewardRunIfReady();
    this.authoredActionIndex = 0;
    this.authoredActionSpawned = false;
    this.authoredBreathRemaining = result.passed ? wave.breathSeconds : 0.45;
    for (const obstacle of this.obstacles) {
      if (obstacle.authoredWaveId === wave.id) obstacle.active = false;
    }
    for (const parcel of this.packages) {
      if (parcel.authoredWaveId === wave.id) parcel.active = false;
    }
    this.emitSnapshot();
  }

  private beginFinaleRewardRunIfReady(): void {
    const director = this.authoredWaveDirector;
    if (!director?.completed || director.definition.id !== "million-threshold" ||
        this.authoredFinaleCelebrated) return;
    this.authoredFinaleCelebrated = true;
    this.finaleRewardRunRemaining = STORY_FINALE_REWARD_RUN_SECONDS;
  }

  private hasPendingPowerUpParcel(): boolean {
    return this.packages.some(({ active, authoredWaveId }) =>
      active && authoredWaveId === "safe-power-up"
    );
  }

  private spawnPendingPowerUpReward(): void {
    const kind = this.pendingPowerUpReward;
    const parcel = this.packages.find(({ active }) => !active);
    if (!kind || !parcel) return;
    parcel.active = true;
    parcel.kind = kind;
    parcel.collectibleClass = "parcel";
    parcel.x = authoredRewardSpawnX(this.speed, STORY_CLIMAX_SPAWN_X, 1.6);
    parcel.y = GROUND_Y - parcel.size - 12;
    parcel.phase = 0;
    parcel.packageType = "notebook";
    parcel.orderVisualType = "parcel";
    parcel.weightKg = 0;
    parcel.storyRewardPattern = true;
    parcel.authoredWaveId = "safe-power-up";
  }

  private resetChallengeRunState(): void {
    this.challengeElapsedSeconds = 0;
    this.challengePatternIndex = 0;
    this.challengeSpawnCooldown = 0;
    this.challengePowerUps.reset();
    this.challengeOnboardingPending = this.mode === "challenge";
    this.challengeWaves.clear();
    this.resetChallengeSequence();
  }

  private resetChallengeSequence(): void {
    this.challengeSequenceRemaining = 0;
    this.challengeSequencePackagesAvailable = 0;
    this.challengeSequencePackagesCollected = 0;
    this.challengeSequenceBreathSeconds = 0;
  }

  private spawnChallengePattern(): void {
    const atom = challengeAtomAt(this.challengePatternIndex);
    const tuning = challengePatternTuning(
      this.challengeElapsedSeconds,
      this.challengePatternIndex,
      atom.packageCount
    );
    if (this.challengeSequenceRemaining === 0) {
      this.challengeSequenceRemaining = tuning.sequenceLength;
      this.challengeSequencePackagesAvailable = 0;
      this.challengeSequencePackagesCollected = 0;
      this.challengeSequenceBreathSeconds = tuning.breathSeconds;
    }
    const waveId = `challenge-${this.challengePatternIndex}`;
    const wave = createAuthoredRewardWave({
      action: atom.action,
      obstacleKind: atom.obstacleKind,
      spawnX: authoredRewardSpawnX(
        this.speed,
        WORLD_WIDTH + GAMEPLAY.spawnPadding,
        tuning.reactionSeconds
      ),
      speed: this.speed,
      packageCount: tuning.packageCount,
      patternIndex: this.challengePatternIndex,
      source: "normal",
      authoredWaveId: waveId,
      minimumReactionSeconds: tuning.reactionSeconds,
      rewards: [{ kind: "standard" }]
    });
    if (!wave || !activateWave(wave, this.obstacles, this.packages)) return;
    this.challengeWaves.set(waveId, { available: tuning.packageCount, collected: 0 });
    this.challengeSequenceRemaining = Math.max(0, this.challengeSequenceRemaining - 1);
    if (this.challengeSequenceRemaining > 0) {
      this.challengeSpawnCooldown = tuning.sequenceGapSeconds;
    }
    this.challengePatternIndex += 1;
  }

  private resolveChallengeWaveIfClear(): void {
    if (this.mode !== "challenge") return;
    for (const [waveId, result] of this.challengeWaves) {
      const active = this.obstacles.some(({ active, authoredWaveId }) =>
        active && authoredWaveId === waveId
      ) || this.packages.some(({ active, authoredWaveId }) =>
        active && authoredWaveId === waveId
      );
      if (active) continue;
      this.challengeSequencePackagesAvailable += result.available;
      this.challengeSequencePackagesCollected += result.collected;
      this.challengeWaves.delete(waveId);
    }
    if (this.challengeSequenceRemaining > 0 || this.challengeWaves.size > 0 ||
        this.challengeSequencePackagesAvailable === 0) return;
    const passed = this.challengeSequencePackagesCollected >=
      Math.ceil(this.challengeSequencePackagesAvailable * STORY_WAVE_COLLECTION_RATIO);
    const perfect = passed &&
      this.challengeSequencePackagesCollected === this.challengeSequencePackagesAvailable;
    const resolution = resolveWaveCombo(this.combo, passed, perfect);
    this.combo = resolution.nextCombo;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.bonusScore += resolution.perfectBonus;
    this.challengeSpawnCooldown = this.challengeSequenceBreathSeconds;
    this.resetChallengeSequence();
  }

  private prepareStoryWave(wave: SpawnWave, segmentId: string | null): SpawnWave {
    if (segmentId !== "epoch_3.matching_creative") return wave;
    const packages = wave.packages.map((parcel, index) => ({
      ...parcel,
      packageType: STORY_CREATIVE_EQUIPMENT_IDS[
        (this.creativeEquipmentCursor + index) % STORY_CREATIVE_EQUIPMENT_IDS.length
      ] ?? "notebook"
    }));
    this.creativeEquipmentCursor += packages.length;
    return { ...wave, packages };
  }

  private positiveMotifForEpoch(epochIndex: number): StoryPositiveMotif {
    return [
      "process-zones",
      "quality-mark",
      "matched-order",
      "dispatch-flow"
    ][Math.max(0, Math.min(3, epochIndex))] as StoryPositiveMotif;
  }

  private activatePowerUp(kind: PowerUpKind): boolean {
    const wasProtected = kind === "gwarancja_48" &&
      this.activePowerUps.has("gwarancja_48");
    const activated = this.activePowerUps.activate(kind);
    if (activated && kind === "gwarancja_48" && !wasProtected) {
      this.shieldActivationSeconds = SHIELD_APPEAR_SECONDS;
    }
    if (activated && this.mode === "story" && this.storyTimeline !== null &&
        !this.seenPowerUpDemos.has(kind)) {
      this.seenPowerUpDemos.add(kind);
      this.powerUpDemoRemaining = STORY_POWER_UP_DEMO_SECONDS;
    }
    return activated;
  }

  private completeBossEncounter(): void {
    this.bossesDefeated += 1;
    this.bonusScore += BOSS.scoreBonus;
    this.clearInteractiveWorld();
  }

  private tickPowerUps(deltaSeconds: number): void {
    this.activePowerUps.tick(deltaSeconds);
  }

  private handleStoryObjectiveUpdate(update: StoryObjectiveUpdate): void {
    if (update.newlyCompletedObjectiveIds.length === 0) return;
    for (const objectiveId of update.newlyCompletedObjectiveIds) {
      this.bonusScore += 750;
      if (objectiveId === "epoch_5.million_threshold") {
        this.finaleCelebrationRemaining = STORY_FINALE_CELEBRATION_SECONDS;
        this.clearInteractiveWorld();
      }
      try {
        this.callbacks.onStoryObjectiveCompleted?.(objectiveId);
      } catch {
        // Host callbacks are isolated from the game loop.
      }
    }
    this.emitSnapshot();
  }

  private emitUnlockedFacts(): void {
    if (this.factEngine === null) return;
    const unlocked = this.factEngine.evaluate();
    for (const factId of unlocked) {
      this.factsUnlockedCount += 1;
      try {
        this.callbacks.onFactUnlocked?.(factId);
      } catch {
        // Host callbacks are isolated from the game loop.
      }
    }
  }

  private syncStorySection(
    previous: StoryTimelineSnapshot,
    next: StoryTimelineSnapshot
  ): void {
    if (previous.sectionId === next.sectionId && previous.state === next.state) return;

    const leftEpoch = previous.phase === "epoch" && (
      next.phase !== "epoch" || previous.epochIndex !== next.epochIndex
    );
    if (leftEpoch) {
      this.factEngine?.recordEpochCompleted(previous.epochIndex, !this.epochHit);
      this.emitUnlockedFacts();
      try {
        this.callbacks.onEpochCompleted?.(previous.epochIndex, !this.epochHit);
      } catch {
        // Host callbacks are isolated from the game loop.
      }
    }

    const enteredEpoch = next.phase === "epoch" && (
      previous.phase !== "epoch" || previous.epochIndex !== next.epochIndex
    );
    if (enteredEpoch) {
      this.enterEpoch(next.epochIndex);
      this.epochElapsed = this.storyEpochElapsed(next.totalActiveElapsedSeconds, next.epochIndex);
    } else if (next.phase === "finale") {
      for (const obstacle of this.obstacles) obstacle.active = false;
      this.storyClimaxDirector.reset();
      this.bossDirector.reset();
      this.bossStarted = false;
    }
    const enteredPlaySegment = next.state === "play" && next.playSegment !== null &&
      previous.playSegment?.id !== next.playSegment.id;
    if (enteredPlaySegment) {
      this.clearInteractiveWorld();
      const definition = storyMicrolevelForSegment(next.playSegment?.id ?? "");
      const runtimeDefinition = definition?.id === "million-threshold" && this.story
        ? {
            ...definition,
            finaleOrderTarget: this.story.millionThreshold.orderTarget,
            repeatWavesUntil: this.story.millionThreshold.combinationTarget
          }
        : definition;
      this.authoredWaveDirector = runtimeDefinition
        ? new AuthoredWaveDirector(runtimeDefinition)
        : null;
      this.authoredActionIndex = 0;
      this.authoredActionSpawned = false;
      this.authoredBreathRemaining = 0;
    } else if (next.state !== "play") {
      this.authoredWaveDirector = null;
      this.authoredActionIndex = 0;
      this.authoredActionSpawned = false;
    }
    if (next.playSegment?.id === "epoch_3.matching_creative" && enteredPlaySegment) {
      this.creativeEquipmentCursor = 0;
    }
    if (next.playSegment?.id === "epoch_4.order_peak" && enteredPlaySegment) {
      this.storyOrderPatternIndex = 0;
    }
    if ((next.playSegment?.id === "epoch_1.training" ||
        next.playSegment?.id === "epoch_2.quality_series") && enteredPlaySegment) {
      this.storyObjectivePatternIndex = 0;
    }
    if (next.state === "play" && next.playSegment) {
      const climaxEpoch = STORY_CLIMAX_SEGMENTS.get(next.playSegment.id);
      if (climaxEpoch === undefined) {
        this.storyClimaxDirector.reset();
      } else {
        const epoch = this.story?.epochs[climaxEpoch];
        this.storyClimaxDirector.enterEpoch(
          climaxEpoch,
          epoch?.challengeName ?? next.playSegment.id,
          next.playSegment.durationSeconds
        );
      }
    }
  }

  private emitStorySignals(force = false): void {
    const snapshot = this.storyTimeline?.snapshot;
    if (!snapshot) return;

    const signal = [
      snapshot.state,
      snapshot.phase,
      snapshot.sectionId,
      snapshot.scene?.id ?? "",
      snapshot.playSegment?.id ?? "",
      snapshot.countdownValue ?? "",
      snapshot.trustCorridor ? "safe" : "play",
      ...snapshot.activeBeats.map(({ id }) => id)
    ].join("|");
    if (force || signal !== this.lastStorySignal) {
      this.lastStorySignal = signal;
      try {
        this.callbacks.onStoryUpdate?.(snapshot);
      } catch {
        // Host callbacks are isolated from the game loop.
      }
    }
  }

  private completeStoryAndEnterChallenge(): void {
    if (!this.storyCompleteEmitted) {
      this.storyCompleteEmitted = true;
      if (this.awardStoryCompletionBonus) {
        this.bonusScore += this.story?.firstCompletionBonusScore ?? 0;
      }
      try {
        this.callbacks.onStoryComplete?.();
      } catch {
        // Host callbacks are isolated from the game loop.
      }
    }
    const previousMode = this.mode;
    this.challengeStartScore = calculateScore(
      this.distancePixels,
      this.ordersCollected,
      this.bonusScore
    );
    this.challengeStartOrders = this.ordersCollected;
    this.mode = "challenge";
    this.storyTimeline = null;
    this.storyObjectiveDirector.enterSegment(null);
    this.factEngine = null;
    this.narrative = null;
    this.currentEpoch = 0;
    this.epochElapsed = 0;
    this.epochHit = false;
    this.epochCollisions = 0;
    this.resetChallengeRunState();
    this.challengeWorldDirector.reset("story-continuation");
    this.recoverySeconds = 0;
    this.startProtectionSeconds = START_PROTECTION_SECONDS;
    this.warrantyBreakSeconds = 0;
    this.shieldActivationSeconds = SHIELD_APPEAR_SECONDS;
    this.crouchHeld = false;
    this.runner.crouching = false;
    this.clearInteractiveWorld();
    this.storyClimaxDirector.reset();
    this.storyObstacleTransformer.reset();
    this.bossDirector.reset();
    this.logisticWaveDirector.reset();
    this.bossStarted = false;
    const difficulty = this.challenge
      ? getChallengeDifficulty(0, this.challenge)
      : getDifficulty(0);
    this.speed = difficulty.speed;
    this.difficultyLevel = difficulty.level;
    this.spawner = new FairSpawner(
      new SeededRandom(mixSeed(this.baseSeed, this.runIndex + 10_000)),
      difficulty.speed
    );
    try {
      this.callbacks.onModeChange?.(this.mode, previousMode);
    } catch {
      // Host callbacks are isolated from the game loop.
    }
    this.emitSnapshot();
  }

  private startCutscene(nextEpoch: number): void {
    const epoch = this.narrative?.epochs[nextEpoch];
    if (!epoch) return;
    this.pendingEpoch = nextEpoch;
    this.cutscene = { title: epoch.name, subtitle: epoch.year };
    this.cutsceneRemaining = CUTSCENE_SECONDS;
    this.callbacks.onCutscene?.(nextEpoch, epoch.name, epoch.year);
  }

  private enterEpoch(index: number): void {
    if (!this.narrative || this.narrative.epochs.length === 0) return;
    const epoch = this.narrative.epochs[index] ?? this.narrative.epochs[0]!;
    this.currentEpoch = index;
    this.epochElapsed = 0;
    this.epochHit = false;
    this.epochCollisions = 0;
    this.furthestEpochReached = Math.max(this.furthestEpochReached, index);
    this.cutscene = null;
    const random = new SeededRandom(mixSeed(this.baseSeed, this.runIndex + index * 97));
    const allowed = epoch.obstaclePool
      .map((kind) => asObstacleKind(kind))
      .filter((kind): kind is ObstacleKind => kind !== null);
    this.spawner = new FairSpawner(
      random,
      this.story
        ? getStoryDifficulty(
            this.storyTimeline?.snapshot.totalActiveElapsedSeconds ?? 0,
            this.story.activeDurationSeconds,
            this.story
          ).speed
        : epochSpeed(epoch, 0),
      allowed
    );
    if (this.story === null) {
      this.storyClimaxDirector.enterEpoch(
        index,
        epoch.challengeName ?? epoch.name,
        epoch.durationSeconds
      );
    } else {
      this.storyClimaxDirector.reset();
    }
    if (this.storyTimeline === null && epoch.powerUpDebut) {
      this.activatePowerUp(epoch.powerUpDebut);
    }
    this.speed = this.story
      ? getStoryDifficulty(
          this.storyTimeline?.snapshot.totalActiveElapsedSeconds ?? 0,
          this.story.activeDurationSeconds,
          this.story
        ).speed
      : epochSpeed(epoch, 0);
  }

  private storyEpochElapsed(totalActiveElapsedSeconds: number, epochIndex: number): number {
    if (!this.story) return this.epochElapsed;
    const before = this.story.epochs
      .slice(0, Math.max(0, epochIndex))
      .reduce((total, epoch) => total + epoch.durationSeconds, 0);
    const duration = this.story.epochs[epochIndex]?.durationSeconds ?? 0;
    return Math.max(0, Math.min(duration, totalActiveElapsedSeconds - before));
  }

  private clearInteractiveWorld(): void {
    for (const obstacle of this.obstacles) obstacle.active = false;
    for (const parcel of this.packages) parcel.active = false;
  }

  private difficultyFromSpeed(speed: number): { level: number; speed: number; speedMultiplier: number; minimumGapSeconds: number } {
    const multiplier = speed / 280;
    const minimumGapSeconds = Math.max(1.0, 2.25 - (multiplier - 1) * 1.4);
    return {
      level: this.difficultyLevel,
      speed,
      speedMultiplier: multiplier,
      minimumGapSeconds
    };
  }

  private finishRun(collisionType: string, outcome: "victory" | "dropout" = "dropout", furthestEpoch = 0): void {
    this.cancelFrame();
    this.impact = true;
    this.emitUnlockedFacts();
    if (this.narrative) {
      try {
        this.callbacks.onNarrativeEnd?.(outcome);
      } catch {
        // Host callbacks are isolated from the game loop.
      }
    }
    this.setState("game_over");
    const snapshot = this.createSnapshot();
    this.invokeSnapshot(snapshot);
    const result: GameResult = {
      ...snapshot,
      collisionType,
      controlMethod: this.controlMethod,
      outcome,
      furthestEpochReached: Math.max(this.furthestEpochReached, furthestEpoch)
    };
    try {
      this.callbacks.onGameOver?.(result);
    } catch {
      // Host callbacks are isolated from the game loop.
    }
  }

  private createSnapshot(): GameSnapshot {
    const distanceM = distanceInMeters(this.distancePixels);
    const epoch = this.narrative?.epochs[this.currentEpoch];
    const epochMax = this.narrative ? this.narrative.epochs.length - 1 : 0;
    const epochDuration = epoch?.durationSeconds ?? 1;
    const storySnapshot = this.storyTimeline?.snapshot;
    const objectives = this.storyObjectiveDirector.snapshot;
    const activeStoryOrderTypes = this.packages
      .filter(({ active, storyOrder, x, size }) =>
        active && storyOrder === true && x + size >= this.runner.x
      )
      .map(({ packageType }) => packageType);
    const visual = this.currentWorldVisual();
    const score = calculateScore(this.distancePixels, this.ordersCollected, this.bonusScore);
    return {
      mode: this.mode,
      visualWorldId: visual.worldId,
      visualStateId: visual.stateId,
      visualNextStateId: visual.nextStateId,
      visualProgress: visual.progress,
      visualWorldIndex: visual.worldIndex,
      visualTransitionPending: visual.transitionPending,
      score,
      packagesCollected: this.packagesCollected,
      ordersCollected: this.ordersCollected,
      challengeScore: this.mode === "challenge"
        ? Math.max(0, score - this.challengeStartScore)
        : 0,
      challengeOrdersCollected: this.mode === "challenge"
        ? Math.max(0, this.ordersCollected - this.challengeStartOrders)
        : 0,
      collisions: this.collisions,
      recoverySeconds: round(this.recoverySeconds, 2),
      startProtectionSeconds: round(this.startProtectionSeconds, 2),
      combo: this.combo,
      bestCombo: this.bestCombo,
      warrantySaves: this.warrantySaves,
      storyPhase: storySnapshot?.phase ?? null,
      storyProgress: storySnapshot?.progress ?? 0,
      activeStoryBeatIds: storySnapshot?.activeBeats.map(({ id }) => id) ?? [],
      trustCorridor: storySnapshot?.trustCorridor ?? false,
      storyObjectiveSegmentId: this.authoredWaveDirector?.definition.segmentId ??
        objectives.activeSegmentId ?? "",
      storyObjectivesCompleted: [...objectives.completedObjectiveIds],
      storyObjectives: objectives,
      activeStoryOrderTypes,
      storyClimaxName: this.storyClimaxDirector.model.challengeName,
      storyClimaxPhase: this.storyClimaxDirector.model.phase,
      storyClimaxesCompleted: [...this.storyClimaxesCompleted].sort(
        (left, right) => left - right
      ),
      storyTransformationMotifs: [
        ...new Set(this.storyObstacleTransformer.models.map(({ motif }) => motif))
      ],
      logisticWavePhase: this.logisticWaveDirector.snapshot.phase,
      logisticWaveProgress: this.logisticWaveDirector.snapshot.patternsCompleted,
      challengePressureAxis: this.mode === "challenge"
        ? challengePressureAt(this.challengeElapsedSeconds).axis
        : null,
      bossesDefeated: this.bossesDefeated,
      bossPhase: this.bossDirector.model.phase,
      bossEncounterPhase: this.bossDirector.model.encounterPhase,
      bossProgress: this.bossDirector.model.attacksSurvived,
      bossAttackCount: this.bossDirector.model.attackCount,
      distanceM,
      backgroundTravelPixels: backgroundTravelPixels(this.distancePixels),
      reducedMotion: this.reducedMotion,
      decorationQuality: this.decorationQuality.level,
      durationSeconds: round(this.elapsedSeconds, 2),
      frameRate: round(this.estimatedFrameRate, 1),
      droppedFrames: this.droppedFrames,
      lastCollisionType: this.lastCollisionType,
      difficultyLevel: this.difficultyLevel,
      speed: round(this.speed, 1),
      epochIndex: this.currentEpoch,
      epochName: epoch?.name ?? "",
      epochYear: epoch?.year ?? "",
      epochIndexMax: epochMax,
      epochProgress: Math.min(1, this.epochElapsed / epochDuration),
      packageTypeCounts: { ...this.packageTypeCounts },
      equipmentTypeCounts: { ...this.equipmentTypeCounts },
      totalWeightKg: Math.round(this.totalWeightKg),
      activePowerUps: this.activePowerUps.keys(),
      activePowerUpStatuses: this.activePowerUps.statuses(),
      powerUpDemoRemaining: round(this.powerUpDemoRemaining, 2),
      factsUnlockedCount: this.factsUnlockedCount,
      milestoneCelebration: this.milestoneCelebrationDirector.snapshot,
      authoredWave: this.authoredWaveDirector?.snapshot ?? null,
      authoredWavePhase: this.authoredWaveDirector === null
        ? "inactive"
        : this.authoredBreathRemaining > 0
          ? "breath"
          : "burst",
      millionCounterValue: this.millionCounterValue()
    };
  }

  private millionCounterValue(): number {
    if (this.mode === "challenge") {
      return 1_000_000 + Math.max(0, this.ordersCollected - this.challengeStartOrders);
    }
    const authored = this.authoredWaveDirector;
    if (authored?.definition.id !== "million-threshold") {
      return this.storyObjectiveDirector.snapshot.epoch5.millionThreshold.counterValue;
    }
    const target = authored.snapshot.totalOrderTarget ?? 30;
    return 1_000_000 - target + Math.min(target, authored.snapshot.totalOrdersCollected);
  }

  private currentWorldVisual(): {
    worldId: CampaignWorldId;
    stateId: string;
    nextStateId: string;
    progress: number;
    worldIndex: number;
    transitionPending: boolean;
  } {
    if (this.mode === "challenge") {
      const challenge = this.challengeWorldDirector.snapshot;
      return {
        worldId: challenge.worldId,
        stateId: challenge.stateId,
        nextStateId: challenge.stateId,
        progress: Math.min(1, challenge.worldElapsedSeconds / 45),
        worldIndex: challenge.worldIndex,
        transitionPending: challenge.transitionPending
      };
    }

    const story = this.storyTimeline?.snapshot;
    if (story?.scene) {
      const state = sceneVisualState(story.scene.id);
      return {
        worldId: state.worldId,
        stateId: state.stateId,
        nextStateId: state.stateId,
        progress: state.worldProgress,
        worldIndex: CAMPAIGN_WORLD_IDS.indexOf(state.worldId),
        transitionPending: false
      };
    }
    if (story?.playSegment) {
      const sectionProgress = story.sectionDurationSeconds <= 0
        ? 0
        : story.sectionElapsedSeconds / story.sectionDurationSeconds;
      const play = resolvePlaySegmentVisual(story.playSegment.id, sectionProgress);
      return {
        worldId: play.worldId,
        stateId: play.fromStateId,
        nextStateId: play.toStateId,
        progress: play.progress,
        worldIndex: CAMPAIGN_WORLD_IDS.indexOf(play.worldId),
        transitionPending: false
      };
    }

    const fallback = sceneVisualState(
      story?.completed ? "story.million_finale" : "story.first_package"
    );
    return {
      worldId: fallback.worldId,
      stateId: fallback.stateId,
      nextStateId: fallback.stateId,
      progress: fallback.worldProgress,
      worldIndex: CAMPAIGN_WORLD_IDS.indexOf(fallback.worldId),
      transitionPending: false
    };
  }

  private emitSnapshot(): void {
    this.invokeSnapshot(this.createSnapshot());
  }

  private invokeSnapshot(snapshot: GameSnapshot): void {
    try {
      this.callbacks.onSnapshot?.(snapshot);
    } catch {
      // Host callbacks are isolated from the game loop.
    }
  }

  private setState(nextState: GameState): void {
    const previousState = this._state;
    if (previousState === nextState) return;
    this._state = nextState;
    try {
      this.callbacks.onStateChange?.(nextState, previousState);
    } catch {
      // Host callbacks are isolated from the game loop.
    }
  }

  private render(): void {
    if (this._state === "destroyed") return;
    this.applyCanvasBuffer();
    const worldVisual = this.currentWorldVisual();
    const scene: RenderScene = {
      state: this._state,
      runner: this.runner,
      obstacles: this.obstacles,
      packages: this.packages,
      boss: this.bossDirector.model,
      elapsedSeconds: this.visualElapsedSeconds,
      distancePixels: this.visualDistancePixels,
      speed: this.speed,
      reducedMotion: this.reducedMotion,
      decorationQuality: this.decorationQuality.level,
      impact: this.impact,
      epochIndex: this.currentEpoch,
      epochName: this.narrative?.epochs[this.currentEpoch]?.name ?? "",
      epochYear: this.narrative?.epochs[this.currentEpoch]?.year ?? "",
      themeIndex: this.narrative?.epochs[this.currentEpoch]?.themeIndex ?? -1,
      worldVisual: {
        worldId: worldVisual.worldId,
        stateId: worldVisual.stateId,
        nextStateId: worldVisual.nextStateId,
        progress: worldVisual.progress
      },
      cutscene: this.cutscene,
      activePowerUps: this.activePowerUps.keys(),
      powerUpCopy: this.powerUpCopy,
      mode: this.mode,
      trustCorridor: this.storyTimeline?.snapshot.trustCorridor ?? false,
      combo: this.combo,
      recoverySeconds: this.recoverySeconds,
      startProtectionSeconds: this.startProtectionSeconds,
      warrantyBreakSeconds: this.warrantyBreakSeconds,
      shieldActivationSeconds: this.shieldActivationSeconds,
      storyPhase: this.storyTimeline?.snapshot.phase ?? null,
      storyProgress: this.storyTimeline?.snapshot.progress ?? 0,
      storyObjectives: this.storyObjectiveDirector.snapshot,
      storyClimax: this.storyClimaxDirector.model,
      obstacleTransformations: this.storyObstacleTransformer.models,
      milestoneCelebration: this.milestoneCelebrationDirector.snapshot,
      authoredWave: this.authoredWaveDirector?.snapshot ?? null
    };
    this.renderer.render(this.context, this.canvas.width, this.canvas.height, scene);
  }

  private installLifecycleListeners(): void {
    this.document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.view?.addEventListener("blur", this.handleWindowBlur);

    const ResizeObserverConstructor = globalThis.ResizeObserver;
    if (typeof ResizeObserverConstructor === "function") {
      const observer = new ResizeObserverConstructor(this.handleResize);
      this.resizeObserver = observer;
      observer.observe(this.canvas);
    } else {
      this.view?.addEventListener("resize", this.handleResize);
    }
  }

  private readonly handleResize = (): void => {
    if (this._state === "destroyed") return;
    this.resizeCanvas();
    this.render();
  };

  private resizeCanvas(): void {
    const bounds = this.canvas.getBoundingClientRect();
    const cssWidth = bounds.width || this.canvas.clientWidth || this.canvas.width || WORLD_WIDTH;
    const cssHeight = bounds.height || this.canvas.clientHeight || this.canvas.height || WORLD_HEIGHT;
    const requestedDpr = this.view?.devicePixelRatio ?? 1;
    const buffer = calculateCanvasBuffer(
      cssWidth,
      cssHeight,
      requestedDpr,
      CANVAS_LIMITS.maxPixels,
      CANVAS_LIMITS.maxDimension
    );
    this.bufferWidth = buffer.width;
    this.bufferHeight = buffer.height;
    this.applyCanvasBuffer();
  }

  private applyCanvasBuffer(): void {
    if (this.canvas.width !== this.bufferWidth) this.canvas.width = this.bufferWidth;
    if (this.canvas.height !== this.bufferHeight) this.canvas.height = this.bufferHeight;
  }

  private readonly handleVisibilityChange = (): void => {
    if (this.document.visibilityState === "hidden" && this.shouldAutoPause()) this.pause();
  };

  private readonly handleWindowBlur = (): void => {
    if (this.shouldAutoPause()) this.pause();
  };

  /**
   * Story cards and their 3–2–1 countdown already own and suspend gameplay.
   * Pausing the engine again there would replace an inert story overlay with an
   * unreachable pause dialog and could consume a scene CTA while still paused.
   */
  private shouldAutoPause(): boolean {
    return this._state === "running" && (this.storyTimeline?.snapshot.controlsEnabled ?? true);
  }

  private readonly handleMotionPreferenceChange = (event: MediaQueryListEvent): void => {
    this.reducedMotion = event.matches;
    this.render();
  };

  private scheduleFrame(): void {
    if (this.frameId !== null || this._state !== "running") return;
    if (this.view?.requestAnimationFrame) {
      this.frameUsesTimeout = false;
      this.frameId = this.view.requestAnimationFrame(this.handleFrame);
      return;
    }

    this.frameUsesTimeout = true;
    this.frameId = globalThis.setTimeout(() => {
      const timestamp = globalThis.performance?.now?.() ?? Date.now();
      this.handleFrame(timestamp);
    }, 16) as unknown as number;
  }

  private cancelFrame(): void {
    if (this.frameId === null) return;
    if (this.frameUsesTimeout) {
      globalThis.clearTimeout(this.frameId);
    } else {
      this.view?.cancelAnimationFrame(this.frameId);
    }
    this.frameId = null;
  }
}

export default RunnerGame;
