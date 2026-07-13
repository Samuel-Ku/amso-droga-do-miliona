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
import { getChallengeDifficulty, getDifficulty } from "./difficulty";
import { createRunnerModel, queueJump, stepRunnerPhysics } from "./physics";
import { mixSeed, normalizeSeed, SeededRandom } from "./random";
import { WarehouseRenderer } from "./renderer";
import { calculateScore, distanceInMeters, resolvePackageCollection } from "./scoring";
import {
  activateBossReward,
  activateTutorialPackages,
  activateWave,
  createBossAttackWave,
  createObstaclePool,
  createPackagePool,
  FairSpawner
} from "./spawning";
import {
  asObstacleKind,
  epochSpeed,
  FactEngine
} from "./narrative";
import type { NarrativeConfig, PackageType, PowerUpKind, StoryConfig } from "../shared/types";
import type { ObstacleKind, ObstacleModel, PackageModel, RenderScene, RunnerModel } from "./types";
import { calculateCanvasBuffer } from "./viewport";
import {
  recoverStoryGapAssist,
  resolveCollision,
  storyGapAssistAfterCollision
} from "./mode-rules";
import {
  ActivePowerUps,
  spawnTravelDistance,
  storyPowerUpsForEpoch
} from "./power-ups";
import {
  StoryTimeline,
  type StoryStartCheckpoint,
  type StoryTimelineSnapshot
} from "./story-timeline";
import { LogisticWaveDirector } from "./logistic-wave";
import {
  StoryClimaxDirector,
  type StoryPositiveMotif
} from "./story-climax";
import {
  FinaleSymbolDirector,
  StoryObstacleTransformer
} from "./story-effects";

const CUTSCENE_SECONDS = 2.6;

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
  private readonly finaleSymbolDirector = new FinaleSymbolDirector();
  private readonly storyObstacleTransformer = new StoryObstacleTransformer();
  private readonly storyClimaxesCompleted = new Set<number>();
  private runner: RunnerModel = createRunnerModel();
  private spawner!: FairSpawner;
  private runIndex = 0;
  private elapsedSeconds = 0;
  private distancePixels = 0;
  private packagesCollected = 0;
  private bonusScore = 0;
  private bossesDefeated = 0;
  private speed = getDifficulty(0).speed;
  private difficultyLevel = 1;
  private controlMethod: ControlMethod = "keyboard";
  private readonly mode: GameMode;
  private readonly story: StoryConfig | null;
  private readonly challenge: RunnerGameOptions["challenge"];
  private readonly storyStartCheckpoint: StoryStartCheckpoint;
  private readonly narrative: NarrativeConfig | null;
  private storyTimeline: StoryTimeline | null = null;
  private lastStorySignal = "";
  private lastStoryCheckpoint: StoryStartCheckpoint | null = null;
  private storyCompleteEmitted = false;
  private lastTrustCorridor = false;
  private symbolSpawnCooldown = 0;
  private readonly logisticWaveDirector: LogisticWaveDirector;
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
  private totalWeightKg = 0;
  private readonly activePowerUps = new ActivePowerUps();
  private collisions = 0;
  private epochCollisions = 0;
  private storyGapAssist = 0;
  private recoverySeconds = 0;
  private combo = 1;
  private bestCombo = 1;
  private warrantySaves = 0;
  private factEngine: FactEngine | null = null;
  private crouchHeld = false;
  private accumulator = 0;
  private lastFrameTime: number | null = null;
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
    const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!context) throw new Error("RunnerGame requires a Canvas 2D context.");

    this.context = context;
    this.callbacks = callbacks;
    this.document = canvas.ownerDocument;
    this.view = this.document.defaultView;
    this.baseSeed = normalizeSeed(options.seed ?? runtimeSeed());
    this.mode = options.mode ?? (options.story || options.narrative ? "story" : "challenge");
    this.story = this.mode === "story" ? options.story ?? null : null;
    this.challenge = this.mode === "challenge" ? options.challenge ?? null : null;
    this.logisticWaveDirector = new LogisticWaveDirector(
      this.challenge?.logisticWaveMinSeconds ?? 45,
      this.challenge?.logisticWaveMaxSeconds ?? 60
    );
    this.storyStartCheckpoint = options.storyCheckpoint ?? "prologue";
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
    this.impact = false;
    this.impactSeconds = 0;
    this.crouchHeld = false;
    this.setState("running");
    this.emitStorySignals(true);
    this.emitSnapshot();
    this.render();
    this.scheduleFrame();
  }

  jump(controlMethod: ControlMethod): void {
    if (this._state === "destroyed" || this._state === "paused" || this._state === "game_over") {
      return;
    }
    if (this._state === "ready") this.start(controlMethod);
    if (this._state !== "running") return;
    if (this.storyTimeline?.snapshot.trustCorridor) return;
    this.controlMethod = controlMethod;
    this.crouchHeld = false;
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
      return;
    }
    this.controlMethod = controlMethod;
    this.crouchHeld = active;
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
    activateTutorialPackages(this.packages);

    const random = new SeededRandom(mixSeed(this.baseSeed, this.runIndex));
    this.elapsedSeconds = 0;
    this.distancePixels = 0;
    this.packagesCollected = 0;
    this.bonusScore = 0;
    this.bossesDefeated = 0;
    this.bossDirector.reset();
    this.storyClimaxDirector.reset();
    this.storyObstacleTransformer.reset();
    this.storyClimaxesCompleted.clear();
    this.logisticWaveDirector.reset();
    this.bossStarted = false;
    this.crouchHeld = false;
    this.accumulator = 0;
    this.lastFrameTime = null;
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
    this.storyGapAssist = 0;
    this.recoverySeconds = 0;
    this.combo = 1;
    this.bestCombo = 1;
    this.warrantySaves = 0;
    this.activePowerUps.clear();
    this.storyTimeline = this.story
      ? new StoryTimeline(this.story, this.storyStartCheckpoint)
      : null;
    this.lastStorySignal = "";
    this.lastStoryCheckpoint = null;
    this.storyCompleteEmitted = false;
    this.lastTrustCorridor = this.storyTimeline?.snapshot.trustCorridor ?? false;
    this.symbolSpawnCooldown = 0;
    const collectedSymbols = this.storyTimeline?.collectedStorySymbolIndices ?? [];
    this.finaleSymbolDirector.reset(collectedSymbols);
    for (const type of Object.keys(this.packageTypeCounts) as PackageType[]) {
      this.packageTypeCounts[type] = 0;
    }
    this.factEngine = this.narrative ? new FactEngine(this.narrative.facts) : null;

    if (this.narrative && this.narrative.epochs.length > 0) {
      this.currentEpoch = this.storyTimeline?.snapshot.epochIndex ?? 0;
      this.furthestEpochReached = this.currentEpoch;
      const epoch = this.narrative.epochs[this.currentEpoch] ?? this.narrative.epochs[0]!;
      const allowed = epoch.obstaclePool
        .map((kind) => asObstacleKind(kind))
        .filter((kind): kind is ObstacleKind => kind !== null);
      this.spawner = new FairSpawner(
        random,
        epochSpeed(epoch, 0),
        allowed,
        true,
        this.story ? storyPowerUpsForEpoch(this.currentEpoch) : undefined
      );
      this.speed = epochSpeed(epoch, 0);
      this.storyClimaxDirector.enterEpoch(
        this.currentEpoch,
        epoch.challengeName ?? epoch.name,
        epoch.durationSeconds
      );
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
      const deltaSeconds = Math.min(
        GAMEPLAY.maxFrameSeconds,
        Math.max(0, (timestamp - this.lastFrameTime) / 1_000)
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

  private update(deltaSeconds: number): void {
    let storyCompletedThisStep = false;
    if (this.storyTimeline !== null) {
      const previousStory = this.storyTimeline.snapshot;
      if (previousStory.phase === "epoch" && previousStory.epochIndex === 4 &&
          previousStory.sectionDurationSeconds - previousStory.sectionElapsedSeconds <=
            deltaSeconds + 0.05) {
        this.guaranteeFinaleSymbols();
      }
      const nextStory = this.storyTimeline.advance(deltaSeconds);
      this.syncStorySection(previousStory, nextStory);
      this.emitStorySignals();
      storyCompletedThisStep = nextStory.completed;
    }

    if (this.storyTimeline === null && this.cutsceneRemaining > 0) {
      this.cutsceneRemaining -= deltaSeconds;
      if (this.cutsceneRemaining <= 0) {
        this.cutsceneRemaining = 0;
        this.enterEpoch(this.pendingEpoch);
      }
      return;
    }

    this.elapsedSeconds += deltaSeconds;
    this.recoverySeconds = Math.max(0, this.recoverySeconds - deltaSeconds);
    this.impactSeconds = Math.max(0, this.impactSeconds - deltaSeconds);
    this.impact = this.impactSeconds > 0;
    this.storyObstacleTransformer.advance(deltaSeconds);
    this.symbolSpawnCooldown = Math.max(0, this.symbolSpawnCooldown - deltaSeconds);
    if (storyCompletedThisStep) {
      this.completeStoryRun();
      return;
    }

    const trustCorridor = this.storyTimeline?.snapshot.trustCorridor ?? false;
    if (this.mode === "story" && !trustCorridor && this.recoverySeconds <= 0) {
      this.storyGapAssist = recoverStoryGapAssist(this.storyGapAssist, deltaSeconds);
    }
    if (trustCorridor && !this.lastTrustCorridor) {
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
      this.runner.crouching = false;
      for (const obstacle of this.obstacles) obstacle.active = false;
    }

    let difficulty = getDifficulty(this.elapsedSeconds);
    if (this.narrative && this.narrative.epochs.length > 0) {
      const epoch = this.narrative.epochs[this.currentEpoch] ?? this.narrative.epochs[0]!;
      this.epochElapsed = this.storyTimeline?.snapshot.phase === "epoch"
        ? this.storyTimeline.snapshot.sectionElapsedSeconds
        : this.epochElapsed + deltaSeconds;
      this.speed = epochSpeed(epoch, this.epochElapsed);
      this.difficultyLevel = 1 + Math.floor(this.epochElapsed / 12);
      difficulty = this.difficultyFromSpeed(this.speed);
    } else {
      difficulty = this.mode === "challenge" && this.challenge
        ? getChallengeDifficulty(this.elapsedSeconds, this.challenge)
        : getDifficulty(this.elapsedSeconds);
      this.speed = difficulty.speed;
      this.difficultyLevel = difficulty.level;
    }
    if (this.mode === "story" && this.storyGapAssist > 0) {
      difficulty = {
        ...difficulty,
        minimumGapSeconds: difficulty.minimumGapSeconds * (1 + this.storyGapAssist)
      };
    }

    const travelledPixels = this.speed * deltaSeconds;
    this.distancePixels += travelledPixels;

    stepRunnerPhysics(this.runner, deltaSeconds);
    this.runner.crouching = this.crouchHeld && this.runner.grounded;
    this.tickPowerUps(deltaSeconds);

    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;
      obstacle.x -= travelledPixels;
      if (obstacle.x + obstacle.width < -40) obstacle.active = false;
    }
    for (const parcel of this.packages) {
      if (!parcel.active) continue;
      parcel.x -= travelledPixels;
      if (parcel.x + parcel.size < -40) {
        if (parcel.kind === "story-symbol" && parcel.storySymbolIndex !== undefined) {
          this.finaleSymbolDirector.recordMiss(parcel.storySymbolIndex);
        }
        parcel.active = false;
      }
    }

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
    const climaxCommand = this.storyTimeline?.snapshot.phase === "epoch" &&
        this.currentEpoch < 4
      ? this.storyClimaxDirector.advance(
          deltaSeconds,
          this.epochElapsed,
          trustCorridor,
          routeClear,
          climaxHazardActive
        )
      : { type: "none" } as const;

    if (climaxCommand.type === "attack") {
      activateWave(
        {
          ...createBossAttackWave(climaxCommand.kind, WORLD_WIDTH - 130),
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

    const bossStartFraction = this.storyTimeline === null ? 0.55 : 0.2;
    if (epoch?.bossClimax && !this.bossStarted &&
        this.epochElapsed >= epoch.durationSeconds * bossStartFraction) {
      this.bossDirector.forceEncounter();
      this.bossStarted = true;
      if (this.storyTimeline !== null && this.currentEpoch === 4) {
        // The final wave explicitly brings back all three learned AMSO values
        // before its attacks; this trail contains every power-up at least once.
        activateBossReward(this.packages, true);
      }
    }

    const runBoss = this.mode !== "challenge" && (!this.narrative || epoch?.bossClimax === true);
    const bossCanWarnInCorridor = this.storyTimeline !== null &&
      (this.bossDirector.model.phase === "pending" || this.bossDirector.model.phase === "warning");
    const bossCommand = runBoss && (!trustCorridor || bossCanWarnInCorridor) &&
        this.recoverySeconds <= 0
      ? this.bossDirector.advance(deltaSeconds, this.elapsedSeconds, routeClear, bossHazardActive)
      : { type: "none" } as const;

    const logisticCommand = this.mode === "challenge" && this.recoverySeconds <= 0
      ? this.logisticWaveDirector.advance(
          deltaSeconds,
          this.elapsedSeconds,
          routeClear,
          bossHazardActive
        )
      : { type: "none" } as const;

    if (logisticCommand.type === "attack") {
      activateWave(
        createBossAttackWave(logisticCommand.kind, WORLD_WIDTH - 130),
        this.obstacles,
        this.packages
      );
    } else if (logisticCommand.type === "complete") {
      this.bonusScore += BOSS.scoreBonus;
      activateBossReward(this.packages, false);
    }

    if (bossCommand.type === "attack") {
      activateWave(
        createBossAttackWave(bossCommand.kind, WORLD_WIDTH - 130),
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

    if (this.storyTimeline?.snapshot.phase === "epoch" &&
        this.currentEpoch === 4 && this.bossStarted) {
      this.spawnFinaleSymbols();
    }

    if (!trustCorridor && this.recoverySeconds <= 0 &&
        !this.bossDirector.blocksRegularSpawns &&
        !this.logisticWaveDirector.blocksRegularSpawns &&
        !this.storyClimaxDirector.blocksRegularSpawns) {
      const wave = this.spawner.advance(
        spawnTravelDistance(travelledPixels, this.activePowerUps.has("audyt_jakosci")),
        this.speed,
        difficulty,
        WORLD_WIDTH + GAMEPLAY.spawnPadding
      );
      if (wave) activateWave(wave, this.obstacles, this.packages);
    }

    for (const parcel of this.packages) {
      if (!collectsPackage(this.runner, parcel)) continue;
      this.collectPackage(parcel);
    }

    for (const obstacle of this.obstacles) {
      if (!collidesWithObstacle(this.runner, obstacle)) continue;
      const resolution = resolveCollision(
        this.mode,
        this.activePowerUps.has("gwarancja_48")
      );
      this.collisions += 1;
      this.epochCollisions += 1;
      this.epochHit = true;
      this.impactSeconds = 0.13;
      this.impact = true;
      if (this.mode === "story") {
        this.storyGapAssist = storyGapAssistAfterCollision(
          this.storyGapAssist,
          this.epochCollisions
        );
      }

      if (resolution.consumeWarranty) {
        if (this.activePowerUps.consumeWarranty()) this.warrantySaves += 1;
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
      for (const activeObstacle of this.obstacles) activeObstacle.active = false;
      if (obstacle.source === "boss" && this.storyTimeline !== null) {
        const bossResolution = this.bossDirector.advance(
          0,
          this.elapsedSeconds,
          true,
          false
        );
        if (bossResolution.type === "complete") this.completeBossEncounter();
      } else if (obstacle.source === "boss" && this.mode === "challenge" &&
          !resolution.finishRun) {
        this.logisticWaveDirector.advance(0, this.elapsedSeconds, true, false);
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
    if (parcel.kind === "story-symbol") {
      const symbolIndex = parcel.storySymbolIndex;
      if (symbolIndex !== undefined && this.storyTimeline?.collectStorySymbol(symbolIndex)) {
        this.finaleSymbolDirector.recordCollected(symbolIndex);
      }
      this.emitSnapshot();
      return;
    }
    const collection = resolvePackageCollection(
      parcel.kind,
      parcel.scoreValue,
      this.combo,
      this.activePowerUps.has("drugie_zycie")
    );
    if (collection.countsAsPackage) {
      this.packagesCollected += 1;
      this.bonusScore += collection.bonusScoreAwarded;
      this.combo = collection.nextCombo;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.packageTypeCounts[parcel.packageType] += 1;
      this.totalWeightKg += parcel.weightKg;
      this.factEngine?.recordPackage(parcel.packageType, parcel.weightKg);
    } else if (parcel.kind !== "standard" && parcel.kind !== "golden") {
      this.activatePowerUp(parcel.kind);
    }
    this.emitUnlockedFacts();
  }

  private spawnFinaleSymbols(): void {
    if (this.symbolSpawnCooldown > 0 || !this.storyTimeline) return;
    const active = this.packages
      .filter(({ active: isActive, kind }) => isActive && kind === "story-symbol")
      .map(({ storySymbolIndex }) => storySymbolIndex)
      .filter((index): index is number => index !== undefined);
    const planned = this.finaleSymbolDirector.planSpawns(
      this.storyTimeline.collectedStorySymbolIndices,
      active,
      1
    );
    const symbolIndex = planned[0];
    if (symbolIndex === undefined || !this.placeStorySymbol(symbolIndex, false)) return;
    this.symbolSpawnCooldown = 0.58;
  }

  private guaranteeFinaleSymbols(): void {
    if (!this.storyTimeline) return;
    const planned = this.finaleSymbolDirector.planGuaranteedSpawns(
      this.storyTimeline.collectedStorySymbolIndices
    );
    for (const symbolIndex of planned) {
      if (!this.placeStorySymbol(symbolIndex, true)) continue;
      const parcel = this.packages.find(
        ({ active, kind, storySymbolIndex: activeIndex }) =>
          active && kind === "story-symbol" && activeIndex === symbolIndex
      );
      if (parcel && collectsPackage(this.runner, parcel)) this.collectPackage(parcel);
    }
  }

  private placeStorySymbol(symbolIndex: number, guaranteed: boolean): boolean {
    let parcel = this.packages.find(
      ({ active, kind, storySymbolIndex: activeIndex }) =>
        active && kind === "story-symbol" && activeIndex === symbolIndex
    );
    parcel ??= this.packages.find(({ active }) => !active);
    if (!parcel && guaranteed) {
      parcel = this.packages.find(({ kind }) => kind !== "story-symbol");
    }
    if (!parcel) return false;

    parcel.active = true;
    parcel.kind = "story-symbol";
    parcel.storySymbolIndex = symbolIndex;
    parcel.scoreValue = 0;
    parcel.size = 30;
    parcel.x = guaranteed ? this.runner.x + 18 : WORLD_WIDTH - 150;
    parcel.y = guaranteed ? this.runner.y + 28 : GROUND_Y - parcel.size - 8;
    parcel.phase = symbolIndex * 0.7;
    parcel.packageType = "notebook";
    parcel.weightKg = 0;
    this.finaleSymbolDirector.recordSpawn(symbolIndex);
    return true;
  }

  private positiveMotifForEpoch(epochIndex: number): StoryPositiveMotif {
    return [
      "ordered-cables",
      "quality-mark",
      "piggy-bank",
      "sorting-network"
    ][Math.max(0, Math.min(3, epochIndex))] as StoryPositiveMotif;
  }

  private activatePowerUp(kind: PowerUpKind): void {
    this.activePowerUps.activate(kind);
  }

  private completeBossEncounter(): void {
    this.bossesDefeated += 1;
    this.bonusScore += BOSS.scoreBonus;
    activateBossReward(this.packages, this.narrative !== null);
  }

  private tickPowerUps(deltaSeconds: number): void {
    this.activePowerUps.tick(deltaSeconds);
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
    if (previous.sectionId === next.sectionId) return;

    if (previous.phase === "epoch") {
      this.factEngine?.recordEpochCompleted(previous.epochIndex, !this.epochHit);
      this.emitUnlockedFacts();
      try {
        this.callbacks.onEpochCompleted?.(previous.epochIndex, !this.epochHit);
      } catch {
        // Host callbacks are isolated from the game loop.
      }
    }

    if (next.phase === "epoch") {
      this.enterEpoch(next.epochIndex);
      this.epochElapsed = next.sectionElapsedSeconds;
    } else if (next.phase === "finale") {
      for (const obstacle of this.obstacles) obstacle.active = false;
      this.storyClimaxDirector.reset();
      this.bossDirector.reset();
      this.bossStarted = false;
    }
  }

  private storyCheckpointFor(snapshot: StoryTimelineSnapshot): StoryStartCheckpoint {
    if (snapshot.phase === "completed") return "completed";
    if (snapshot.phase === "prologue") return "prologue";
    if (snapshot.phase === "finale") return "finale";
    return `epoch_${snapshot.epochIndex + 1}` as StoryStartCheckpoint;
  }

  private emitStorySignals(force = false): void {
    const snapshot = this.storyTimeline?.snapshot;
    if (!snapshot) return;

    const signal = [
      snapshot.phase,
      snapshot.sectionId,
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

    const checkpoint = this.storyCheckpointFor(snapshot);
    if (checkpoint !== this.lastStoryCheckpoint) {
      this.lastStoryCheckpoint = checkpoint;
      try {
        this.callbacks.onStoryCheckpoint?.(checkpoint);
      } catch {
        // Host callbacks are isolated from the game loop.
      }
    }
  }

  private completeStoryRun(): void {
    if (!this.storyCompleteEmitted) {
      this.storyCompleteEmitted = true;
      try {
        this.callbacks.onStoryComplete?.();
      } catch {
        // Host callbacks are isolated from the game loop.
      }
    }
    this.finishRun("completion", "victory", this.currentEpoch);
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
    this.storyGapAssist = 0;
    this.furthestEpochReached = Math.max(this.furthestEpochReached, index);
    this.cutscene = null;
    const random = new SeededRandom(mixSeed(this.baseSeed, this.runIndex + index * 97));
    const allowed = epoch.obstaclePool
      .map((kind) => asObstacleKind(kind))
      .filter((kind): kind is ObstacleKind => kind !== null);
    this.spawner = new FairSpawner(
      random,
      epochSpeed(epoch, 0),
      allowed,
      true,
      this.story ? storyPowerUpsForEpoch(index) : undefined
    );
    this.storyClimaxDirector.enterEpoch(
      index,
      epoch.challengeName ?? epoch.name,
      epoch.durationSeconds
    );
    this.speed = epochSpeed(epoch, 0);
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
    const activeStorySymbolIds = this.packages
      .filter(({ active, kind }) => active && kind === "story-symbol")
      .map(({ storySymbolIndex }) => storySymbolIndex)
      .filter((index): index is number => index !== undefined)
      .sort((left, right) => left - right);
    return {
      mode: this.mode,
      score: calculateScore(this.distancePixels, this.packagesCollected, this.bonusScore),
      packagesCollected: this.packagesCollected,
      collisions: this.collisions,
      recoverySeconds: round(this.recoverySeconds, 2),
      combo: this.combo,
      bestCombo: this.bestCombo,
      warrantySaves: this.warrantySaves,
      storyPhase: storySnapshot?.phase ?? null,
      storyProgress: storySnapshot?.progress ?? 0,
      activeStoryBeatIds: storySnapshot?.activeBeats.map(({ id }) => id) ?? [],
      trustCorridor: storySnapshot?.trustCorridor ?? false,
      storySymbols: storySnapshot?.symbolsCollected ?? 0,
      activeStorySymbolIds,
      storySymbolRespawns: this.finaleSymbolDirector.respawnCount,
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
      bossesDefeated: this.bossesDefeated,
      bossPhase: this.bossDirector.model.phase,
      bossProgress: this.bossDirector.model.attacksSurvived,
      bossAttackCount: this.bossDirector.model.attackCount,
      distanceM,
      durationSeconds: round(this.elapsedSeconds, 2),
      difficultyLevel: this.difficultyLevel,
      speed: round(this.speed, 1),
      epochIndex: this.currentEpoch,
      epochName: epoch?.name ?? "",
      epochYear: epoch?.year ?? "",
      epochIndexMax: epochMax,
      epochProgress: Math.min(1, this.epochElapsed / epochDuration),
      packageTypeCounts: { ...this.packageTypeCounts },
      totalWeightKg: Math.round(this.totalWeightKg),
      activePowerUps: this.activePowerUps.keys(),
      factsUnlockedCount: this.factsUnlockedCount
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
    const scene: RenderScene = {
      state: this._state,
      runner: this.runner,
      obstacles: this.obstacles,
      packages: this.packages,
      boss: this.bossDirector.model,
      elapsedSeconds: this.elapsedSeconds,
      distancePixels: this.distancePixels,
      speed: this.speed,
      reducedMotion: this.reducedMotion,
      impact: this.impact,
      epochIndex: this.currentEpoch,
      epochName: this.narrative?.epochs[this.currentEpoch]?.name ?? "",
      epochYear: this.narrative?.epochs[this.currentEpoch]?.year ?? "",
      themeIndex: this.narrative?.epochs[this.currentEpoch]?.themeIndex ?? -1,
      cutscene: this.cutscene,
      activePowerUps: this.activePowerUps.keys(),
      mode: this.mode,
      trustCorridor: this.storyTimeline?.snapshot.trustCorridor ?? false,
      combo: this.combo,
      recoverySeconds: this.recoverySeconds,
      storyPhase: this.storyTimeline?.snapshot.phase ?? null,
      storyProgress: this.storyTimeline?.snapshot.progress ?? 0,
      storySymbols: this.storyTimeline?.snapshot.symbolsCollected ?? 0,
      storyClimax: this.storyClimaxDirector.model,
      obstacleTransformations: this.storyObstacleTransformer.models
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
    if (this.document.visibilityState === "hidden") this.pause();
  };

  private readonly handleWindowBlur = (): void => {
    this.pause();
  };

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
    }, 16);
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
