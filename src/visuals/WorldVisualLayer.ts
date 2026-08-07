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
import type { CampaignI18n } from "../localization";

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
  private readonly terminalFailures = new Set<string>();

  public constructor(source: DecodedImageStore | (() => HTMLImageElement) = () => new Image()) {
    this.ownsStore = !(source instanceof DecodedImageStore);
    this.store = source instanceof DecodedImageStore
      ? source
      : new DecodedImageStore({ imageFactory: source });
  }

  public load(path: string): Promise<DecodedWorldAsset> {
    if (this.terminalFailures.has(path)) {
      return Promise.reject(new Error("world_asset_decode_failed"));
    }
    const pending = this.promises.get(path);
    if (pending) return pending;
    const match = /\/world-\d{2}-(.+)\.webp$/u.exec(path);
    const canonicalAssetId = match?.[1] ? `world-${match[1]}` : `world:${path}`;
    const promise = this.store.load(canonicalAssetId, path)
      .then(({ image }) => ({ path, image }))
      .catch((error: unknown) => {
        this.promises.delete(path);
        this.terminalFailures.add(path);
        throw error;
      });
    this.promises.set(path, promise);
    return promise;
  }

  public async prepareAll(
    paths: readonly string[] = CAMPAIGN_WORLDS.map(({ assetPath }) => assetPath)
  ): Promise<void> {
    for (const path of paths) {
      try {
        await this.load(path);
      } catch {
        // A terminal failure is a ready semantic-fallback state.
      }
    }
  }

  public destroy(): void {
    this.promises.clear();
    this.terminalFailures.clear();
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
  private stagedPanel: HTMLImageElement;
  private readonly seamBlur: HTMLElement;
  private readonly plate: HTMLElement;
  private readonly route: SVGElement;
  private readonly counter: HTMLElement;
  private lastCounterValue: number | null = null;
  private lastPhaseValue = "";
  private lastMotionState = "";
  private lastPhasePixels = "";
  private lastPanelTransforms: [string, string] = ["", ""];
  private seamVisible = false;
  private seamLeft = "";
  private seamWorlds = "";
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
  private scheduledPreloadAsset: DecodedWorldAsset | null = null;
  private preparedPanelAsset: DecodedWorldAsset | null = null;
  private panelPreparationScheduled = false;
  private panelPreparationPath: string | null = null;
  private panelPreparationRevision = 0;
  private idlePreparationLease = false;
  private paused = false;
  private destroyed = false;
  private currentPresentationReady: Promise<void> = Promise.resolve();
  private resolveCurrentPresentation: (() => void) | null = null;
  private rejectCurrentPresentation: ((error: Error) => void) | null = null;

  public constructor(
    private readonly host: HTMLElement,
    private readonly assets = new WorldAssetStore(),
    private readonly i18n?: CampaignI18n
  ) {
    host.innerHTML = `
      <div class="amso-world-visual__image-stack" data-world-plate aria-hidden="true">
        <img class="amso-world-visual__panel" data-world-panel="current" alt="" width="1780" height="941" draggable="false" />
        <img class="amso-world-visual__panel" data-world-panel="next" alt="" width="1780" height="941" draggable="false" />
        <img class="amso-world-visual__panel" data-world-staged-panel alt="" width="1780" height="941" draggable="false" />
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
    this.stagedPanel = requiredElement<HTMLImageElement>(host, "[data-world-staged-panel]");
    this.seamBlur = requiredElement<HTMLElement>(host, "[data-world-seam-blur]");
    this.plate = requiredElement<HTMLElement>(host, "[data-world-plate]");
    this.route = requiredElement<SVGElement>(this.plate, ".amso-world-visual__route");
    this.counter = requiredElement<HTMLElement>(host, "[data-world-counter]");
    this.host.style.setProperty("--world-overlap", "0px");
    this.panels[0].style.transition = "none";
    this.panels[1].style.transition = "none";
    this.stagedPanel.style.transition = "none";
    this.stagedPanel.style.transform = "translate3d(200%, 0, 0)";
  }

  public applyGeometry(snapshot: Readonly<WorldPlateTransform>): void {
    const { x, y, width, height } = snapshot.plateRect;
    this.setStyle(this.plate, "left", `${x}px`);
    this.setStyle(this.plate, "top", `${y}px`);
    this.setStyle(this.plate, "width", `${width}px`);
    this.setStyle(this.plate, "height", `${height}px`);
    this.setStyle(this.route, "left", `${snapshot.worldOffsetX - x}px`);
    this.setStyle(this.route, "top", `${snapshot.worldOffsetY - y}px`);
    this.setStyle(this.route, "width", `${WORLD_WIDTH * snapshot.worldScale}px`);
    this.setStyle(this.route, "height", `${WORLD_HEIGHT * snapshot.worldScale}px`);
    this.setProperty("--plate-x", `${x}px`);
    this.setProperty("--plate-y", `${y}px`);
    this.setProperty("--plate-width", `${width}px`);
    this.setProperty("--plate-height", `${height}px`);
  }

  public show(selection: WorldVisualSelection): CampaignSceneVisualState {
    const state = sceneVisualState(selection.stateId);
    if (state.worldId !== selection.worldId) {
      throw new Error(`World/state mismatch: ${selection.worldId}/${selection.stateId}`);
    }
    const world = campaignWorld(selection.worldId);
    const worldChanged = this.currentWorldId !== selection.worldId;
    const stateChanged = this.currentStateId !== selection.stateId;
    const phaseChanged = this.lastPhaseValue !== selection.phase;
    this.transitionMode = selection.transitionMode ?? "story-linked";
    this.currentWorldId = selection.worldId;
    this.currentStateId = selection.stateId;

    this.setDataset("worldId", selection.worldId);
    this.setDataset("stateId", selection.stateId);
    this.setDataset("phase", selection.phase);
    this.lastPhaseValue = selection.phase;
    this.setDataset("copyPlacement", state.copyPlacement);
    this.setProperty("--world-position-portrait", state.crops.portrait);
    this.setProperty("--world-position-landscape", state.crops.landscape);
    this.setProperty("--world-position-desktop", state.crops.desktop);
    this.setProperty("--world-reading-zoom", String(state.readingCamera.zoom));
    this.setProperty("--world-game-zoom", String(state.gameCamera.zoom));
    this.setProperty("--world-reading-origin-x", `${state.readingCamera.x * 100}%`);
    this.setProperty("--world-reading-origin-y", `${state.readingCamera.y * 100}%`);

    if (selection.phase === "story") this.setParallaxDistance(0, false);
    if (worldChanged || (this.currentAsset === null && this.requestedAssetPath === null)) {
      this.loadWorldAsset(world.assetPath, selection.phase === "story");
    }
    if (worldChanged || stateChanged) {
      this.setDataset("reveal", state.revealMotion);
      this.setDataset("visualEvent", state.visualEvent);
    }
    if (phaseChanged) this.resumePanelPreparation();
    return state;
  }

  public setCounterValue(value: number): void {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    if (safeValue === this.lastCounterValue) return;
    this.lastCounterValue = safeValue;
    const text = (this.i18n?.formatInteger(safeValue) ?? safeValue.toLocaleString("pl-PL"))
      .replace(/[\u00a0\u202f]/gu, " ");
    if (this.counter.textContent !== text) this.counter.textContent = text;
  }

  public setPhase(phase: WorldVisualPhase): void {
    if (phase === this.lastPhaseValue) return;
    this.lastPhaseValue = phase;
    this.host.dataset.phase = phase;
    this.resumePanelPreparation();
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    this.setDataset("paused", String(paused));
    this.resumePanelPreparation();
  }

  public async prepareChallengeWorlds(): Promise<void> {
    await this.currentPresentationReady.catch(() => undefined);
    if (this.destroyed) return;
    const currentPath = this.currentAsset?.path ?? (this.currentWorldId === null
      ? CAMPAIGN_WORLDS[0]?.assetPath
      : campaignWorld(this.currentWorldId).assetPath);
    const currentIndex = CAMPAIGN_WORLDS.findIndex(({ assetPath }) =>
      assetPath === currentPath);
    const next = CAMPAIGN_WORLDS[(Math.max(0, currentIndex) + 1) % CAMPAIGN_WORLDS.length];
    if (next === undefined) return;
    try {
      const asset = await this.assets.load(next.assetPath);
      if (this.destroyed || !this.isPanelPreparationSafe()) return;
      const ready = await this.drawPrecompositedPanelPair(asset);
      if (!ready || this.destroyed) return;
      this.preparedPanelAsset = asset;
      if (this.scheduledPreloadPath === asset.path) {
        this.scheduledPreloadPath = null;
        this.scheduledPreloadAsset = null;
      }
      this.prepareNextWorld(asset.path);
    } catch {
      // Terminal optional-image failure is a ready semantic-fallback state.
    }
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
    this.destroyed = true;
    this.requestedAssetPath = null;
    this.currentAsset = null;
    this.clearPendingTransition();
    this.scheduledPreloadPath = null;
    this.scheduledPreloadAsset = null;
    this.preparedPanelAsset = null;
    this.idlePreparationLease = false;
    this.panelPreparationRevision += 1;
    this.resolveCurrentPresentation = null;
    this.rejectCurrentPresentation = null;
    for (const panel of [...this.panels, this.stagedPanel]) {
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
    const phasePixels = `${distance}px`;
    if (phasePixels !== this.lastPhasePixels) {
      this.lastPhasePixels = phasePixels;
      this.host.style.setProperty("--world-phase-px", phasePixels);
    }
    const motionState = active ? "moving" : "reading";
    if (motionState !== this.lastMotionState) {
      this.lastMotionState = motionState;
      this.host.dataset.motionState = motionState;
    }

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
        this.promotePreparedPanels();
        this.commitPendingAsset();
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
      const preparedAssetSwap = this.pendingAsset !== null && this.pendingPanelPrepared;
      const preparedFallbackSwap = this.pendingFallbackWorldId !== null &&
        this.pendingPanelPrepared;
      if (preparedAssetSwap || preparedFallbackSwap) {
        this.promotePreparedPanels();
      } else {
        this.recyclePanels();
      }
      this.setPanelMotion(true, false);
      this.placePanels(progress);
      if (this.pendingAsset !== null) {
        if (this.pendingPanelPrepared) {
          this.commitPendingAsset();
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
    const currentTransform = `translate3d(${currentX}%, 0, 0)`;
    const nextTransform = `translate3d(${nextX}%, 0, 0)`;
    if (currentTransform !== this.lastPanelTransforms[0]) {
      this.panels[0].style.transform = currentTransform;
      this.lastPanelTransforms[0] = currentTransform;
    }
    if (nextTransform !== this.lastPanelTransforms[1]) {
      this.panels[1].style.transform = nextTransform;
      this.lastPanelTransforms[1] = nextTransform;
    }
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
    if (this.seamVisible !== betweenDifferentWorlds) {
      this.seamVisible = betweenDifferentWorlds;
      this.seamBlur.hidden = !betweenDifferentWorlds;
    }
    if (!betweenDifferentWorlds) {
      if (this.seamWorlds !== "") {
        this.seamWorlds = "";
        delete this.seamBlur.dataset.betweenWorlds;
      }
      return;
    }
    const left = `${(1 - progress) * 100}%`;
    if (left !== this.seamLeft) {
      this.seamLeft = left;
      this.seamBlur.style.left = left;
    }
    const worlds = `${currentWorldId}:${nextWorldId}`;
    if (worlds !== this.seamWorlds) {
      this.seamWorlds = worlds;
      this.seamBlur.dataset.betweenWorlds = worlds;
    }
  }

  private setPanelMotion(currentSmooth: boolean, nextSmooth = currentSmooth): void {
    void currentSmooth;
    void nextSmooth;
  }

  private recyclePanels(): void {
    this.panels = [this.panels[1], this.panels[0]];
    this.lastPanelTransforms = [
      this.panels[0].style.transform,
      this.panels[1].style.transform
    ];
    this.panels[0].dataset.worldPanel = "current";
    this.panels[1].dataset.worldPanel = "next";
  }

  private promotePreparedPanels(): void {
    const previousCurrent = this.panels[0];
    const preparedCurrent = this.panels[1];
    const preparedNext = this.stagedPanel;
    this.panels = [preparedCurrent, preparedNext];
    this.stagedPanel = previousCurrent;
    delete preparedNext.dataset.worldStagedPanel;
    preparedCurrent.dataset.worldPanel = "current";
    preparedNext.dataset.worldPanel = "next";
    preparedNext.style.willChange = "transform";
    delete previousCurrent.dataset.worldPanel;
    previousCurrent.dataset.worldStagedPanel = "";
    previousCurrent.style.transition = "none";
    previousCurrent.style.transform = "translate3d(200%, 0, 0)";
    previousCurrent.style.willChange = "auto";
    previousCurrent.hidden = true;
    this.lastPanelTransforms = [
      preparedCurrent.style.transform,
      preparedNext.style.transform
    ];
  }

  private resynchronizePanels(progress: number): void {
    this.setPanelMotion(false);
    if (this.pendingAsset !== null && this.pendingPanelPrepared) {
      this.promotePreparedPanels();
      this.commitPendingAsset();
    } else if (this.pendingFallbackWorldId !== null && this.pendingPanelPrepared) {
      this.promotePreparedPanels();
      this.commitPendingFallback();
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
        this.clearPreparedPanel();
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
        this.pendingPanelPrepared = this.preparedPanelAsset?.path === decodedAsset.path &&
          this.preparedPanelsMatch(decodedAsset.path);
        if (this.pendingPanelPrepared) this.preparedPanelAsset = null;
        this.pendingPanelPreparing = false;
        this.transitionStartDistance = this.lastDistance - this.lastDistance % WORLD_WIDTH;
        this.resumePanelPreparation();
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

  private commitPendingAsset(): void {
    if (this.pendingAsset === null) return;
    this.currentAsset = this.pendingAsset;
    this.pendingAsset = this.queuedAsset;
    this.queuedAsset = null;
    this.pendingPanelPrepared = false;
    this.pendingPanelPreparing = false;
    this.placePanels((this.lastDistance % WORLD_WIDTH) / WORLD_WIDTH);
    this.prepareNextWorld(this.currentAsset.path);
  }

  private prepareNextWorld(assetPath: string): void {
    const index = CAMPAIGN_WORLDS.findIndex(({ assetPath: candidate }) => candidate === assetPath);
    if (index < 0) return;
    const next = CAMPAIGN_WORLDS[(index + 1) % CAMPAIGN_WORLDS.length];
    if (next === undefined || this.preparedPanelAsset?.path === next.assetPath ||
        this.scheduledPreloadPath === next.assetPath) {
      if (this.scheduledPreloadPath === next?.assetPath) this.schedulePreparedPanelWork();
      return;
    }
    this.scheduledPreloadPath = next.assetPath;
    this.scheduledPreloadAsset = null;
    this.schedulePreparedPanelWork();
  }

  private schedulePreparedPanelWork(): void {
    if (this.host.dataset.phase === "landing") return;
    const view = this.host.ownerDocument.defaultView;
    const requestIdle = view?.requestIdleCallback;
    const activeGameplay = this.host.dataset.phase === "game" && !this.paused;
    if (this.destroyed || (activeGameplay && typeof requestIdle !== "function") ||
        this.scheduledPreloadPath === null || this.panelPreparationScheduled ||
        this.panelPreparationPath !== null) return;
    if (this.scheduledPreloadAsset !== null && !activeGameplay) {
      this.prepareScheduledPanel();
      return;
    }
    this.panelPreparationScheduled = true;
    const path = this.scheduledPreloadPath;
    const run = (): void => {
      this.panelPreparationScheduled = false;
      if (this.destroyed) return;
      const needsIdleLease = this.host.dataset.phase === "game" && !this.paused;
      this.idlePreparationLease = needsIdleLease;
      const preloadOnly = this.preparedPanelAsset !== null;
      if (this.scheduledPreloadPath !== path) {
        this.idlePreparationLease = false;
        this.schedulePreparedPanelWork();
        return;
      }
      void this.assets.load(path).then((asset) => {
        if (this.destroyed || this.scheduledPreloadPath !== path) {
          this.idlePreparationLease = false;
          return;
        }
        this.scheduledPreloadAsset = asset;
        if (preloadOnly) {
          this.idlePreparationLease = false;
          return;
        }
        this.prepareScheduledPanel();
      }).catch(() => {
        this.idlePreparationLease = false;
        if (this.scheduledPreloadPath === path) {
          this.scheduledPreloadPath = null;
          this.scheduledPreloadAsset = null;
        }
      });
    };
    if (typeof requestIdle === "function") {
      requestIdle(run, { timeout: 1_500 });
    } else {
      view?.setTimeout(run, 50);
    }
  }

  private prepareScheduledPanel(): void {
    const asset = this.scheduledPreloadAsset;
    if (asset === null || !this.isPanelPreparationSafe() || this.panelPreparationPath !== null) {
      this.idlePreparationLease = false;
      return;
    }
    if (this.preparedPanelAsset !== null) {
      this.idlePreparationLease = false;
      return;
    }
    const revision = ++this.panelPreparationRevision;
    this.panelPreparationPath = asset.path;
    void this.drawPrecompositedPanelPair(asset).then((ready) => {
      if (revision !== this.panelPreparationRevision) {
        this.idlePreparationLease = false;
        return;
      }
      this.panelPreparationPath = null;
      if (ready && this.scheduledPreloadPath === asset.path) {
        this.preparedPanelAsset = asset;
        this.scheduledPreloadPath = null;
        this.scheduledPreloadAsset = null;
      } else if (!ready && this.isPanelPreparationSafe() &&
          (this.panels[1].dataset.assetPath === asset.path ||
            this.stagedPanel.dataset.assetPath === asset.path)) {
        this.scheduledPreloadPath = null;
        this.scheduledPreloadAsset = null;
      } else if (this.isPanelPreparationSafe()) {
        this.schedulePreparedPanelWork();
      }
      this.idlePreparationLease = false;
      this.resumePanelPreparation();
    });
  }

  private resumePanelPreparation(): void {
    if (!this.isPanelPreparationSafe()) {
      this.schedulePreparedPanelWork();
      return;
    }
    if (this.pendingFallbackWorldId !== null) {
      this.preparePendingFallback();
      return;
    }
    if (this.pendingAsset !== null && !this.pendingPanelPrepared) {
      this.preparePendingPanel();
      return;
    }
    this.schedulePreparedPanelWork();
  }

  private isPanelPreparationSafe(): boolean {
    return this.host.dataset.phase !== "game" || this.paused || this.idlePreparationLease;
  }

  private async drawPrecompositedPanel(
    panel: HTMLImageElement,
    asset: DecodedWorldAsset
  ): Promise<boolean> {
    if (!this.isPanelPreparationSafe()) return false;
    panel.style.willChange = "transform";
    const assignment = this.assignDecodedPanel(panel, asset);
    panel.hidden = true;
    try {
      await panel.decode();
      if (!this.isPanelAssignmentCurrent(panel, asset, assignment) ||
          !this.isPanelPreparationSafe()) return false;
      panel.hidden = false;
      panel.getBoundingClientRect();
      await this.waitForCompositeFrame();
      if (!this.isPanelAssignmentCurrent(panel, asset, assignment) ||
          !this.isPanelPreparationSafe()) {
        if (assignment === this.panelAssignmentRevisions.get(panel)) panel.hidden = true;
        return false;
      }
      await this.waitForCompositeFrame();
      if (!this.isPanelAssignmentCurrent(panel, asset, assignment) ||
          !this.isPanelPreparationSafe()) {
        if (assignment === this.panelAssignmentRevisions.get(panel)) panel.hidden = true;
        return false;
      }
      panel.dataset.presentationReady = "true";
      return true;
    } catch {
      if (assignment === this.panelAssignmentRevisions.get(panel)) panel.hidden = true;
      return false;
    }
  }

  private async drawPrecompositedPanelPair(asset: DecodedWorldAsset): Promise<boolean> {
    if (!await this.drawPrecompositedPanel(this.stagedPanel, asset)) return false;
    return this.drawPrecompositedPanel(this.panels[1], asset);
  }

  private preparedPanelsMatch(assetPath: string): boolean {
    return this.panels[1].dataset.assetPath === assetPath && !this.panels[1].hidden &&
      this.stagedPanel.dataset.assetPath === assetPath && !this.stagedPanel.hidden;
  }

  private waitForCompositeFrame(): Promise<void> {
    const view = this.host.ownerDocument.defaultView;
    return new Promise((resolve) => {
      if (typeof view?.requestAnimationFrame === "function") {
        view.requestAnimationFrame(() => resolve());
      } else {
        view?.setTimeout(resolve, 0);
      }
    });
  }

  private isPanelAssignmentCurrent(
    panel: HTMLImageElement,
    asset: DecodedWorldAsset,
    assignment: number
  ): boolean {
    const expectedSource = new URL(
      asset.image.currentSrc || asset.image.src || asset.path,
      this.host.ownerDocument.baseURI
    ).href;
    return assignment === this.panelAssignmentRevisions.get(panel) &&
      panel.src === expectedSource &&
      asset.image.naturalWidth === WORLD_ARTWORK_CONTRACT.artWidth &&
      asset.image.naturalHeight === WORLD_ARTWORK_CONTRACT.artHeight;
  }

  private clearPreparedPanel(): void {
    this.preparedPanelAsset = null;
    this.scheduledPreloadPath = null;
    this.scheduledPreloadAsset = null;
    this.panelPreparationPath = null;
    this.panelPreparationRevision += 1;
    this.idlePreparationLease = false;
  }

  private setProperty(name: string, value: string): void {
    if (this.host.style.getPropertyValue(name) !== value) {
      this.host.style.setProperty(name, value);
    }
  }

  private setDataset(name: string, value: string): void {
    if (this.host.dataset[name] !== value) this.host.dataset[name] = value;
  }

  private setStyle(element: HTMLElement | SVGElement, name: string, value: string): void {
    if (element.style.getPropertyValue(name) !== value) {
      element.style.setProperty(name, value);
    }
  }

  private preparePendingPanel(): void {
    const asset = this.pendingAsset;
    if (asset === null || this.pendingPanelPrepared || this.pendingPanelPreparing ||
        !this.isPanelPreparationSafe() || this.panelPreparationPath !== null) return;
    const revision = ++this.panelPreparationRevision;
    this.panelPreparationPath = asset.path;
    this.pendingPanelPreparing = true;
    void this.drawPrecompositedPanelPair(asset).then((ready) => {
      if (revision !== this.panelPreparationRevision) return;
      this.panelPreparationPath = null;
      this.pendingPanelPreparing = false;
      if (this.pendingAsset !== asset) {
        this.resumePanelPreparation();
        return;
      }
      this.pendingPanelPrepared = ready;
      if (ready) {
        this.preparedPanelAsset = null;
        if (this.scheduledPreloadPath === asset.path) {
          this.scheduledPreloadPath = null;
          this.scheduledPreloadAsset = null;
        }
        this.host.dataset.assetState = "loaded";
        this.updateSeamBlur((this.lastDistance % WORLD_WIDTH) / WORLD_WIDTH);
      } else if (this.isPanelPreparationSafe() &&
          (this.panels[1].dataset.assetPath === asset.path ||
            this.stagedPanel.dataset.assetPath === asset.path)) {
        const failedWorld = CAMPAIGN_WORLDS.find(({ assetPath }) => assetPath === asset.path);
        this.pendingAsset = null;
        this.pendingFallbackWorldId = failedWorld?.worldId ?? this.currentWorldId;
        this.host.dataset.assetState = "fallback-pending";
      }
      this.resumePanelPreparation();
    });
  }

  private preparePendingFallback(): void {
    const worldId = this.pendingFallbackWorldId;
    if (worldId === null || this.pendingPanelPrepared || !this.isPanelPreparationSafe()) return;
    this.assignFallback(this.panels[1], worldId);
    this.assignFallback(this.stagedPanel, worldId);
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
    delete panel.dataset.presentationReady;
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
      this.assignFallback(this.stagedPanel, worldId);
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
    delete panel.dataset.presentationReady;
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
      if (!this.isPanelAssignmentCurrent(panel, asset, assignment)) return false;
      panel.hidden = false;
      return true;
    } catch {
      if (assignment === this.panelAssignmentRevisions.get(panel)) panel.hidden = true;
      return false;
    }
  }

  private clearPanels(): void {
    for (const panel of [...this.panels, this.stagedPanel]) {
      panel.removeAttribute("src");
      delete panel.dataset.assetPath;
      delete panel.dataset.worldId;
      delete panel.dataset.assetFallback;
      delete panel.dataset.presentationReady;
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
