import {
  campaignWorld,
  sceneVisualState,
  type CampaignSceneVisualState,
  type CampaignWorldId
} from "./scene-manifest";
import { WORLD_ROUTE_SVG } from "./world-route";
import { WORLD_WIDTH } from "../game/constants";
import { reducedMotionBackgroundTravelPixels } from "./background-parallax";

const WORLD_CONNECTOR_FRACTION = 0.08;

export type WorldVisualPhase = "landing" | "story" | "game" | "result";

export interface WorldVisualSelection {
  readonly worldId: CampaignWorldId;
  readonly stateId: string;
  readonly phase: WorldVisualPhase;
}

type WorldImageFactory = () => HTMLImageElement;

function defaultImageFactory(): HTMLImageElement {
  return new Image();
}

interface WorldAssetEntry {
  readonly path: string;
  readonly image: HTMLImageElement;
  readonly promise: Promise<string>;
}

/** One decoded image object per world, with one bounded retry and a two-world window. */
export class WorldAssetStore {
  private readonly entries = new Map<string, WorldAssetEntry>();

  public constructor(private readonly imageFactory: WorldImageFactory = defaultImageFactory) {}

  public load(path: string): Promise<string> {
    const cached = this.entries.get(path);
    if (cached !== undefined) return cached.promise;

    const image = this.imageFactory();
    let attempts = 0;
    const promise = new Promise<string>((resolve, reject) => {
      const startAttempt = (): void => {
        attempts += 1;
        image.onload = () => {
          image.onload = null;
          image.onerror = null;
          resolve(path);
        };
        image.onerror = () => {
          if (attempts < 2) {
            queueMicrotask(startAttempt);
            return;
          }
          image.onload = null;
          image.onerror = null;
          reject(new Error("world_asset_decode_failed"));
        };
        image.src = path;
        if (image.complete && image.naturalWidth > 0) image.onload?.(new Event("load"));
      };
      startAttempt();
    });
    this.entries.set(path, { path, image, promise });
    while (this.entries.size > 2) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
    return promise;
  }
}

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`World visual element not found: ${selector}`);
  return element;
}

/** Adjacent world panels and a neutral connector share one absolute parallax phase. */
export class WorldVisualLayer {
  private readonly panels: readonly [HTMLElement, HTMLElement];
  private readonly connector: HTMLElement;
  private currentWorldId: CampaignWorldId | null = null;
  private currentStateId = "";
  private requestedAssetPath = "";
  private currentAssetPath = "";
  private pendingAssetPath = "";
  private transitionStartDistance = 0;
  private lastDistance = 0;

  public constructor(
    private readonly host: HTMLElement,
    private readonly assets = new WorldAssetStore()
  ) {
    host.innerHTML = `
      <div class="amso-world-visual__image-stack" aria-hidden="true">
        <div class="amso-world-visual__panel" data-world-panel="current"></div>
        <div class="amso-world-visual__connector" data-world-connector></div>
        <div class="amso-world-visual__panel" data-world-panel="next"></div>
      </div>
      ${WORLD_ROUTE_SVG}
      <div class="amso-world-visual__counter" aria-hidden="true">
        <span data-world-counter>999 950</span>
      </div>
    `;
    this.panels = [
      requiredElement(host, '[data-world-panel="current"]'),
      requiredElement(host, '[data-world-panel="next"]')
    ];
    this.connector = requiredElement(host, "[data-world-connector]");
    this.host.style.setProperty("--world-overlap", "0px");
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

    if (worldChanged) this.loadWorldAsset(world.assetPath, selection.phase !== "game");
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

  public setParallaxDistance(
    distancePixels: number,
    active: boolean,
    reducedMotion = false,
    _gameplaySpeed = 280
  ): void {
    if (!Number.isFinite(distancePixels)) return;
    const distance = reducedMotion
      ? reducedMotionBackgroundTravelPixels(distancePixels)
      : Math.max(0, distancePixels);
    this.lastDistance = distance;
    this.host.style.setProperty("--world-phase-px", `${distance}px`);

    if (!active) {
      if (this.pendingAssetPath !== "") this.commitPendingAsset();
      this.placePanels(0, false);
      return;
    }

    if (this.pendingAssetPath !== "") {
      const transitionDistance = WORLD_WIDTH * (1 + WORLD_CONNECTOR_FRACTION);
      const transition = Math.max(0, (distance - this.transitionStartDistance) / transitionDistance);
      this.placePanels(Math.min(1, transition), true);
      if (transition >= 1) this.commitPendingAsset();
      return;
    }
    const progress = (distance % WORLD_WIDTH) / WORLD_WIDTH;
    this.placePanels(progress, false);
  }

  private placePanels(progress: number, transitioning: boolean): void {
    const travel = transitioning
      ? progress * (100 + WORLD_CONNECTOR_FRACTION * 100)
      : progress * 100;
    const currentX = -travel;
    const nextX = (transitioning ? 108 : 100) - travel;
    this.panels[0].style.transform = `translate3d(${currentX}%, 0, 0)`;
    this.panels[1].style.transform = `translate3d(${nextX}%, 0, 0)`;
    this.connector.hidden = !transitioning;
    this.connector.style.transform = `translate3d(${(100 - travel) * 12.5}%, 0, 0)`;
  }

  private loadWorldAsset(assetPath: string, commitImmediately: boolean): void {
    if (this.requestedAssetPath === assetPath) return;
    this.requestedAssetPath = assetPath;
    this.host.dataset.assetState = "loading";
    void this.assets.load(assetPath).then((decodedPath) => {
      if (this.requestedAssetPath !== assetPath) return;
      if (this.currentAssetPath === "" || commitImmediately) {
        this.currentAssetPath = decodedPath;
        this.pendingAssetPath = "";
        this.setPanelImage(this.panels[0], decodedPath);
        this.setPanelImage(this.panels[1], decodedPath);
      } else {
        this.pendingAssetPath = decodedPath;
        this.transitionStartDistance = this.lastDistance;
        this.setPanelImage(this.panels[1], decodedPath);
      }
      this.host.dataset.assetState = "loaded";
    }).catch(() => {
      if (this.requestedAssetPath !== assetPath) return;
      this.pendingAssetPath = "";
      this.host.dataset.assetState = "fallback";
    });
  }

  private commitPendingAsset(): void {
    if (this.pendingAssetPath === "") return;
    this.currentAssetPath = this.pendingAssetPath;
    this.pendingAssetPath = "";
    this.setPanelImage(this.panels[0], this.currentAssetPath);
    this.setPanelImage(this.panels[1], this.currentAssetPath);
    this.connector.hidden = true;
    this.placePanels(0, false);
  }

  private setPanelImage(panel: HTMLElement, path: string): void {
    panel.style.backgroundImage = `url("${path}")`;
  }
}
