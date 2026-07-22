import {
  CAMPAIGN_WORLDS,
  campaignWorld,
  sceneVisualState,
  type CampaignSceneVisualState,
  type CampaignWorldId
} from "./scene-manifest";
import { WORLD_ROUTE_SVG } from "./world-route";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../game/constants";
import { reducedMotionBackgroundTravelPixels } from "./background-parallax";
import {
  WORLD_ARTWORK_CONTRACT,
  type WorldPlateTransform
} from "./world-plate-transform";
import { DecodedImageStore } from "../assets/DecodedImageStore";

export type WorldVisualPhase = "landing" | "story" | "game" | "result";
export type WorldTransitionMode = "story-linked" | "offscreen";

export interface WorldVisualSelection {
  readonly worldId: CampaignWorldId;
  readonly stateId: string;
  readonly phase: WorldVisualPhase;
  readonly transitionMode?: WorldTransitionMode;
}

export interface DecodedWorldAsset {
  readonly path: string;
  readonly image: HTMLImageElement;
}

/** One decoded image object per world, retained for the complete campaign session. */
export class WorldAssetStore {
  private readonly store: DecodedImageStore;
  private readonly promises = new Map<string, Promise<DecodedWorldAsset>>();

  public constructor(source: DecodedImageStore | (() => HTMLImageElement) = () => new Image()) {
    this.store = source instanceof DecodedImageStore
      ? source
      : new DecodedImageStore({ imageFactory: source });
  }

  public load(path: string): Promise<DecodedWorldAsset> {
    const pending = this.promises.get(path);
    if (pending) return pending;
    const match = /\/world-\d{2}-(.+)\.webp$/u.exec(path);
    const canonicalAssetId = match?.[1] ? `world-${match[1]}` : `world:${path}`;
    const promise = this.store.load(canonicalAssetId, path)
      .then(({ image }) => ({ path, image }))
      .catch((error: unknown) => {
        this.promises.delete(path);
        throw error;
      });
    this.promises.set(path, promise);
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
  private panels: [HTMLImageElement, HTMLImageElement];
  private currentWorldId: CampaignWorldId | null = null;
  private currentStateId = "";
  private requestedAssetPath: string | null = null;
  private currentAsset: DecodedWorldAsset | null = null;
  private pendingAsset: DecodedWorldAsset | null = null;
  private queuedAsset: DecodedWorldAsset | null = null;
  private pendingPanelPrepared = false;
  private transitionMode: WorldTransitionMode = "story-linked";
  private transitionStartDistance = 0;
  private lastDistance = 0;
  private lastParallaxCycle: number | null = null;
  private readonly panelAssignmentRevisions = new WeakMap<HTMLImageElement, number>();

  public constructor(
    private readonly host: HTMLElement,
    private readonly assets = new WorldAssetStore()
  ) {
    host.innerHTML = `
      <div class="amso-world-visual__image-stack" data-world-plate aria-hidden="true">
        <img class="amso-world-visual__panel" data-world-panel="current" alt="" width="1780" height="941" draggable="false" />
        <img class="amso-world-visual__panel" data-world-panel="next" alt="" width="1780" height="941" draggable="false" />
        ${WORLD_ROUTE_SVG}
      </div>
      <div class="amso-world-visual__counter" aria-hidden="true">
        <span data-world-counter>999 970</span>
      </div>
    `;
    this.panels = [
      requiredElement<HTMLImageElement>(host, '[data-world-panel="current"]'),
      requiredElement<HTMLImageElement>(host, '[data-world-panel="next"]')
    ];
    this.host.style.setProperty("--world-overlap", "0px");
  }

  public applyGeometry(snapshot: Readonly<WorldPlateTransform>): void {
    const { x, y, width, height } = snapshot.plateRect;
    const plate = requiredElement<HTMLElement>(this.host, "[data-world-plate]");
    plate.style.left = `${x}px`;
    plate.style.top = `${y}px`;
    plate.style.width = `${width}px`;
    plate.style.height = `${height}px`;
    const route = requiredElement<SVGElement>(plate, ".amso-world-visual__route");
    route.style.left = `${snapshot.worldOffsetX - x}px`;
    route.style.top = `${snapshot.worldOffsetY - y}px`;
    route.style.width = `${WORLD_WIDTH * snapshot.worldScale}px`;
    route.style.height = `${WORLD_HEIGHT * snapshot.worldScale}px`;
    this.host.style.setProperty("--plate-x", `${x}px`);
    this.host.style.setProperty("--plate-y", `${y}px`);
    this.host.style.setProperty("--plate-width", `${width}px`);
    this.host.style.setProperty("--plate-height", `${height}px`);
  }

  public show(selection: WorldVisualSelection): CampaignSceneVisualState {
    const state = sceneVisualState(selection.stateId);
    if (state.worldId !== selection.worldId) {
      throw new Error(`World/state mismatch: ${selection.worldId}/${selection.stateId}`);
    }
    const world = campaignWorld(selection.worldId);
    const worldChanged = this.currentWorldId !== selection.worldId;
    const stateChanged = this.currentStateId !== selection.stateId;
    this.transitionMode = selection.transitionMode ?? "story-linked";
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
      this.loadWorldAsset(world.assetPath);
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

  public get qualityBoundaryState(): { panelBoundarySafe: boolean; assetSwapComplete: boolean } {
    const progress = (this.lastDistance % WORLD_WIDTH) / WORLD_WIDTH;
    return {
      panelBoundarySafe: this.pendingAsset === null && (progress <= 0.001 || progress >= 0.999),
      assetSwapComplete: this.pendingAsset === null && this.queuedAsset === null && !this.pendingPanelPrepared
    };
  }

  public destroy(): void {
    this.requestedAssetPath = null;
    this.currentAsset = null;
    this.pendingAsset = null;
    this.queuedAsset = null;
    this.pendingPanelPrepared = false;
    for (const panel of this.panels) {
      panel.onload = null;
      panel.onerror = null;
      panel.removeAttribute("src");
      panel.remove();
    }
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
      this.setPanelMotion(false);
      this.placePanels((distance % WORLD_WIDTH) / WORLD_WIDTH);
      return;
    }

    if (this.transitionMode === "offscreen") {
      this.setOffscreenParallaxDistance(distance);
      return;
    }

    const cycle = Math.floor(distance / WORLD_WIDTH);
    const wrapped = this.lastParallaxCycle !== null && cycle !== this.lastParallaxCycle;
    this.setPanelMotion(this.lastParallaxCycle !== null && !wrapped);
    this.lastParallaxCycle = cycle;

    if (this.pendingAsset !== null) {
      if (!this.pendingPanelPrepared) {
        this.drawPanel(this.panels[1], this.pendingAsset);
        this.pendingPanelPrepared = true;
      }
      const transition = Math.max(0, (distance - this.transitionStartDistance) / WORLD_WIDTH);
      if (transition >= 1 - Number.EPSILON * 8) {
        this.commitPendingAsset(true);
      } else {
        this.placePanels(Math.min(1, transition));
      }
      return;
    }
    const progress = (distance % WORLD_WIDTH) / WORLD_WIDTH;
    this.placePanels(progress);
  }

  private setOffscreenParallaxDistance(distance: number): void {
    const cycle = Math.floor(distance / WORLD_WIDTH);
    const progress = (distance % WORLD_WIDTH) / WORLD_WIDTH;
    const previousCycle = this.lastParallaxCycle;
    const cycleDelta = previousCycle === null ? 0 : cycle - previousCycle;

    if (previousCycle !== null && cycleDelta !== 0 && cycleDelta !== 1) {
      this.resynchronizePanels(progress);
      this.lastParallaxCycle = cycle;
      return;
    }

    if (cycleDelta === 1) {
      this.recyclePanels();
      this.setPanelMotion(true, false);
      this.placePanels(progress);
      if (this.pendingAsset !== null) {
        if (this.pendingPanelPrepared) {
          this.commitPendingAsset(false);
        } else {
          this.drawPanel(this.panels[1], this.pendingAsset);
          this.pendingPanelPrepared = true;
        }
      }
    } else {
      this.setPanelMotion(previousCycle !== null);
      this.placePanels(progress);
      if (previousCycle === null && progress <= Number.EPSILON * 8 &&
          this.pendingAsset !== null && !this.pendingPanelPrepared) {
        this.drawPanel(this.panels[1], this.pendingAsset);
        this.pendingPanelPrepared = true;
      }
    }
    this.lastParallaxCycle = cycle;
  }

  private placePanels(progress: number): void {
    const travel = progress * 100;
    const currentX = -travel;
    const nextX = 100 - travel;
    this.panels[0].style.transform = `translate3d(${currentX}%, 0, 0)`;
    this.panels[1].style.transform = `translate3d(${nextX}%, 0, 0)`;
  }

  private setPanelMotion(currentSmooth: boolean, nextSmooth = currentSmooth): void {
    void currentSmooth;
    void nextSmooth;
    this.panels[0].style.transition = "none";
    this.panels[1].style.transition = "none";
  }

  private recyclePanels(): void {
    this.panels = [this.panels[1], this.panels[0]];
    this.panels[0].dataset.worldPanel = "current";
    this.panels[1].dataset.worldPanel = "next";
  }

  private resynchronizePanels(progress: number): void {
    this.setPanelMotion(false);
    if (this.currentAsset !== null && this.pendingPanelPrepared) {
      this.drawPanel(this.panels[0], this.currentAsset);
      this.drawPanel(this.panels[1], this.currentAsset);
    }
    if (this.queuedAsset !== null) {
      this.pendingAsset = this.queuedAsset;
      this.queuedAsset = null;
    }
    this.pendingPanelPrepared = false;
    this.placePanels(progress);
  }

  private loadWorldAsset(assetPath: string): void {
    if (this.requestedAssetPath === assetPath) return;
    this.requestedAssetPath = assetPath;
    this.host.dataset.assetState = "loading";
    void this.assets.load(assetPath).then((decodedAsset) => {
      if (this.requestedAssetPath !== assetPath) return;
      if (this.currentAsset === null) {
        this.currentAsset = decodedAsset;
        this.pendingAsset = null;
        this.queuedAsset = null;
        this.pendingPanelPrepared = false;
        this.drawPanel(this.panels[0], decodedAsset);
        this.drawPanel(this.panels[1], decodedAsset);
        this.prepareNextWorld(decodedAsset.path);
      } else if (this.transitionMode === "offscreen" &&
          this.pendingAsset !== null && this.pendingPanelPrepared) {
        this.queuedAsset = decodedAsset.path === this.pendingAsset.path
          ? null
          : decodedAsset;
      } else {
        this.pendingAsset = decodedAsset;
        this.queuedAsset = null;
        this.pendingPanelPrepared = false;
        this.transitionStartDistance = this.lastDistance - this.lastDistance % WORLD_WIDTH;
      }
      this.host.dataset.assetState = "loaded";
    }).catch(() => {
      if (this.requestedAssetPath !== assetPath) return;
      if (this.transitionMode === "offscreen" &&
          this.pendingAsset !== null && this.pendingPanelPrepared) {
        this.queuedAsset = null;
        this.requestedAssetPath = this.pendingAsset.path;
        this.host.dataset.assetState = "loaded";
        return;
      }
      this.pendingAsset = null;
      this.queuedAsset = null;
      this.pendingPanelPrepared = false;
      if (this.currentAsset === null) {
        this.clearPanels();
        this.host.dataset.assetState = "fallback";
      } else {
        this.requestedAssetPath = this.currentAsset.path;
        this.host.dataset.assetState = "loaded";
      }
    });
  }

  private commitPendingAsset(redrawVisiblePanel: boolean): void {
    if (this.pendingAsset === null) return;
    this.currentAsset = this.pendingAsset;
    this.pendingAsset = this.queuedAsset;
    this.queuedAsset = null;
    this.pendingPanelPrepared = false;
    if (redrawVisiblePanel) this.drawPanel(this.panels[0], this.currentAsset);
    this.drawPanel(this.panels[1], this.currentAsset);
    if (redrawVisiblePanel) {
      this.placePanels((this.lastDistance % WORLD_WIDTH) / WORLD_WIDTH);
    }
    this.prepareNextWorld(this.currentAsset.path);
  }

  private prepareNextWorld(assetPath: string): void {
    const index = CAMPAIGN_WORLDS.findIndex(({ assetPath: candidate }) => candidate === assetPath);
    const next = CAMPAIGN_WORLDS[index + 1];
    if (next !== undefined) void this.assets.load(next.assetPath).catch(() => undefined);
  }

  private drawPanel(panel: HTMLImageElement, asset: DecodedWorldAsset): void {
    const assignment = (this.panelAssignmentRevisions.get(panel) ?? 0) + 1;
    this.panelAssignmentRevisions.set(panel, assignment);
    panel.hidden = true;
    panel.width = WORLD_ARTWORK_CONTRACT.artWidth;
    panel.height = WORLD_ARTWORK_CONTRACT.artHeight;
    panel.dataset.assetPath = asset.path;
    panel.src = asset.path;
    void panel.decode().then(() => {
      if (assignment !== this.panelAssignmentRevisions.get(panel) || panel.src !== new URL(asset.path, document.baseURI).href) return;
      panel.hidden = false;
    }).catch(() => {
      if (assignment === this.panelAssignmentRevisions.get(panel)) panel.hidden = true;
    });
  }

  private clearPanels(): void {
    for (const panel of this.panels) {
      panel.removeAttribute("src");
      delete panel.dataset.assetPath;
    }
  }
}
