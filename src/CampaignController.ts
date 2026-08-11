import { DataLayerTracker } from "./analytics/data-layer";
import {
  AssetBundleLoadError,
  AssetBundleLoader
} from "./assets/AssetBundleLoader";
import {
  nextWorldAssetBundle,
  requiredStartAssetBundles
} from "./assets/asset-bundle-plan";
import {
  CampaignAudio,
  type CampaignAudioCue,
  type CampaignMusicState
} from "./audio/CampaignAudio";
import type {
  GameResult,
  GameSnapshot,
  RunnerGameCallbacks
} from "./game/contracts";
import { RunnerGame } from "./game/RunnerGame";
import type { StoryTimelineSnapshot } from "./game/story-timeline";
import { PlayerProfileStore } from "./profile";
import { RecordsClient } from "./records-client";
import { QaSessionReportCollector } from "./qa/session-report";
import type { RunnerConfig } from "./shared/types";
import {
  CampaignShell,
  type CampaignStartRequest
} from "./ui/CampaignShell";
import {
  campaignWorld,
  sceneVisualState,
  storyPageVisualStateId,
  type CampaignWorldId
} from "./visuals/scene-manifest";
import type { QaBootConfig } from "./qa/boot-config";
import { DecodedImageStore } from "./assets/DecodedImageStore";
import {
  COURIER_CROUCH_SPRITE_PATH,
  COURIER_JUMP_SPRITE_PATH,
  COURIER_SPRITE_PATH,
  OBSTACLE_ASSET_PATHS,
  ORDER_ATLAS_PATH,
  PARCEL_CELEBRATION_FRAME_PATHS,
  POWER_UP_ATLAS_PATH,
  OVERHEAD_VARIANT_ASSET_PATHS,
  RunnerArtwork
} from "./game/runner-artwork";
import {
  PERFORMANCE_REFERENCE_V1,
  checkpointMatches,
  validateScenarioRun,
  type ScenarioValidationResult
} from "./qa/performance-reference-v1";
import { exactDeterminismArtifact, type ExactDeterminismArtifact } from "./qa/determinism";
import { evaluatePerformanceReleaseGate } from "./qa/release-gate";
import { createCampaignI18n, type CampaignI18n } from "./localization";
import { campaignUrl } from "./localization/idosell-deployment";

export interface CampaignRuntimeOptions {
  readonly qa?: QaBootConfig;
  readonly onLanguageChange?: (locale: CampaignI18n["locale"]) => void;
}

type AnalyticsConsentWindow = Window & { AMSOAnalyticsConsent?: boolean };

function hasAnalyticsConsent(): boolean {
  try {
    return (window as AnalyticsConsentWindow).AMSOAnalyticsConsent === true ||
      document.documentElement.dataset.analyticsConsent === "granted";
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

const AUDIO_CHAPTERS = [
  "first-package",
  "order-backlog",
  "quality-process",
  "client-growth",
  "order-scale",
  "million-threshold"
] as const;

export function authoredAudioFeedback(snapshot: Readonly<GameSnapshot>): {
  music: CampaignMusicState;
  resultKey: string | null;
  resultCue: CampaignAudioCue | null;
  completionCue: CampaignAudioCue | null;
} {
  const authored = snapshot.authoredWave;
  const chapter = authored === null
    ? 0
    : Math.max(0, AUDIO_CHAPTERS.indexOf(authored.microlevelId) + 1);
  const finaleLayer = authored?.microlevelId === "million-threshold"
    ? Math.max(0, Math.min(4, Math.ceil((authored.wavesCompleted / Math.max(1, authored.waveTarget)) * 4)))
    : 0;
  const result = authored?.lastResult ?? null;
  return {
    music: {
      chapter,
      phase: snapshot.authoredWavePhase === "burst" ? "burst" : "breath",
      finaleLayer: finaleLayer as CampaignMusicState["finaleLayer"]
    },
    resultKey: authored && result
      ? `${authored.microlevelId}:${result.waveId}:${result.attempts}:${result.passed}:${authored.wavesCompleted}`
      : null,
    resultCue: result === null
      ? null
      : result.perfect
        ? "wave-perfect"
        : result.passed
          ? "wave-success"
          : "wave-retry",
    completionCue: authored?.completed === true
      ? authored.microlevelId === "million-threshold" ? "million" : "chapter-complete"
      : null
  };
}

export class CampaignController {
  private readonly profile: PlayerProfileStore;
  private readonly recordsClient: RecordsClient;
  private readonly tracker: DataLayerTracker;
  private readonly shell: CampaignShell;
  private readonly audio: CampaignAudio;
  private readonly assetLoader: AssetBundleLoader;
  private readonly decodedImageStore = new DecodedImageStore();
  private game: RunnerGame | null = null;
  private detachGameGeometry: (() => void) | null = null;
  private lastSnapshot: GameSnapshot | null = null;
  private lastTrustCorridor = false;
  private lastStorySegmentId = "";
  private lastStorySceneId = "";
  private lastStoryCountdownValue: 3 | 2 | 1 | null = null;
  private lastVisualWorldId: CampaignWorldId | null = null;
  private lastLogisticPhase: GameSnapshot["logisticWavePhase"] = "inactive";
  private lastWaveAudioKey = "";
  private readonly shownPowerUpHints = new Set<string>();
  private readonly qaReport = new QaSessionReportCollector();
  private pendingStart: CampaignStartRequest | null = null;
  private startToken = 0;
  private destroyed = false;
  private scenarioArtifact: ExactDeterminismArtifact<Readonly<Record<string, unknown>>> | null = null;
  private scenarioValidation: ScenarioValidationResult | null = null;
  private scenarioInitialCheckpointPassed = false;
  private scenarioCheckpointResults: Array<{
    completedThroughStep: number;
    passed: boolean;
  }> = [];

  public constructor(
    host: HTMLElement,
    private readonly config: RunnerConfig,
    profile = new PlayerProfileStore(),
    assetLoader?: AssetBundleLoader,
    private readonly runtime: CampaignRuntimeOptions = {},
    private readonly i18n: CampaignI18n = createCampaignI18n("pl")
  ) {
    this.profile = profile;
    this.recordsClient = new RecordsClient(config.recordsApi ?? "/api/records", {
      readsEnabled: runtime.qa === undefined,
      writesEnabled: runtime.qa === undefined
    });
    this.tracker = new DataLayerTracker({
      gameVersion: config.gameVersion,
      locale: i18n.locale,
      consentGranted: runtime.qa === undefined && hasAnalyticsConsent
    });
    this.audio = new CampaignAudio({
      muted: runtime.qa?.audio === "muted" || profile.snapshot.soundMuted
    });
    this.assetLoader = assetLoader ?? new AssetBundleLoader(config.assets.bundles, {
      decodedImageStore: this.decodedImageStore
    });
    this.shell = new CampaignShell(host, {
      onStart: (request) => {
        void this.startRun(request);
      },
      onPause: () => this.pause(),
      onResume: () => this.resume(),
      onRestart: (mode) => {
        void this.startRun({
          mode,
          restartStory: mode === "story"
        });
      },
      onReturnToMenu: () => this.returnToMenu(),
      onRetryLoad: () => {
        if (this.pendingStart !== null) void this.startRun(this.pendingStart);
        else this.showLanding();
      },
      onJump: (method) => {
        this.audio.playCue("jump");
        this.game?.jump(method);
      },
      onSlide: (active, method) => {
        if (active) this.audio.playCue("slide");
        this.game?.crouch(active, method);
      },
      onMuteChange: (muted) => {
        this.profile.setSoundMuted(muted);
        this.audio.setMuted(muted);
      },
      onFullscreenPreferenceChange: (choice) => this.profile.setFullscreenPreference(choice),
      onStoryContinue: (sceneId) => {
        this.game?.continueStoryScene(sceneId);
      },
      onLanguageChange: runtime.onLanguageChange
    }, {
      keyboardProfile: host.dataset.campaignKeyboardProfile === "vercel"
        ? "vercel"
        : "idosell",
      languageSelector: runtime.onLanguageChange !== undefined,
      campaignUrl: campaignUrl(this.i18n.locale),
      fullStoryUrl: campaignUrl(this.i18n.locale),
      recordsClient: this.recordsClient,
      profile: this.profile,
      copy: {
        ...config.ui,
        startChallenge: config.cta.challengeLabel,
        fullStory: config.cta.campaignLabel
      },
      ...(runtime.qa === undefined ? {} : {
        qaDpr: runtime.qa.dpr,
        qaBadgeText: `QA PERFORMANCE\n${runtime.qa.scenarioId}\n${runtime.qa.quality.toUpperCase()} · ${runtime.qa.motion.toUpperCase()} · AUDIO ${runtime.qa.audio.toUpperCase()} · DPR ${runtime.qa.dpr}`
      }),
      decodedImageStore: this.decodedImageStore,
      i18n: this.i18n
    });

    this.showLanding();
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.startToken += 1;
    this.destroyGame();
    this.shell.destroy();
    this.decodedImageStore.destroy();
    void this.audio.destroy();
  }

  private showLanding(): void {
    if (this.destroyed) return;
    this.shell.showLanding({
      challengeUnlocked: this.profile.snapshot.storyCompleted,
      fullscreenPreference: this.profile.snapshot.fullscreenPreference,
      muted: this.profile.snapshot.soundMuted
    });
  }

  private async startRun(request: CampaignStartRequest): Promise<void> {
    if (this.destroyed) return;
    const qaScenario = this.runtime.qa !== undefined;
    const requested = qaScenario ? { mode: "challenge" as const, restartStory: false } : request;
    const safeRequest = requested.mode === "challenge" && !this.profile.snapshot.storyCompleted && !qaScenario
      ? { mode: "story" as const, restartStory: false }
      : requested;
    this.pendingStart = safeRequest;
    const token = ++this.startToken;
    this.destroyGame();
    this.lastSnapshot = null;
    this.lastTrustCorridor = false;
    this.lastStorySegmentId = "";
    this.lastStorySceneId = "";
    this.lastVisualWorldId = null;
    this.lastLogisticPhase = "inactive";
    this.lastWaveAudioKey = "";
    this.shownPowerUpHints.clear();
    this.scenarioCheckpointResults = [];
    this.shell.showLoading(undefined);

    if (this.config.audio.enabled && this.runtime.qa?.audio !== "disabled") void this.audio.start();

    try {
      const requiredBundles = requiredStartAssetBundles(safeRequest.mode);
      await this.assetLoader.ensureBundles(requiredBundles, ({
        readyCritical,
        totalCritical
      }) => {
        if (!this.destroyed && token === this.startToken) {
          this.shell.showLoading(
            totalCritical === 0 ? 1 : readyCritical / totalCritical,
            this.uiCopy("loading", "Przygotowujemy pierwszą paczkę…")
          );
        }
      });
      const runnerArtwork = await this.loadRunnerArtwork();
      if (this.destroyed || token !== this.startToken) return;
      runnerArtwork.prepareForFirstFrame();
      if (safeRequest.mode === "challenge") {
        await this.shell.prepareChallengeWorlds();
      }
      await this.shell.waitForWorldPresentation();
      // The page shell is already present; this paint is the real hand-off from
      // resource readiness to Canvas/context readiness.
      await nextPaint();
      if (this.destroyed || token !== this.startToken) return;
      const callbacks = this.createGameCallbacks();
      const reducedMotion = this.runtime.qa?.motion === "reduced"
        ? true
        : this.runtime.qa?.motion === "full"
          ? false
          : prefersReducedMotion();
      this.game = new RunnerGame(this.shell.canvas, callbacks, {
        reducedMotion,
        mode: safeRequest.mode,
        story: safeRequest.mode === "story" ? this.config.story : null,
        challenge: this.config.challenge,
        bestChallengeOrdersAtStart: this.profile.snapshot.bestChallengeOrders,
        awardStoryCompletionBonus: safeRequest.mode === "story" &&
          !this.profile.snapshot.storyCompleted,
        powerUpCopy: {
          gwarancja_48: [
            this.uiCopy("parcelWarrantyLine1", "GWARANCJA"),
            this.uiCopy("parcelWarrantyLine2", "AMSO CARE")
          ],
          podwojny_wynik: [
            this.uiCopy("parcelSecondLifeLine1", "2×"),
            this.uiCopy("parcelSecondLifeLine2", "PUNKTY")
          ]
        },
        formatInteger: this.i18n.formatInteger,
        millionCounterLabel: this.i18n.translate("ZAMÓWIEŃ").toLocaleUpperCase(this.i18n.intlLocale),
        visualFrameSink: (visualDistancePixels, interpolationAlpha) => {
          this.shell.updateVisualFrame(
            visualDistancePixels,
            interpolationAlpha,
            reducedMotion
          );
        },
        qualityCommitContext: () => this.shell.qualityCommitContext(),
        qualityMode: this.runtime.qa?.quality ?? "auto",
        runnerArtwork,
        ...(qaScenario ? {
          seed: PERFORMANCE_REFERENCE_V1.seed,
          qaScenarioActive: true,
          replayInputs: PERFORMANCE_REFERENCE_V1.inputs,
          scenarioDurationSteps: PERFORMANCE_REFERENCE_V1.durationSteps,
          challengeWorldDurationSeconds:
            PERFORMANCE_REFERENCE_V1.challengeWorldDurationSeconds,
          scenarioCheckpointSteps: PERFORMANCE_REFERENCE_V1.expectedCheckpoints
            .map(({ completedThroughStep }) => completedThroughStep)
            .filter((completedThroughStep) => completedThroughStep >= 0),
          onScenarioCheckpoint: (completedThroughStep, canonicalState) => {
            const checkpoint = PERFORMANCE_REFERENCE_V1.expectedCheckpoints.find(
              (candidate) => candidate.completedThroughStep === completedThroughStep
            );
            this.scenarioCheckpointResults.push({
              completedThroughStep,
              passed: checkpoint !== undefined &&
                checkpointMatches(checkpoint, canonicalState)
            });
          },
          onQaAbort: () => this.shell.showError("QA Scenario failed: input queue overflow."),
          onScenarioComplete: () => {
            if (this.game?.isReplayValid) {
              this.scenarioArtifact = exactDeterminismArtifact(
                this.game.canonicalDeterministicState()
              );
              this.scenarioValidation = validateScenarioRun(PERFORMANCE_REFERENCE_V1, {
                completedThroughStep: PERFORMANCE_REFERENCE_V1.durationSteps - 1,
                checkpointResults: this.scenarioCheckpointResults,
                coverage: this.game.scenarioCoverage(),
                finalDigest: this.scenarioArtifact.digest,
                expectedFinalDigest: PERFORMANCE_REFERENCE_V1.expectedFinalDigest,
                inputQueueOverflows: 0
              });
            }
            this.shell.announce("QA Performance Scenario complete.");
          }
        } : {})
      });
      if (qaScenario) {
        const initial = PERFORMANCE_REFERENCE_V1.expectedCheckpoints[0];
        this.scenarioInitialCheckpointPassed = initial !== undefined &&
          checkpointMatches(initial, this.game.canonicalDeterministicState());
        this.scenarioCheckpointResults.push({
          completedThroughStep: -1,
          passed: this.scenarioInitialCheckpointPassed
        });
      }
      this.scheduleCelebrationArtworkWarmup(runnerArtwork, token);
      const game = this.game;
      this.detachGameGeometry = this.shell.attachGameGeometry(game, () => {
        if (this.destroyed || token !== this.startToken || this.game !== game) return;
        this.shell.showGame(safeRequest.mode);
        game.start("pointer");
        this.tracker.track("game_started", { mode: safeRequest.mode });
      });
    } catch (error: unknown) {
      this.destroyGame();
      this.tracker.loadFailed(
        error instanceof AssetBundleLoadError ? error.code : "runtime_init_failed"
      );
      this.shell.showError();
    }
  }

  private createGameCallbacks(): RunnerGameCallbacks {
    return {
      onStateChange: (state) => {
        if (state === "paused") this.shell.setPaused(true);
      },
      onSnapshot: (snapshot) => this.handleSnapshot(snapshot),
      onGameOver: (result) => this.handleGameOver(result),
      onStoryUpdate: (update) => this.handleStoryUpdate(update),
      onStoryComplete: () => {
        this.profile.completeStory();
        this.tracker.track("story_completed", {});
      },
      onStoryObjectiveCompleted: (objectiveId) => {
        const label = {
          "epoch_1.training": "Skok i ślizg opanowane.",
          "epoch_1.order_backlog": "Zator Zamówień opanowany.",
          "epoch_2.quality_series": "SPRAWDZONY — cztery serie ukończone.",
          "epoch_3.matching_creative": "Pierwszy zestaw dopasowany.",
          "epoch_3.matching_growth": "Drugi zestaw dopasowany.",
          "epoch_3.matching_trust": "Trzeci zestaw dopasowany.",
          "epoch_4.order_peak": "Sześć zamówień gotowych.",
          "epoch_4.order_peak_final": "Szczyt Zamówień opanowany.",
          "epoch_5.million_threshold": "1 000 000 zamówień. Droga trwa dalej."
        }[objectiveId];
        this.shell.announce(this.i18n.translate(label));
      },
      onSpecialPickup: (kind) => {
        if (this.shownPowerUpHints.has(kind)) return;
        this.shownPowerUpHints.add(kind);
        const copy = {
          podwojny_wynik: "2× WYNIK — punkty za każde zamówienie liczą się podwójnie.",
          gwarancja_48: this.uiCopy(
            "powerupWarranty",
            "GWARANCJA AMSO CARE — uratuje jedną próbę w Trybie Wyzwania."
          )
        } as const;
        this.shell.showPickupNotice(this.i18n.translate(copy[kind]));
      },
      onCollectiblePickup: (pickup) => {
        if (pickup.collectibleClass === "equipment") {
          this.audio.playEquipmentPickup();
          this.shell.showPickupNotice(`+${pickup.basePoints}`, "equipment", 600);
        } else {
          this.audio.playParcelPickup(pickup.combo);
          this.shell.showPickupNotice(`+${pickup.basePoints}`, "parcel", 600);
        }
      },
      onMilestoneCelebration: (celebration) => {
        this.audio.playMilestoneCue(celebration.kind, celebration.intensity);
        if (celebration.achievement === "record") this.audio.playRecordCue();
        this.shell.announce(this.i18n.translate(celebration.text));
      },
      onModeChange: (mode) => {
        this.shell.showStoryObjective(null);
        this.shell.showGame(mode);
        if (mode === "challenge") {
          this.shell.announce(this.i18n.translate(
            "Tryb Wyzwania. Wynik i zamówienia zostały zachowane. Tempo rośnie, a pierwsze niezabezpieczone zderzenie kończy bieg."
          ));
        }
        this.tracker.track("game_started", { mode });
      }
    };
  }

  private async loadRunnerArtwork(): Promise<RunnerArtwork> {
    const load = (assetId: string, source: string) =>
      this.decodedImageStore.load(assetId, source).then(({ image }) => image);
    // Decode serially: mobile browsers can otherwise spike memory and main-thread work.
    const orders = await load("order-atlas", ORDER_ATLAS_PATH);
    const powerUps = await load("power-up-atlas", POWER_UP_ATLAS_PATH);
    const courier = await load("courier-run-sheet", COURIER_SPRITE_PATH);
    const courierCrouch = await load("courier-crouch", COURIER_CROUCH_SPRITE_PATH);
    const courierJump = await load("courier-jump-sheet", COURIER_JUMP_SPRITE_PATH);
    const boxStack = await load("obstacle-box-stack", OBSTACLE_ASSET_PATHS["box-stack"]);
    const pallet = await load("obstacle-pallet", OBSTACLE_ASSET_PATHS.pallet);
    const trolley = await load("obstacle-trolley", OBSTACLE_ASSET_PATHS.trolley);
    const overhead = await load("obstacle-overhead", OBSTACLE_ASSET_PATHS.overhead);
    const overheadDoor = await load("obstacle-overhead-door", OVERHEAD_VARIANT_ASSET_PATHS[1]!);
    const overheadConveyor = await load("obstacle-overhead-conveyor", OVERHEAD_VARIANT_ASSET_PATHS[2]!);
    if (!orders || !powerUps || !courier || !courierCrouch || !courierJump || !boxStack ||
        !pallet || !trolley || !overhead || !overheadDoor || !overheadConveyor) {
      throw new Error("critical_runner_artwork_missing");
    }
    return new RunnerArtwork({
      orders,
      powerUps,
      courier,
      courierCrouch,
      courierJump,
      obstacles: { "box-stack": boxStack, pallet, trolley, overhead },
      overheadVariants: [overhead, overheadDoor, overheadConveyor],
      parcelFrames: []
    });
  }

  private scheduleCelebrationArtworkWarmup(artwork: RunnerArtwork, token: number): void {
    let index = 0;
    const scheduleNext = (): void => {
      if (this.destroyed || token !== this.startToken || index >= PARCEL_CELEBRATION_FRAME_PATHS.length) return;
      const run = (): void => {
        if (this.destroyed || token !== this.startToken) return;
        if (!this.shell.isDecodeSafePhase()) {
          window.setTimeout(scheduleNext, 250);
          return;
        }
        const current = index++;
        void this.decodedImageStore.load(
          `parcel-celebration-${current + 1}`,
          PARCEL_CELEBRATION_FRAME_PATHS[current]!
        ).then(({ image }) => {
          if (this.destroyed || token !== this.startToken) return;
          artwork.installParcelFrame(current, image);
          scheduleNext();
        }).catch(() => scheduleNext());
      };
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => run());
      } else {
        const runWhenPaused = (): void => {
          if (this.destroyed || token !== this.startToken) return;
          if (this.game?.state === "running") {
            window.setTimeout(runWhenPaused, 250);
            return;
          }
          run();
        };
        window.setTimeout(runWhenPaused, 50);
      }
    };
    scheduleNext();
  }

  private handleSnapshot(snapshot: GameSnapshot): void {
    this.qaReport.record(snapshot);
    const authoredAudio = authoredAudioFeedback(snapshot);
    this.audio.setMusicState(authoredAudio.music);
    if (authoredAudio.resultKey !== null && authoredAudio.resultKey !== this.lastWaveAudioKey) {
      this.lastWaveAudioKey = authoredAudio.resultKey;
      if (authoredAudio.resultCue !== null) this.audio.playCue(authoredAudio.resultCue);
      if (authoredAudio.completionCue !== null) this.audio.playCue(authoredAudio.completionCue);
    }
    const previous = this.lastSnapshot;
    if (previous !== null) {
      if (snapshot.collisions > previous.collisions) {
        this.audio.playCue("collision");
      }
      if (snapshot.warrantySaves > previous.warrantySaves) {
        this.shell.showPickupNotice(this.uiCopy(
          "warrantyConsumed",
          "GWARANCJA AMSO CARE zadziałała — próba trwa dalej."
        ));
      }
      const activatedPowerUp = snapshot.activePowerUps.find(
        (kind) => !previous.activePowerUps.includes(kind)
      );
      if (activatedPowerUp !== undefined) {
        this.audio.playPowerUpCue(activatedPowerUp);
      }
    }
    this.lastSnapshot = snapshot;
    this.shell.update(snapshot);
    if (snapshot.mode === "challenge" && snapshot.logisticWavePhase !== this.lastLogisticPhase) {
      this.lastLogisticPhase = snapshot.logisticWavePhase;
      if (snapshot.logisticWavePhase === "warning") {
        this.shell.announce(this.uiCopy("logisticWarning", "Uwaga: fala logistyczna"));
      } else if (snapshot.logisticWavePhase === "reward") {
        this.shell.announce(this.uiCopy(
          "logisticReward",
          "Fala opanowana — droga jest czysta."
        ));
      }
    }
  }

  public qaReportText(): string {
    if (this.runtime.qa === undefined) return this.qaReport.text(this.shell.geometryDiagnostics);
    const session = this.qaReport.snapshot(this.shell.geometryDiagnostics);
    return JSON.stringify({
      qaRunConfiguration: {
        qaMode: "performance",
        scenarioId: this.runtime.qa.scenarioId,
        scenarioConfigVersion: PERFORMANCE_REFERENCE_V1.configVersion,
        seed: PERFORMANCE_REFERENCE_V1.seed,
        inputTraceDigest: exactDeterminismArtifact(PERFORMANCE_REFERENCE_V1.inputs).digest,
        challengeWorldDurationSeconds:
          PERFORMANCE_REFERENCE_V1.challengeWorldDurationSeconds,
        qualityRequest: this.runtime.qa.quality,
        motionRequest: this.runtime.qa.motion,
        resolvedMotionPreference: this.runtime.qa.motion === "reduced" ||
          (this.runtime.qa.motion === "system" && prefersReducedMotion())
          ? "reduced-motion"
          : "full-motion",
        audioMode: this.runtime.qa.audio,
        requestedDpr: this.runtime.qa.dpr,
        effectiveDpr: this.runtime.qa.dpr,
        externalWritesDisabled: true
      },
      session,
      scenarioArtifact: this.scenarioArtifact,
      scenarioCheckpoints: this.scenarioCheckpointResults,
      scenarioValidation: this.scenarioValidation,
      releaseGate: evaluatePerformanceReleaseGate({
        inputQueueOverflows: session.inputQueueOverflows,
        reportMetadataComplete: false,
        minimumProfileDeviceAvailable: false,
        checkpointsPassed: this.scenarioValidation?.checkpointsPassed,
        digestPassed: this.scenarioValidation?.digestPassed,
        requiredCoveragePassed: this.scenarioValidation?.coveragePassed
      })
    }, null, 2);
  }

  private handleStoryUpdate(update: StoryTimelineSnapshot): void {
    if (update.state !== "countdown") {
      this.lastStoryCountdownValue = null;
    }
    if (update.trustCorridor !== this.lastTrustCorridor) {
      this.audio.playCue(update.trustCorridor ? "corridor-enter" : "corridor-exit");
      if (!update.trustCorridor) {
        this.shell.announce(this.uiCopy("corridorResume", "Biegniemy dalej."));
      }
      this.lastTrustCorridor = update.trustCorridor;
    }
    if (update.state === "scene" && update.scene) {
      const visualState = sceneVisualState(update.scene.id);
      this.warmWorldAssetWindow(visualState.worldId);
      if (update.scene.id !== this.lastStorySceneId) {
        this.lastStorySceneId = update.scene.id;
        this.audio.playCue(visualState.soundCue);
      }
      this.shell.showStoryObjective(null);
      this.shell.showStoryScene({
        sceneId: update.scene.id,
        visualStateId: storyPageVisualStateId(update.scene.id, update.scenePageId ?? null),
        presentationId: update.scenePageId === null || update.scenePageId === undefined
          ? update.scene.id
          : `${update.scene.id}:${update.scenePageId}`,
        eyebrow: update.scene.eyebrow,
        title: update.scene.title,
        body: update.scene.body,
        vignette: update.scene.vignette,
        continueLabel: update.scene.continueLabel,
        ...(update.sceneAction === null || update.sceneAction === undefined
          ? {}
          : { action: update.sceneAction }),
        ...(update.sceneFinalFrame === null || update.sceneFinalFrame === undefined
          ? {}
          : { finalFrame: update.sceneFinalFrame })
      });
      return;
    }
    if (update.state === "reframe") {
      this.shell.showStoryReframe();
      return;
    }
    if (update.state === "countdown" && update.countdownValue !== null) {
      const countdownValue = update.countdownValue as 3 | 2 | 1;
      if (countdownValue !== this.lastStoryCountdownValue) {
        this.lastStoryCountdownValue = countdownValue;
        this.audio.playCountdownCue(countdownValue);
      }
      this.shell.showStoryCountdown(countdownValue);
      return;
    }
    if (update.state === "play") {
      this.shell.returnToGame();
      const segmentId = update.playSegment?.id ?? "";
      if (segmentId !== this.lastStorySegmentId) {
        this.lastStorySegmentId = segmentId;
        // The first game snapshot supplies the authored semantic HUD. Avoid a
        // stale legacy objective flashing before it arrives.
        this.shell.showStoryObjective(null);
      }
    }
  }

  private handleGameOver(result: GameResult): void {
    this.qaReport.recordResult(result);
    this.audio.stop();
    if (result.mode === "story") {
      this.shell.showStoryResult({
        orders: result.packagesCollected,
        score: result.score,
        bestCombo: result.bestCombo
      });
      return;
    }

    const firstChallengeResult = this.profile.snapshot.challengeRecordRuns === 0;
    this.profile.recordChallengeResult(
      result.challengeScore,
      result.challengeOrdersCollected
    );
    this.shell.showChallengeResult({
      orders: result.packagesCollected,
      totalScore: result.score,
      challengeScore: result.challengeScore,
      bestScore: this.profile.snapshot.bestChallengeScore,
      firstChallengeResult,
      distanceM: result.distanceM,
      warrantySaves: result.warrantySaves
    });
  }

  private pause(): void {
    if (this.game?.state !== "running") return;
    this.game.pause();
    this.shell.setPaused(true);
    this.audio.stop();
  }

  private resume(): void {
    if (this.game?.state !== "paused") return;
    this.game.resume();
    this.shell.setPaused(false);
    if (this.config.audio.enabled && this.runtime.qa?.audio !== "disabled") void this.audio.start();
  }

  private returnToMenu(): void {
    this.startToken += 1;
    this.destroyGame();
    this.audio.stop();
    this.showLanding();
  }

  private destroyGame(): void {
    this.detachGameGeometry?.();
    this.detachGameGeometry = null;
    this.game?.destroy();
    this.game = null;
  }

  /**
   * Keeps the displayed world and its successor warm without blocking scene
   * presentation. A world transition is the retry boundary after an offline or
   * interrupted preload, while repeated animation snapshots remain no-ops.
   */
  private warmWorldAssetWindow(worldId: CampaignWorldId): void {
    if (this.destroyed || worldId === this.lastVisualWorldId) return;
    this.lastVisualWorldId = worldId;

    const currentBundle = campaignWorld(worldId).bundleId;
    const nextBundle = nextWorldAssetBundle(currentBundle);
    const bundleWindow = [currentBundle, nextBundle]
      .filter((bundleId): bundleId is NonNullable<typeof bundleId> => bundleId !== null)
      .filter((bundleId) => !this.assetLoader.isBundleReady(bundleId));
    if (bundleWindow.length === 0) return;

    // Artwork has a semantic vector fallback, so background transport failures
    // must never replace a readable scene with the global loading error.
    const warmNext = (index: number): void => {
      const bundleId = bundleWindow[index];
      if (bundleId === undefined) return;
      void this.assetLoader.warmBundles([bundleId])
        .then(() => warmNext(index + 1))
        .catch(() => undefined);
    };
    warmNext(0);
  }

  private uiCopy(key: string, fallback: string): string {
    return this.config.ui?.[key] ?? fallback;
  }
}

export default CampaignController;
