import {
  campaignWorld,
  sceneVisualState,
  type CampaignSceneVisualState,
  type CampaignWorldId
} from "./scene-manifest";
import { WORLD_ROUTE_SVG } from "./world-route";

export type WorldVisualPhase = "landing" | "story" | "game" | "result";

export interface WorldVisualSelection {
  readonly worldId: CampaignWorldId;
  readonly stateId: string;
  readonly phase: WorldVisualPhase;
}

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`World visual element not found: ${selector}`);
  return element;
}

/**
 * Owns world image crossfades and the shared route. The canvas stays a
 * separate gameplay plane, so story cards and gameplay literally share this
 * same environment instance.
 */
export class WorldVisualLayer {
  private readonly images: readonly [HTMLImageElement, HTMLImageElement];
  private activeImageIndex = 0;
  private requestedAssetPath = "";
  private currentWorldId: CampaignWorldId | null = null;
  private currentStateId = "";

  public constructor(private readonly host: HTMLElement) {
    host.innerHTML = `
      <div class="amso-world-visual__image-stack" aria-hidden="true">
        <img class="amso-world-visual__image" data-world-image="0" alt="" width="1672" height="941" decoding="async" loading="eager" fetchpriority="high" />
        <img class="amso-world-visual__image" data-world-image="1" alt="" width="1672" height="941" decoding="async" loading="eager" fetchpriority="high" />
      </div>
      ${WORLD_ROUTE_SVG}
      <div class="amso-world-visual__counter" aria-hidden="true">
        <span data-world-counter>999 970</span>
      </div>
    `;
    this.images = [
      requiredElement(host, '[data-world-image="0"]'),
      requiredElement(host, '[data-world-image="1"]')
    ];
  }

  public show(selection: WorldVisualSelection): CampaignSceneVisualState {
    const state = sceneVisualState(selection.stateId);
    if (state.worldId !== selection.worldId) {
      throw new Error(`World/state mismatch: ${selection.worldId}/${selection.stateId}`);
    }
    const world = campaignWorld(selection.worldId);
    const worldChanged = this.currentWorldId !== selection.worldId;
    const stateChanged = this.currentStateId !== selection.stateId;
    this.currentWorldId = selection.worldId;
    this.currentStateId = selection.stateId;

    this.host.dataset.worldId = selection.worldId;
    this.host.dataset.stateId = selection.stateId;
    this.host.dataset.phase = selection.phase;
    this.host.dataset.copyPlacement = state.copyPlacement;
    this.host.style.setProperty("--world-position-portrait", state.crops.portrait);
    this.host.style.setProperty("--world-position-landscape", state.crops.landscape);
    this.host.style.setProperty("--world-position-desktop", state.crops.desktop);
    this.host.style.setProperty("--world-reading-zoom", String(state.readingCamera.zoom));
    this.host.style.setProperty("--world-game-zoom", String(state.gameCamera.zoom));
    this.host.style.setProperty("--world-reading-origin-x", `${state.readingCamera.x * 100}%`);
    this.host.style.setProperty("--world-reading-origin-y", `${state.readingCamera.y * 100}%`);

    if (worldChanged) this.loadWorldAsset(world.assetPath);
    if (worldChanged || stateChanged) {
      this.host.dataset.reveal = state.revealMotion;
      this.host.dataset.visualEvent = state.visualEvent;
    }
    return state;
  }

  public setCounterValue(value: number): void {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    const text = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 })
      .format(safeValue)
      .replace(/[\u00a0\u202f]/gu, " ");
    this.host.querySelectorAll<HTMLElement>("[data-world-counter]")
      .forEach((element) => { element.textContent = text; });
  }

  public setPhase(phase: WorldVisualPhase): void {
    this.host.dataset.phase = phase;
  }

  private loadWorldAsset(assetPath: string): void {
    if (this.requestedAssetPath === assetPath) return;
    this.requestedAssetPath = assetPath;
    const nextIndex = this.activeImageIndex === 0 ? 1 : 0;
    const nextImage = this.images[nextIndex]!;
    const previousImage = this.images[this.activeImageIndex]!;
    this.host.dataset.assetState = "loading";
    nextImage.classList.remove("is-active");

    const activate = (): void => {
      if (this.requestedAssetPath !== assetPath) return;
      previousImage.classList.remove("is-active");
      nextImage.classList.add("is-active");
      this.activeImageIndex = nextIndex;
      this.host.dataset.assetState = "loaded";
    };
    const fail = (): void => {
      if (this.requestedAssetPath === assetPath) this.host.dataset.assetState = "fallback";
    };

    nextImage.addEventListener("load", activate, { once: true });
    nextImage.addEventListener("error", fail, { once: true });
    nextImage.src = assetPath;
    if (nextImage.complete && nextImage.naturalWidth > 0) activate();
  }
}
