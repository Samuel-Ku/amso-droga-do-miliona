import {
  CAMPAIGN_WORLDS,
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

type WorldImageFactory = () => HTMLImageElement;

function defaultImageFactory(): HTMLImageElement {
  return new Image();
}

interface WorldAssetEntry {
  readonly path: string;
  readonly image: HTMLImageElement;
  readonly promise: Promise<DecodedWorldAsset>;
}

export interface DecodedWorldAsset {
  readonly path: string;
  readonly image: HTMLImageElement;
}

/** One decoded image object per world, with one bounded retry and a two-world window. */
export class WorldAssetStore {
  private readonly entries = new Map<string, WorldAssetEntry>();

  public constructor(private readonly imageFactory: WorldImageFactory = defaultImageFactory) {}

  public load(path: string): Promise<DecodedWorldAsset> {
    const cached = this.entries.get(path);
    if (cached !== undefined) return cached.promise;

    const image = this.imageFactory();
    let attempts = 0;
    const promise = new Promise<DecodedWorldAsset>((resolve, reject) => {
      const failAttempt = (): void => {
        if (attempts < 2) {
          queueMicrotask(startAttempt);
          return;
        }
        image.onload = null;
        image.onerror = null;
        reject(new Error("world_asset_decode_failed"));
      };
      const startAttempt = (): void => {
        attempts += 1;
        image.onload = async () => {
          image.onload = null;
          image.onerror = null;
          try {
            await image.decode?.();
            resolve({ path, image });
          } catch {
            failAttempt();
          }
        };
        image.onerror = failAttempt;
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

/** Two adjacent world panels share one absolute parallax phase. */
export class WorldVisualLayer {
  private readonly panels: readonly [HTMLCanvasElement, HTMLCanvasElement];
  private currentWorldId: CampaignWorldId | null = null;
  private currentStateId = "";
  private requestedAssetPath: string | null = null;
  private currentAsset: DecodedWorldAsset | null = null;
  private pendingAsset: DecodedWorldAsset | null = null;
  private transitionStartDistance = 0;
  private lastDistance = 0;
  private stationaryCommitTimer: ReturnType<typeof setTimeout> | null = null;

  public constructor(
    private readonly host: HTMLElement,
    private readonly assets = new WorldAssetStore()
  ) {
    host.innerHTML = `
      <div class="amso-world-visual__image-stack" aria-hidden="true">
        <canvas class="amso-world-visual__panel" data-world-panel="current" width="1672" height="941"></canvas>
        <canvas class="amso-world-visual__panel" data-world-panel="next" width="1672" height="941"></canvas>
      </div>
      ${WORLD_ROUTE_SVG}
      <div class="amso-world-visual__counter" aria-hidden="true">
        <span data-world-counter>999 970</span>
      </div>
    `;
    this.panels = [
      requiredElement<HTMLCanvasElement>(host, '[data-world-panel="current"]'),
      requiredElement<HTMLCanvasElement>(host, '[data-world-panel="next"]')
    ];
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

    if (worldChanged) {
      this.loadWorldAsset(world.assetPath, selection.phase !== "game");
    }
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
    reducedMotion = false
  ): void {
    if (!Number.isFinite(distancePixels)) return;
    const distance = reducedMotion
      ? reducedMotionBackgroundTravelPixels(distancePixels)
      : Math.max(0, distancePixels);
    this.lastDistance = distance;
    this.host.style.setProperty("--world-phase-px", `${distance}px`);
    this.host.dataset.motionState = active ? "moving" : "reading";

    if (!active) {
      if (this.pendingAsset !== null) this.startStationaryTransition();
      return;
    }

    if (this.stationaryCommitTimer !== null) {
      this.cancelStationaryTransition();
      this.transitionStartDistance = distance;
    }
    if (this.pendingAsset !== null) {
      const transition = Math.max(0, (distance - this.transitionStartDistance) / WORLD_WIDTH);
      if (transition >= 1 - Number.EPSILON * 8) {
        this.commitPendingAsset();
      } else {
        this.placePanels(Math.min(1, transition));
      }
      return;
    }
    const progress = (distance % WORLD_WIDTH) / WORLD_WIDTH;
    this.placePanels(progress);
  }

  private placePanels(progress: number): void {
    const travel = progress * 100;
    const currentX = -travel;
    const nextX = 100 - travel;
    this.panels[0].style.transform = `translate3d(${currentX}%, 0, 0)`;
    this.panels[1].style.transform = `translate3d(${nextX}%, 0, 0)`;
  }

  private loadWorldAsset(assetPath: string, commitImmediately: boolean): void {
    if (this.requestedAssetPath === assetPath) return;
    this.cancelStationaryTransition();
    this.requestedAssetPath = assetPath;
    this.host.dataset.assetState = "loading";
    void this.assets.load(assetPath).then((decodedAsset) => {
      if (this.requestedAssetPath !== assetPath) return;
      if (this.currentAsset === null) {
        this.currentAsset = decodedAsset;
        this.pendingAsset = null;
        this.drawPanel(this.panels[0], decodedAsset);
        this.drawPanel(this.panels[1], decodedAsset);
        this.prepareNextWorld(decodedAsset.path);
      } else {
        this.pendingAsset = decodedAsset;
        this.transitionStartDistance = this.lastDistance;
        this.drawPanel(this.panels[1], decodedAsset);
        if (commitImmediately) this.startStationaryTransition();
      }
      this.host.dataset.assetState = "loaded";
    }).catch(() => {
      if (this.requestedAssetPath !== assetPath) return;
      this.pendingAsset = null;
      this.clearPanels();
      this.host.dataset.assetState = "fallback";
    });
  }

  private commitPendingAsset(): void {
    if (this.pendingAsset === null) return;
    this.currentAsset = this.pendingAsset;
    this.pendingAsset = null;
    this.drawPanel(this.panels[0], this.currentAsset);
    this.drawPanel(this.panels[1], this.currentAsset);
    this.placePanels(0);
    this.prepareNextWorld(this.currentAsset.path);
  }

  private prepareNextWorld(assetPath: string): void {
    const index = CAMPAIGN_WORLDS.findIndex(({ assetPath: candidate }) => candidate === assetPath);
    const next = CAMPAIGN_WORLDS[index + 1];
    if (next !== undefined) void this.assets.load(next.assetPath).catch(() => undefined);
  }

  private startStationaryTransition(): void {
    if (this.pendingAsset === null || this.stationaryCommitTimer !== null) return;
    this.host.dataset.motionState = "reading";
    this.stationaryCommitTimer = setTimeout(() => {
      this.stationaryCommitTimer = null;
      this.commitPendingAsset();
    }, 720);
  }

  private cancelStationaryTransition(): void {
    if (this.stationaryCommitTimer !== null) clearTimeout(this.stationaryCommitTimer);
    this.stationaryCommitTimer = null;
  }

  private drawPanel(panel: HTMLCanvasElement, asset: DecodedWorldAsset): void {
    const width = asset.image.naturalWidth || 1672;
    const height = asset.image.naturalHeight || 941;
    panel.width = width;
    panel.height = height;
    const context = panel.getContext("2d");
    if (context === null) return;
    context.clearRect(0, 0, width, height);
    context.drawImage(asset.image, 0, 0, width, height);
  }

  private clearPanels(): void {
    for (const panel of this.panels) {
      panel.getContext("2d")?.clearRect(0, 0, panel.width, panel.height);
    }
  }
}
