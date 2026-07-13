import "../styles/campaign.css";
import type { ControlMethod, GameSnapshot } from "../game/contracts";

export type CampaignMode = "story" | "challenge";

export type CampaignCheckpointId =
  | "prologue"
  | "epoch_1"
  | "epoch_2"
  | "epoch_3"
  | "epoch_4"
  | "epoch_5"
  | "finale"
  | "completed";

export interface CampaignCheckpointOption {
  id: CampaignCheckpointId;
  label: string;
}

export interface CampaignLandingOptions {
  challengeUnlocked: boolean;
  checkpoint?: CampaignCheckpointOption;
  fullscreenPromptSeen: boolean;
  muted: boolean;
}

export interface CampaignStartRequest {
  mode: CampaignMode;
  checkpoint?: CampaignCheckpointId;
  restartStory: boolean;
}

export type CampaignPauseReason = "user" | "layout_change" | "visibility";

export interface CampaignStoryBeat {
  id: string;
  eyebrow?: string;
  title?: string;
  body: string | readonly string[];
}

export interface CampaignStoryResult {
  packages: number;
  score: number;
  bestCombo: number;
}

export interface CampaignChallengeResult {
  packages: number;
  score: number;
  bestScore: number;
  distanceM: number;
  warrantySaves: number;
}

export type CampaignSharePlatform = "facebook" | "instagram" | "download";
export type CampaignShareMethod = "web_share" | "facebook_url" | "download" | "cancelled";

export const DEFAULT_CAMPAIGN_SHELL_COPY = {
  brandEdition: "Droga do Miliona",
  soundOn: "Wycisz",
  soundOff: "Włącz dźwięk",
  fullscreenEnter: "Pełny ekran",
  fullscreenExit: "Wyjdź z pełnego",
  hudPackages: "Paczki",
  hudScore: "Wynik",
  pauseAction: "Pauza",
  storyMode: "Droga do Miliona",
  challengeMode: "Próba Miliona",
  landingEyebrow: "Jubileuszowa historia AMSO",
  landingTitle: "AMSO —",
  landingTitleAccent: "Droga do Miliona",
  landingLead: "Jedna paczka rozpoczęła historię. Przebiegnij z nami drogę do zamówienia nr 1 000 000.",
  landingMeta: "Około 3 minut · skok i ślizg · historia ma gwarantowany finał",
  startStory: "Rozpocznij historię",
  choosePath: "Wybierz swoją drogę",
  replayStory: "Przejdź historię ponownie",
  resumeQuestion: "Wrócić na Drogę do Miliona?",
  resumeFrom: "Kontynuuj od:",
  startOver: "Zacznij od początku",
  orientationEyebrow: "Szerszy kadr",
  orientationTitle: "Chcesz zobaczyć więcej historii?",
  orientationBody: "Obróć telefon i włącz pełny ekran. Możesz też grać pionowo.",
  orientationFullscreen: "Włącz pełny ekran",
  orientationPortrait: "Zostań w pionie",
  loading: "Przygotowujemy pierwszą paczkę…",
  errorEyebrow: "Trasa chwilowo niedostępna",
  errorTitle: "Nie udało się przygotować gry.",
  errorBody: "Sprawdź połączenie i spróbuj ponownie.",
  retry: "Spróbuj ponownie",
  campaignBack: "Wróć na stronę kampanii",
  pauseEyebrow: "Bezpieczny przystanek",
  pauseTitle: "Gra wstrzymana",
  pauseBody: "Twój postęp jest bezpieczny.",
  resume: "Wznów",
  returnToMenu: "Wróć do menu",
  corridorEyebrow: "Bezpieczny odcinek — historia biegnie dalej",
  storyResultEyebrow: "Dziękujemy za wspólną drogę",
  storyResultTitle: "Twoja Droga do Miliona",
  resultPackages: "Dostarczone paczki",
  resultScore: "Wynik",
  resultCombo: "Najlepsza seria",
  storyResultIntro: "Biegnij do pierwszego niezabezpieczonego zderzenia i ustanów rekord.",
  startChallenge: "Gramy dalej — tryb wyzwania",
  fullStory: "Poznaj pełną historię AMSO",
  challengeResultEyebrow: "Próba Miliona",
  challengeResultTitle: "Koniec próby",
  resultBest: "Rekord",
  resultDistance: "Przebyta droga",
  resultWarranty: "Gwarancja uratowała bieg",
  retryChallenge: "Spróbuj jeszcze raz",
  shareResult: "Udostępnij wynik",
  shareLead: "Wybierz, gdzie chcesz udostępnić kartę wyniku.",
  shareTurn: "Teraz Twoja kolej.",
  sharePublication: "Sprawdź, jak daleko dojdziesz w Drodze do Miliona.",
  sharePreparing: "Przygotowujemy kartę wyniku…",
  shareReady: "Karta wyniku jest gotowa do udostępnienia.",
  shareDownloaded: "Zapisaliśmy kartę. Dodaj ją do relacji lub posta.",
  shareDownloadReady: "Karta jest gotowa do dodania na Facebooku lub Instagramie.",
  shareCancelled: "Udostępnianie anulowane.",
  shareFailure: "Nie udało się przygotować karty. Spróbuj ponownie.",
  facebook: "Facebook",
  instagram: "Instagram",
  downloadCard: "Pobierz kartę",
  narrowTitle: "Potrzebujemy trochę więcej miejsca.",
  narrowBody: "Obróć urządzenie, żeby rozpocząć grę.",
  footerTagline: "AMSO. Sprzęt z przeszłością. Na przyszłość.",
  footerCampaign: "Strona kampanii",
} as const;

export type CampaignShellCopy = {
  [Key in keyof typeof DEFAULT_CAMPAIGN_SHELL_COPY]: string;
};

export interface CampaignShellCallbacks {
  onStart(request: CampaignStartRequest): void;
  onPause(reason: CampaignPauseReason): void;
  onResume(): void;
  onRestart(mode: CampaignMode): void;
  onReturnToMenu(): void;
  onRetryLoad(): void;
  onJump(method: ControlMethod): void;
  onSlide(active: boolean, method: ControlMethod): void;
  onMuteChange(muted: boolean): void;
  onFullscreenPromptHandled(choice: "fullscreen" | "portrait"): void;
  onShare?(platform: CampaignSharePlatform, method: CampaignShareMethod): void;
}

export interface CampaignShellOptions {
  canonicalUrl?: string;
  campaignUrl?: string;
  fullStoryUrl?: string;
  copy?: Partial<CampaignShellCopy>;
}

export interface CampaignShareCardOptions {
  canonicalUrl: string;
  title?: string;
  scoreLabel?: string;
  packagesLabel?: string;
  callToAction?: string;
  publicationText?: string;
}

export interface CampaignShareRequest extends CampaignShareCardOptions {
  platform: Exclude<CampaignSharePlatform, "download">;
  result: Pick<CampaignChallengeResult, "score" | "packages">;
}

const integerFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });

function formatInteger(value: number): string {
  return integerFormatter.format(Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
}

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Campaign shell element not found: ${selector}`);
  }
  return element;
}

function canonicalPageUrl(): string {
  if (typeof window === "undefined") {
    return "/gra/droga-do-miliona";
  }
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.href;
}

function isMobileLayout(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return coarsePointer || navigator.maxTouchPoints > 0;
}

function drawShareCard(
  context: CanvasRenderingContext2D,
  result: Pick<CampaignChallengeResult, "score" | "packages">,
  options: CampaignShareCardOptions,
): void {
  const { canvas } = context;
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#061426");
  gradient.addColorStop(0.56, "#0c294b");
  gradient.addColorStop(1, "#123b68");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255,255,255,0.035)";
  for (let x = 0; x < canvas.width; x += 54) {
    context.fillRect(x, 0, 2, canvas.height);
  }
  for (let y = 0; y < canvas.height; y += 54) {
    context.fillRect(0, y, canvas.width, 2);
  }

  context.fillStyle = "#ff6b00";
  context.beginPath();
  context.arc(885, 182, 220, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.13)";
  context.beginPath();
  context.arc(885, 182, 151, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ff6b00";
  context.font = "950 70px system-ui, sans-serif";
  context.fillText("AMSO", 82, 125);
  context.fillStyle = "#ffffff";
  context.font = "800 34px system-ui, sans-serif";
  context.fillText(options.title ?? "Droga do Miliona", 82, 177);

  context.fillStyle = "#aebed0";
  context.font = "750 29px system-ui, sans-serif";
  context.fillText(options.scoreLabel ?? "MÓJ WYNIK", 82, 398);
  context.fillStyle = "#ffffff";
  context.font = "950 136px system-ui, sans-serif";
  context.fillText(formatInteger(result.score), 76, 536);

  context.fillStyle = "#fff8ed";
  context.beginPath();
  context.roundRect(76, 636, 928, 206, 38);
  context.fill();
  context.fillStyle = "#607083";
  context.font = "800 28px system-ui, sans-serif";
  context.fillText(options.packagesLabel ?? "DOSTARCZONE PACZKI", 124, 708);
  context.fillStyle = "#071a31";
  context.font = "950 78px system-ui, sans-serif";
  context.fillText(formatInteger(result.packages), 124, 797);

  context.fillStyle = "#ffffff";
  context.font = "900 50px system-ui, sans-serif";
  context.fillText(options.callToAction ?? "Teraz Twoja kolej.", 82, 1019);
  context.fillStyle = "#dce6f1";
  context.font = "600 25px system-ui, sans-serif";
  context.fillText("Sprawdź, jak daleko dojdziesz", 82, 1072);
  context.fillText("w Drodze do Miliona.", 82, 1111);

  context.fillStyle = "rgba(255,255,255,0.72)";
  context.font = "600 20px system-ui, sans-serif";
  context.fillText(options.canonicalUrl, 82, 1269, 916);
}

function canvasToBlob(canvas: HTMLCanvasElement): Blob {
  const dataUrl = canvas.toDataURL("image/png");
  const separator = dataUrl.indexOf(",");
  if (separator < 0) {
    throw new Error("share_card_generation_failed");
  }
  const binary = atob(dataUrl.slice(separator + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: "image/png" });
}

export async function createCampaignShareCard(
  result: Pick<CampaignChallengeResult, "score" | "packages">,
  options: CampaignShareCardOptions,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("share_card_canvas_unavailable");
  }
  drawShareCard(context, result, options);
  return canvasToBlob(canvas);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export async function downloadCampaignShareCard(
  result: Pick<CampaignChallengeResult, "score" | "packages">,
  options: CampaignShareCardOptions,
): Promise<void> {
  const blob = await createCampaignShareCard(result, options);
  downloadBlob(blob, `amso-droga-do-miliona-${Math.floor(result.score)}.png`);
}

export async function shareCampaignResult(request: CampaignShareRequest): Promise<CampaignShareMethod> {
  const text = request.publicationText ?? "Sprawdź, jak daleko dojdziesz w Drodze do Miliona.";
  if (request.platform === "facebook" && typeof navigator.share !== "function") {
    const shareUrl = new URL("https://www.facebook.com/sharer/sharer.php");
    shareUrl.searchParams.set("u", request.canonicalUrl);
    const popup = window.open(shareUrl.href, "amso-facebook-share", "popup,width=680,height=620");
    if (popup !== null) {
      popup.opener = null;
      return "facebook_url";
    }
  }

  const blob = await createCampaignShareCard(request.result, request);
  const filename = `amso-droga-do-miliona-${Math.floor(request.result.score)}.png`;
  const file = new File([blob], filename, { type: "image/png" });
  const shareData: ShareData = {
    title: request.title ?? "AMSO — Droga do Miliona",
    text,
    url: request.canonicalUrl,
    files: [file],
  };

  if (
    typeof navigator.share === "function" &&
    (typeof navigator.canShare !== "function" || navigator.canShare(shareData))
  ) {
    try {
      await navigator.share(shareData);
      return "web_share";
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  if (request.platform === "facebook") {
    const shareUrl = new URL("https://www.facebook.com/sharer/sharer.php");
    shareUrl.searchParams.set("u", request.canonicalUrl);
    const popup = window.open(shareUrl.href, "amso-facebook-share", "popup,width=680,height=620");
    if (popup !== null) {
      popup.opener = null;
      // Facebook's web dialog shares the canonical OG page, not a runtime Blob.
      // Preserve the requested score card locally so the result is not lost.
      downloadBlob(blob, filename);
      return "facebook_url";
    }
  }

  downloadBlob(blob, filename);
  return "download";
}

/**
 * Dedicated, page-level DOM view for the v3 campaign. It owns presentation and
 * browser input only; gameplay, persistence and analytics remain coordinator concerns.
 */
export class CampaignShell {
  public readonly canvas: HTMLCanvasElement;

  private readonly root: HTMLElement;
  private readonly landingScreen: HTMLElement;
  private readonly landingActions: HTMLElement;
  private readonly orientationScreen: HTMLElement;
  private readonly loadingScreen: HTMLElement;
  private readonly loadingText: HTMLElement;
  private readonly loadingProgress: HTMLProgressElement;
  private readonly errorScreen: HTMLElement;
  private readonly errorText: HTMLElement;
  private readonly pauseScreen: HTMLElement;
  private readonly storyResultScreen: HTMLElement;
  private readonly challengeResultScreen: HTMLElement;
  private readonly storyCaption: HTMLElement;
  private readonly storyEyebrow: HTMLElement;
  private readonly storyTitle: HTMLElement;
  private readonly storyBody: HTMLElement;
  private readonly gameplayHint: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly hudMode: HTMLElement;
  private readonly hudEpoch: HTMLElement;
  private readonly hudPackages: HTMLElement;
  private readonly hudScore: HTMLElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly fullscreenButton: HTMLButtonElement;
  private readonly liveRegion: HTMLElement;
  private readonly sharePanel: HTMLElement;
  private readonly shareStatus: HTMLElement;
  private readonly tooNarrow: HTMLElement;
  private readonly canonicalUrl: string;
  private readonly campaignUrl: string;
  private readonly fullStoryUrl: string;
  private readonly copy: CampaignShellCopy;
  private activeMode: CampaignMode | null = null;
  private pendingStart: CampaignStartRequest | null = null;
  private fullscreenPromptSeen = false;
  private muted = false;
  private paused = false;
  private trustCorridor = false;
  private destroyed = false;
  private pointerStartY: number | null = null;
  private pointerSwipedDown = false;
  private challengeResult: CampaignChallengeResult | null = null;
  private readonly orientationQuery: MediaQueryList | null;

  public constructor(
    host: HTMLElement,
    private readonly callbacks: CampaignShellCallbacks,
    options: CampaignShellOptions = {},
  ) {
    this.canonicalUrl = options.canonicalUrl ?? canonicalPageUrl();
    this.campaignUrl = options.campaignUrl ?? "/milion";
    this.fullStoryUrl = options.fullStoryUrl ?? this.campaignUrl;
    this.copy = { ...DEFAULT_CAMPAIGN_SHELL_COPY, ...options.copy };
    this.root = document.createElement("div");
    this.root.className = "amso-campaign";
    this.root.dataset.view = "landing";
    this.root.innerHTML = `
      <div class="amso-campaign__backdrop" aria-hidden="true"></div>
      <header class="amso-campaign__header">
        <a class="amso-campaign__brand" data-campaign-link>
          <span class="amso-campaign__brand-name">AMSO</span>
          <span class="amso-campaign__brand-edition" data-campaign-copy="brandEdition">Droga do Miliona</span>
        </a>
        <div class="amso-campaign__tools">
          <button class="amso-campaign__icon-button" type="button" data-campaign-mute aria-pressed="false">
            <span aria-hidden="true" data-campaign-mute-icon>♪</span>
            <span class="amso-campaign__tool-label" data-campaign-mute-label data-campaign-copy="soundOn">Wycisz</span>
          </button>
          <button class="amso-campaign__icon-button" type="button" data-campaign-fullscreen aria-pressed="false">
            <span aria-hidden="true">⛶</span>
            <span class="amso-campaign__tool-label" data-campaign-copy="fullscreenEnter">Pełny ekran</span>
          </button>
        </div>
      </header>

      <main class="amso-campaign__main">
        <section class="amso-campaign__stage" data-campaign-stage>
          <canvas
            class="amso-campaign__canvas"
            data-campaign-canvas
            width="960"
            height="540"
            tabindex="-1"
            aria-hidden="true"
            aria-label="Pole gry. Spacja lub tapnięcie wykonuje skok. Strzałka w dół, S lub przesunięcie w dół wykonuje ślizg."
          ></canvas>
          <div class="amso-campaign__trust-sphere" aria-hidden="true"></div>

          <section class="amso-campaign__hud" data-campaign-hud hidden aria-label="Wynik biegu">
            <div class="amso-campaign__hud-context">
              <strong data-campaign-hud-mode></strong>
              <span data-campaign-hud-epoch></span>
            </div>
            <div class="amso-campaign__hud-stats">
              <span><small data-campaign-copy="hudPackages">Paczki</small> <strong data-campaign-hud-packages>0</strong></span>
              <span><small data-campaign-copy="hudScore">Wynik</small> <strong data-campaign-hud-score>0</strong></span>
            </div>
            <button class="amso-campaign__pause-button" type="button" data-campaign-pause data-campaign-copy="pauseAction">Pauza</button>
          </section>

          <section class="amso-campaign__story-caption" data-campaign-story-caption hidden aria-live="polite">
            <p class="amso-campaign__eyebrow" data-campaign-story-eyebrow></p>
            <h2 data-campaign-story-title hidden></h2>
            <div data-campaign-story-body></div>
          </section>

          <div class="amso-campaign__gameplay-hint" data-campaign-gameplay-hint hidden role="status"></div>

          <section class="amso-campaign__screen amso-campaign__screen--landing" data-campaign-landing>
            <div class="amso-campaign__landing-copy">
              <p class="amso-campaign__eyebrow" data-campaign-copy="landingEyebrow">Jubileuszowa historia AMSO</p>
              <h1><small data-campaign-copy="landingTitle">AMSO —</small> <span data-campaign-copy="landingTitleAccent">Droga do Miliona</span></h1>
              <p class="amso-campaign__lead" data-campaign-copy="landingLead">Jedna paczka rozpoczęła historię. Przebiegnij z nami drogę do zamówienia nr 1 000 000.</p>
              <p class="amso-campaign__meta" data-campaign-copy="landingMeta">Około 3 minut · skok i ślizg · historia ma gwarantowany finał</p>
              <div class="amso-campaign__landing-actions" data-campaign-landing-actions></div>
            </div>
            <div class="amso-campaign__landing-art" aria-hidden="true">
              <span class="amso-campaign__first-package">1</span>
              <span class="amso-campaign__spark"></span>
              <span class="amso-campaign__milestone">1 000 000</span>
            </div>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--dialog" data-campaign-orientation hidden>
            <div class="amso-campaign__card">
              <p class="amso-campaign__eyebrow" data-campaign-copy="orientationEyebrow">Szerszy kadr</p>
              <h2 data-campaign-copy="orientationTitle">Chcesz zobaczyć więcej historii?</h2>
              <p data-campaign-copy="orientationBody">Obróć telefon i włącz pełny ekran. Możesz też grać pionowo.</p>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-enter-fullscreen data-campaign-copy="orientationFullscreen">Włącz pełny ekran</button>
                <button class="amso-campaign__button amso-campaign__button--secondary" type="button" data-campaign-stay-portrait data-campaign-copy="orientationPortrait">Zostań w pionie</button>
              </div>
            </div>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--dialog" data-campaign-loading hidden>
            <div class="amso-campaign__card amso-campaign__card--loading">
              <span class="amso-campaign__loading-package" aria-hidden="true"></span>
              <h2 data-campaign-loading-text data-campaign-copy="loading">Przygotowujemy pierwszą paczkę…</h2>
              <progress data-campaign-loading-progress max="1"></progress>
            </div>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--dialog" data-campaign-error hidden>
            <div class="amso-campaign__card">
              <p class="amso-campaign__eyebrow" data-campaign-copy="errorEyebrow">Trasa chwilowo niedostępna</p>
              <h2 data-campaign-copy="errorTitle">Nie udało się przygotować gry.</h2>
              <p data-campaign-error-text data-campaign-copy="errorBody">Sprawdź połączenie i spróbuj ponownie.</p>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-retry data-campaign-copy="retry">Spróbuj ponownie</button>
                <a class="amso-campaign__button amso-campaign__button--secondary" data-campaign-link data-campaign-copy="campaignBack">Wróć na stronę kampanii</a>
              </div>
            </div>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--dialog" data-campaign-pause-screen hidden>
            <div class="amso-campaign__card">
              <p class="amso-campaign__eyebrow" data-campaign-copy="pauseEyebrow">Bezpieczny przystanek</p>
              <h2 data-campaign-copy="pauseTitle">Gra wstrzymana</h2>
              <p data-campaign-copy="pauseBody">Twój postęp jest bezpieczny.</p>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-resume data-campaign-copy="resume">Wznów</button>
                <button class="amso-campaign__button amso-campaign__button--secondary" type="button" data-campaign-menu data-campaign-copy="returnToMenu">Wróć do menu</button>
              </div>
            </div>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--result" data-campaign-story-result hidden>
            <div class="amso-campaign__result-card">
              <p class="amso-campaign__eyebrow" data-campaign-copy="storyResultEyebrow">Dziękujemy za wspólną drogę</p>
              <h2 data-campaign-copy="storyResultTitle">Twoja Droga do Miliona</h2>
              <div class="amso-campaign__result-grid">
                <span><small data-campaign-copy="resultPackages">Dostarczone paczki</small> <strong data-campaign-story-packages>0</strong></span>
                <span><small data-campaign-copy="resultScore">Wynik</small> <strong data-campaign-story-score>0</strong></span>
                <span><small data-campaign-copy="resultCombo">Najlepsza seria</small> <strong data-campaign-story-combo>×1</strong></span>
              </div>
              <p class="amso-campaign__result-intro" data-campaign-copy="storyResultIntro">Biegnij do pierwszego niezabezpieczonego zderzenia i ustanów rekord.</p>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-start-challenge data-campaign-copy="startChallenge">Gramy dalej — tryb wyzwania</button>
                <a class="amso-campaign__button amso-campaign__button--secondary" data-campaign-full-story data-campaign-copy="fullStory">Poznaj pełną historię AMSO</a>
                <a class="amso-campaign__text-link" data-campaign-link data-campaign-copy="campaignBack">Wróć na stronę kampanii</a>
              </div>
            </div>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--result" data-campaign-challenge-result hidden>
            <div class="amso-campaign__result-card">
              <p class="amso-campaign__eyebrow" data-campaign-copy="challengeResultEyebrow">Próba Miliona</p>
              <h2 data-campaign-copy="challengeResultTitle">Koniec próby</h2>
              <div class="amso-campaign__result-grid amso-campaign__result-grid--challenge">
                <span><small data-campaign-copy="resultPackages">Dostarczone paczki</small> <strong data-campaign-challenge-packages>0</strong></span>
                <span><small data-campaign-copy="resultScore">Wynik</small> <strong data-campaign-challenge-score>0</strong></span>
                <span><small data-campaign-copy="resultBest">Rekord</small> <strong data-campaign-challenge-best>0</strong></span>
                <span><small data-campaign-copy="resultDistance">Przebyta droga</small> <strong><i data-campaign-challenge-distance>0</i> m</strong></span>
                <span><small data-campaign-copy="resultWarranty">Gwarancja uratowała bieg</small> <strong data-campaign-challenge-saves>0</strong></span>
              </div>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-restart-challenge data-campaign-copy="retryChallenge">Spróbuj jeszcze raz</button>
                <button class="amso-campaign__button amso-campaign__button--secondary" type="button" data-campaign-toggle-share data-campaign-copy="shareResult">Udostępnij wynik</button>
                <button class="amso-campaign__text-link" type="button" data-campaign-restart-story data-campaign-copy="replayStory">Przejdź historię ponownie</button>
                <a class="amso-campaign__text-link" data-campaign-link data-campaign-copy="campaignBack">Wróć na stronę kampanii</a>
              </div>
              <div class="amso-campaign__share-panel" data-campaign-share-panel hidden>
                <p><strong data-campaign-copy="shareTurn">Teraz Twoja kolej.</strong> <span data-campaign-copy="shareLead">Wybierz, gdzie chcesz udostępnić kartę wyniku.</span></p>
                <div class="amso-campaign__share-actions">
                  <button type="button" data-campaign-share="facebook" data-campaign-copy="facebook">Facebook</button>
                  <button type="button" data-campaign-share="instagram" data-campaign-copy="instagram">Instagram</button>
                  <button type="button" data-campaign-share="download" data-campaign-copy="downloadCard">Pobierz kartę</button>
                </div>
                <p class="amso-campaign__share-status" data-campaign-share-status role="status"></p>
              </div>
            </div>
          </section>

          <section class="amso-campaign__too-narrow" data-campaign-too-narrow hidden>
            <strong data-campaign-copy="narrowTitle">Potrzebujemy trochę więcej miejsca.</strong>
            <span data-campaign-copy="narrowBody">Obróć urządzenie, żeby rozpocząć grę.</span>
          </section>
        </section>
      </main>

      <footer class="amso-campaign__footer">
        <span data-campaign-copy="footerTagline">AMSO. Sprzęt z przeszłością. Na przyszłość.</span>
        <a data-campaign-link data-campaign-copy="footerCampaign">Strona kampanii</a>
      </footer>
      <div class="amso-campaign__sr-only" data-campaign-live aria-live="polite" aria-atomic="true"></div>
    `;
    host.replaceChildren(this.root);

    this.canvas = requiredElement<HTMLCanvasElement>(this.root, "[data-campaign-canvas]");
    this.landingScreen = requiredElement(this.root, "[data-campaign-landing]");
    this.landingActions = requiredElement(this.root, "[data-campaign-landing-actions]");
    this.orientationScreen = requiredElement(this.root, "[data-campaign-orientation]");
    this.loadingScreen = requiredElement(this.root, "[data-campaign-loading]");
    this.loadingText = requiredElement(this.root, "[data-campaign-loading-text]");
    this.loadingProgress = requiredElement(this.root, "[data-campaign-loading-progress]");
    this.errorScreen = requiredElement(this.root, "[data-campaign-error]");
    this.errorText = requiredElement(this.root, "[data-campaign-error-text]");
    this.pauseScreen = requiredElement(this.root, "[data-campaign-pause-screen]");
    this.storyResultScreen = requiredElement(this.root, "[data-campaign-story-result]");
    this.challengeResultScreen = requiredElement(this.root, "[data-campaign-challenge-result]");
    this.storyCaption = requiredElement(this.root, "[data-campaign-story-caption]");
    this.storyEyebrow = requiredElement(this.root, "[data-campaign-story-eyebrow]");
    this.storyTitle = requiredElement(this.root, "[data-campaign-story-title]");
    this.storyBody = requiredElement(this.root, "[data-campaign-story-body]");
    this.gameplayHint = requiredElement(this.root, "[data-campaign-gameplay-hint]");
    this.hud = requiredElement(this.root, "[data-campaign-hud]");
    this.hudMode = requiredElement(this.root, "[data-campaign-hud-mode]");
    this.hudEpoch = requiredElement(this.root, "[data-campaign-hud-epoch]");
    this.hudPackages = requiredElement(this.root, "[data-campaign-hud-packages]");
    this.hudScore = requiredElement(this.root, "[data-campaign-hud-score]");
    this.muteButton = requiredElement(this.root, "[data-campaign-mute]");
    this.fullscreenButton = requiredElement(this.root, "[data-campaign-fullscreen]");
    this.liveRegion = requiredElement(this.root, "[data-campaign-live]");
    this.sharePanel = requiredElement(this.root, "[data-campaign-share-panel]");
    this.shareStatus = requiredElement(this.root, "[data-campaign-share-status]");
    this.tooNarrow = requiredElement(this.root, "[data-campaign-too-narrow]");
    this.orientationQuery = window.matchMedia?.("(orientation: landscape)") ?? null;

    this.applyCopy();

    this.root.querySelectorAll<HTMLAnchorElement>("[data-campaign-link]").forEach((anchor) => {
      anchor.href = this.campaignUrl;
    });
    this.root.querySelectorAll<HTMLAnchorElement>("[data-campaign-full-story]").forEach((anchor) => {
      anchor.href = this.fullStoryUrl;
    });

    this.installListeners();
    this.updateNarrowState();
  }

  public showLanding(options: CampaignLandingOptions): void {
    if (this.destroyed) return;
    this.activeMode = null;
    this.challengeResult = null;
    this.fullscreenPromptSeen = options.fullscreenPromptSeen;
    this.setMuted(options.muted, false);
    this.setView("landing", this.landingScreen);
    this.renderLandingActions(options);
    this.canvas.tabIndex = -1;
    this.announce("Gra gotowa. Wybierz swoją drogę.");
  }

  public showLoading(progress?: number, label?: string): void {
    if (this.destroyed) return;
    const loadingLabel = label ?? this.copy.loading;
    this.loadingText.textContent = loadingLabel;
    if (typeof progress === "number" && Number.isFinite(progress)) {
      this.loadingProgress.value = Math.min(1, Math.max(0, progress));
      this.loadingProgress.removeAttribute("data-indeterminate");
    } else {
      this.loadingProgress.removeAttribute("value");
      this.loadingProgress.dataset.indeterminate = "true";
    }
    this.setView("loading", this.loadingScreen);
    this.announce(loadingLabel);
  }

  public showError(message?: string): void {
    if (this.destroyed) return;
    const errorMessage = message ?? this.copy.errorBody;
    this.errorText.textContent = errorMessage;
    this.setView("error", this.errorScreen);
    requiredElement<HTMLButtonElement>(this.errorScreen, "[data-campaign-retry]").focus({ preventScroll: true });
    this.announce(`${this.copy.errorTitle} ${errorMessage}`);
  }

  public showGame(mode: CampaignMode): void {
    if (this.destroyed) return;
    this.activeMode = mode;
    this.paused = false;
    this.challengeResult = null;
    this.hideScreens();
    this.root.dataset.view = "game";
    this.root.dataset.mode = mode;
    this.hud.hidden = false;
    this.hudMode.textContent = mode === "story" ? this.copy.storyMode : this.copy.challengeMode;
    this.hudEpoch.hidden = mode === "challenge";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-hidden", "false");
    this.canvas.focus({ preventScroll: true });
    this.announce(mode === "story" ? "Rozpoczynamy Drogę do Miliona." : "Rozpoczynamy Próbę Miliona.");
  }

  public setPaused(paused: boolean): void {
    if (this.destroyed || this.activeMode === null) return;
    this.paused = paused;
    this.pauseScreen.hidden = !paused;
    this.root.toggleAttribute("data-paused", paused);
    this.canvas.tabIndex = paused ? -1 : 0;
    if (paused) {
      requiredElement<HTMLButtonElement>(this.pauseScreen, "[data-campaign-resume]").focus({ preventScroll: true });
      this.announce("Gra wstrzymana. Twój postęp jest bezpieczny.");
    } else {
      this.canvas.focus({ preventScroll: true });
      this.announce("Biegniemy dalej.");
    }
  }

  public update(snapshot: GameSnapshot): void {
    if (this.destroyed) return;
    this.hudPackages.textContent = formatInteger(snapshot.packagesCollected);
    this.hudScore.textContent = formatInteger(snapshot.score);
    if (this.activeMode === "story") {
      const progress = snapshot.epochIndexMax > 0
        ? `${snapshot.epochIndex + 1}/${snapshot.epochIndexMax + 1}`
        : "";
      this.hudEpoch.textContent = [snapshot.epochName, progress].filter(Boolean).join(" · ");
    }
  }

  public showStoryBeat(beat: CampaignStoryBeat | null, trustCorridor: boolean): void {
    if (this.destroyed) return;
    this.trustCorridor = trustCorridor;
    this.root.toggleAttribute("data-trust-corridor", trustCorridor);
    this.hud.toggleAttribute("data-muted", trustCorridor);
    if (beat === null) {
      this.storyCaption.hidden = true;
      delete this.storyCaption.dataset.beatId;
      this.storyBody.replaceChildren();
      return;
    }

    this.storyCaption.dataset.beatId = beat.id;
    this.storyEyebrow.textContent = beat.eyebrow ?? (trustCorridor ? this.copy.corridorEyebrow : "");
    this.storyEyebrow.hidden = this.storyEyebrow.textContent.length === 0;
    this.storyTitle.textContent = beat.title ?? "";
    this.storyTitle.hidden = this.storyTitle.textContent.length === 0;
    const paragraphs = typeof beat.body === "string" ? [beat.body] : beat.body;
    this.storyBody.replaceChildren(...paragraphs.map((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      return paragraph;
    }));
    this.storyCaption.hidden = false;
    this.announce([beat.title, ...paragraphs].filter(Boolean).join(". "));
  }

  public showGameplayHint(message: string | null): void {
    if (this.destroyed) return;
    this.gameplayHint.textContent = message ?? "";
    this.gameplayHint.hidden = message === null;
    if (message !== null) this.announce(message);
  }

  public showStoryResult(result: CampaignStoryResult): void {
    if (this.destroyed) return;
    this.activeMode = "story";
    requiredElement(this.storyResultScreen, "[data-campaign-story-packages]").textContent = formatInteger(result.packages);
    requiredElement(this.storyResultScreen, "[data-campaign-story-score]").textContent = formatInteger(result.score);
    requiredElement(this.storyResultScreen, "[data-campaign-story-combo]").textContent = `×${formatInteger(result.bestCombo)}`;
    this.setView("story_result", this.storyResultScreen);
    requiredElement<HTMLButtonElement>(this.storyResultScreen, "[data-campaign-start-challenge]").focus({ preventScroll: true });
    this.announce(`Twoja Droga do Miliona. Dostarczone paczki: ${formatInteger(result.packages)}. Wynik: ${formatInteger(result.score)}.`);
  }

  public showChallengeResult(result: CampaignChallengeResult): void {
    if (this.destroyed) return;
    this.activeMode = "challenge";
    this.challengeResult = result;
    requiredElement(this.challengeResultScreen, "[data-campaign-challenge-packages]").textContent = formatInteger(result.packages);
    requiredElement(this.challengeResultScreen, "[data-campaign-challenge-score]").textContent = formatInteger(result.score);
    requiredElement(this.challengeResultScreen, "[data-campaign-challenge-best]").textContent = formatInteger(result.bestScore);
    requiredElement(this.challengeResultScreen, "[data-campaign-challenge-distance]").textContent = formatInteger(result.distanceM);
    requiredElement(this.challengeResultScreen, "[data-campaign-challenge-saves]").textContent = formatInteger(result.warrantySaves);
    this.sharePanel.hidden = true;
    this.shareStatus.textContent = "";
    this.setView("challenge_result", this.challengeResultScreen);
    requiredElement<HTMLButtonElement>(this.challengeResultScreen, "[data-campaign-restart-challenge]").focus({ preventScroll: true });
    this.announce(`Koniec próby. Wynik: ${formatInteger(result.score)}. Dostarczone paczki: ${formatInteger(result.packages)}.`);
  }

  public setMuted(muted: boolean, notify = true): void {
    if (this.destroyed) return;
    this.muted = muted;
    this.muteButton.setAttribute("aria-pressed", String(muted));
    requiredElement(this.muteButton, "[data-campaign-mute-icon]").textContent = muted ? "×" : "♪";
    requiredElement(this.muteButton, "[data-campaign-mute-label]").textContent = muted ? this.copy.soundOff : this.copy.soundOn;
    if (notify) this.callbacks.onMuteChange(muted);
  }

  public announce(message: string): void {
    if (!this.destroyed) this.liveRegion.textContent = message;
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    document.removeEventListener("keydown", this.handleKeydown, true);
    document.removeEventListener("keyup", this.handleKeyup, true);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
    window.removeEventListener("resize", this.handleResize);
    this.orientationQuery?.removeEventListener?.("change", this.handleOrientationChange);
    this.root.removeEventListener("click", this.handleClick);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("pointercancel", this.handlePointerCancel);
    this.root.remove();
  }

  private installListeners(): void {
    this.root.addEventListener("click", this.handleClick);
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerup", this.handlePointerUp);
    this.canvas.addEventListener("pointercancel", this.handlePointerCancel);
    document.addEventListener("keydown", this.handleKeydown, true);
    document.addEventListener("keyup", this.handleKeyup, true);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    window.addEventListener("resize", this.handleResize);
    this.orientationQuery?.addEventListener?.("change", this.handleOrientationChange);
  }

  private applyCopy(): void {
    this.root.querySelectorAll<HTMLElement>("[data-campaign-copy]").forEach((element) => {
      const key = element.dataset.campaignCopy;
      if (key !== undefined && Object.prototype.hasOwnProperty.call(this.copy, key)) {
        element.textContent = this.copy[key as keyof CampaignShellCopy];
      }
    });
  }

  private renderLandingActions(options: CampaignLandingOptions): void {
    this.landingActions.replaceChildren();
    if (options.checkpoint !== undefined && options.checkpoint.id !== "completed") {
      const heading = document.createElement("h2");
      heading.textContent = this.copy.resumeQuestion;
      const continueButton = this.createActionButton(`${this.copy.resumeFrom} ${options.checkpoint.label}`, true);
      continueButton.addEventListener("click", () => this.queueStart({
        mode: "story",
        checkpoint: options.checkpoint?.id,
        restartStory: false,
      }), { once: true });
      const restartButton = this.createActionButton(this.copy.startOver, false);
      restartButton.addEventListener("click", () => this.queueStart({
        mode: "story",
        checkpoint: "prologue",
        restartStory: true,
      }), { once: true });
      this.landingActions.append(heading, continueButton, restartButton);
      if (options.challengeUnlocked) {
        const challengeButton = this.createActionButton(this.copy.challengeMode, false);
        challengeButton.addEventListener("click", () => this.queueStart({ mode: "challenge", restartStory: false }), { once: true });
        this.landingActions.append(challengeButton);
      }
      return;
    }

    if (options.challengeUnlocked) {
      const heading = document.createElement("h2");
      heading.textContent = this.copy.choosePath;
      const storyButton = this.createActionButton(this.copy.replayStory, true);
      storyButton.addEventListener("click", () => this.queueStart({ mode: "story", checkpoint: "prologue", restartStory: true }), { once: true });
      const challengeButton = this.createActionButton(this.copy.challengeMode, false);
      challengeButton.addEventListener("click", () => this.queueStart({ mode: "challenge", restartStory: false }), { once: true });
      this.landingActions.append(heading, storyButton, challengeButton);
      return;
    }

    const startButton = this.createActionButton(this.copy.startStory, true);
    startButton.addEventListener("click", () => this.queueStart({ mode: "story", checkpoint: "prologue", restartStory: false }), { once: true });
    this.landingActions.append(startButton);
  }

  private createActionButton(label: string, primary: boolean): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `amso-campaign__button amso-campaign__button--${primary ? "primary" : "secondary"}`;
    button.textContent = label;
    return button;
  }

  private queueStart(request: CampaignStartRequest): void {
    if (!this.fullscreenPromptSeen && isMobileLayout()) {
      this.fullscreenPromptSeen = true;
      this.pendingStart = request;
      this.setView("orientation", this.orientationScreen);
      requiredElement<HTMLButtonElement>(this.orientationScreen, "[data-campaign-enter-fullscreen]").focus({ preventScroll: true });
      return;
    }
    this.callbacks.onStart(request);
  }

  private dispatchPendingStart(choice: "fullscreen" | "portrait"): void {
    this.callbacks.onFullscreenPromptHandled(choice);
    const request = this.pendingStart;
    this.pendingStart = null;
    if (request !== null) this.callbacks.onStart(request);
  }

  private async enterFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement === null && typeof this.root.requestFullscreen === "function") {
        await this.root.requestFullscreen({ navigationUI: "hide" });
      }
    } catch {
      // Fullscreen is optional; the page remains a viewport-filling fallback.
    }
  }

  private toggleFullscreen(): void {
    void (async () => {
      if (document.fullscreenElement !== null) {
        await document.exitFullscreen().catch(() => undefined);
      } else {
        await this.enterFullscreen();
      }
    })();
  }

  private hideScreens(): void {
    [
      this.landingScreen,
      this.orientationScreen,
      this.loadingScreen,
      this.errorScreen,
      this.pauseScreen,
      this.storyResultScreen,
      this.challengeResultScreen,
    ].forEach((screen) => { screen.hidden = true; });
  }

  private setView(view: string, visibleScreen: HTMLElement): void {
    this.hideScreens();
    visibleScreen.hidden = false;
    this.root.dataset.view = view;
    this.hud.hidden = true;
    this.storyCaption.hidden = true;
    this.gameplayHint.hidden = true;
    this.gameplayHint.textContent = "";
    this.root.removeAttribute("data-trust-corridor");
    this.trustCorridor = false;
    this.canvas.tabIndex = -1;
    this.canvas.setAttribute("aria-hidden", "true");
  }

  private canControl(): boolean {
    return this.activeMode !== null && !this.paused && !this.trustCorridor && this.root.dataset.view === "game";
  }

  private updateNarrowState(): void {
    const narrow = window.innerWidth < 360;
    this.tooNarrow.hidden = !narrow;
    this.root.toggleAttribute("data-too-narrow", narrow);
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("button, a") : null;
    if (target === null) return;
    if (target.matches("[data-campaign-mute]")) {
      this.setMuted(!this.muted);
    } else if (target.matches("[data-campaign-fullscreen]")) {
      this.toggleFullscreen();
    } else if (target.matches("[data-campaign-enter-fullscreen]")) {
      void this.enterFullscreen().finally(() => this.dispatchPendingStart("fullscreen"));
    } else if (target.matches("[data-campaign-stay-portrait]")) {
      this.dispatchPendingStart("portrait");
    } else if (target.matches("[data-campaign-pause]")) {
      this.callbacks.onPause("user");
    } else if (target.matches("[data-campaign-resume]")) {
      this.callbacks.onResume();
    } else if (target.matches("[data-campaign-menu]")) {
      this.callbacks.onReturnToMenu();
    } else if (target.matches("[data-campaign-retry]")) {
      this.callbacks.onRetryLoad();
    } else if (target.matches("[data-campaign-start-challenge]")) {
      this.callbacks.onStart({ mode: "challenge", restartStory: false });
    } else if (target.matches("[data-campaign-restart-challenge]")) {
      this.callbacks.onRestart("challenge");
    } else if (target.matches("[data-campaign-restart-story]")) {
      this.callbacks.onRestart("story");
    } else if (target.matches("[data-campaign-toggle-share]")) {
      this.sharePanel.hidden = !this.sharePanel.hidden;
      if (!this.sharePanel.hidden) requiredElement<HTMLButtonElement>(this.sharePanel, "[data-campaign-share]").focus({ preventScroll: true });
    } else if (target.matches("[data-campaign-share]")) {
      const platform = target.dataset.campaignShare;
      if (platform === "facebook" || platform === "instagram" || platform === "download") {
        void this.handleShare(platform);
      }
    }
  };

  private async handleShare(platform: CampaignSharePlatform): Promise<void> {
    if (this.challengeResult === null) return;
    this.shareStatus.textContent = this.copy.sharePreparing;
    try {
      if (platform === "download") {
        await downloadCampaignShareCard(this.challengeResult, {
          canonicalUrl: this.canonicalUrl,
          scoreLabel: this.copy.resultScore.toLocaleUpperCase("pl-PL"),
          packagesLabel: this.copy.resultPackages.toLocaleUpperCase("pl-PL"),
          callToAction: this.copy.shareTurn,
          publicationText: this.copy.sharePublication,
        });
        this.callbacks.onShare?.(platform, "download");
        this.shareStatus.textContent = this.copy.shareDownloadReady;
        return;
      }
      const method = await shareCampaignResult({
        platform,
        result: this.challengeResult,
        canonicalUrl: this.canonicalUrl,
        scoreLabel: this.copy.resultScore.toLocaleUpperCase("pl-PL"),
        packagesLabel: this.copy.resultPackages.toLocaleUpperCase("pl-PL"),
        callToAction: this.copy.shareTurn,
        publicationText: this.copy.sharePublication,
      });
      this.callbacks.onShare?.(platform, method);
      this.shareStatus.textContent = method === "cancelled"
        ? this.copy.shareCancelled
        : method === "download"
          ? this.copy.shareDownloaded
          : this.copy.shareReady;
    } catch {
      this.shareStatus.textContent = this.copy.shareFailure;
    }
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.canControl() || !event.isPrimary || event.button > 0) return;
    event.preventDefault();
    this.canvas.focus({ preventScroll: true });
    if (event.pointerType === "touch") {
      this.pointerStartY = event.clientY;
      this.pointerSwipedDown = false;
    } else {
      this.callbacks.onJump("pointer");
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.pointerStartY === null || this.pointerSwipedDown) return;
    if (event.clientY - this.pointerStartY > 24) {
      this.pointerSwipedDown = true;
      this.callbacks.onSlide(true, "touch");
    }
  };

  private readonly handlePointerUp = (): void => {
    if (this.pointerStartY === null) return;
    if (this.pointerSwipedDown) this.callbacks.onSlide(false, "touch");
    else if (this.canControl()) this.callbacks.onJump("touch");
    this.pointerStartY = null;
    this.pointerSwipedDown = false;
  };

  private readonly handlePointerCancel = (): void => {
    if (this.pointerSwipedDown) this.callbacks.onSlide(false, "touch");
    this.pointerStartY = null;
    this.pointerSwipedDown = false;
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (!this.canControl() || event.repeat) return;
    const interactive = event.target instanceof Element && event.target.closest("button, a, input") !== null;
    if (interactive) return;
    const jump = event.code === "Space" || event.key === " ";
    const slide = event.code === "ArrowDown" || event.code === "KeyS";
    if (jump) {
      event.preventDefault();
      this.callbacks.onJump("keyboard");
    } else if (slide) {
      event.preventDefault();
      this.callbacks.onSlide(true, "keyboard");
    }
  };

  private readonly handleKeyup = (event: KeyboardEvent): void => {
    if (this.activeMode !== null && (event.code === "ArrowDown" || event.code === "KeyS")) {
      this.callbacks.onSlide(false, "keyboard");
    }
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden && this.canControl()) {
      this.paused = true;
      this.callbacks.onPause("visibility");
    }
  };

  private readonly handleFullscreenChange = (): void => {
    const fullscreen = document.fullscreenElement === this.root;
    this.fullscreenButton.setAttribute("aria-pressed", String(fullscreen));
    requiredElement(this.fullscreenButton, ".amso-campaign__tool-label").textContent = fullscreen ? this.copy.fullscreenExit : this.copy.fullscreenEnter;
    if (this.canControl()) {
      this.paused = true;
      this.callbacks.onPause("layout_change");
    }
  };

  private readonly handleOrientationChange = (): void => {
    if (this.canControl()) {
      this.paused = true;
      this.callbacks.onPause("layout_change");
    }
  };

  private readonly handleResize = (): void => {
    this.updateNarrowState();
  };
}

export default CampaignShell;
