import "../styles/campaign.css";
import { AMSO_LOGO_DATA_URI } from "./brandLogo";
import type { ControlMethod, GameSnapshot } from "../game/contracts";
import { WorldVisualLayer } from "../visuals/WorldVisualLayer";
import { sceneVisualState } from "../visuals/scene-manifest";
import {
  fullscreenPreferenceFromElement,
  formatPowerUpHud,
  formatStoryControlsHud,
  formatStoryObjectiveHud,
  getTrappedFocusIndex,
  snapshotStoryScene,
  StoryContinuationGate,
  type CampaignStorySceneInput
} from "./story-presentation";

export type { CampaignStoryScene, CampaignStorySceneInput } from "./story-presentation";

const MAIN_LOCKUP_PATH = "/assets/milion-runner/brand/mz-main-lockup-v1.avif";
const COMPACT_LOCKUP_PATH = "/assets/milion-runner/brand/mz-compact-lockup-v1.avif";

export type CampaignMode = "story" | "challenge";

export interface CampaignLandingOptions {
  challengeUnlocked: boolean;
  fullscreenPreference: "fullscreen" | "portrait" | null;
  muted: boolean;
}

export interface CampaignStartRequest {
  mode: CampaignMode;
  restartStory: boolean;
}

export type CampaignStoryCountdownValue = 3 | 2 | 1;

export type CampaignPauseReason = "user" | "layout_change" | "visibility";

export interface CampaignStoryResult {
  packages: number;
  score: number;
  bestCombo: number;
}

export interface CampaignChallengeResult {
  packages: number;
  totalScore: number;
  challengeScore: number;
  bestScore: number;
  firstChallengeResult: boolean;
  distanceM: number;
  warrantySaves: number;
}

export type CampaignSharePlatform = "facebook" | "instagram";
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
  challengeMode: "Szybki start — Tryb Wyzwania",
  landingEyebrow: "Jubileuszowa historia AMSO",
  landingTitle: "AMSO —",
  landingTitleAccent: "Droga do Miliona",
  landingLead: "Jedna paczka rozpoczęła historię. Przebiegnij z nami drogę do zamówienia nr 1 000 000.",
  landingMeta: "Około 6 minut · historia w Twoim tempie · skok i ślizg",
  startStory: "Rozpocznij historię",
  choosePath: "Wybierz swoją drogę",
  replayStory: "Pełna historia i instrukcja",
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
  corridorResume: "Biegniemy dalej.",
  storyCountdownLabel: "Wracamy do gry",
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
  shareScoreLabel: "Mój wynik",
  shareTurn: "Teraz Twoja kolej.",
  sharePublication: "Sprawdź, jak daleko dojdziesz w Drodze do Miliona.",
  sharePreparing: "Przygotowujemy kartę wyniku…",
  shareReady: "Karta wyniku jest gotowa do udostępnienia.",
  shareFacebookReady: "Facebook otwarty. Dołącz pobraną kartę wyniku do posta.",
  shareDownloaded: "Zapisaliśmy kartę. Dodaj ją do relacji lub posta.",
  shareCancelled: "Udostępnianie anulowane.",
  shareFailure: "Nie udało się przygotować karty. Spróbuj ponownie.",
  facebook: "Facebook",
  instagram: "Instagram",
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
  onFullscreenPreferenceChange(choice: "fullscreen" | "portrait"): void;
  onStoryContinue(sceneId: string): void;
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
  platform: CampaignSharePlatform;
  result: { score: number; packages: number };
}

type CampaignShareResult = CampaignShareRequest["result"];

const integerFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });

function formatInteger(value: number): string {
  return integerFormatter.format(Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
}

export function campaignWorldCounterValue(
  mode: CampaignMode,
  visualStateId: string,
  storyCounterValue: number,
): number {
  if (mode === "challenge" &&
      (visualStateId === "epoch_5.wave" || visualStateId === "challenge.million_wave")) {
    return 999_999;
  }
  return storyCounterValue;
}

export function campaignVisualStateAtProgress(
  currentStateId: string,
  nextStateId: string,
  worldProgress: number,
): string {
  if (currentStateId === nextStateId) return currentStateId;
  const current = sceneVisualState(currentStateId);
  const next = sceneVisualState(nextStateId);
  if (current.worldId !== next.worldId) return currentStateId;
  const span = next.worldProgress - current.worldProgress;
  if (span <= 0) return currentStateId;
  const transitionProgress = (worldProgress - current.worldProgress) / span;
  return transitionProgress >= 0.58 ? nextStateId : currentStateId;
}

export function isCampaignViewportTooNarrow(width: number, height: number): boolean {
  const landscape = width > height;
  return width < 390 || (landscape && height < 390);
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
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
  if (canonical?.startsWith("https://") || canonical?.startsWith("http://")) return canonical;
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

function loadShareCardLockup(): Promise<HTMLImageElement | null> {
  const image = document.createElement("img");
  image.alt = "";
  image.decoding = "async";

  return new Promise((resolve) => {
    let settled = false;
    let timeout = 0;
    const finish = (result: HTMLImageElement | null): void => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      resolve(result);
    };

    timeout = window.setTimeout(() => finish(null), 2_500);
    image.onload = () => finish(image.naturalWidth > 0 ? image : null);
    image.onerror = () => finish(null);
    image.src = COMPACT_LOCKUP_PATH;

    if (image.complete) {
      finish(image.naturalWidth > 0 ? image : null);
    }
  });
}

function drawShareCardLockup(
  context: CanvasRenderingContext2D,
  lockup: HTMLImageElement | null,
): void {
  if (lockup !== null) {
    const lockupWidth = 430;
    const lockupHeight = lockupWidth * (lockup.naturalHeight / lockup.naturalWidth);
    context.drawImage(lockup, 596, 43, lockupWidth, lockupHeight);
    return;
  }

  // Preserve a useful campaign fallback without redrawing the AMSO wordmark.
  const fallbackGradient = context.createLinearGradient(610, 58, 1000, 252);
  fallbackGradient.addColorStop(0, "#f47100");
  fallbackGradient.addColorStop(0.52, "#f04f45");
  fallbackGradient.addColorStop(1, "#eb32a4");
  context.strokeStyle = fallbackGradient;
  context.lineWidth = 10;
  context.beginPath();
  context.roundRect(624, 70, 352, 166, 34);
  context.stroke();
  context.fillStyle = "#faf7f0";
  context.font = "950 49px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText("1 000 000", 800, 172, 300);
  context.textAlign = "start";
}

function drawShareCard(
  context: CanvasRenderingContext2D,
  result: CampaignShareResult,
  options: CampaignShareCardOptions,
  lockup: HTMLImageElement | null,
): void {
  const { canvas } = context;
  context.fillStyle = "#faf7f0";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const brandGradient = context.createLinearGradient(0, 0, canvas.width, 0);
  brandGradient.addColorStop(0, "#f47100");
  brandGradient.addColorStop(0.5, "#f04f45");
  brandGradient.addColorStop(1, "#eb32a4");
  context.fillStyle = brandGradient;
  context.fillRect(0, 0, canvas.width, 22);

  context.fillStyle = "#171717";
  context.fillRect(0, 22, canvas.width, 296);
  context.fillStyle = "#faf7f0";
  context.font = "800 26px system-ui, sans-serif";
  context.fillText("KARTA WYNIKU", 72, 99);
  context.font = "950 58px system-ui, sans-serif";
  context.fillText(options.title ?? "Droga do Miliona", 72, 170, 470);
  context.fillStyle = "#d8d2c8";
  context.font = "650 24px system-ui, sans-serif";
  context.fillText("Jubileuszowa gra", 72, 222);
  drawShareCardLockup(context, lockup);

  context.fillStyle = "#45413b";
  context.font = "750 29px system-ui, sans-serif";
  context.fillText(options.scoreLabel ?? "MÓJ WYNIK", 72, 407);
  context.fillStyle = "#171717";
  context.font = "950 142px system-ui, sans-serif";
  context.fillText(formatInteger(result.score), 66, 548, 940);

  context.fillStyle = brandGradient;
  context.fillRect(72, 581, 936, 12);

  context.fillStyle = "#171717";
  context.beginPath();
  context.roundRect(72, 632, 936, 216, 38);
  context.fill();
  context.fillStyle = "#d8d2c8";
  context.font = "800 28px system-ui, sans-serif";
  context.fillText(options.packagesLabel ?? "DOSTARCZONE PACZKI", 120, 705);
  context.fillStyle = "#faf7f0";
  context.font = "950 78px system-ui, sans-serif";
  context.fillText(formatInteger(result.packages), 120, 797, 560);

  context.fillStyle = brandGradient;
  context.beginPath();
  context.roundRect(788, 669, 172, 142, 28);
  context.fill();
  context.fillStyle = "#171717";
  context.font = "950 50px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText("×", 874, 754);
  context.textAlign = "start";

  context.fillStyle = "#171717";
  context.font = "900 50px system-ui, sans-serif";
  context.fillText(options.callToAction ?? "Teraz Twoja kolej.", 72, 978, 936);
  context.fillStyle = "#45413b";
  context.font = "650 27px system-ui, sans-serif";
  const publicationText = options.publicationText
    ?? "Sprawdź, jak daleko dojdziesz w Drodze do Miliona.";
  context.fillText(publicationText, 72, 1034, 936);

  context.fillStyle = "#171717";
  context.beginPath();
  context.roundRect(72, 1128, 936, 138, 30);
  context.fill();
  context.fillStyle = brandGradient;
  context.fillRect(72, 1128, 18, 138);
  context.fillStyle = "#faf7f0";
  context.font = "600 20px system-ui, sans-serif";
  context.fillText(options.canonicalUrl, 124, 1208, 830);
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
  result: CampaignShareResult,
  options: CampaignShareCardOptions,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("share_card_canvas_unavailable");
  }
  const lockup = await loadShareCardLockup();
  drawShareCard(context, result, options, lockup);
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

export async function shareCampaignResult(request: CampaignShareRequest): Promise<CampaignShareMethod> {
  const text = request.publicationText ?? "Sprawdź, jak daleko dojdziesz w Drodze do Miliona.";
  const blob = await createCampaignShareCard(request.result, request);
  const filename = `amso-droga-do-miliona-${Math.floor(request.result.score)}.png`;
  const file = typeof File === "function"
    ? new File([blob], filename, { type: "image/png" })
    : null;
  const shareData: ShareData = {
    title: request.title ?? "AMSO — Droga do Miliona",
    text,
    url: request.canonicalUrl,
    ...(file === null ? {} : { files: [file] }),
  };

  if (
    file !== null &&
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
 * Dedicated, page-level DOM view for the campaign. It owns presentation and
 * browser input only; gameplay, persistence and analytics remain coordinator concerns.
 */
export class CampaignShell {
  public readonly canvas: HTMLCanvasElement;

  private readonly root: HTMLElement;
  private readonly stage: HTMLElement;
  private readonly worldVisualLayer: WorldVisualLayer;
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
  private readonly storyPresentation: HTMLElement;
  private readonly storySceneCard: HTMLElement;
  private readonly storySceneEyebrow: HTMLElement;
  private readonly storySceneTitle: HTMLElement;
  private readonly storySceneBody: HTMLElement;
  private readonly storyContinueButton: HTMLButtonElement;
  private readonly storyCountdown: HTMLElement;
  private readonly storyCountdownLabel: HTMLElement;
  private readonly storyCountdownValue: HTMLElement;
  private readonly presentationBackground: readonly HTMLElement[];
  private readonly hud: HTMLElement;
  private readonly hudMode: HTMLElement;
  private readonly hudEpoch: HTMLElement;
  private readonly hudObjective: HTMLElement;
  private readonly hudControls: HTMLElement;
  private readonly hudPowerUps: HTMLElement;
  private readonly hudNotice: HTMLElement;
  private readonly hudPackages: HTMLElement;
  private readonly hudScore: HTMLElement;
  private readonly hudCombo: HTMLElement;
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
  private fullscreenPreference: "fullscreen" | "portrait" | null = null;
  private muted = false;
  private paused = false;
  private trustCorridor = false;
  private tooNarrowActive = false;
  private activeModalScreen: HTMLElement | null = null;
  private destroyed = false;
  private pointerStartY: number | null = null;
  private pointerSwipedDown = false;
  private challengeResult: CampaignChallengeResult | null = null;
  private lastCountdownValue: CampaignStoryCountdownValue | null = null;
  private readonly storyContinuationGate = new StoryContinuationGate();
  private storyUnlockTimer: number | null = null;
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
          <img class="amso-campaign__brand-logo" src="${AMSO_LOGO_DATA_URI}" alt="AMSO" />
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
          <div class="amso-campaign__world-visual" data-campaign-world-visual aria-hidden="true"></div>
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
              <span data-campaign-hud-objective hidden></span>
              <span data-campaign-hud-controls hidden></span>
              <span data-campaign-hud-powerups hidden></span>
              <span class="amso-campaign__hud-notice" data-campaign-hud-notice hidden role="status"></span>
            </div>
            <div class="amso-campaign__hud-stats">
              <span><small data-campaign-copy="hudPackages">Paczki</small> <strong data-campaign-hud-packages>0</strong></span>
              <span><small data-campaign-copy="hudScore">Wynik</small> <strong data-campaign-hud-score>0</strong></span>
              <span><small>SERIA</small> <strong data-campaign-hud-combo>×1</strong></span>
            </div>
            <button class="amso-campaign__pause-button" type="button" data-campaign-pause data-campaign-copy="pauseAction">Pauza</button>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--landing" data-campaign-landing>
            <div class="amso-campaign__landing-copy">
              <p class="amso-campaign__eyebrow" data-campaign-copy="landingEyebrow">Jubileuszowa historia AMSO</p>
              <h1><span data-campaign-copy="landingTitleAccent">Droga do Miliona</span></h1>
              <p class="amso-campaign__lead" data-campaign-copy="landingLead">Jedna paczka rozpoczęła historię. Przebiegnij z nami drogę do zamówienia nr 1 000 000.</p>
              <p class="amso-campaign__meta" data-campaign-copy="landingMeta">Około 6 minut · historia w Twoim tempie · skok i ślizg</p>
              <details class="amso-campaign__how-to">
                <summary>Jak działa gra?</summary>
                <div>
                  <p><strong>Historia i bieg przeplatają się.</strong> Gdy pojawia się karta historii, trasa jest bezpieczna i niczego nie musisz omijać ani zbierać.</p>
                  <p><strong>Skacz</strong> dotykiem lub Spacją. <strong>Ślizg</strong> wykonaj gestem w dół albo klawiszem ↓.</p>
                  <p><strong>Paczki zwiększają wynik i licznik.</strong> Specjalna paczka zawsze pokazuje swoją nazwę i działanie, a kolejne czyste akcje budują <strong>SERIĘ ×N</strong>.</p>
                </div>
              </details>
              <div class="amso-campaign__landing-actions" data-campaign-landing-actions></div>
            </div>
            <div class="amso-campaign__landing-art" aria-hidden="true">
              <img class="amso-campaign__main-lockup" src="${MAIN_LOCKUP_PATH}" alt="" width="1600" height="1460" />
            </div>
          </section>

          <section
            class="amso-campaign__screen amso-campaign__screen--dialog"
            data-campaign-orientation
            role="dialog"
            aria-modal="true"
            aria-labelledby="amso-campaign-orientation-title"
            hidden
          >
            <div class="amso-campaign__card">
              <p class="amso-campaign__eyebrow" data-campaign-copy="orientationEyebrow">Szerszy kadr</p>
              <h2 id="amso-campaign-orientation-title" data-campaign-copy="orientationTitle">Chcesz zobaczyć więcej historii?</h2>
              <p data-campaign-copy="orientationBody">Obróć telefon i włącz pełny ekran. Możesz też grać pionowo.</p>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-enter-fullscreen data-campaign-copy="orientationFullscreen">Włącz pełny ekran</button>
                <button class="amso-campaign__button amso-campaign__button--secondary" type="button" data-campaign-stay-portrait data-campaign-copy="orientationPortrait">Zostań w pionie</button>
              </div>
            </div>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--dialog" data-campaign-loading hidden>
            <div class="amso-campaign__card amso-campaign__card--loading">
              <img class="amso-campaign__compact-lockup" src="${COMPACT_LOCKUP_PATH}" alt="" width="1600" height="924" />
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

          <section
            class="amso-campaign__screen amso-campaign__screen--dialog"
            data-campaign-pause-screen
            role="dialog"
            aria-modal="true"
            aria-labelledby="amso-campaign-pause-title"
            hidden
          >
            <div class="amso-campaign__card">
              <p class="amso-campaign__eyebrow" data-campaign-copy="pauseEyebrow">Bezpieczny przystanek</p>
              <h2 id="amso-campaign-pause-title" data-campaign-copy="pauseTitle">Gra wstrzymana</h2>
              <p data-campaign-copy="pauseBody">Twój postęp jest bezpieczny.</p>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-resume data-campaign-copy="resume">Wznów</button>
                <button class="amso-campaign__button amso-campaign__button--secondary" type="button" data-campaign-menu data-campaign-copy="returnToMenu">Wróć do menu</button>
              </div>
            </div>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--result" data-campaign-story-result hidden>
            <div class="amso-campaign__result-card">
              <img class="amso-campaign__result-lockup amso-campaign__result-lockup--main" src="${MAIN_LOCKUP_PATH}" alt="" width="1600" height="1460" />
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
              <img class="amso-campaign__result-lockup" src="${COMPACT_LOCKUP_PATH}" alt="" width="1600" height="924" />
              <p class="amso-campaign__eyebrow" data-campaign-copy="challengeResultEyebrow">Próba Miliona</p>
              <h2 data-campaign-copy="challengeResultTitle">Koniec próby</h2>
              <div class="amso-campaign__result-grid amso-campaign__result-grid--challenge">
                <span><small data-campaign-copy="resultPackages">Dostarczone paczki</small> <strong data-campaign-challenge-packages>0</strong></span>
                <span><small>Wynik łączny</small> <strong data-campaign-challenge-total>0</strong></span>
                <span><small>Wynik wyzwania</small> <strong data-campaign-challenge-score>0</strong></span>
                <span><small data-campaign-challenge-best-label>Twój rekord wyzwania</small> <strong data-campaign-challenge-best>0</strong></span>
                <span><small data-campaign-copy="resultDistance">Przebyta droga</small> <strong><i data-campaign-challenge-distance>0</i> m</strong></span>
                <span data-campaign-challenge-saves-stat><small data-campaign-copy="resultWarranty">Ochrona uratowała bieg</small> <strong data-campaign-challenge-saves>0</strong></span>
              </div>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-restart-challenge data-campaign-copy="retryChallenge">Spróbuj jeszcze raz</button>
                <button class="amso-campaign__button amso-campaign__button--secondary" type="button" data-campaign-toggle-share data-campaign-copy="shareResult">Udostępnij wynik</button>
                <button class="amso-campaign__text-link" type="button" data-campaign-restart-story data-campaign-copy="replayStory">Przejdź historię ponownie</button>
                <a class="amso-campaign__text-link" data-campaign-link data-campaign-copy="campaignBack">Wróć na stronę kampanii</a>
              </div>
              <div class="amso-campaign__share-panel" data-campaign-share-panel hidden>
                <img class="amso-campaign__share-lockup" src="${COMPACT_LOCKUP_PATH}" alt="" width="1600" height="924" />
                <p><strong data-campaign-copy="shareTurn">Teraz Twoja kolej.</strong> <span data-campaign-copy="shareLead">Wybierz, gdzie chcesz udostępnić kartę wyniku.</span></p>
                <div class="amso-campaign__share-actions">
                  <button type="button" data-campaign-share="facebook" data-campaign-copy="facebook">Facebook</button>
                  <button type="button" data-campaign-share="instagram" data-campaign-copy="instagram">Instagram</button>
                </div>
                <p class="amso-campaign__share-status" data-campaign-share-status role="status"></p>
              </div>
            </div>
          </section>

          <section class="amso-campaign__story-presentation" data-campaign-story-presentation hidden>
            <div class="amso-campaign__story-scrim" aria-hidden="true"></div>

            <article
              class="amso-campaign__story-scene-card"
              data-campaign-story-scene
              role="dialog"
              aria-modal="true"
              aria-labelledby="amso-campaign-story-scene-title"
            >
              <img class="amso-campaign__story-final-lockup" src="${MAIN_LOCKUP_PATH}" alt="" width="1600" height="1460" />
              <p class="amso-campaign__story-scene-eyebrow" data-campaign-story-scene-eyebrow hidden></p>
              <h2 id="amso-campaign-story-scene-title" data-campaign-story-scene-title></h2>
              <div class="amso-campaign__story-scene-body" data-campaign-story-scene-body tabindex="0"></div>
              <button
                class="amso-campaign__button amso-campaign__button--primary amso-campaign__story-continue"
                type="button"
                data-campaign-story-continue
              >Dalej</button>
            </article>

            <div class="amso-campaign__story-countdown" data-campaign-story-countdown hidden tabindex="-1" role="status" aria-live="assertive" aria-atomic="true">
              <p data-campaign-story-countdown-label>Wracamy do gry</p>
              <strong data-campaign-story-countdown-value>3</strong>
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

    this.stage = requiredElement(this.root, "[data-campaign-stage]");
    this.worldVisualLayer = new WorldVisualLayer(
      requiredElement(this.root, "[data-campaign-world-visual]")
    );
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
    this.storyPresentation = requiredElement(this.root, "[data-campaign-story-presentation]");
    this.storySceneCard = requiredElement(this.root, "[data-campaign-story-scene]");
    this.storySceneEyebrow = requiredElement(this.root, "[data-campaign-story-scene-eyebrow]");
    this.storySceneTitle = requiredElement(this.root, "[data-campaign-story-scene-title]");
    this.storySceneBody = requiredElement(this.root, "[data-campaign-story-scene-body]");
    this.storyContinueButton = requiredElement(this.root, "[data-campaign-story-continue]");
    this.storyCountdown = requiredElement(this.root, "[data-campaign-story-countdown]");
    this.storyCountdownLabel = requiredElement(this.root, "[data-campaign-story-countdown-label]");
    this.storyCountdownValue = requiredElement(this.root, "[data-campaign-story-countdown-value]");
    this.hud = requiredElement(this.root, "[data-campaign-hud]");
    this.hudMode = requiredElement(this.root, "[data-campaign-hud-mode]");
    this.hudEpoch = requiredElement(this.root, "[data-campaign-hud-epoch]");
    this.hudObjective = requiredElement(this.root, "[data-campaign-hud-objective]");
    this.hudControls = requiredElement(this.root, "[data-campaign-hud-controls]");
    this.hudPowerUps = requiredElement(this.root, "[data-campaign-hud-powerups]");
    this.hudNotice = requiredElement(this.root, "[data-campaign-hud-notice]");
    this.hudPackages = requiredElement(this.root, "[data-campaign-hud-packages]");
    this.hudScore = requiredElement(this.root, "[data-campaign-hud-score]");
    this.hudCombo = requiredElement(this.root, "[data-campaign-hud-combo]");
    this.muteButton = requiredElement(this.root, "[data-campaign-mute]");
    this.fullscreenButton = requiredElement(this.root, "[data-campaign-fullscreen]");
    this.liveRegion = requiredElement(this.root, "[data-campaign-live]");
    this.sharePanel = requiredElement(this.root, "[data-campaign-share-panel]");
    this.shareStatus = requiredElement(this.root, "[data-campaign-share-status]");
    this.tooNarrow = requiredElement(this.root, "[data-campaign-too-narrow]");
    this.presentationBackground = [
      requiredElement(this.root, ".amso-campaign__header"),
      requiredElement(this.root, ".amso-campaign__footer")
    ];
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
    this.fullscreenPreference = options.fullscreenPreference;
    this.fullscreenPromptSeen = options.fullscreenPreference !== null;
    this.setMuted(options.muted, false);
    this.applyWorldVisual("first-mile", "story.first_package", "landing");
    this.setView("landing", this.landingScreen);
    this.renderLandingActions(options);
    this.canvas.tabIndex = -1;
    this.landingActions.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    this.announce("Gra gotowa. Wybierz swoją drogę.");
  }

  public showLoading(progress?: number, label?: string): void {
    if (this.destroyed) return;
    const loadingLabel = label ?? this.copy.loading;
    this.applyWorldVisual("first-mile", "story.first_package", "landing");
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
    if (this.root.dataset.view === "story_scene") this.callbacks.onSlide(false, "keyboard");
    this.hideStoryPresentation();
    this.activeMode = mode;
    this.paused = false;
    this.challengeResult = null;
    this.hideScreens();
    this.root.dataset.view = "game";
    this.root.dataset.mode = mode;
    this.hud.hidden = false;
    this.hudMode.textContent = mode === "story" ? this.copy.storyMode : this.copy.challengeMode;
    this.hudEpoch.hidden = mode === "challenge";
    if (mode === "challenge") this.showStoryObjective(null);
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-hidden", "false");
    this.canvas.focus({ preventScroll: true });
    this.announce(mode === "story" ? this.copy.storyMode : this.copy.challengeMode);
  }

  /**
   * Shows one stable, player-paced story card above the entire campaign shell.
   * Re-emitting the active scene id is intentionally a no-op: only a new id can
   * replace visible copy or re-enable the continuation button.
   */
  public showStoryScene(input: CampaignStorySceneInput): void {
    if (this.destroyed) return;
    const scene = snapshotStoryScene(input);
    const wasGame = this.root.dataset.view === "game";
    const lockDurationMs = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? 500
      : 1_500;
    const isNewScene = this.storyContinuationGate.arm(scene.presentationId, lockDurationMs);
    if (wasGame) this.callbacks.onSlide(false, "keyboard");

    this.activeMode = "story";
    this.root.dataset.mode = "story";
    this.root.dataset.view = "story_scene";
    const visualState = sceneVisualState(scene.visualStateId);
    this.applyWorldVisual(visualState.worldId, visualState.stateId, "story");
    this.storyPresentation.dataset.state = "scene";
    this.storyPresentation.dataset.copyPlacement = visualState.copyPlacement;
    this.storyPresentation.hidden = false;
    this.storySceneCard.hidden = false;
    this.storyCountdown.hidden = true;
    this.hud.hidden = true;
    this.canvas.tabIndex = -1;
    this.canvas.setAttribute("aria-hidden", "true");
    this.setScreenModal(this.storyPresentation);

    if (!isNewScene) return;

    this.lastCountdownValue = null;
    this.storySceneCard.dataset.sceneId = scene.sceneId;
    this.storySceneEyebrow.textContent = scene.eyebrow ?? "";
    this.storySceneEyebrow.hidden = this.storySceneEyebrow.textContent.length === 0;
    this.storySceneTitle.textContent = scene.title;
    this.storySceneBody.replaceChildren(...scene.body.map((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      return paragraph;
    }));
    this.storySceneBody.scrollTop = 0;
    this.storyContinueButton.textContent = scene.continueLabel;
    this.storyContinueButton.dataset.sceneId = scene.sceneId;
    this.storyContinueButton.dataset.presentationId = scene.presentationId;
    this.storyContinueButton.disabled = true;
    this.storySceneBody.focus({ preventScroll: true });
    if (this.storyUnlockTimer !== null) window.clearTimeout(this.storyUnlockTimer);
    this.storyUnlockTimer = window.setTimeout(() => {
      this.storyUnlockTimer = null;
      if (this.destroyed || this.storyContinueButton.dataset.presentationId !== scene.presentationId ||
          this.storyContinuationGate.isLocked(scene.presentationId)) return;
      this.storyContinueButton.disabled = false;
    }, lockDurationMs);
    this.announce([scene.eyebrow, scene.title, ...scene.body].filter(Boolean).join(". "));
  }

  /** Gives the world camera its full 720 ms hand-off before the 3–2–1 starts. */
  public showStoryReframe(): void {
    if (this.destroyed) return;
    this.worldVisualLayer.setPhase("game");
    this.root.dataset.view = "story_reframe";
    this.storyPresentation.dataset.state = "reframe";
    this.storyPresentation.hidden = false;
    this.storySceneCard.hidden = true;
    this.storyCountdown.hidden = true;
    this.hud.hidden = true;
    this.canvas.tabIndex = -1;
    this.canvas.setAttribute("aria-hidden", "true");
    this.storyContinueButton.disabled = true;
    delete this.storyContinueButton.dataset.sceneId;
    delete this.storyContinueButton.dataset.presentationId;
    this.storyContinuationGate.clear();
    this.setScreenModal(this.storyPresentation);
    this.storyPresentation.tabIndex = -1;
    this.storyPresentation.focus({ preventScroll: true });
    this.announce(this.copy.storyCountdownLabel);
  }

  public showStoryCountdown(
    value: CampaignStoryCountdownValue,
    label = this.copy.storyCountdownLabel
  ): void {
    if (this.destroyed) return;
    this.worldVisualLayer.setPhase("game");
    this.root.dataset.view = "story_countdown";
    this.storyPresentation.dataset.state = "countdown";
    this.storyPresentation.hidden = false;
    this.storySceneCard.hidden = true;
    this.storyCountdown.hidden = false;
    this.hud.hidden = true;
    this.canvas.tabIndex = -1;
    this.canvas.setAttribute("aria-hidden", "true");
    this.storyContinueButton.disabled = true;
    delete this.storyContinueButton.dataset.sceneId;
    delete this.storyContinueButton.dataset.presentationId;
    this.storyContinuationGate.clear();
    this.setScreenModal(this.storyPresentation);

    this.storyCountdownLabel.textContent = label;
    this.storyCountdownValue.textContent = String(value);
    this.storyCountdownValue.dataset.value = String(value);
    if (value !== this.lastCountdownValue) {
      this.lastCountdownValue = value;
      this.storyCountdown.focus({ preventScroll: true });
    }
  }

  /** Atomically restores HUD, focus and controls after the engine finishes 3–2–1. */
  public returnToGame(): void {
    if (this.destroyed || this.activeMode === null) return;
    this.hideStoryPresentation();
    this.hideScreens();
    this.root.dataset.view = "game";
    this.root.removeAttribute("data-trust-corridor");
    this.trustCorridor = false;
    this.hud.removeAttribute("data-muted");
    this.hud.hidden = false;
    this.hudEpoch.hidden = this.activeMode === "challenge";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-hidden", "false");
    this.canvas.focus({ preventScroll: true });
    this.announce(this.copy.corridorResume);
  }

  public setPaused(paused: boolean): void {
    if (this.destroyed || this.activeMode === null) return;
    this.paused = paused;
    this.pauseScreen.hidden = !paused;
    this.root.toggleAttribute("data-paused", paused);
    this.canvas.tabIndex = paused ? -1 : 0;
    if (paused) {
      this.setScreenModal(this.pauseScreen);
      requiredElement<HTMLButtonElement>(this.pauseScreen, "[data-campaign-resume]").focus({ preventScroll: true });
      this.announce(`${this.copy.pauseTitle}. ${this.copy.pauseBody}`);
    } else {
      this.setScreenModal(null);
      this.canvas.focus({ preventScroll: true });
      this.announce(this.copy.corridorResume);
    }
  }

  public update(snapshot: GameSnapshot): void {
    if (this.destroyed) return;
    const displayedVisualStateId = campaignVisualStateAtProgress(
      snapshot.visualStateId,
      snapshot.visualNextStateId,
      snapshot.visualProgress,
    );
    this.applyWorldVisual(
      snapshot.visualWorldId,
      displayedVisualStateId,
      this.root.dataset.view === "story_scene" ? "story" : "game"
    );
    this.worldVisualLayer.setCounterValue(campaignWorldCounterValue(
      snapshot.mode,
      displayedVisualStateId,
      snapshot.storyObjectives.epoch5.millionThreshold.counterValue,
    ));
    this.hudPackages.textContent = formatInteger(snapshot.packagesCollected);
    this.hudScore.textContent = formatInteger(snapshot.score);
    this.hudCombo.textContent = `×${formatInteger(snapshot.combo)}`;
    const activePowerUps = formatPowerUpHud(snapshot.activePowerUps);
    this.hudPowerUps.textContent = activePowerUps;
    this.hudPowerUps.hidden = activePowerUps.length === 0;
    const controls = formatStoryControlsHud(snapshot.storyObjectiveSegmentId);
    this.hudControls.textContent = controls ?? "";
    this.hudControls.hidden = controls === null;
    if (this.activeMode === "story") {
      const progress = snapshot.epochIndexMax > 0
        ? `${snapshot.epochIndex + 1}/${snapshot.epochIndexMax + 1}`
        : "";
      this.hudEpoch.textContent = [snapshot.epochName, progress].filter(Boolean).join(" · ");
      this.showStoryObjective(
        formatStoryObjectiveHud(snapshot.storyObjectives, snapshot.activeStoryOrderTypes)
      );
    }
  }

  public showPickupNotice(message: string): void {
    if (this.destroyed) return;
    this.hudNotice.textContent = message;
    this.hudNotice.hidden = false;
    this.announce(message);
    window.setTimeout(() => {
      if (this.destroyed || this.hudNotice.textContent !== message) return;
      this.hudNotice.hidden = true;
      this.hudNotice.textContent = "";
    }, 3_800);
  }

  public showStoryObjective(message: string | null): void {
    if (this.destroyed) return;
    this.hudObjective.textContent = message ?? "";
    this.hudObjective.title = message ?? "";
    this.hudObjective.hidden = message === null;
  }

  public showStoryResult(result: CampaignStoryResult): void {
    if (this.destroyed) return;
    this.activeMode = "story";
    this.applyWorldVisual("million-finale", "story.million_finale", "result");
    requiredElement(this.storyResultScreen, "[data-campaign-story-packages]").textContent = formatInteger(result.packages);
    requiredElement(this.storyResultScreen, "[data-campaign-story-score]").textContent = formatInteger(result.score);
    requiredElement(this.storyResultScreen, "[data-campaign-story-combo]").textContent = `×${formatInteger(result.bestCombo)}`;
    this.setView("story_result", this.storyResultScreen);
    requiredElement<HTMLButtonElement>(this.storyResultScreen, "[data-campaign-start-challenge]").focus({ preventScroll: true });
    this.announce(
      `${this.copy.storyResultTitle}. ${this.copy.resultPackages}: ${formatInteger(result.packages)}. ` +
      `${this.copy.resultScore}: ${formatInteger(result.score)}.`
    );
  }

  public showChallengeResult(result: CampaignChallengeResult): void {
    if (this.destroyed) return;
    this.activeMode = "challenge";
    this.applyWorldVisual("million-finale", "story.million_finale", "result");
    this.challengeResult = result;
    requiredElement(this.challengeResultScreen, "[data-campaign-challenge-packages]").textContent = formatInteger(result.packages);
    requiredElement(this.challengeResultScreen, "[data-campaign-challenge-total]").textContent = formatInteger(result.totalScore);
    requiredElement(this.challengeResultScreen, "[data-campaign-challenge-score]").textContent = formatInteger(result.challengeScore);
    requiredElement(this.challengeResultScreen, "[data-campaign-challenge-best]").textContent = formatInteger(result.bestScore);
    requiredElement(this.challengeResultScreen, "[data-campaign-challenge-best-label]").textContent =
      result.firstChallengeResult ? "Pierwszy wynik wyzwania" : "Twój rekord wyzwania";
    requiredElement(this.challengeResultScreen, "[data-campaign-challenge-distance]").textContent = formatInteger(result.distanceM);
    requiredElement(this.challengeResultScreen, "[data-campaign-challenge-saves]").textContent = formatInteger(result.warrantySaves);
    requiredElement<HTMLElement>(this.challengeResultScreen, "[data-campaign-challenge-saves-stat]").hidden = result.warrantySaves === 0;
    this.sharePanel.hidden = true;
    this.shareStatus.textContent = "";
    this.setView("challenge_result", this.challengeResultScreen);
    requiredElement<HTMLButtonElement>(this.challengeResultScreen, "[data-campaign-restart-challenge]").focus({ preventScroll: true });
    this.announce(
      `${this.copy.challengeResultTitle}. Wynik łączny: ${formatInteger(result.totalScore)}. ` +
      `Wynik wyzwania: ${formatInteger(result.challengeScore)}. ` +
      `${this.copy.resultPackages}: ${formatInteger(result.packages)}.`
    );
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
    if (this.storyUnlockTimer !== null) window.clearTimeout(this.storyUnlockTimer);
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
    if (options.challengeUnlocked) {
      const heading = document.createElement("h2");
      heading.textContent = this.copy.choosePath;
      const storyButton = this.createActionButton(this.copy.replayStory, true);
      storyButton.addEventListener("click", () => this.queueStart({ mode: "story", restartStory: true }), { once: true });
      const challengeButton = this.createActionButton(this.copy.challengeMode, false);
      challengeButton.addEventListener("click", () => this.queueStart({ mode: "challenge", restartStory: false }), { once: true });
      this.landingActions.append(heading, storyButton, challengeButton);
      return;
    }

    const startButton = this.createActionButton(this.copy.startStory, true);
    startButton.addEventListener("click", () => this.queueStart({ mode: "story", restartStory: false }), { once: true });
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
    if (this.fullscreenPreference === "fullscreen" && isMobileLayout() &&
        document.fullscreenElement === null) {
      void this.enterFullscreen().finally(() => this.callbacks.onStart(request));
      return;
    }
    this.callbacks.onStart(request);
  }

  private dispatchPendingStart(choice: "fullscreen" | "portrait"): void {
    this.rememberFullscreenPreference(choice);
    const request = this.pendingStart;
    this.pendingStart = null;
    if (request !== null) this.callbacks.onStart(request);
  }

  private rememberFullscreenPreference(choice: "fullscreen" | "portrait"): void {
    const changed = !this.fullscreenPromptSeen || this.fullscreenPreference !== choice;
    this.fullscreenPromptSeen = true;
    this.fullscreenPreference = choice;
    if (changed) this.callbacks.onFullscreenPreferenceChange(choice);
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
      this.rememberFullscreenPreference(
        fullscreenPreferenceFromElement(document.fullscreenElement, this.root)
      );
    })();
  }

  private hideScreens(): void {
    this.setScreenModal(null);
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
    this.hideStoryPresentation();
    this.hideScreens();
    visibleScreen.hidden = false;
    this.root.dataset.view = view;
    this.hud.hidden = true;
    this.root.removeAttribute("data-trust-corridor");
    this.trustCorridor = false;
    this.canvas.tabIndex = -1;
    this.canvas.setAttribute("aria-hidden", "true");
    if (visibleScreen === this.orientationScreen) this.setScreenModal(visibleScreen);
  }

  private hideStoryPresentation(): void {
    if (this.storyUnlockTimer !== null) {
      window.clearTimeout(this.storyUnlockTimer);
      this.storyUnlockTimer = null;
    }
    this.storyPresentation.hidden = true;
    this.storySceneCard.hidden = false;
    this.storyCountdown.hidden = true;
    this.storyContinueButton.disabled = true;
    delete this.storyContinueButton.dataset.sceneId;
    delete this.storyContinueButton.dataset.presentationId;
    delete this.storySceneCard.dataset.sceneId;
    delete this.storyPresentation.dataset.state;
    delete this.storyPresentation.dataset.copyPlacement;
    this.lastCountdownValue = null;
    this.storyContinuationGate.clear();
    this.setScreenModal(null);
  }

  /** Keeps in-stage dialogs reachable without making their own ancestor inert. */
  private setScreenModal(screen: HTMLElement | null): void {
    this.activeModalScreen = screen;
    this.applyModalInertState();
  }

  private applyModalInertState(): void {
    const screen = this.tooNarrowActive ? this.tooNarrow : this.activeModalScreen;
    const active = screen !== null;
    for (const region of this.presentationBackground) region.inert = active;
    for (const child of this.stage.children) {
      if (child instanceof HTMLElement) child.inert = active && child !== screen;
    }
    if (screen) screen.inert = false;
  }

  private activeKeyboardDialog(): HTMLElement | null {
    if (!this.pauseScreen.hidden) return this.pauseScreen;
    if (!this.orientationScreen.hidden) return this.orientationScreen;
    return null;
  }

  private canControl(): boolean {
    return this.activeMode !== null && !this.paused && !this.trustCorridor &&
      !this.tooNarrowActive && this.root.dataset.view === "game";
  }

  private updateNarrowState(): void {
    const narrow = isCampaignViewportTooNarrow(window.innerWidth, window.innerHeight);
    const enteredNarrowState = narrow && !this.tooNarrowActive;
    const leftNarrowState = !narrow && this.tooNarrowActive;
    this.tooNarrowActive = narrow;
    this.tooNarrow.hidden = !narrow;
    this.root.toggleAttribute("data-too-narrow", narrow);
    this.applyModalInertState();

    const activeView = this.root.dataset.view;
    if (enteredNarrowState && this.activeMode !== null && !this.paused &&
        (activeView === "game" || activeView === "story_reframe" ||
          activeView === "story_countdown")) {
      this.callbacks.onPause("layout_change");
    } else if (leftNarrowState && !this.pauseScreen.hidden) {
      requiredElement<HTMLButtonElement>(this.pauseScreen, "[data-campaign-resume]")
        .focus({ preventScroll: true });
    }
  }

  private applyWorldVisual(
    worldId: GameSnapshot["visualWorldId"],
    stateId: string,
    phase: "landing" | "story" | "game" | "result"
  ): void {
    const state = this.worldVisualLayer.show({
      worldId,
      stateId,
      phase
    });
    this.root.dataset.visualWorld = state.worldId;
    this.root.dataset.visualState = state.stateId;
    this.root.dataset.copyPlacement = state.copyPlacement;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("button, a") : null;
    if (target === null) return;
    if (target.matches("[data-campaign-story-continue]")) {
      this.tryContinueStory();
    } else if (target.matches("[data-campaign-mute]")) {
      this.setMuted(!this.muted);
    } else if (target.matches("[data-campaign-fullscreen]")) {
      this.toggleFullscreen();
    } else if (target.matches("[data-campaign-enter-fullscreen]")) {
      void this.enterFullscreen().finally(() => this.dispatchPendingStart(
        fullscreenPreferenceFromElement(document.fullscreenElement, this.root)
      ));
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
      if (platform === "facebook" || platform === "instagram") {
        void this.handleShare(platform);
      }
    }
  };

  private async handleShare(platform: CampaignSharePlatform): Promise<void> {
    if (this.challengeResult === null) return;
    this.shareStatus.textContent = this.copy.sharePreparing;
    try {
      const method = await shareCampaignResult({
        platform,
        result: {
          score: this.challengeResult.totalScore,
          packages: this.challengeResult.packages
        },
        canonicalUrl: this.canonicalUrl,
        scoreLabel: this.copy.shareScoreLabel.toLocaleUpperCase("pl-PL"),
        packagesLabel: this.copy.resultPackages.toLocaleUpperCase("pl-PL"),
        callToAction: this.copy.shareTurn,
        publicationText: this.copy.sharePublication,
      });
      this.callbacks.onShare?.(platform, method);
      this.shareStatus.textContent = method === "cancelled"
        ? this.copy.shareCancelled
        : method === "download"
          ? this.copy.shareDownloaded
          : method === "facebook_url"
            ? this.copy.shareFacebookReady
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
    const activeDialog = this.activeKeyboardDialog();
    if (activeDialog !== null && event.key === "Tab") {
      const focusable = [...activeDialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )];
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const nextIndex = getTrappedFocusIndex(currentIndex, focusable.length, event.shiftKey);
      const next = focusable[nextIndex];
      if (next !== undefined) {
        event.preventDefault();
        next.focus({ preventScroll: true });
      }
      return;
    }
    if (!this.storyPresentation.hidden && this.storySceneCard.hidden && event.key === "Tab") {
      event.preventDefault();
      const focusTarget = this.storyCountdown.hidden
        ? this.storyPresentation
        : this.storyCountdown;
      focusTarget.focus({ preventScroll: true });
      return;
    }
    if (!this.storyPresentation.hidden && !this.storySceneCard.hidden && event.key === "Tab") {
      const focusable = [this.storySceneBody, this.storyContinueButton]
        .filter((element) => !(element instanceof HTMLButtonElement && element.disabled));
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const nextIndex = getTrappedFocusIndex(currentIndex, focusable.length, event.shiftKey);
      const next = focusable[nextIndex];
      if (next !== undefined) {
        event.preventDefault();
        next.focus({ preventScroll: true });
      }
      return;
    }
    if (!this.storyPresentation.hidden && !this.storySceneCard.hidden &&
        (event.code === "Space" || event.key === " " || event.code === "Enter" || event.key === "Enter")) {
      event.preventDefault();
      if (!event.repeat) this.tryContinueStory();
      return;
    }
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
    this.rememberFullscreenPreference(
      fullscreenPreferenceFromElement(document.fullscreenElement, this.root)
    );
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

  private tryContinueStory(): void {
    const sceneId = this.storyContinueButton.dataset.sceneId;
    const presentationId = this.storyContinueButton.dataset.presentationId;
    if (sceneId === undefined || presentationId === undefined ||
        !this.storyContinuationGate.consume(presentationId)) return;
    this.storyContinueButton.disabled = true;
    this.callbacks.onStoryContinue(sceneId);
  }
}

export default CampaignShell;
