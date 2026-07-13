import { DataLayerTracker } from "./analytics/data-layer";
import {
  AssetBundleLoadError,
  AssetBundleLoader
} from "./assets/AssetBundleLoader";
import { requiredStartAssetBundles } from "./assets/asset-bundle-plan";
import { CampaignAudio } from "./audio/CampaignAudio";
import type {
  GameResult,
  GameSnapshot,
  RunnerGameCallbacks
} from "./game/contracts";
import { RunnerGame } from "./game/RunnerGame";
import type { StoryTimelineSnapshot } from "./game/story-timeline";
import { PlayerProfileStore } from "./profile";
import type { RunnerConfig } from "./shared/types";
import {
  CampaignShell,
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
  private lastLogisticPhase: GameSnapshot["logisticWavePhase"] = "inactive";
  private pendingTutorial: "jump" | "slide" | null = null;
  private readonly shownPowerUpHints = new Set<string>();
  private powerUpHintTimer: number | null = null;
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
        if (this.pendingTutorial === "jump") {
          this.pendingTutorial = "slide";
          this.shell.showGameplayHint(this.uiCopy(
            "tutorialSlide",
            "Teraz przesuń palcem w dół albo naciśnij ↓, żeby zrobić ślizg."
          ));
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
    this.clearPowerUpHintTimer();
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
    this.lastLogisticPhase = "inactive";
    this.pendingTutorial = null;
    this.shownPowerUpHints.clear();
    this.clearPowerUpHintTimer();
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
        awardStoryCompletionBonus: safeRequest.mode === "story" &&
          !this.profile.snapshot.storyCompleted
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
          "epoch_1.cable_chaos": "Kablowy Chaos uporządkowany.",
          "epoch_2.quality_series": "SPRAWDZONY — cztery serie ukończone.",
          "epoch_3.creative_contract": "Kreatywny start ukończony.",
          "epoch_3.growth_contract": "Kontrakt rozwoju ukończony.",
          "epoch_3.trust_contract": "Kontrakt zaufania ukończony.",
          "epoch_4.orders": "Sześć zamówień gotowych.",
          "epoch_4.logistic_hydra": "Logistyczna Hydra opanowana.",
          "epoch_5.counter": "Licznik: 999 999.",
          "epoch_5.million_wave": "Fala Miliona ukończona.",
          "epoch_5.symbols": "Osiem symboli zebranych."
        }[objectiveId];
        this.shell.showStoryObjective(`✓ ${label}`);
        this.shell.showGameplayHint(label);
        this.clearPowerUpHintTimer();
        this.powerUpHintTimer = window.setTimeout(() => {
          this.powerUpHintTimer = null;
          this.shell.showGameplayHint(null);
        }, 2_400);
      },
      onModeChange: (mode) => {
        this.shell.showStoryObjective(null);
        this.shell.showGame(mode);
        this.tracker.track("game_started", { mode });
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
        this.shell.announce(this.uiCopy("logisticWarning", "Uwaga: fala logistyczna"));
      } else if (snapshot.logisticWavePhase === "reward") {
        this.shell.announce(this.uiCopy(
          "logisticReward",
          "Fala opanowana — złote paczki są Twoje."
        ));
      }
      this.shell.showStoryBeat(null, false);
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
    if (update.state === "scene" && update.scene) {
      this.shell.showStoryObjective(null);
      this.shell.showStoryScene({
        sceneId: update.scene.id,
        eyebrow: update.scene.eyebrow,
        title: update.scene.title,
        body: update.scene.body,
        vignette: update.scene.vignette,
        continueLabel: update.scene.continueLabel
      });
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
        const objective = {
          "epoch_1.training": "Cel: 5 skoków i 5 ślizgów",
          "epoch_1.cable_chaos": "Kablowy Chaos: skok i ślizg naprzemiennie",
          "epoch_2.quality_series": "Cel: 4 serie po 3 udane akcje",
          "epoch_2.doubt_cloud": "Chmura Wątpliwości: utrzymaj trasę",
          "epoch_3.creative_contract": "Kreatywny start: zbierz 3 elementy",
          "epoch_3.growth_contract": "Rozwój firmy: zbuduj combo ×8",
          "epoch_3.trust_contract": "Zaufanie na lata: 12 czystych akcji",
          "epoch_3.budget_eater": "Budżetożerca: przejdź finał kontraktów",
          "epoch_4.orders": "Fala zamówień: przygotuj 6 paczek",
          "epoch_4.logistic_hydra": "Logistyczna Hydra: przetrwaj 3 fazy",
          "epoch_5.counter": "Licznik: dojdź do 999 999",
          "epoch_5.million_wave": "Fala Miliona: zbierz 8 symboli"
        }[segmentId] ?? null;
        this.shell.showStoryObjective(objective);
      }
      if (update.playSegment?.id === "epoch_1.training" && this.pendingTutorial === null) {
        this.pendingTutorial = "jump";
      }
    }
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
    this.game?.destroy();
    this.game = null;
    this.audio.stop();
    this.clearPowerUpHintTimer();
    this.showLanding();
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
