import { DataLayerTracker } from "./analytics/data-layer";
import {
  AssetBundleLoadError,
  AssetBundleLoader
} from "./assets/AssetBundleLoader";
import {
  assetBundleForStoryCheckpoint,
  requiredStartAssetBundles
} from "./assets/asset-bundle-plan";
import { CampaignAudio } from "./audio/CampaignAudio";
import type {
  GameResult,
  GameSnapshot,
  RunnerGameCallbacks
} from "./game/contracts";
import { RunnerGame } from "./game/RunnerGame";
import type { StoryTimelineSnapshot } from "./game/story-timeline";
import {
  PlayerProfileStore,
  type StoryCheckpoint
} from "./profile";
import type {
  AssetBundleId,
  RunnerConfig,
  StoryBeatConfig
} from "./shared/types";
import {
  CampaignShell,
  type CampaignCheckpointOption,
  type CampaignStartRequest
} from "./ui/CampaignShell";

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

function storyCaption(
  beats: readonly StoryBeatConfig[],
  trustCorridor: boolean,
  corridorEyebrow: string
): Parameters<CampaignShell["showStoryBeat"]>[0] {
  if (beats.length === 0) return null;
  const title = beats.find(({ kind }) => kind === "title");
  const body = beats.filter((beat) => beat !== title).map(({ text }) => text);
  return {
    id: beats.map(({ id }) => id).join("+"),
    ...(trustCorridor ? { eyebrow: corridorEyebrow } : {}),
    ...(title === undefined ? {} : { title: title.text }),
    body: title === undefined ? beats.map(({ text }) => text) : body
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
  private lastLogisticPhase: GameSnapshot["logisticWavePhase"] = "inactive";
  private pendingTutorial: "jump" | "slide" | null = null;
  private readonly shownPowerUpHints = new Set<string>();
  private powerUpHintTimer: number | null = null;
  private pendingStart: CampaignStartRequest | null = null;
  private assetGatePending = false;
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
          ...(mode === "story" ? { checkpoint: "prologue" as const } : {}),
          restartStory: mode === "story"
        });
      },
      onReturnToMenu: () => this.returnToMenu(),
      onRetryLoad: () => {
        if (this.pendingStart !== null) void this.startRun(this.pendingStart);
        else this.showLanding();
      },
      onJump: (method) => {
        if (this.pendingTutorial === "jump") {
          this.pendingTutorial = null;
          this.shell.showGameplayHint(null);
        }
        this.audio.playCue("jump");
        this.game?.jump(method);
      },
      onSlide: (active, method) => {
        if (active && this.pendingTutorial === "slide") {
          this.pendingTutorial = null;
          this.shell.showGameplayHint(null);
        }
        if (active) this.audio.playCue("slide");
        this.game?.crouch(active, method);
      },
      onMuteChange: (muted) => {
        this.profile.setSoundMuted(muted);
        this.audio.setMuted(muted);
      },
      onFullscreenPromptHandled: () => this.profile.markFullscreenPromptSeen()
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
    this.assetGatePending = false;
    this.shell.destroy();
    this.clearPowerUpHintTimer();
    void this.audio.destroy();
  }

  private showLanding(): void {
    if (this.destroyed) return;
    const checkpoint = this.checkpointOption();
    this.shell.showLanding({
      challengeUnlocked: this.profile.snapshot.storyCompleted,
      ...(checkpoint === undefined ? {} : { checkpoint }),
      fullscreenPromptSeen: this.profile.snapshot.fullscreenPromptSeen,
      muted: this.profile.snapshot.soundMuted
    });
  }

  private checkpointOption(): CampaignCheckpointOption | undefined {
    const checkpoint = this.profile.snapshot.storyCheckpoint;
    if (checkpoint === "prologue" || checkpoint === "completed") return undefined;
    if (checkpoint === "finale") {
      return { id: checkpoint, label: this.uiCopy("checkpointFinale", "Zakończenie") };
    }
    const epochIndex = Number(checkpoint.slice("epoch_".length)) - 1;
    const epoch = this.config.story.epochs[epochIndex];
    return epoch === undefined ? undefined : { id: checkpoint, label: epoch.name };
  }

  private async startRun(request: CampaignStartRequest): Promise<void> {
    if (this.destroyed) return;
    const safeRequest = request.mode === "challenge" && !this.profile.snapshot.storyCompleted
      ? { mode: "story" as const, checkpoint: "prologue" as const, restartStory: false }
      : request;
    this.pendingStart = safeRequest;
    const token = ++this.startToken;
    this.game?.destroy();
    this.game = null;
    this.lastSnapshot = null;
    this.lastTrustCorridor = false;
    this.lastLogisticPhase = "inactive";
    this.pendingTutorial = null;
    this.assetGatePending = false;
    this.shownPowerUpHints.clear();
    this.clearPowerUpHintTimer();
    this.shell.showLoading(undefined);

    if (this.config.audio.enabled) void this.audio.start();

    try {
      const checkpoint = this.storyCheckpointFor(safeRequest);
      const requiredBundles = requiredStartAssetBundles(safeRequest.mode, checkpoint);
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
        ...(safeRequest.mode === "story" ? { storyCheckpoint: checkpoint } : {})
      });
      this.shell.showGame(safeRequest.mode);
      this.game.start("pointer");
      this.tracker.track("game_started", { mode: safeRequest.mode });
      this.warmRemainingBundles(requiredBundles);
    } catch (error: unknown) {
      this.game?.destroy();
      this.game = null;
      this.assetGatePending = false;
      this.tracker.loadFailed(
        error instanceof AssetBundleLoadError ? error.code : "runtime_init_failed"
      );
      this.shell.showError();
    }
  }

  private storyCheckpointFor(request: CampaignStartRequest): StoryCheckpoint {
    if (request.restartStory) return "prologue";
    const requested = request.checkpoint ?? this.profile.snapshot.storyCheckpoint;
    return requested === "completed" ? "prologue" : requested;
  }

  private createGameCallbacks(): RunnerGameCallbacks {
    return {
      onStateChange: (state) => {
        if (state === "paused" && !this.assetGatePending) this.shell.setPaused(true);
      },
      onSnapshot: (snapshot) => this.handleSnapshot(snapshot),
      onGameOver: (result) => this.handleGameOver(result),
      onStoryUpdate: (update) => this.handleStoryUpdate(update),
      onStoryCheckpoint: (checkpoint) => {
        this.profile.setStoryCheckpoint(checkpoint);
        if (checkpoint === "epoch_1") this.pendingTutorial = "jump";
        if (checkpoint === "epoch_2") this.pendingTutorial = "slide";
        void this.ensureCheckpointAssets(checkpoint);
      },
      onStoryComplete: () => {
        this.profile.completeStory();
        this.tracker.track("story_completed", {});
      }
    };
  }

  private handleSnapshot(snapshot: GameSnapshot): void {
    const previous = this.lastSnapshot;
    if (previous !== null) {
      if (snapshot.packagesCollected > previous.packagesCollected) {
        this.audio.playCue("package");
      }
      if (snapshot.collisions > previous.collisions) {
        this.audio.playCue("collision");
      }
      if (snapshot.activePowerUps.some((kind) => !previous.activePowerUps.includes(kind))) {
        this.audio.playCue("power-up");
        const newPowerUp = snapshot.activePowerUps.find(
          (kind) => !previous.activePowerUps.includes(kind) && !this.shownPowerUpHints.has(kind)
        );
        if (snapshot.mode === "story" && !snapshot.trustCorridor &&
            this.pendingTutorial === null && newPowerUp !== undefined) {
          this.shownPowerUpHints.add(newPowerUp);
          const copy = {
            audyt_jakosci: this.uiCopy(
              "powerupAudit",
              "Audyt jakości — zobacz przeszkody wcześniej."
            ),
            drugie_zycie: this.uiCopy(
              "powerupSecondLife",
              "Drugie życie — każda paczka liczy się podwójnie."
            ),
            gwarancja_48: this.uiCopy(
              "powerupWarranty",
              "Gwarancja 48 miesięcy — jedno bezpieczne uderzenie."
            )
          } as const;
          this.shell.showGameplayHint(copy[newPowerUp]);
          this.clearPowerUpHintTimer();
          this.powerUpHintTimer = window.setTimeout(() => {
            this.powerUpHintTimer = null;
            if (this.pendingTutorial === null) this.shell.showGameplayHint(null);
          }, 4_000);
        }
      }
    }
    this.lastSnapshot = snapshot;
    this.shell.update(snapshot);
    if (snapshot.mode === "challenge" && snapshot.logisticWavePhase !== this.lastLogisticPhase) {
      this.lastLogisticPhase = snapshot.logisticWavePhase;
      if (snapshot.logisticWavePhase === "warning") {
        this.shell.showStoryBeat({
          id: "challenge.logistic_wave_warning",
          eyebrow: this.uiCopy("challengeMode", "Próba Miliona"),
          body: this.uiCopy("logisticWarning", "Uwaga: fala logistyczna")
        }, false);
      } else if (snapshot.logisticWavePhase === "reward") {
        this.shell.showStoryBeat({
          id: "challenge.logistic_wave_reward",
          body: this.uiCopy(
            "logisticReward",
            "Fala opanowana — złote paczki są Twoje."
          )
        }, false);
      } else {
        this.shell.showStoryBeat(null, false);
      }
    }
  }

  private handleStoryUpdate(update: StoryTimelineSnapshot): void {
    if (update.trustCorridor) {
      this.clearPowerUpHintTimer();
      this.shell.showGameplayHint(null);
    }
    if (update.trustCorridor !== this.lastTrustCorridor) {
      this.audio.playCue(update.trustCorridor ? "corridor-enter" : "corridor-exit");
      if (!update.trustCorridor) {
        this.shell.announce(this.uiCopy("corridorResume", "Biegniemy dalej."));
      }
      this.lastTrustCorridor = update.trustCorridor;
    }
    this.shell.showStoryBeat(
      storyCaption(
        update.activeBeats,
        update.trustCorridor,
        this.uiCopy("corridorEyebrow", "Bezpieczny odcinek — historia biegnie dalej")
      ),
      update.trustCorridor
    );
    if (!update.trustCorridor && this.pendingTutorial !== null) {
      this.shell.showGameplayHint(this.pendingTutorial === "jump"
        ? this.uiCopy("tutorialJump", "Tapnij lub naciśnij Spację, żeby skoczyć.")
        : this.uiCopy(
            "tutorialSlide",
            "Przesuń palcem w dół albo naciśnij ↓, żeby zrobić ślizg."
          ));
    }
  }

  private handleGameOver(result: GameResult): void {
    this.audio.stop();
    if (result.mode === "story") {
      this.shell.showStoryBeat(null, false);
      this.shell.showStoryResult({
        packages: result.packagesCollected,
        score: result.score,
        bestCombo: result.bestCombo
      });
      return;
    }

    this.profile.recordChallengeResult(result.score, result.packagesCollected);
    this.shell.showChallengeResult({
      packages: result.packagesCollected,
      score: result.score,
      bestScore: this.profile.snapshot.bestChallengeScore,
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
    this.assetGatePending = false;
    this.game?.destroy();
    this.game = null;
    this.audio.stop();
    this.clearPowerUpHintTimer();
    this.showLanding();
  }

  private warmRemainingBundles(requiredBundles: readonly AssetBundleId[]): void {
    const required = new Set(requiredBundles);
    const remaining = this.config.assets.bundles
      .map(({ id }) => id)
      .filter((bundleId) => !required.has(bundleId));
    void this.assetLoader.warmBundles(remaining).catch(() => {
      // A background failure only becomes blocking if that chapter is reached.
    });
  }

  private async ensureCheckpointAssets(checkpoint: StoryCheckpoint): Promise<void> {
    const bundleId = assetBundleForStoryCheckpoint(checkpoint);
    const game = this.game;
    if (bundleId === null || game === null || this.assetLoader.isBundleReady(bundleId)) return;

    const token = this.startToken;
    this.assetGatePending = true;
    game.pause();
    this.shell.showStoryBeat({
      id: "system.asset-preparing",
      eyebrow: this.uiCopy("corridorEyebrow", "Bezpieczny odcinek — historia biegnie dalej"),
      body: this.uiCopy(
        "assetPreparing",
        "Bezpieczny odcinek — przygotowujemy kolejny rozdział."
      )
    }, true);

    try {
      await this.assetLoader.ensureBundles([bundleId]);
      if (this.destroyed || token !== this.startToken || game !== this.game) return;
      this.assetGatePending = false;
      this.shell.showStoryBeat(null, false);
      game.resume();
    } catch {
      if (this.destroyed || token !== this.startToken || game !== this.game) return;
      this.assetGatePending = false;
      game.destroy();
      this.game = null;
      this.audio.stop();
      this.pendingStart = { mode: "story", checkpoint, restartStory: false };
      this.tracker.loadFailed("critical_asset_failed");
      this.shell.showError();
    }
  }

  private clearPowerUpHintTimer(): void {
    if (this.powerUpHintTimer === null) return;
    window.clearTimeout(this.powerUpHintTimer);
    this.powerUpHintTimer = null;
  }

  private uiCopy(key: string, fallback: string): string {
    return this.config.ui?.[key] ?? fallback;
  }
}

export default CampaignController;
