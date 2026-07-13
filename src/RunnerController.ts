import { DataLayerTracker } from "./analytics/data-layer";
import type { ControlMethod, GameResult } from "./game/contracts";
import { RunnerGame } from "./game/RunnerGame";
import type {
  NarrativeConfig,
  RunnerConfig,
  RunnerOpenOptions,
  RunnerPublicApi,
  RunnerSource
} from "./shared/types";
import { RunnerModal } from "./ui/RunnerModal";
import { PlayerProfileStore } from "./profile";

const GAME_LEVEL_NAME = "million_route";
const GAME_CHARACTER = "amso_courier";

function now(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function secondsSince(timestamp: number): number {
  return Math.max(0, Math.round((now() - timestamp) / 1000));
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export class RunnerController implements RunnerPublicApi {
  private readonly tracker: DataLayerTracker;
  private readonly modal: RunnerModal;
  private readonly game: RunnerGame;
  private readonly profile: PlayerProfileStore;
  private readonly narrative: NarrativeConfig | null;

  private sourceLocation: RunnerSource = "unknown";
  private openedAt = 0;
  private runNumber = 0;
  private controlMethod: ControlMethod = "pointer";
  private controlMethodLocked = false;
  private lastResult: GameResult | null = null;
  private ctaTrackedForRun = false;
  private destroyed = false;
  private opened = false;
  private readyFrame: number | null = null;
  private runDiscoveredFactIds: string[] = [];
  private currentEpochIndex = 0;

  public constructor(private readonly config: RunnerConfig) {
    this.tracker = new DataLayerTracker({
      gameVersion: config.gameVersion,
      sourceLocation: this.sourceLocation
    });

    this.narrative = config.narrativeMode ? config.narrative ?? null : null;
    this.profile = new PlayerProfileStore();

    this.modal = new RunnerModal(config, {
      onStart: () => this.startRun(false),
      onRestart: () => this.startRun(true),
      onClose: (reason) => this.close(reason),
      onPauseToggle: () => this.togglePause(),
      onJump: (method) => this.jump(method),
      onCrouch: (active, method) => this.crouch(active, method),
      onCta: (event) => this.handleCta(event),
      onShare: (event) => this.handleShare(event)
    });

    this.game = new RunnerGame(
      this.modal.canvas,
      {
        onStateChange: (state) => this.modal.setState(state),
        onSnapshot: (snapshot) => this.modal.update(snapshot),
        onGameOver: (result) => this.handleGameOver(result),
        onEpochCompleted: (index, clean) => this.handleEpochCompleted(index, clean),
        onFactUnlocked: (factId) => this.handleFactUnlocked(factId),
        onCutscene: (index, title) => {
          this.currentEpochIndex = index;
          this.tracker.track("epoch_start", {
            epoch_index: index,
            epoch_name: title,
            run_number: this.runNumber
          });
        },
        onNarrativeEnd: (outcome) => this.tracker.track("game_closed", {
          close_state: `narrative_${outcome}`,
          run_number: this.runNumber,
          elapsed_open_seconds: secondsSince(this.openedAt)
        })
      },
      { reducedMotion: prefersReducedMotion(), narrative: this.narrative }
    );

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("blur", this.handleWindowBlur);
  }

  public open(options: RunnerOpenOptions): void {
    if (this.destroyed || this.opened) {
      return;
    }

    this.opened = true;
    this.runNumber = 0;
    this.lastResult = null;
    this.ctaTrackedForRun = false;
    this.controlMethod = "pointer";
    this.controlMethodLocked = false;
    this.sourceLocation = options.sourceLocation;
    this.tracker.setSourceLocation(options.sourceLocation);
    this.openedAt = now();
    this.modal.open(options);
    if (!options.openedTracked) {
      this.tracker.track("game_opened", {});
    }

    if (this.game.state === "game_over") {
      this.game.reset();
    }

    if (this.readyFrame !== null) {
      window.cancelAnimationFrame(this.readyFrame);
    }

    this.readyFrame = window.requestAnimationFrame(() => {
      this.readyFrame = null;
      const requestedAt = options.requestedAt ?? this.openedAt;
      this.tracker.track("game_ready", {
        load_time_ms: Math.max(0, Math.round(now() - requestedAt))
      });
    });
  }

  public close(_reason = "api"): void {
    if (this.destroyed || !this.opened) {
      return;
    }

    this.opened = false;
    if (this.readyFrame !== null) {
      window.cancelAnimationFrame(this.readyFrame);
      this.readyFrame = null;
    }

    const closeState = this.game.state;
    if (closeState === "running") {
      this.game.pause();
    }

    this.tracker.track("game_closed", {
      close_state: closeState,
      run_number: this.runNumber,
      elapsed_open_seconds: secondsSince(this.openedAt)
    });
    this.modal.close();
    this.game.reset();
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    if (this.opened) {
      this.close("destroy");
    }

    this.destroyed = true;
    if (this.readyFrame !== null) {
      window.cancelAnimationFrame(this.readyFrame);
      this.readyFrame = null;
    }

    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("blur", this.handleWindowBlur);
    this.game.destroy();
    this.modal.destroy();
  }

  public trackTriggerViewed(sourceLocation: RunnerSource): void {
    this.tracker.triggerViewed(sourceLocation);
  }

  public trackOpenRequested(sourceLocation: RunnerSource): void {
    this.tracker.openRequested(sourceLocation);
  }

  private startRun(isRestart: boolean): void {
    if (this.destroyed) {
      return;
    }

    if (isRestart && this.lastResult !== null) {
      this.tracker.track("game_restarted", {
        previous_score: this.lastResult.score,
        run_number: this.runNumber + 1
      });
    }

    this.runNumber += 1;
    this.controlMethod = "pointer";
    this.controlMethodLocked = false;
    this.ctaTrackedForRun = false;
    this.lastResult = null;
    this.runDiscoveredFactIds = [];
    this.game.start(this.controlMethod);
    this.tracker.track("level_start", {
      level_name: GAME_LEVEL_NAME,
      character: GAME_CHARACTER,
      run_number: this.runNumber
    });
    if (this.narrative && this.narrative.epochs.length > 0) {
      const first = this.narrative.epochs[0]!;
      this.tracker.track("epoch_start", {
        epoch_index: 0,
        epoch_name: first.name,
        run_number: this.runNumber
      });
    }
  }

  private jump(method: ControlMethod): void {
    if (!this.controlMethodLocked) {
      this.controlMethod = method;
      this.controlMethodLocked = true;
    }
    this.game.jump(method);
  }

  private crouch(active: boolean, method: ControlMethod): void {
    if (!this.controlMethodLocked) {
      this.controlMethod = method;
      this.controlMethodLocked = true;
    }
    this.game.crouch(active, method);
  }

  private togglePause(): void {
    if (this.game.state === "running") {
      this.game.pause();
    } else if (this.game.state === "paused") {
      this.game.resume();
    }
  }

  private handleGameOver(result: GameResult): void {
    this.lastResult = { ...result, controlMethod: this.controlMethod };

    this.profile.recordRun(
      result.score,
      result.packagesCollected,
      result.furthestEpochReached,
      this.runDiscoveredFactIds
    );

    const legacyFacts = this.config.facts.filter((fact) => fact.enabled);
    const legacyFact =
      legacyFacts.length > 0
        ? legacyFacts[(result.score + result.packagesCollected) % legacyFacts.length]
        : undefined;
    const selectedFact =
      legacyFact ?? { id: "orders_1m", text: "Ponad milion zamówień. Dziękujemy, że biegniesz z nami." };

    const epoch = this.narrative?.epochs[result.furthestEpochReached];

    this.modal.showGameOver(this.lastResult, {
      fact: selectedFact,
      discoveredFactIds: this.runDiscoveredFactIds,
      factsUnlockedCount: result.factsUnlockedCount,
      cumulativeFactCount: this.profile.snapshot.discoveredFactIds.length,
      outcome: result.outcome,
      narrative: this.narrative !== null,
      discountCode: this.config.discountCode,
      epochName: epoch?.name,
      epochYear: epoch?.year,
        bestScore: this.profile.snapshot.bestChallengeScore,
        bestPackages: this.profile.snapshot.bestChallengePackages
    });

    this.tracker.track("post_score", {
      score: this.lastResult.score,
      level: this.lastResult.difficultyLevel,
      character: GAME_CHARACTER,
      packages_collected: this.lastResult.packagesCollected,
      bosses_defeated: this.lastResult.bossesDefeated,
      distance_m: this.lastResult.distanceM,
      run_duration_seconds: this.lastResult.durationSeconds,
      difficulty_level: this.lastResult.difficultyLevel,
      collision_type: this.lastResult.collisionType,
      control_method: this.lastResult.controlMethod,
      fact_id: this.runDiscoveredFactIds[this.runDiscoveredFactIds.length - 1] ?? selectedFact.id,
      run_number: this.runNumber,
      epoch_reached: result.furthestEpochReached,
      facts_unlocked_count: result.factsUnlockedCount,
      outcome: result.outcome
    });
  }

  private handleEpochCompleted(index: number, clean: boolean): void {
    const epoch = this.narrative?.epochs[index];
    if (!epoch) return;
    this.tracker.track("epoka_ukończona", {
      epoch_index: index,
      epoch_name: epoch.name,
      duration_seconds: epoch.durationSeconds,
      completed_clean: clean
    });
  }

  private handleFactUnlocked(factId: string): void {
    if (this.runDiscoveredFactIds.includes(factId)) return;
    this.runDiscoveredFactIds.push(factId);
    const fact = this.narrative?.facts.find((candidate) => candidate.id === factId);
    this.tracker.track("fakt_odblokowany", {
      fact_id: factId,
      epoch_index: this.currentEpochIndex,
      trigger: fact?.trigger.type ?? "unknown"
    });
  }

  private handleShare(event: MouseEvent): void {
    event.preventDefault();
    const score = this.lastResult?.score ?? 0;
    const text = `Przeszedłem z AMSO kawałek drogi do miliona i zdobyłem ${score} punktów!`;
    this.tracker.track("share", {
      method: typeof navigator !== "undefined" && "share" in navigator ? "web_share" : "copy",
      content_type: "run",
      item_id: String(score)
    });
    const navigatorAny = navigator as Navigator & { share?: (data: { text: string }) => Promise<void> };
    if (typeof navigatorAny.share === "function") {
      navigatorAny.share({ text }).catch(() => {
        this.copyToClipboard(text);
      });
    } else {
      this.copyToClipboard(text);
    }
  }

  private copyToClipboard(text: string): void {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function") {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch {
      // Clipboard access can be denied; sharing is best-effort.
    }
  }

  private handleCta(event: MouseEvent): void {
    if (this.ctaTrackedForRun) {
      return;
    }

    this.ctaTrackedForRun = true;
    const score = this.lastResult?.score ?? 0;
    const packagesCollected = this.lastResult?.packagesCollected ?? 0;
    const anchor = event.currentTarget instanceof HTMLAnchorElement ? event.currentTarget : null;
    const navigate = (): void => {
      if (anchor?.href) {
        window.location.assign(anchor.href);
      }
    };

    const isPlainPrimaryClick =
      event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

    if (window.google_tag_manager && anchor && isPlainPrimaryClick) {
      event.preventDefault();
      let navigated = false;
      const navigateOnce = (): void => {
        if (navigated) {
          return;
        }
        navigated = true;
        navigate();
      };

      window.setTimeout(navigateOnce, 450);
      this.tracker.track(
        "game_cta_clicked",
        {
          cta_id: this.config.cta.id,
          destination_path: this.config.cta.path,
          score,
          packages_collected: packagesCollected
        },
        { eventCallback: navigateOnce, eventTimeout: 400 }
      );
      return;
    }

    this.tracker.track("game_cta_clicked", {
      cta_id: this.config.cta.id,
      destination_path: this.config.cta.path,
      score,
      packages_collected: packagesCollected
    });
  }

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden && this.game.state === "running") {
      this.game.pause();
    }
  };

  private readonly handleWindowBlur = (): void => {
    if (this.game.state === "running") {
      this.game.pause();
    }
  };
}
