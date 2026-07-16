import {
  campaignWorld,
  sceneVisualState,
  type CampaignSceneVisualState,
  type CampaignWorldId
} from "./scene-manifest";
import { WORLD_ROUTE_SVG } from "./world-route";
import { WORLD_WIDTH } from "../game/constants";
import { reducedMotionBackgroundTravelPixels } from "./background-parallax";

export type WorldVisualPhase = "landing" | "story" | "game" | "result";

export interface WorldVisualSelection {
  readonly worldId: CampaignWorldId;
  readonly stateId: string;
  readonly phase: WorldVisualPhase;
}

const WORLD_TILE_BLEND_PIXELS = 32;
const WORLD_TILE_SOLID_OVERLAP_PIXELS = 3;
const WORLD_TILE_OVERLAP_PIXELS = WORLD_TILE_BLEND_PIXELS + WORLD_TILE_SOLID_OVERLAP_PIXELS;
const WORLD_RECENTER_MILLISECONDS = 720;

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
  private readonly panels: readonly [HTMLElement, HTMLElement];
  private readonly tiles: readonly [
    readonly [HTMLImageElement, HTMLImageElement],
    readonly [HTMLImageElement, HTMLImageElement]
  ];
  private activeImageIndex = 0;
  private requestedAssetPath = "";
  private currentWorldId: CampaignWorldId | null = null;
  private currentStateId = "";
  private lastParallaxCycle: number | null = null;

  public constructor(private readonly host: HTMLElement) {
    host.innerHTML = `
      <div class="amso-world-visual__image-stack" aria-hidden="true">
        <div class="amso-world-visual__panel" data-world-panel="0">
          <img class="amso-world-visual__image" data-world-image="0" data-world-tile="0" alt="" width="1672" height="941" decoding="async" loading="eager" fetchpriority="high" />
          <img class="amso-world-visual__image" data-world-image="0-copy" data-world-tile="1" alt="" width="1672" height="941" decoding="async" loading="eager" fetchpriority="high" />
        </div>
        <div class="amso-world-visual__panel" data-world-panel="1">
          <img class="amso-world-visual__image" data-world-image="1" data-world-tile="0" alt="" width="1672" height="941" decoding="async" loading="eager" fetchpriority="high" />
          <img class="amso-world-visual__image" data-world-image="1-copy" data-world-tile="1" alt="" width="1672" height="941" decoding="async" loading="eager" fetchpriority="high" />
        </div>
      </div>
      ${WORLD_ROUTE_SVG}
      <div class="amso-world-visual__counter" aria-hidden="true">
        <span data-world-counter>999 950</span>
      </div>
    `;
    this.panels = [
      requiredElement(host, '[data-world-panel="0"]'),
      requiredElement(host, '[data-world-panel="1"]')
    ];
    this.tiles = [
      [
        requiredElement(host, '[data-world-image="0"]'),
        requiredElement(host, '[data-world-image="0-copy"]')
      ],
      [
        requiredElement(host, '[data-world-image="1"]'),
        requiredElement(host, '[data-world-image="1-copy"]')
      ]
    ];
    this.panels[0].classList.add("is-active");
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

  /** Applies an absolute phase so story-to-challenge and world crossfades never jump. */
  public setParallaxDistance(
    distancePixels: number,
    active: boolean,
    reducedMotion = false,
    gameplaySpeed = 280
  ): void {
    const transitionMilliseconds = reducedMotion
      ? 1_200
      : Math.max(360, Math.min(900, (WORLD_WIDTH / Math.max(1, gameplaySpeed)) * 250));
    this.host.style.setProperty("--world-transition-ms", `${Math.round(transitionMilliseconds)}ms`);
    if (!active || !Number.isFinite(distancePixels)) {
      for (const panelTiles of this.tiles) {
        for (const tile of panelTiles) {
          tile.style.transition = `transform ${reducedMotion ? 1_200 : WORLD_RECENTER_MILLISECONDS}ms ` +
            "cubic-bezier(0.2, 0.7, 0.2, 1)";
        }
        panelTiles[0].style.transform = "translateX(0px)";
        panelTiles[1].style.transform =
          `translateX(calc(100% - ${WORLD_TILE_OVERLAP_PIXELS}px))`;
      }
      return;
    }
    const distance = reducedMotion
      ? reducedMotionBackgroundTravelPixels(distancePixels)
      : Math.max(0, distancePixels);
    const cycle = Math.floor(distance / WORLD_WIDTH);
    const progress = (distance % WORLD_WIDTH) / WORLD_WIDTH;
    const wrapped = this.lastParallaxCycle !== null && cycle !== this.lastParallaxCycle;
    for (const panelTiles of this.tiles) {
      for (const tile of panelTiles) {
        tile.style.transition = this.lastParallaxCycle === null || wrapped
          ? "none"
          : `transform ${reducedMotion ? 280 : 140}ms linear`;
      }
      panelTiles[0].style.transform =
        `translateX(calc(${-progress * 100}% + ${progress * WORLD_TILE_OVERLAP_PIXELS}px))`;
      panelTiles[1].style.transform =
        `translateX(calc(${(1 - progress) * 100}% - ${(1 - progress) * WORLD_TILE_OVERLAP_PIXELS}px))`;
    }
    this.lastParallaxCycle = cycle;
  }

  private loadWorldAsset(assetPath: string): void {
    if (this.requestedAssetPath === assetPath) return;
    this.requestedAssetPath = assetPath;
    const nextIndex = this.activeImageIndex === 0 ? 1 : 0;
    const nextPanel = this.panels[nextIndex]!;
    const previousPanel = this.panels[this.activeImageIndex]!;
    const nextTiles = this.tiles[nextIndex]!;
    const nextImage = nextTiles[0];
    this.host.dataset.assetState = "loading";
    nextPanel.classList.remove("is-active");

    const activate = (): void => {
      if (this.requestedAssetPath !== assetPath) return;
      previousPanel.classList.add("is-leaving");
      previousPanel.classList.remove("is-active");
      nextPanel.classList.remove("is-leaving");
      nextPanel.classList.add("is-active");
      this.activeImageIndex = nextIndex;
      this.host.dataset.assetState = "loaded";
      window.setTimeout(() => previousPanel.classList.remove("is-leaving"), 760);
    };
    const fail = (): void => {
      if (this.requestedAssetPath === assetPath) this.host.dataset.assetState = "fallback";
    };

    nextImage.addEventListener("load", activate, { once: true });
    nextImage.addEventListener("error", fail, { once: true });
    nextTiles[0].src = assetPath;
    nextTiles[1].src = assetPath;
    if (nextImage.complete && nextImage.naturalWidth > 0) activate();
  }

}
