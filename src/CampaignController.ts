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
  private readonly tracker: DataLayerTracker;
  private readonly shell: CampaignShell;
  private readonly audio: CampaignAudio;
  private readonly assetLoader: AssetBundleLoader;
  private game: RunnerGame | null = null;
  private lastSnapshot: GameSnapshot | null = null;
  private lastTrustCorridor = false;
  private lastStorySegmentId = "";
  private lastStorySceneId = "";
  private lastVisualWorldId: CampaignWorldId | null = null;
  private lastLogisticPhase: GameSnapshot["logisticWavePhase"] = "inactive";
  private lastWaveAudioKey = "";
  private readonly shownPowerUpHints = new Set<string>();
  private readonly qaReport = new QaSessionReportCollector();
  private pendingStart: CampaignStartRequest | null = null;
  private startToken = 0;
  private destroyed = false;

  public constructor(
    host: HTMLElement,
    private readonly config: RunnerConfig,
    profile = new PlayerProfileStore(),
    assetLoader = new AssetBundleLoader(config.assets.bundles)
  ) {
    this.profile = profile;
    this.tracker = new DataLayerTracker({
      gameVersion: config.gameVersion,
      consentGranted: hasAnalyticsConsent
    });
    this.audio = new CampaignAudio({ muted: profile.snapshot.soundMuted });
    this.assetLoader = assetLoader;
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
      }
    }, {
      campaignUrl: config.cta.path,
      fullStoryUrl: config.cta.path,
      copy: {
        ...config.ui,
        startChallenge: config.cta.challengeLabel,
        fullStory: config.cta.campaignLabel
      }
    });

    this.showLanding();
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.startToken += 1;
    this.game?.destroy();
    this.game = null;
    this.shell.destroy();
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
    const safeRequest = request.mode === "challenge" && !this.profile.snapshot.storyCompleted
      ? { mode: "story" as const, restartStory: false }
      : request;
    this.pendingStart = safeRequest;
    const token = ++this.startToken;
    this.game?.destroy();
    this.game = null;
    this.lastSnapshot = null;
    this.lastTrustCorridor = false;
    this.lastStorySegmentId = "";
    this.lastStorySceneId = "";
    this.lastVisualWorldId = null;
    this.lastLogisticPhase = "inactive";
    this.lastWaveAudioKey = "";
    this.shownPowerUpHints.clear();
    this.shell.showLoading(undefined);

    if (this.config.audio.enabled) void this.audio.start();

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
      // The page shell is already present; this paint is the real hand-off from
      // resource readiness to Canvas/context readiness.
      await nextPaint();
      if (this.destroyed || token !== this.startToken) return;
      const callbacks = this.createGameCallbacks();
      this.game = new RunnerGame(this.shell.canvas, callbacks, {
        reducedMotion: prefersReducedMotion(),
        mode: safeRequest.mode,
        story: safeRequest.mode === "story" ? this.config.story : null,
        challenge: this.config.challenge,
        bestChallengeOrdersAtStart: this.profile.snapshot.bestChallengeOrders,
        awardStoryCompletionBonus: safeRequest.mode === "story" &&
          !this.profile.snapshot.storyCompleted,
        powerUpPackageCopy: {
          gwarancja_48: [
            this.uiCopy("parcelWarrantyLine1", "GWARANCJA"),
            this.uiCopy("parcelWarrantyLine2", "48 M")
          ],
          podwojny_wynik: [
            this.uiCopy("parcelSecondLifeLine1", "2×"),
            this.uiCopy("parcelSecondLifeLine2", "PUNKTY")
          ]
        }
      });
      this.shell.showGame(safeRequest.mode);
      this.game.start("pointer");
      this.tracker.track("game_started", { mode: safeRequest.mode });
    } catch (error: unknown) {
      this.game?.destroy();
      this.game = null;
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
        this.shell.announce(label);
      },
      onSpecialPickup: (kind) => {
        if (this.shownPowerUpHints.has(kind)) return;
        this.shownPowerUpHints.add(kind);
        const copy = {
          podwojny_wynik: "2× WYNIK — punkty za każde zamówienie liczą się podwójnie.",
          gwarancja_48: this.uiCopy(
            "powerupWarranty",
            "GWARANCJA 48 M — uratuje jedną próbę w Trybie Wyzwania."
          )
        } as const;
        this.shell.showPickupNotice(copy[kind]);
      },
      onMilestoneCelebration: (celebration) => {
        this.audio.playMilestoneCue(celebration.kind, celebration.intensity);
        if (celebration.achievement === "record") this.audio.playRecordCue();
        this.shell.announce(celebration.text);
      },
      onModeChange: (mode) => {
        this.shell.showStoryObjective(null);
        this.shell.showGame(mode);
        if (mode === "challenge") {
          this.shell.announce(
            "Tryb Wyzwania. Wynik i zamówienia zostały zachowane. Tempo rośnie, a pierwsze niezabezpieczone zderzenie kończy bieg."
          );
        }
        this.tracker.track("game_started", { mode });
      }
    };
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
    this.warmWorldAssetWindow(snapshot.visualWorldId);
    const previous = this.lastSnapshot;
    if (previous !== null) {
      if (snapshot.ordersCollected > previous.ordersCollected) {
        this.audio.playOrderPickup(snapshot.combo);
      }
      if (snapshot.collisions > previous.collisions) {
        this.audio.playCue("collision");
      }
      if (snapshot.warrantySaves > previous.warrantySaves) {
        this.shell.showPickupNotice(this.uiCopy(
          "warrantyConsumed",
          "GWARANCJA 48 M zadziałała — próba trwa dalej."
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
    return this.qaReport.text();
  }

  private handleStoryUpdate(update: StoryTimelineSnapshot): void {
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
      this.shell.showStoryCountdown(update.countdownValue as 3 | 2 | 1);
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
        orders: result.ordersCollected,
        score: result.score,
        bestCombo: result.bestCombo
      });
      return;
    }

    const firstChallengeResult = this.profile.snapshot.challengeRuns === 0;
    this.profile.recordChallengeResult(
      result.challengeScore,
      result.challengeOrdersCollected
    );
    this.shell.showChallengeResult({
      orders: result.ordersCollected,
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
    if (this.config.audio.enabled) void this.audio.start();
  }

  private returnToMenu(): void {
    this.startToken += 1;
    this.game?.destroy();
    this.game = null;
    this.audio.stop();
    this.showLanding();
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
    void this.assetLoader.warmBundles(bundleWindow).catch(() => undefined);
  }

  private uiCopy(key: string, fallback: string): string {
    return this.config.ui?.[key] ?? fallback;
  }
}

export default CampaignController;
