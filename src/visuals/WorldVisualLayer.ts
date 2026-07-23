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
  private readonly ownsStore: boolean;
  private readonly promises = new Map<string, Promise<DecodedWorldAsset>>();

  public constructor(source: DecodedImageStore | (() => HTMLImageElement) = () => new Image()) {
    this.ownsStore = !(source instanceof DecodedImageStore);
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

  public destroy(): void {
    this.promises.clear();
    if (this.ownsStore) this.store.destroy();
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
  private readonly seamBlur: HTMLElement;
  private currentWorldId: CampaignWorldId | null = null;
  private currentStateId = "";
  private requestedAssetPath: string | null = null;
  private currentAsset: DecodedWorldAsset | null = null;
  private pendingAsset: DecodedWorldAsset | null = null;
  private queuedAsset: DecodedWorldAsset | null = null;
  private pendingFallbackWorldId: CampaignWorldId | null = null;
  private pendingPanelPrepared = false;
  private pendingPanelPreparing = false;
  private transitionMode: WorldTransitionMode = "story-linked";
  private transitionStartDistance = 0;
  private lastDistance = 0;
  private lastParallaxCycle: number | null = null;
  private readonly panelAssignmentRevisions = new WeakMap<HTMLImageElement, number>();
  private scheduledPreloadPath: string | null = null;
  private currentPresentationReady: Promise<void> = Promise.resolve();
  private resolveCurrentPresentation: (() => void) | null = null;
  private rejectCurrentPresentation: ((error: Error) => void) | null = null;

  public constructor(
    private readonly host: HTMLElement,
    private readonly assets = new WorldAssetStore()
  ) {
    host.innerHTML = `
      <div class="amso-world-visual__image-stack" data-world-plate aria-hidden="true">
        <img class="amso-world-visual__panel" data-world-panel="current" alt="" width="1780" height="941" draggable="false" />
        <img class="amso-world-visual__panel" data-world-panel="next" alt="" width="1780" height="941" draggable="false" />
        <div class="amso-world-visual__seam-blur" data-world-seam-blur hidden></div>
        ${WORLD_ROUTE_SVG}
      </div>
      <div class="amso-world-visual__counter" aria-hidden="true">
         <span data-world-counter>999 950</span>
      </div>
    `;
    this.panels = [
      requiredElement<HTMLImageElement>(host, '[data-world-panel="current"]'),
      requiredElement<HTMLImageElement>(host, '[data-world-panel="next"]')
    ];
    this.seamBlur = requiredElement<HTMLElement>(host, "[data-world-seam-blur]");
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

    if (selection.phase === "story") this.setParallaxDistance(0, false);
    if (worldChanged || (this.currentAsset === null && this.requestedAssetPath === null)) {
      this.loadWorldAsset(world.assetPath, selection.phase === "story");
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

  public waitForCurrentPresentation(): Promise<void> {
    return this.currentPresentationReady;
  }

  public get qualityBoundaryState(): { panelBoundarySafe: boolean; assetSwapComplete: boolean } {
    const progress = (this.lastDistance % WORLD_WIDTH) / WORLD_WIDTH;
    return {
      panelBoundarySafe: this.pendingAsset === null && this.pendingFallbackWorldId === null &&
        (progress <= 0.001 || progress >= 0.999),
      assetSwapComplete: this.pendingAsset === null && this.queuedAsset === null &&
        this.pendingFallbackWorldId === null &&
        !this.pendingPanelPrepared && !this.pendingPanelPreparing
    };
  }

  public destroy(): void {
    this.requestedAssetPath = null;
    this.currentAsset = null;
    this.clearPendingTransition();
    this.scheduledPreloadPath = null;
    this.resolveCurrentPresentation = null;
    this.rejectCurrentPresentation = null;
    for (const panel of this.panels) {
      panel.onload = null;
      panel.onerror = null;
      panel.removeAttribute("src");
      panel.remove();
    }
    this.assets.destroy();
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
      if (!this.pendingPanelPrepared) this.preparePendingPanel();
      if (!this.pendingPanelPrepared) {
        this.placePanels((distance % WORLD_WIDTH) / WORLD_WIDTH);
        return;
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
          this.preparePendingPanel();
        }
      } else if (this.pendingFallbackWorldId !== null) {
        if (this.pendingPanelPrepared) {
          this.commitPendingFallback();
        } else {
          this.preparePendingFallback();
        }
      }
    } else {
      this.setPanelMotion(previousCycle !== null);
      this.placePanels(progress);
      if (previousCycle === null && progress <= Number.EPSILON * 8 &&
          this.pendingAsset !== null && !this.pendingPanelPrepared) {
        this.preparePendingPanel();
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
    this.updateSeamBlur(progress);
  }

  private updateSeamBlur(progress: number): void {
    const currentWorldId = this.panels[0].dataset.worldId;
    const nextWorldId = this.panels[1].dataset.worldId;
    const betweenDifferentWorlds = this.transitionMode === "offscreen" &&
      this.host.dataset.phase === "game" &&
      progress > Number.EPSILON * 8 &&
      progress < 1 - Number.EPSILON * 8 &&
      currentWorldId !== undefined &&
      nextWorldId !== undefined &&
      currentWorldId !== nextWorldId;
    this.seamBlur.hidden = !betweenDifferentWorlds;
    if (!betweenDifferentWorlds) {
      delete this.seamBlur.dataset.betweenWorlds;
      return;
    }
    this.seamBlur.style.left = `${(1 - progress) * 100}%`;
    this.seamBlur.dataset.betweenWorlds = `${currentWorldId}:${nextWorldId}`;
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
      void this.drawPanel(this.panels[0], this.currentAsset);
      void this.drawPanel(this.panels[1], this.currentAsset);
    }
    if (this.queuedAsset !== null) {
      this.pendingAsset = this.queuedAsset;
      this.queuedAsset = null;
    }
    this.pendingPanelPrepared = false;
    this.pendingPanelPreparing = false;
    this.placePanels(progress);
  }

  private loadWorldAsset(assetPath: string, immediateStoryPresentation = false): void {
    if (this.requestedAssetPath === assetPath) return;
    this.requestedAssetPath = assetPath;
    this.host.dataset.assetState = "loading";
    if (this.currentAsset === null || immediateStoryPresentation) {
      this.currentPresentationReady = new Promise<void>((resolve, reject) => {
        this.resolveCurrentPresentation = resolve;
        this.rejectCurrentPresentation = reject;
      });
      void this.currentPresentationReady.catch(() => undefined);
    }
    void this.assets.load(assetPath).then((decodedAsset) => {
      if (this.requestedAssetPath !== assetPath) return;
      if (this.currentAsset === null || immediateStoryPresentation) {
        this.currentAsset = decodedAsset;
        this.clearPendingTransition();
        void Promise.all([
          this.drawPanel(this.panels[0], decodedAsset),
          this.drawPanel(this.panels[1], decodedAsset)
        ]).then((ready) => {
          if (this.currentAsset === decodedAsset && ready.every(Boolean)) {
            if (immediateStoryPresentation) this.setParallaxDistance(0, false);
            this.host.dataset.assetState = "loaded";
            this.resolveCurrentPresentation?.();
            this.resolveCurrentPresentation = null;
            this.rejectCurrentPresentation = null;
          } else if (this.currentAsset === decodedAsset) {
            if (immediateStoryPresentation) {
              this.presentImmediateFallback();
            } else {
              this.rejectCurrentPresentation?.(new Error("world_panel_decode_failed"));
              this.resolveCurrentPresentation = null;
              this.rejectCurrentPresentation = null;
            }
          }
        });
        this.prepareNextWorld(decodedAsset.path);
      } else if (this.transitionMode === "offscreen" &&
          this.pendingAsset !== null && this.pendingPanelPrepared) {
        this.queuedAsset = decodedAsset.path === this.pendingAsset.path
          ? null
          : decodedAsset;
      } else {
        this.pendingAsset = decodedAsset;
        this.queuedAsset = null;
        this.pendingFallbackWorldId = null;
        this.pendingPanelPrepared = false;
        this.pendingPanelPreparing = false;
        this.transitionStartDistance = this.lastDistance - this.lastDistance % WORLD_WIDTH;
      }
      if (this.currentAsset !== decodedAsset) this.host.dataset.assetState = "loaded";
    }).catch(() => {
      if (this.requestedAssetPath !== assetPath) return;
      if (this.transitionMode === "offscreen" &&
          this.pendingAsset !== null && this.pendingPanelPrepared) {
        this.queuedAsset = null;
        this.requestedAssetPath = this.pendingAsset.path;
        this.host.dataset.assetState = "loaded";
        return;
      }
      if (this.transitionMode === "offscreen" && this.currentAsset !== null) {
        const failedWorld = CAMPAIGN_WORLDS.find(({ assetPath: path }) => path === assetPath);
        this.clearPendingTransition();
        this.pendingFallbackWorldId = failedWorld?.worldId ?? this.currentWorldId;
        this.host.dataset.assetState = "fallback-pending";
        return;
      }
      this.clearPendingTransition();
      if (this.currentAsset === null || immediateStoryPresentation) {
        if (immediateStoryPresentation) {
          this.presentImmediateFallback();
        } else {
          this.currentAsset = null;
          this.requestedAssetPath = null;
          this.clearPanels();
          this.host.dataset.assetState = "fallback";
          this.rejectCurrentPresentation?.(new Error("world_asset_decode_failed"));
          this.resolveCurrentPresentation = null;
          this.rejectCurrentPresentation = null;
        }
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
    this.pendingPanelPreparing = false;
    if (redrawVisiblePanel) void this.drawPanel(this.panels[0], this.currentAsset);
    void this.drawPanel(this.panels[1], this.currentAsset);
    this.placePanels((this.lastDistance % WORLD_WIDTH) / WORLD_WIDTH);
    this.prepareNextWorld(this.currentAsset.path);
  }

  private prepareNextWorld(assetPath: string): void {
    const index = CAMPAIGN_WORLDS.findIndex(({ assetPath: candidate }) => candidate === assetPath);
    const next = CAMPAIGN_WORLDS[index + 1];
    if (next === undefined || this.scheduledPreloadPath === next.assetPath) return;
    this.scheduledPreloadPath = next.assetPath;
    const run = (): void => {
      if (this.scheduledPreloadPath !== next.assetPath) return;
      void this.assets.load(next.assetPath).catch(() => undefined).finally(() => {
        if (this.scheduledPreloadPath === next.assetPath) this.scheduledPreloadPath = null;
      });
    };
    const view = this.host.ownerDocument.defaultView;
    if (typeof view?.requestIdleCallback === "function") {
      view.requestIdleCallback(() => run());
    } else {
      const runWhenPresentationPaused = (): void => {
        if (this.scheduledPreloadPath !== next.assetPath) return;
        if (this.host.dataset.phase === "game") {
          view?.setTimeout(runWhenPresentationPaused, 250);
          return;
        }
        run();
      };
      view?.setTimeout(runWhenPresentationPaused, 50);
    }
  }

  private preparePendingPanel(): void {
    const asset = this.pendingAsset;
    if (asset === null || this.pendingPanelPrepared) return;
    this.assignDecodedPanel(this.panels[1], asset);
    this.pendingPanelPreparing = false;
    this.pendingPanelPrepared = true;
    this.host.dataset.assetState = "loaded";
    this.updateSeamBlur((this.lastDistance % WORLD_WIDTH) / WORLD_WIDTH);
  }

  private preparePendingFallback(): void {
    const worldId = this.pendingFallbackWorldId;
    if (worldId === null || this.pendingPanelPrepared) return;
    this.assignFallback(this.panels[1], worldId);
    this.pendingPanelPrepared = true;
    this.host.dataset.assetState = "fallback";
    this.updateSeamBlur((this.lastDistance % WORLD_WIDTH) / WORLD_WIDTH);
  }

  private commitPendingFallback(): void {
    const worldId = this.pendingFallbackWorldId;
    if (worldId === null) return;
    this.pendingFallbackWorldId = null;
    this.pendingPanelPrepared = false;
    this.pendingPanelPreparing = false;
    this.assignFallback(this.panels[1], worldId);
    this.host.dataset.assetState = "fallback";
    this.placePanels((this.lastDistance % WORLD_WIDTH) / WORLD_WIDTH);
  }

  private assignFallback(panel: HTMLImageElement, worldId: CampaignWorldId): void {
    this.panelAssignmentRevisions.set(
      panel,
      (this.panelAssignmentRevisions.get(panel) ?? 0) + 1
    );
    panel.removeAttribute("src");
    delete panel.dataset.assetPath;
    panel.dataset.worldId = worldId;
    panel.dataset.assetFallback = "true";
    panel.hidden = false;
  }

  private presentImmediateFallback(): void {
    this.currentAsset = null;
    this.requestedAssetPath = null;
    this.clearPendingTransition();
    const worldId = this.currentWorldId;
    if (worldId !== null) {
      this.assignFallback(this.panels[0], worldId);
      this.assignFallback(this.panels[1], worldId);
    } else {
      this.clearPanels();
    }
    this.setParallaxDistance(0, false);
    this.host.dataset.assetState = "fallback";
    this.resolveCurrentPresentation?.();
    this.resolveCurrentPresentation = null;
    this.rejectCurrentPresentation = null;
  }

  private assignDecodedPanel(panel: HTMLImageElement, asset: DecodedWorldAsset): number {
    const assignment = (this.panelAssignmentRevisions.get(panel) ?? 0) + 1;
    this.panelAssignmentRevisions.set(panel, assignment);
    panel.width = WORLD_ARTWORK_CONTRACT.artWidth;
    panel.height = WORLD_ARTWORK_CONTRACT.artHeight;
    panel.dataset.assetPath = asset.path;
    delete panel.dataset.assetFallback;
    const world = CAMPAIGN_WORLDS.find(({ assetPath }) => assetPath === asset.path);
    if (world) panel.dataset.worldId = world.worldId;
    panel.src = asset.image.currentSrc || asset.image.src || asset.path;
    panel.hidden = false;
    return assignment;
  }

  private async drawPanel(panel: HTMLImageElement, asset: DecodedWorldAsset): Promise<boolean> {
    const assignment = this.assignDecodedPanel(panel, asset);
    panel.hidden = true;
    // Presentation elements intentionally share the canonical source while keeping
    // their own DOM decode readiness; they never create a second retry lifecycle.
    try {
      await panel.decode();
      const expectedSource = new URL(asset.image.currentSrc || asset.image.src || asset.path, document.baseURI).href;
      if (assignment !== this.panelAssignmentRevisions.get(panel) || panel.src !== expectedSource) return false;
      if (asset.image.naturalWidth !== WORLD_ARTWORK_CONTRACT.artWidth ||
          asset.image.naturalHeight !== WORLD_ARTWORK_CONTRACT.artHeight) return false;
      panel.hidden = false;
      return true;
    } catch {
      if (assignment === this.panelAssignmentRevisions.get(panel)) panel.hidden = true;
      return false;
    }
  }

  private clearPanels(): void {
    for (const panel of this.panels) {
      panel.removeAttribute("src");
      delete panel.dataset.assetPath;
      delete panel.dataset.worldId;
      delete panel.dataset.assetFallback;
    }
  }

  private clearPendingTransition(): void {
    this.pendingAsset = null;
    this.queuedAsset = null;
    this.pendingFallbackWorldId = null;
    this.pendingPanelPrepared = false;
    this.pendingPanelPreparing = false;
  }
}
