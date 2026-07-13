import type { GameResult, GameSnapshot, GameState } from "../game/contracts";
import { BOSS } from "../game/constants";
import type { RunnerConfig, RunnerOpenOptions } from "../shared/types";
import type { RunnerModalApi, RunnerModalCallbacks, RunSummary } from "./contracts";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const integerFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 0,
});

let modalSequence = 0;

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Runner modal element not found: ${selector}`);
  }

  return element;
}

function safeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function formatInteger(value: number): string {
  return integerFormatter.format(safeInteger(value));
}

function isHTMLElement(value: EventTarget | null): value is HTMLElement {
  return value instanceof HTMLElement;
}

function isInteractiveControl(value: EventTarget | null): boolean {
  if (!isHTMLElement(value)) {
    return false;
  }

  return Boolean(value.closest("a, button, input, select, textarea, [role='button']"));
}

function isInsideExternalModal(root: HTMLElement, value: EventTarget | null): boolean {
  if (!(value instanceof Element)) {
    return false;
  }

  const modal = value.closest<HTMLElement>('[role="dialog"][aria-modal="true"]');
  return modal !== null && modal !== root && !root.contains(modal);
}

/**
 * DOM-only view for the runner. Game state, analytics and navigation stay in the
 * coordinator and are exposed here exclusively as callbacks.
 */
export class RunnerModal implements RunnerModalApi {
  public readonly canvas: HTMLCanvasElement;

  private readonly root: HTMLDivElement;
  private readonly startScreen: HTMLElement;
  private readonly gameOverScreen: HTMLElement;
  private readonly pauseScreen: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly controlsHint: HTMLElement;
  private readonly startButton: HTMLButtonElement;
  private readonly restartButton: HTMLButtonElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly resumeButton: HTMLButtonElement;
  private readonly ctaLink: HTMLAnchorElement;
  private readonly alternateLink: HTMLAnchorElement;
  private readonly gameOverTitle: HTMLHeadingElement;
  private readonly liveRegion: HTMLDivElement;
  private readonly hudScore: HTMLElement;
  private readonly hudPackages: HTMLElement;
  private readonly resultScore: HTMLElement;
  private readonly resultPackages: HTMLElement;
  private readonly resultDistance: HTMLElement;
  private readonly resultBosses: HTMLElement;
  private readonly fact: HTMLElement;
  private readonly factText: HTMLElement;
  private readonly epochTag: HTMLElement;
  private readonly epochName: HTMLElement;
  private readonly epochYear: HTMLElement;
  private readonly epochProgress: HTMLElement;
  private readonly factsCount: HTMLElement;
  private readonly dropoutNote: HTMLElement;
  private readonly discountBox: HTMLElement;
  private readonly discountLabel: HTMLElement;
  private readonly discountCode: HTMLElement;
  private readonly shareButton: HTMLButtonElement;
  private currentState: GameState = "ready";
  private opened = false;
  private destroyed = false;
  private returnFocusTo: HTMLElement | null = null;
  private bodyOverflowBeforeOpen: string | null = null;
  private lastResult: GameResult | null = null;
  private gameOverAnnounced = false;
  private lastBossPhase: GameSnapshot["bossPhase"] = "inactive";
  private lastBossProgress = 0;

  public constructor(
    private readonly config: RunnerConfig,
    private readonly callbacks: RunnerModalCallbacks,
  ) {
    modalSequence += 1;
    const titleId = `amso-runner-title-${modalSequence}`;
    const descriptionId = `amso-runner-description-${modalSequence}`;

    this.root = document.createElement("div");
    this.root.className = "amso-runner-modal";
    this.root.hidden = true;
    this.root.dataset.state = "ready";
    this.root.setAttribute("role", "dialog");
    this.root.setAttribute("aria-modal", "true");
    this.root.setAttribute("aria-labelledby", titleId);
    this.root.setAttribute("aria-describedby", descriptionId);
    this.root.setAttribute("tabindex", "-1");
    this.root.innerHTML = `
      <div class="amso-runner-modal__backdrop" aria-hidden="true"></div>
      <div class="amso-runner-modal__shell">
        <header class="amso-runner-modal__header">
          <div class="amso-runner-brand" aria-label="AMSO">
            <span class="amso-runner-brand__name">AMSO</span>
            <span class="amso-runner-brand__route" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
            <span class="amso-runner-brand__edition">Droga do Miliona</span>
          </div>

          <button
            class="amso-runner-icon-button amso-runner-modal__close"
            type="button"
            data-runner-close
            aria-label="Zamknij grę"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6.75 6.75 17.25 17.25M17.25 6.75 6.75 17.25" />
            </svg>
          </button>
        </header>

        <main class="amso-runner-modal__viewport">
          <div class="amso-runner-stage" data-runner-stage>
            <canvas
              class="amso-runner-stage__canvas"
              data-runner-canvas
              width="960"
              height="540"
              tabindex="-1"
              aria-hidden="true"
              aria-label="Pole gry. Naciśnij spację albo dotknij ekranu, aby skoczyć. Przykucnij strzałką w dół lub S pod wiszącymi belkami."
            >
              Twoja przeglądarka nie obsługuje Canvas. Skorzystaj z linku do strony kampanii.
            </canvas>

            <div class="amso-runner-stage__ambient" aria-hidden="true">
              <span class="amso-runner-stage__sun"></span>
              <span class="amso-runner-stage__cloud amso-runner-stage__cloud--one"></span>
              <span class="amso-runner-stage__cloud amso-runner-stage__cloud--two"></span>
              <span class="amso-runner-stage__warehouse">AMSO</span>
              <span class="amso-runner-stage__road"></span>
            </div>

            <section class="amso-runner-hud" data-runner-hud hidden aria-label="Wynik biegu">
              <div class="amso-runner-epoch" data-runner-epoch hidden aria-hidden="true">
                <span data-runner-epoch-name></span>
                <span data-runner-epoch-year></span>
                <span data-runner-epoch-progress></span>
              </div>
              <div class="amso-runner-hud__stats">
                <div class="amso-runner-counter">
                  <span class="amso-runner-counter__icon" aria-hidden="true">◆</span>
                  <span>
                    <span class="amso-runner-counter__label">Paczki</span>
                    <strong data-runner-hud-packages>0</strong>
                  </span>
                </div>
                <div class="amso-runner-counter">
                  <span class="amso-runner-counter__icon amso-runner-counter__icon--score" aria-hidden="true">★</span>
                  <span>
                    <span class="amso-runner-counter__label">Wynik</span>
                    <strong data-runner-hud-score>0</strong>
                  </span>
                </div>
              </div>

              <button
                class="amso-runner-pause-button"
                type="button"
                data-runner-pause
                aria-pressed="false"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M8.25 6.75v10.5M15.75 6.75v10.5" />
                </svg>
                <span data-runner-pause-label>Pauza</span>
              </button>
            </section>

            <div class="amso-runner-controls-hint" data-runner-controls hidden aria-hidden="true">
              <span class="amso-runner-controls-hint__desktop"><kbd>Spacja</kbd> = skok · <kbd>↓</kbd>/<kbd>S</kbd> = przykucnij</span>
              <span class="amso-runner-controls-hint__mobile">Dotyk = skok · przesuń w dół = przykucnij</span>
            </div>

            <section class="amso-runner-screen amso-runner-screen--start" data-runner-start>
              <div class="amso-runner-screen__decoration" aria-hidden="true">
                <span class="amso-runner-package amso-runner-package--one"></span>
                <span class="amso-runner-package amso-runner-package--two"></span>
                <span class="amso-runner-route-line"></span>
              </div>

              <div class="amso-runner-card amso-runner-card--start">
                <p class="amso-runner-eyebrow">Jubileuszowa mini-gra AMSO</p>
                <h1 id="${titleId}">Droga do <span>Miliona</span></h1>
                <div class="amso-runner-claim" aria-label="Ponad milion zrealizowanych zamówień">
                  <strong data-runner-claim></strong>
                  <span>zrealizowanych zamówień</span>
                </div>
              <p id="${descriptionId}" class="amso-runner-instruction">
                Zbieraj paczki, omijaj przeszkody i przetrwaj starcie z Wózkiem Milionerem. Skacz spacją, kliknięciem lub dotknięciem. Pod wiszące belki przykucnij strzałką w dół, S lub przesunięciem palcem w dół.
              </p>
                <button class="amso-runner-primary-button" type="button" data-runner-start-button>
                  <span>Rozpocznij bieg</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
                <p class="amso-runner-card__note">Jedna zasada: zbieraj paczki i biegnij jak najdalej.</p>
              </div>
            </section>

            <section class="amso-runner-screen amso-runner-screen--pause" data-runner-pause-screen hidden>
              <div class="amso-runner-card amso-runner-card--pause">
                <span class="amso-runner-pause-mark" aria-hidden="true">
                  <i></i><i></i>
                </span>
                <p class="amso-runner-eyebrow">Krótki przystanek</p>
                <h2>Gra wstrzymana</h2>
                <p>Trasa poczeka. Wznów bieg, gdy będziesz gotowy.</p>
                <button class="amso-runner-primary-button" type="button" data-runner-resume>
                  <span>Wznów bieg</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              </div>
            </section>

            <section class="amso-runner-screen amso-runner-screen--over" data-runner-game-over hidden>
              <div class="amso-runner-card amso-runner-card--over">
                <p class="amso-runner-eyebrow">Świetny bieg!</p>
                <h2 tabindex="-1" data-runner-game-over-title>Twoja paczka wyników</h2>

                <div class="amso-runner-result-grid" aria-label="Wynik końcowy">
                  <div class="amso-runner-result amso-runner-result--packages">
                    <span>Paczki</span>
                    <strong data-runner-result-packages>0</strong>
                  </div>
                  <div class="amso-runner-result">
                    <span>Wynik</span>
                    <strong data-runner-result-score>0</strong>
                  </div>
                  <div class="amso-runner-result">
                    <span>Dystans</span>
                    <strong><span data-runner-result-distance>0</span> m</strong>
                  </div>
                  <div class="amso-runner-result amso-runner-result--bosses">
                    <span>Bossowie</span>
                    <strong data-runner-result-bosses>0</strong>
                  </div>
                </div>

                <div class="amso-runner-fact" data-runner-fact>
                  <span class="amso-runner-fact__icon" aria-hidden="true">i</span>
                  <p><strong>Czy wiesz, że…</strong> <span data-runner-fact-text></span></p>
                </div>

                <p class="amso-runner-facts-count" data-runner-facts-count hidden></p>

                <p class="amso-runner-dropout-note" data-runner-dropout hidden></p>

                <div class="amso-runner-discount" data-runner-discount hidden>
                  <span class="amso-runner-discount__label" data-runner-discount-label></span>
                  <code class="amso-runner-discount__code" data-runner-discount-code></code>
                </div>

                <div class="amso-runner-celebration-claim">
                  <span>Razem z Tobą</span>
                  <strong data-runner-claim></strong>
                </div>

                <div class="amso-runner-actions">
                  <button class="amso-runner-secondary-button" type="button" data-runner-restart>
                    Zagraj ponownie
                  </button>
                  <a class="amso-runner-primary-button" data-runner-cta>
                    <span data-runner-cta-label></span>
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </a>
                  <button class="amso-runner-secondary-button" type="button" data-runner-share>
                    Udostępnij wynik
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer class="amso-runner-modal__footer">
          <span>Nie możesz lub nie chcesz grać?</span>
          <a data-runner-alternate-link>Przejdź do strony kampanii</a>
        </footer>
      </div>

      <div class="amso-runner-sr-only" data-runner-live aria-live="polite" aria-atomic="true"></div>
    `;

    this.canvas = requiredElement<HTMLCanvasElement>(this.root, "[data-runner-canvas]");
    this.startScreen = requiredElement<HTMLElement>(this.root, "[data-runner-start]");
    this.gameOverScreen = requiredElement<HTMLElement>(this.root, "[data-runner-game-over]");
    this.pauseScreen = requiredElement<HTMLElement>(this.root, "[data-runner-pause-screen]");
    this.hud = requiredElement<HTMLElement>(this.root, "[data-runner-hud]");
    this.controlsHint = requiredElement<HTMLElement>(this.root, "[data-runner-controls]");
    this.startButton = requiredElement<HTMLButtonElement>(this.root, "[data-runner-start-button]");
    this.restartButton = requiredElement<HTMLButtonElement>(this.root, "[data-runner-restart]");
    this.closeButton = requiredElement<HTMLButtonElement>(this.root, "[data-runner-close]");
    this.pauseButton = requiredElement<HTMLButtonElement>(this.root, "[data-runner-pause]");
    this.resumeButton = requiredElement<HTMLButtonElement>(this.root, "[data-runner-resume]");
    this.ctaLink = requiredElement<HTMLAnchorElement>(this.root, "[data-runner-cta]");
    this.alternateLink = requiredElement<HTMLAnchorElement>(this.root, "[data-runner-alternate-link]");
    this.gameOverTitle = requiredElement<HTMLHeadingElement>(this.root, "[data-runner-game-over-title]");
    this.liveRegion = requiredElement<HTMLDivElement>(this.root, "[data-runner-live]");
    this.hudScore = requiredElement<HTMLElement>(this.root, "[data-runner-hud-score]");
    this.hudPackages = requiredElement<HTMLElement>(this.root, "[data-runner-hud-packages]");
    this.resultScore = requiredElement<HTMLElement>(this.root, "[data-runner-result-score]");
    this.resultPackages = requiredElement<HTMLElement>(this.root, "[data-runner-result-packages]");
    this.resultDistance = requiredElement<HTMLElement>(this.root, "[data-runner-result-distance]");
    this.resultBosses = requiredElement<HTMLElement>(this.root, "[data-runner-result-bosses]");
    this.fact = requiredElement<HTMLElement>(this.root, "[data-runner-fact]");
    this.factText = requiredElement<HTMLElement>(this.root, "[data-runner-fact-text]");
    this.epochTag = requiredElement<HTMLElement>(this.root, "[data-runner-epoch]");
    this.epochName = requiredElement<HTMLElement>(this.root, "[data-runner-epoch-name]");
    this.epochYear = requiredElement<HTMLElement>(this.root, "[data-runner-epoch-year]");
    this.epochProgress = requiredElement<HTMLElement>(this.root, "[data-runner-epoch-progress]");
    this.factsCount = requiredElement<HTMLElement>(this.root, "[data-runner-facts-count]");
    this.dropoutNote = requiredElement<HTMLElement>(this.root, "[data-runner-dropout]");
    this.discountBox = requiredElement<HTMLElement>(this.root, "[data-runner-discount]");
    this.discountLabel = requiredElement<HTMLElement>(this.root, "[data-runner-discount-label]");
    this.discountCode = requiredElement<HTMLElement>(this.root, "[data-runner-discount-code]");
    this.shareButton = requiredElement<HTMLButtonElement>(this.root, "[data-runner-share]");

    this.root.querySelectorAll<HTMLElement>("[data-runner-claim]").forEach((element) => {
      element.textContent = this.config.claim;
    });
    requiredElement<HTMLElement>(this.root, "[data-runner-cta-label]").textContent =
      this.config.cta.label;
    this.ctaLink.href = this.config.cta.path;
    this.ctaLink.dataset.ctaId = this.config.cta.id;
    this.alternateLink.href = this.config.cta.path;

    (document.body ?? document.documentElement).append(this.root);

    this.closeButton.addEventListener("click", this.handleCloseClick);
    this.startButton.addEventListener("click", this.handleStartClick);
    this.restartButton.addEventListener("click", this.handleRestartClick);
    this.pauseButton.addEventListener("click", this.handlePauseClick);
    this.resumeButton.addEventListener("click", this.handlePauseClick);
    this.ctaLink.addEventListener("click", this.handleCtaClick);
    this.shareButton.addEventListener("click", this.handleShareClick);
    this.canvas.addEventListener("pointerdown", this.handleCanvasPointerDown);
    this.canvas.addEventListener("pointermove", this.handleCanvasPointerMove);
    this.canvas.addEventListener("pointerup", this.handleCanvasPointerUp);
    this.canvas.addEventListener("pointercancel", this.handleCanvasPointerCancel);
    document.addEventListener("keydown", this.handleDocumentKeydown, true);
    document.addEventListener("keyup", this.handleDocumentKeyup, true);
    document.addEventListener("focusin", this.handleDocumentFocusIn, true);
    this.renderState();
  }

  public open(options: RunnerOpenOptions): void {
    if (this.destroyed) {
      return;
    }

    if (!this.opened) {
      const activeElement = document.activeElement;
      this.returnFocusTo =
        options.returnFocusTo ?? (activeElement instanceof HTMLElement ? activeElement : null);
      this.bodyOverflowBeforeOpen = document.body?.style.overflow ?? null;

      if (document.body) {
        document.body.style.overflow = "hidden";
      }

      this.root.hidden = false;
      this.root.dataset.open = "true";
      this.opened = true;
    }

    this.focusForState();
    this.announceCurrentState();
  }

  public close(): void {
    if (!this.opened) {
      return;
    }

    this.opened = false;
    this.root.hidden = true;
    delete this.root.dataset.open;
    this.liveRegion.textContent = "";

    if (document.body && this.bodyOverflowBeforeOpen !== null) {
      document.body.style.overflow = this.bodyOverflowBeforeOpen;
    }

    this.bodyOverflowBeforeOpen = null;

    const focusTarget = this.returnFocusTo;
    this.returnFocusTo = null;

    if (focusTarget?.isConnected) {
      focusTarget.focus({ preventScroll: true });
    }
  }

  public setState(state: GameState): void {
    if (this.destroyed) {
      return;
    }

    if (state === "destroyed") {
      this.destroy();
      return;
    }

    const previousState = this.currentState;
    this.currentState = state;

    if (state === "ready" || state === "running") {
      this.lastResult = null;
    }

    if (state !== "game_over") {
      this.gameOverAnnounced = false;
    }

    this.renderState();

    if (previousState !== state) {
      this.announceCurrentState();
      this.focusForState();
    }
  }

  public update(snapshot: GameSnapshot): void {
    if (this.destroyed) {
      return;
    }

    this.hudScore.textContent = formatInteger(snapshot.score);
    this.hudPackages.textContent = formatInteger(snapshot.packagesCollected);

    const showEpoch =
      snapshot.epochIndexMax > 0 && snapshot.epochName.length > 0 && this.currentState === "running";
    this.epochTag.hidden = !showEpoch;
    if (showEpoch) {
      this.epochName.textContent = snapshot.epochName;
      this.epochYear.textContent = snapshot.epochYear;
      this.epochProgress.textContent = `${snapshot.epochIndex + 1}/${snapshot.epochIndexMax + 1}`;
    }

    if (snapshot.bossPhase !== this.lastBossPhase && this.currentState === "running") {
      if (snapshot.bossPhase === "warning") {
        this.announce("Uwaga. Nadjeżdża Wózek Milioner.");
      } else if (snapshot.bossPhase === "attacking") {
        this.announce("Starcie z bossem rozpoczęte. Przeskocz trzy przeszkody.");
      } else if (snapshot.bossPhase === "reward") {
        this.announce(`Boss pokonany. Bonus ${formatInteger(BOSS.scoreBonus)} punktów.`);
      }
    } else if (
      snapshot.bossPhase === "attacking" &&
      snapshot.bossProgress > this.lastBossProgress &&
      this.currentState === "running"
    ) {
      this.announce(
        `Unik ${formatInteger(snapshot.bossProgress)} z ${formatInteger(snapshot.bossAttackCount)}.`,
      );
    }

    this.lastBossPhase = snapshot.bossPhase;
    this.lastBossProgress = snapshot.bossProgress;
  }

  public showGameOver(result: GameResult, summary: RunSummary): void {
    if (this.destroyed) {
      return;
    }

    this.lastResult = result;
    this.gameOverTitle.textContent =
      summary.outcome === "victory"
        ? "Przeszedłeś z nami kawałek drogi do miliona."
        : "Dobry bieg — do miliona brakuje już niewiele.";
    this.resultScore.textContent = formatInteger(result.score);
    this.resultPackages.textContent = formatInteger(result.packagesCollected);
    this.resultDistance.textContent = formatInteger(result.distanceM);
    this.resultBosses.textContent = formatInteger(result.bossesDefeated);

    const fact = summary.fact;
    if (fact && !summary.narrative) {
      this.fact.dataset.factId = fact.id;
      this.factText.textContent = fact.text;
      this.fact.hidden = fact.text.trim().length === 0;
    } else {
      this.fact.hidden = true;
    }

    if (summary.narrative) {
      this.factsCount.hidden = false;
      this.factsCount.textContent = summary.factsUnlockedCount > 0
        ? `Odkryte fakty w tej sesji: ${summary.factsUnlockedCount} · w całej historii: ${summary.cumulativeFactCount}`
        : `W tej sesji nie odkryłeś nowych faktów · w całej historii: ${summary.cumulativeFactCount}`;
    } else {
      this.factsCount.hidden = true;
    }

    if (summary.outcome === "dropout" && summary.epochYear) {
      this.dropoutNote.hidden = false;
      this.dropoutNote.textContent = `Zatrzymałeś się w ${summary.epochYear} — spróbuj dojść dalej!`;
    } else {
      this.dropoutNote.hidden = true;
    }

    if (summary.discountCode) {
      this.discountBox.hidden = false;
      this.discountLabel.textContent = summary.discountCode.label;
      this.discountCode.textContent = summary.discountCode.code;
    } else {
      this.discountBox.hidden = true;
    }

    if (this.currentState !== "game_over") {
      this.setState("game_over");
    } else {
      this.renderState();

      if (!this.gameOverAnnounced) {
        this.announceCurrentState();
      }

      this.focusForState();
    }
  }

  private readonly handleShareClick = (event: MouseEvent): void => {
    this.callbacks.onShare(event);
  };

  public announce(message: string): void {
    if (this.destroyed) {
      return;
    }

    this.liveRegion.textContent = message;
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.close();
    this.destroyed = true;
    this.currentState = "destroyed";
    this.root.dataset.state = "destroyed";

    this.closeButton.removeEventListener("click", this.handleCloseClick);
    this.startButton.removeEventListener("click", this.handleStartClick);
    this.restartButton.removeEventListener("click", this.handleRestartClick);
    this.pauseButton.removeEventListener("click", this.handlePauseClick);
    this.resumeButton.removeEventListener("click", this.handlePauseClick);
    this.ctaLink.removeEventListener("click", this.handleCtaClick);
    this.shareButton.removeEventListener("click", this.handleShareClick);
    this.canvas.removeEventListener("pointerdown", this.handleCanvasPointerDown);
    this.canvas.removeEventListener("pointermove", this.handleCanvasPointerMove);
    this.canvas.removeEventListener("pointerup", this.handleCanvasPointerUp);
    this.canvas.removeEventListener("pointercancel", this.handleCanvasPointerCancel);
    document.removeEventListener("keydown", this.handleDocumentKeydown, true);
    document.removeEventListener("keyup", this.handleDocumentKeyup, true);
    document.removeEventListener("focusin", this.handleDocumentFocusIn, true);
    this.root.remove();
  }

  private readonly handleCloseClick = (): void => {
    this.callbacks.onClose("close_button");
  };

  private readonly handleStartClick = (): void => {
    this.callbacks.onStart();
  };

  private readonly handleRestartClick = (): void => {
    this.callbacks.onRestart();
  };

  private readonly handlePauseClick = (): void => {
    this.callbacks.onPauseToggle();
  };

  private readonly handleCtaClick = (event: MouseEvent): void => {
    this.callbacks.onCta(event);
  };

  private pointerStartY: number | null = null;
  private pointerSwipedDown = false;

  private readonly handleCanvasPointerDown = (event: PointerEvent): void => {
    if (this.currentState !== "running" || !event.isPrimary || event.button > 0) {
      return;
    }

    event.preventDefault();
    this.canvas.focus({ preventScroll: true });

    if (event.pointerType === "touch") {
      this.pointerStartY = event.clientY;
      this.pointerSwipedDown = false;
      return;
    }

    this.callbacks.onJump(event.pointerType === "pointer" ? "pointer" : "keyboard");
  };

  private readonly handleCanvasPointerMove = (event: PointerEvent): void => {
    if (this.pointerStartY === null) {
      return;
    }
    if (event.clientY - this.pointerStartY > 24) {
      this.pointerSwipedDown = true;
      this.callbacks.onCrouch(true, "touch");
    }
  };

  private readonly handleCanvasPointerUp = (event: PointerEvent): void => {
    if (this.pointerStartY === null) {
      return;
    }
    if (this.pointerSwipedDown) {
      this.callbacks.onCrouch(false, "touch");
    } else {
      this.callbacks.onJump(event.pointerType === "touch" ? "touch" : "pointer");
    }
    this.pointerStartY = null;
    this.pointerSwipedDown = false;
  };

  private readonly handleCanvasPointerCancel = (): void => {
    if (this.pointerStartY !== null && this.pointerSwipedDown) {
      this.callbacks.onCrouch(false, "touch");
    }
    this.pointerStartY = null;
    this.pointerSwipedDown = false;
  };

  private readonly handleDocumentKeydown = (event: KeyboardEvent): void => {
    if (!this.opened) {
      return;
    }

    if (isInsideExternalModal(this.root, event.target)) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.callbacks.onClose("escape");
      return;
    }

    if (event.key === "Tab") {
      this.trapFocus(event);
      return;
    }

    const isSpace = event.code === "Space" || event.key === " ";
    const isCrouch =
      event.code === "ArrowDown" ||
      event.code === "KeyS" ||
      event.key === "ArrowDown" ||
      event.key === "s" ||
      event.key === "S";

    if (
      isSpace &&
      !event.repeat &&
      this.currentState === "running" &&
      !isInteractiveControl(event.target)
    ) {
      event.preventDefault();
      this.callbacks.onJump("keyboard");
      return;
    }

    if (
      isCrouch &&
      !event.repeat &&
      this.currentState === "running" &&
      !isInteractiveControl(event.target)
    ) {
      event.preventDefault();
      this.callbacks.onCrouch(true, "keyboard");
    }
  };

  private readonly handleDocumentKeyup = (event: KeyboardEvent): void => {
    if (!this.opened) {
      return;
    }
    const isCrouch =
      event.code === "ArrowDown" ||
      event.code === "KeyS" ||
      event.key === "ArrowDown" ||
      event.key === "s" ||
      event.key === "S";
    if (isCrouch) {
      this.callbacks.onCrouch(false, "keyboard");
    }
  };

  private readonly handleDocumentFocusIn = (event: FocusEvent): void => {
    if (!this.opened || this.root.contains(event.target as Node)) {
      return;
    }

    if (isInsideExternalModal(this.root, event.target)) {
      return;
    }

    this.focusFirstAvailable();
  };

  private renderState(): void {
    const isReady = this.currentState === "ready";
    const isRunning = this.currentState === "running";
    const isPaused = this.currentState === "paused";
    const isGameOver = this.currentState === "game_over";

    this.root.dataset.state = this.currentState;
    this.startScreen.hidden = !isReady;
    this.gameOverScreen.hidden = !isGameOver;
    this.pauseScreen.hidden = !isPaused;
    this.hud.hidden = !isRunning;
    this.controlsHint.hidden = !isRunning;

    this.pauseButton.setAttribute("aria-pressed", String(isPaused));
    requiredElement<HTMLElement>(this.pauseButton, "[data-runner-pause-label]").textContent =
      isPaused ? "Wznów" : "Pauza";

    this.canvas.tabIndex = isRunning ? 0 : -1;
    this.canvas.setAttribute("aria-hidden", String(!isRunning));
  }

  private announceCurrentState(): void {
    if (!this.opened) {
      return;
    }

    switch (this.currentState) {
      case "ready":
        this.announce("Gra gotowa. Wybierz Rozpocznij bieg.");
        break;
      case "running":
        this.announce("Bieg rozpoczęty. Skacz spacją, kliknięciem lub dotknięciem.");
        break;
      case "paused":
        this.announce("Gra wstrzymana.");
        break;
      case "game_over":
        if (this.lastResult) {
          this.announce(
            `Koniec biegu. Wynik ${formatInteger(this.lastResult.score)}. Zebrane paczki: ${formatInteger(
              this.lastResult.packagesCollected,
            )}. Pokonani bossowie: ${formatInteger(this.lastResult.bossesDefeated)}.`,
          );
          this.gameOverAnnounced = true;
        }
        break;
      case "destroyed":
        break;
    }
  }

  private focusForState(): void {
    if (!this.opened) {
      return;
    }

    if (this.currentState === "ready") {
      this.startButton.focus({ preventScroll: true });
      return;
    }

    if (this.currentState === "running") {
      this.canvas.focus({ preventScroll: true });
      return;
    }

    if (this.currentState === "game_over") {
      this.gameOverTitle.focus({ preventScroll: true });
      return;
    }

    if (this.currentState === "paused") {
      this.resumeButton.focus({ preventScroll: true });
    }
  }

  private focusFirstAvailable(): void {
    const first = this.getFocusableElements()[0];
    (first ?? this.root).focus({ preventScroll: true });
  }

  private getFocusableElements(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (element) =>
        !element.hasAttribute("disabled") &&
        !element.closest("[hidden]") &&
        element.getAttribute("aria-hidden") !== "true",
    );
  }

  private trapFocus(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();

    if (focusableElements.length === 0) {
      event.preventDefault();
      this.root.focus({ preventScroll: true });
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (!first || !last) {
      return;
    }

    const activeElement = document.activeElement;

    if (event.shiftKey && (activeElement === first || !this.root.contains(activeElement))) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && (activeElement === last || !this.root.contains(activeElement))) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }
}

export default RunnerModal;
