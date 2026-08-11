// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BACKGROUND_PARALLAX_SPEED_RATIO,
  REDUCED_MOTION_PARALLAX_RATIO,
  backgroundTravelPixels
} from "../src/visuals/background-parallax";
import {
  WorldAssetStore,
  WorldVisualLayer,
  type WorldVisualSelection
} from "../src/visuals/WorldVisualLayer";
import { DecodedImageStore } from "../src/assets/DecodedImageStore";
import {
  CHALLENGE_WORLD_STATES,
  campaignWorld,
  sceneVisualState
} from "../src/visuals/scene-manifest";
import { WORLD_WIDTH } from "../src/game/constants";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import { parseRunnerConfig } from "../src/config/schema";
import { RunnerGame } from "../src/game/RunnerGame";
import { WORLD_ARTWORK_CONTRACT, calculateWorldPlateTransform } from "../src/visuals/world-plate-transform";

const CHALLENGE_WORLD_PAIRS = CHALLENGE_WORLD_STATES.map((stateId, index) => [
  stateId,
  CHALLENGE_WORLD_STATES[(index + 1) % CHALLENGE_WORLD_STATES.length]!
] as const);

function panelXPercent(panel: HTMLElement): number {
  return Number(/translate3d\((-?[\d.]+)%/u.exec(panel.style.transform)?.[1]);
}

function expectPanelsCoverStage(panels: readonly HTMLImageElement[]): void {
  const positions = panels.map(panelXPercent);
  expect(panels.every(({ hidden }) => !hidden)).toBe(true);
  expect(positions.every(Number.isFinite)).toBe(true);
  expect(positions[0]!).toBeLessThanOrEqual(0);
  expect(positions[0]! + 100).toBeGreaterThanOrEqual(positions[1]!);
  expect(positions[1]! + 100).toBeGreaterThanOrEqual(100);
}

function deterministicGameHarness(): {
  readonly game: RunnerGame;
  advanceFrames(count: number, beforeFrame?: (frame: number) => void): void;
} {
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrameId = 0;
  let timestamp = 0;
  const view = {
    devicePixelRatio: 1,
    requestAnimationFrame(callback: FrameRequestCallback): number {
      const id = ++nextFrameId;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id: number): void { frames.delete(id); },
    addEventListener(): void {},
    removeEventListener(): void {},
    matchMedia: () => ({ matches: false, addEventListener(): void {}, removeEventListener(): void {} })
  };
  const documentMock = {
    defaultView: view,
    visibilityState: "visible" as DocumentVisibilityState,
    addEventListener(): void {},
    removeEventListener(): void {}
  };
  const context = new Proxy({
    createLinearGradient: () => ({ addColorStop(): void {} })
  } as Record<PropertyKey, unknown>, {
    get(target, key) { return key in target ? target[key] : (): void => {}; },
    set(target, key, value) { target[key] = value; return true; }
  }) as unknown as CanvasRenderingContext2D;
  const canvas = {
    width: 960,
    height: 540,
    style: { width: "", height: "" },
    ownerDocument: documentMock,
    getContext: () => context,
    getBoundingClientRect: () => { throw new Error("gameplay_dom_read"); }
  } as unknown as HTMLCanvasElement;
  const config = parseRunnerConfig(productionConfig);
  if (!config) throw new Error("production config should parse");
  const game = new RunnerGame(canvas, {
    onSnapshot(): void {},
    onGameOver(): void {},
    onStoryUpdate(): void {},
    onModeChange(): void {}
  }, {
    seed: 7,
    reducedMotion: true,
    mode: "challenge",
    story: config.story,
    challenge: config.challenge
  });
  game.applyGeometry(
    calculateWorldPlateTransform(960, 540, WORLD_ARTWORK_CONTRACT)!,
    { width: 960, height: 540, dpr: 1 }
  );
  return {
    game,
    advanceFrames(count, beforeFrame) {
      for (let frame = 0; frame < count && game.state === "running"; frame += 1) {
        const entry = frames.entries().next().value as [number, FrameRequestCallback] | undefined;
        if (!entry) break;
        frames.delete(entry[0]);
        beforeFrame?.(frame);
        timestamp += 1000 / 60;
        entry[1](timestamp);
      }
    }
  };
}

function imageHarness(): {
  store: WorldAssetStore;
  images: HTMLImageElement[];
} {
  const images: HTMLImageElement[] = [];
  class ControlledImage extends EventTarget {
    public onload: ((event: Event) => unknown) | null = null;
    public onerror: ((event: Event) => unknown) | null = null;
    public src = "";
    public complete = false;
    public naturalWidth = 0;
    private resolveDecode: (() => void) | null = null;
    private rejectDecode: ((error: Error) => void) | null = null;
    public decode = vi.fn(() => new Promise<void>((resolve, reject) => {
      this.resolveDecode = resolve;
      this.rejectDecode = reject;
    }));

    public override dispatchEvent(event: Event): boolean {
      if (event.type === "load") {
        this.complete = true;
        this.naturalWidth = 1780;
        Object.defineProperty(this, "naturalHeight", { configurable: true, value: 941 });
        this.resolveDecode?.();
        this.onload?.(event);
      }
      if (event.type === "error") {
        this.rejectDecode?.(new Error("world_asset_decode_failed"));
        this.onerror?.(event);
      }
      return super.dispatchEvent(event);
    }
  }
  return {
    images,
    store: new WorldAssetStore(() => {
      const image = new ControlledImage() as unknown as HTMLImageElement;
      images.push(image);
      return image;
    })
  };
}

describe("mobile-safe world assets", () => {
  it("labels a decoded image with its canonical performance attribution", async () => {
    const image = document.createElement("img");
    Object.defineProperties(image, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 1780 }
    });
    image.decode = vi.fn().mockResolvedValue(undefined);
    const store = new DecodedImageStore({ imageFactory: () => image });

    await store.load(
      "world-quality-service-v2",
      "/assets/milion-runner/worlds/world-03-quality-service-v2.webp"
    );

    expect(image.dataset.assetId).toBe("world-quality-service-v2");
  });

  it("decodes one resource per world and reuses it", async () => {
    const { store, images } = imageHarness();
    const first = store.load("data:image/webp;base64,AAA");
    const second = store.load("data:image/webp;base64,AAA");
    expect(images).toHaveLength(1);
    images[0]!.dispatchEvent(new Event("load"));

    await expect(first).resolves.toMatchObject({ path: "data:image/webp;base64,AAA" });
    await expect(second).resolves.toMatchObject({ path: "data:image/webp;base64,AAA" });
    expect(images[0]!.decode).toHaveBeenCalledOnce();
  });

  it("retries one decode failure and then exposes a local fallback", async () => {
    const { store, images } = imageHarness();
    const loading = store.load("data:image/webp;base64,BBB");
    images[0]!.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(images[0]!.decode).toHaveBeenCalledTimes(2));
    images[0]!.dispatchEvent(new Event("load"));
    await expect(loading).resolves.toMatchObject({ path: "data:image/webp;base64,BBB" });

    const failed = store.load("data:image/webp;base64,CCC");
    images[1]!.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(images[1]!.decode).toHaveBeenCalledTimes(2));
    images[1]!.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(images[1]!.decode).toHaveBeenCalledTimes(3));
    images[1]!.dispatchEvent(new Event("error"));
    await expect(failed).rejects.toThrow("world_asset_decode_failed");
  });

  it("retains every decoded world for the complete session", async () => {
    const { store, images } = imageHarness();
    const paths = Array.from({ length: 7 }, (_, index) => `world-${index + 1}.webp`);
    for (const [index, path] of paths.entries()) {
      const loading = store.load(path);
      images[index]!.dispatchEvent(new Event("load"));
      await loading;
    }

    await store.load(paths[0]!);
    expect(images).toHaveLength(7);
  });

  it("prepares challenge worlds sequentially and caches terminal fallback readiness", async () => {
    const { store, images } = imageHarness();
    const preparing = store.prepareAll(["world-a.webp", "world-b.webp"]);

    expect(images).toHaveLength(1);
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(images).toHaveLength(2));
    images[1]!.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(images[1]!.decode).toHaveBeenCalledTimes(2));
    images[1]!.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(images[1]!.decode).toHaveBeenCalledTimes(3));
    images[1]!.dispatchEvent(new Event("error"));
    await preparing;

    await expect(store.load("world-b.webp")).rejects.toThrow(
      "world_asset_decode_failed"
    );
    expect(images).toHaveLength(2);
  });
});

describe("edge-to-edge gameplay background", () => {
  beforeEach(() => {
    vi.spyOn(HTMLImageElement.prototype, "decode").mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  it("moves at exactly ten percent of gameplay travel", () => {
    expect(BACKGROUND_PARALLAX_SPEED_RATIO).toBe(0.1);
    expect(backgroundTravelPixels(2_400)).toBe(240);
  });

  it("does not repeat stable counter, motion, or phase writes", async () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    layer.setCounterValue(999_950);
    layer.setParallaxDistance(240, true);
    const mutations: MutationRecord[] = [];
    const observer = new MutationObserver((records) => mutations.push(...records));
    observer.observe(host, {
      subtree: true,
      attributes: true,
      characterData: true,
      childList: true
    });

    layer.setCounterValue(999_950);
    layer.setParallaxDistance(240, true);
    await Promise.resolve();

    expect(mutations).toEqual([]);
    observer.disconnect();
  });

  it("prepares only the current and next challenge world before gameplay", async () => {
    const images: HTMLImageElement[] = [];
    const store = new WorldAssetStore(() => {
      const image = new Image();
      Object.defineProperties(image, {
        complete: { configurable: true, value: true },
        naturalWidth: { configurable: true, value: 1780 },
        naturalHeight: { configurable: true, value: 941 }
      });
      image.decode = vi.fn().mockResolvedValue(undefined);
      images.push(image);
      return image;
    });
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "landing"
    });
    await layer.waitForCurrentPresentation();

    await layer.prepareChallengeWorlds();

    expect(images.map(({ src }) => src.match(/world-\d{2}/u)?.[0])).toEqual([
      "world-01",
      "world-02"
    ]);
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
      ?.dataset.presentationReady).toBe("true");
    expect(host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
      ?.dataset.assetPath).toContain("world-02-order-process");
  });

  it("prepares the next challenge world's semantic fallback before gameplay", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "landing"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await layer.waitForCurrentPresentation();

    const preparing = layer.prepareChallengeWorlds();
    await vi.waitFor(() => expect(images).toHaveLength(2));
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      images[1]!.dispatchEvent(new Event("error"));
      if (attempt < 3) {
        await vi.waitFor(() => expect(images[1]!.decode).toHaveBeenCalledTimes(attempt + 1));
      }
    }
    await preparing;
    expect([...host.querySelectorAll<HTMLImageElement>("[data-world-panel], [data-world-staged-panel]")]
      .filter(({ dataset }) => dataset.worldId === "order-process")
      .every(({ dataset }) => dataset.assetFallback === "true")).toBe(true);

    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    layer.show({
      worldId: "order-process",
      stateId: "epoch_1.challenge",
      phase: "game",
      transitionMode: "offscreen"
    });
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("fallback-pending"));
    layer.setParallaxDistance(240, true);
    layer.setParallaxDistance(961, true);
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="current"]')
      ?.dataset.assetFallback).toBe("true");
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="current"]')
      ?.dataset.worldId).toBe("order-process");
  });

  it("continues the one-world warmup queue in an active idle budget", async () => {
    const idleCallbacks: IdleRequestCallback[] = [];
    vi.stubGlobal("requestIdleCallback", vi.fn((callback: IdleRequestCallback) => {
      idleCallbacks.push(callback);
      return idleCallbacks.length;
    }));
    const images: HTMLImageElement[] = [];
    const store = new WorldAssetStore(() => {
      const image = new Image();
      Object.defineProperties(image, {
        complete: { configurable: true, value: true },
        naturalWidth: { configurable: true, value: 1780 },
        naturalHeight: { configurable: true, value: 941 }
      });
      image.decode = vi.fn().mockResolvedValue(undefined);
      images.push(image);
      return image;
    });
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "landing"
    });
    await layer.waitForCurrentPresentation();
    await layer.prepareChallengeWorlds();
    expect(idleCallbacks).toHaveLength(0);

    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    await vi.waitFor(() => expect(idleCallbacks).toHaveLength(1), { timeout: 1_500 });
    idleCallbacks.shift()?.({ didTimeout: false, timeRemaining: () => 0 });
    await Promise.resolve();
    expect(images).toHaveLength(2);
    expect(idleCallbacks).toHaveLength(0);
    await vi.waitFor(() => expect(idleCallbacks).toHaveLength(1));
    idleCallbacks.shift()?.({ didTimeout: false, timeRemaining: () => 0 });
    await vi.waitFor(() => expect(idleCallbacks).toHaveLength(1));
    idleCallbacks.shift()?.({ didTimeout: false, timeRemaining: () => 50 });
    await vi.waitFor(() => expect(images).toHaveLength(3));
    expect(host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
      ?.dataset.assetPath).toContain("world-02-order-process");

    layer.show({
      worldId: "order-process",
      stateId: "epoch_1.challenge",
      phase: "game",
      transitionMode: "offscreen"
    });
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(240, true);
    layer.setParallaxDistance(961, true);
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="current"]')
      ?.dataset.worldId).toBe("order-process");
    const decodeCountAtSeam = images.reduce((count, image) =>
      count + vi.mocked(image.decode).mock.calls.length, 0);
    idleCallbacks.shift()?.({ didTimeout: false, timeRemaining: () => 50 });
    await Promise.resolve();
    expect(images.reduce((count, image) =>
      count + vi.mocked(image.decode).mock.calls.length, 0)).toBe(decodeCountAtSeam);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 500));
    expect(images.reduce((count, image) =>
      count + vi.mocked(image.decode).mock.calls.length, 0)).toBe(decodeCountAtSeam);

    for (let stage = 0; stage < 16 &&
        !(host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
          ?.dataset.assetPath?.includes("world-03-quality-service") &&
          host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
            ?.dataset.presentationReady === "true"); stage += 1) {
      await vi.waitFor(() => expect(idleCallbacks.length).toBeGreaterThan(0));
      idleCallbacks.shift()?.({ didTimeout: false, timeRemaining: () => 50 });
      await Promise.resolve();
      await Promise.resolve();
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    }
    await vi.waitFor(() => {
      expect(host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
        ?.dataset.assetPath).toContain("world-03-quality-service");
      expect(host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
        ?.dataset.presentationReady).toBe("true");
    });
  });

  it("continues DOM preparation through short active idle budgets", async () => {
    const idleCallbacks: IdleRequestCallback[] = [];
    const idleOptions: (IdleRequestOptions | undefined)[] = [];
    const compositeFrames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestIdleCallback", vi.fn((callback: IdleRequestCallback,
      options?: IdleRequestOptions) => {
      idleCallbacks.push(callback);
      idleOptions.push(options);
      return idleCallbacks.length;
    }));
    const images: HTMLImageElement[] = [];
    const store = new WorldAssetStore(() => {
      const image = new Image();
      Object.defineProperties(image, {
        complete: { configurable: true, value: true },
        naturalWidth: { configurable: true, value: 1780 },
        naturalHeight: { configurable: true, value: 941 }
      });
      image.decode = vi.fn().mockResolvedValue(undefined);
      images.push(image);
      return image;
    });
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "landing" });
    await layer.waitForCurrentPresentation();
    await layer.prepareChallengeWorlds();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      compositeFrames.push(callback);
      return compositeFrames.length;
    });

    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    layer.setParallaxDistance(240, true);
    layer.setParallaxDistance(961, true);
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="current"]')
      ?.dataset.worldId).toBe("order-process");
    layer.show({
      worldId: "order-process",
      stateId: "epoch_1.challenge",
      phase: "game",
      transitionMode: "offscreen"
    });
    expect(host.dataset.assetState).toBe("loading");
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));

    await vi.waitFor(() => expect(idleCallbacks.length).toBeGreaterThan(0));
    expect(idleOptions.shift()).toBeUndefined();
    idleCallbacks.shift()?.({ didTimeout: false, timeRemaining: () => 4 });
    await vi.waitFor(() => expect(images).toHaveLength(3));
    expect(images[2]?.src).toContain("world-03-quality-service");

    await vi.waitFor(() => expect(idleCallbacks.length).toBeGreaterThan(0));
    const panelsReady = (): boolean =>
      host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
        ?.dataset.assetPath?.includes("world-03-quality-service") === true &&
      host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
        ?.dataset.presentationReady === "true" &&
      host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
        ?.dataset.assetPath?.includes("world-03-quality-service") === true &&
      host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
        ?.dataset.presentationReady === "true";
    for (let stage = 0; stage < 14 && !panelsReady(); stage += 1) {
      await vi.waitFor(() => expect(idleCallbacks.length + compositeFrames.length)
        .toBeGreaterThan(0));
      if (idleCallbacks.length > 0) {
        expect(idleOptions.shift()).toBeUndefined();
        idleCallbacks.shift()?.({ didTimeout: false, timeRemaining: () => 4 });
      } else {
        compositeFrames.shift()?.(stage * 16);
      }
      await Promise.resolve();
      await Promise.resolve();
    }
    await vi.waitFor(() => {
      expect(host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
        ?.dataset.assetPath).toContain("world-03-quality-service");
      expect(host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
        ?.dataset.assetPath).toContain("world-03-quality-service");
    });
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

    const panelDecode = vi.mocked(HTMLImageElement.prototype.decode);
    const decodeCountBeforeQualitySeam = panelDecode.mock.calls.length;
    const preparedWorlds = () => ({
      next: host.querySelector<HTMLImageElement>('[data-world-panel="next"]')?.dataset.worldId,
      nextReady: host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
        ?.dataset.presentationReady,
      staged: host.querySelector<HTMLImageElement>("[data-world-staged-panel]")?.dataset.worldId,
      stagedReady: host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
        ?.dataset.presentationReady
    });
    expect(preparedWorlds()).toEqual({
      next: "quality-service", nextReady: "true",
      staged: "quality-service", stagedReady: "true"
    });
    layer.setParallaxDistance(1_200, true);
    layer.setParallaxDistance(1_921, true);

    const current = host.querySelector<HTMLImageElement>('[data-world-panel="current"]');
    expect({
      current: current?.dataset.worldId,
      next: host.querySelector<HTMLImageElement>('[data-world-panel="next"]')?.dataset.worldId,
      staged: host.querySelector<HTMLImageElement>("[data-world-staged-panel]")?.dataset.worldId
    }).toEqual({ current: "quality-service", next: "order-process", staged: "quality-service" });
    expect(current?.dataset.presentationReady).toBe("true");
    expect(current?.hidden).toBe(false);
    layer.show({
      worldId: "quality-service",
      stateId: "epoch_2.resolve",
      phase: "game",
      transitionMode: "offscreen"
    });
    expect(host.dataset.assetState).toBe("loading");
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="current"]')
      ?.dataset.worldId).toBe("quality-service");
    expect(panelDecode).toHaveBeenCalledTimes(decodeCountBeforeQualitySeam);
  });

  it("prepares active panels in bounded steps when WebKit has no idle callback", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestIdleCallback", undefined);
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    await vi.advanceTimersByTimeAsync(50);
    expect(images[1]?.src).toContain("world-02-order-process");
    images[1]!.dispatchEvent(new Event("load"));

    const pairReady = (): boolean =>
      host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
        ?.dataset.presentationReady === "true" &&
      host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
        ?.dataset.presentationReady === "true";
    for (let step = 0; step < 30 && !pairReady(); step += 1) {
      await vi.advanceTimersByTimeAsync(50);
    }
    expect(host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
      ?.dataset.assetPath).toContain("world-02-order-process");
    expect(host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
      ?.dataset.presentationReady).toBe("true");
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
      ?.dataset.presentationReady).toBe("true");
  });

  it("stages a later queued fallback through active idle before its seam", async () => {
    const idleCallbacks: IdleRequestCallback[] = [];
    vi.stubGlobal("requestIdleCallback", vi.fn((callback: IdleRequestCallback) => {
      idleCallbacks.push(callback);
      return idleCallbacks.length;
    }));
    let imageIndex = 0;
    const images: HTMLImageElement[] = [];
    const store = new WorldAssetStore(() => {
      const index = imageIndex++;
      const image = new Image();
      Object.defineProperties(image, {
        complete: { configurable: true, value: true },
        naturalWidth: { configurable: true, value: 1780 },
        naturalHeight: { configurable: true, value: 941 }
      });
      image.decode = index === 2
        ? vi.fn().mockRejectedValue(new Error("world_asset_decode_failed"))
        : vi.fn().mockResolvedValue(undefined);
      images.push(image);
      return image;
    });
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "landing" });
    await layer.waitForCurrentPresentation();
    await layer.prepareChallengeWorlds();
    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    await vi.waitFor(() => expect(idleCallbacks).toHaveLength(1));
    idleCallbacks.shift()?.({ didTimeout: false, timeRemaining: () => 50 });
    await vi.waitFor(() => expect(images[2]?.decode).toHaveBeenCalledTimes(3), { timeout: 1_500 });

    layer.show({
      worldId: "order-process",
      stateId: "epoch_1.challenge",
      phase: "game",
      transitionMode: "offscreen"
    });
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(240, true);
    layer.setParallaxDistance(961, true);
    for (let step = 0; step < 4 &&
        host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
          ?.dataset.assetFallback !== "true"; step += 1) {
      await vi.waitFor(() => expect(idleCallbacks.length).toBeGreaterThan(0), { timeout: 1_500 });
      idleCallbacks.shift()?.({ didTimeout: false, timeRemaining: () => 50 });
      await Promise.resolve();
      await Promise.resolve();
    }
    await vi.waitFor(() => {
      expect(host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
        ?.dataset.worldId).toBe("quality-service");
      expect(host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
        ?.dataset.assetFallback).toBe("true");
    }, { timeout: 1_500 });

    layer.show({
      worldId: "quality-service",
      stateId: "epoch_2.resolve",
      phase: "game",
      transitionMode: "offscreen"
    });
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("fallback-pending"), {
      timeout: 1_500
    });
    layer.setParallaxDistance(1_921, true);
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="current"]')
      ?.dataset.worldId).toBe("quality-service");
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="current"]')
      ?.dataset.assetFallback).toBe("true");
  });

  it("uses adjacent, equally oriented panels without overlap or crossfade", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    layer.setParallaxDistance(480, true);

    const panels = [...host.querySelectorAll<HTMLElement>("[data-world-panel]")];
    expect(panels).toHaveLength(2);
    expect(panels.every((panel) => panel.style.opacity === "")).toBe(true);
    expect(panels.every((panel) => !panel.style.transform.includes("scaleX"))).toBe(true);
    expect(host.querySelector("[data-world-connector]")).toBeNull();
    expect(host.style.getPropertyValue("--world-overlap")).toBe("");
  });

  it("keeps challenge world motion linear without overlap or mask state", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    const panels = [...host.querySelectorAll<HTMLImageElement>("[data-world-panel]")];
    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    panels[0]!.dataset.worldId = "first-mile";
    panels[1]!.dataset.worldId = "order-process";

    const samples = [48, 96, 144].map((distance) => {
      layer.setParallaxDistance(distance, true);
      return panels.map(panelXPercent);
    });

    expect(samples).toEqual([
      [-5, 95],
      [-10, 90],
      [-15, 85]
    ]);
    expect(samples[1]![0]! - samples[0]![0]!).toBe(-5);
    expect(samples[2]![0]! - samples[1]![0]!).toBe(-5);
    expect(host.style.getPropertyValue("--world-overlap")).toBe("");
    expect(host.dataset.worldSeamBetween).toBeUndefined();
    expect(host.dataset.worldSeamMask).toBeUndefined();
    expect(panels.every(({ dataset }) => dataset.worldSeamSide === undefined)).toBe(true);
    expect(panels.every(({ style }) =>
      style.getPropertyValue("--world-seam-overlap") === "")).toBe(true);
  });

  it.each(CHALLENGE_WORLD_PAIRS)(
    "keeps the %s → %s challenge boundary linear and covered",
    async (currentStateId, nextStateId) => {
      const currentWorldId = sceneVisualState(currentStateId).worldId;
      const nextWorldId = sceneVisualState(nextStateId).worldId;
      const { store, images } = imageHarness();
      const host = document.createElement("div");
      const layer = new WorldVisualLayer(host, store);
      layer.show({
        worldId: currentWorldId,
        stateId: currentStateId,
        phase: "game",
        transitionMode: "offscreen"
      });
      const currentImage = images.find(({ src }) =>
        src.includes(campaignWorld(currentWorldId).assetPath));
      expect(currentImage).toBeDefined();
      currentImage!.dispatchEvent(new Event("load"));
      await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
      layer.setParallaxDistance(240, true);

      layer.show({
        worldId: nextWorldId,
        stateId: nextStateId,
        phase: "game",
        transitionMode: "offscreen"
      });
      const nextImage = images.find(({ src }) =>
        src.includes(campaignWorld(nextWorldId).assetPath));
      expect(nextImage).toBeDefined();
      nextImage!.dispatchEvent(new Event("load"));
      await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
      layer.setPaused(true);
      await vi.waitFor(() => {
        expect(host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
          ?.dataset.presentationReady).toBe("true");
      });
      layer.setPaused(false);

      for (const distance of [96, 480, 864]) {
        layer.setParallaxDistance(distance, true);
        const panels = [...host.querySelectorAll<HTMLImageElement>("[data-world-panel]")];
        const travel = distance / WORLD_WIDTH * 100;
        expect(panels.map(({ dataset }) => dataset.worldId))
          .toEqual([currentWorldId, nextWorldId]);
        expect(panels.map(panelXPercent)).toEqual([-travel, 100 - travel]);
        expect(host.dataset.worldSeamBetween).toBeUndefined();
        expect(host.dataset.worldSeamDirection).toBeUndefined();
        expect(host.style.getPropertyValue("--world-overlap")).toBe("");
        expect(panels.every(({ dataset }) => dataset.worldSeamSide === undefined)).toBe(true);
        expectPanelsCoverStage(panels);
      }
      const incoming = host.querySelector<HTMLImageElement>('[data-world-panel="next"]')!;
      layer.setParallaxDistance(WORLD_WIDTH, true);
      const promoted = host.querySelector<HTMLImageElement>('[data-world-panel="current"]')!;
      expect(promoted).toBe(incoming);
      expect(promoted.dataset.worldId).toBe(nextWorldId);
      expect(panelXPercent(promoted)).toBe(0);
    }
  );

  it("keeps the active linear phase fixed through pause, resume and visibility changes", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    const panels = [...host.querySelectorAll<HTMLImageElement>("[data-world-panel]")];
    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    panels[0]!.dataset.worldId = "client-paths";
    panels[1]!.dataset.worldId = "scale-logistics";
    layer.setParallaxDistance(480, true);
    const before = {
      transforms: panels.map(({ style }) => style.transform),
      phase: host.style.getPropertyValue("--world-phase-px")
    };

    layer.setPaused(true);
    document.dispatchEvent(new Event("visibilitychange"));
    layer.setPaused(false);

    expect(panels.map(({ style }) => style.transform)).toEqual(before.transforms);
    expect(host.style.getPropertyValue("--world-phase-px")).toBe(before.phase);
    expect(host.style.getPropertyValue("--world-overlap")).toBe("");
    expect(host.dataset.worldSeamBetween).toBeUndefined();
  });

  it("uses the reduced-motion distance function with the same spatial seam contract", () => {
    const standardHost = document.createElement("div");
    const reducedHost = document.createElement("div");
    const standard = new WorldVisualLayer(standardHost);
    const reduced = new WorldVisualLayer(reducedHost);
    const setup = (host: HTMLElement, layer: WorldVisualLayer): HTMLImageElement[] => {
      layer.show({
        worldId: "first-mile",
        stateId: "story.first_package",
        phase: "game",
        transitionMode: "offscreen"
      });
      const panels = [...host.querySelectorAll<HTMLImageElement>("[data-world-panel]")];
      panels[0]!.dataset.worldId = "million-approach";
      panels[1]!.dataset.worldId = "million-finale";
      return panels;
    };
    const standardPanels = setup(standardHost, standard);
    const reducedPanels = setup(reducedHost, reduced);

    standard.setParallaxDistance(480, true);
    reduced.setParallaxDistance(480 / REDUCED_MOTION_PARALLAX_RATIO, true, true);

    expect(reducedPanels.map(({ style }) => style.transform))
      .toEqual(standardPanels.map(({ style }) => style.transform));
    expect(reducedHost.style.getPropertyValue("--world-overlap")).toBe("");
    expect(reducedHost.dataset.worldSeamBetween).toBeUndefined();
  });

  it("leaves deterministic simulation, input, spawn, score and route state unchanged", () => {
    const baseline = deterministicGameHarness();
    const withSeam = deterministicGameHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    const panels = [...host.querySelectorAll<HTMLImageElement>("[data-world-panel]")];
    panels[0]!.dataset.worldId = "first-mile";
    panels[1]!.dataset.worldId = "order-process";

    baseline.game.start("keyboard");
    withSeam.game.start("keyboard");
    baseline.advanceFrames(90, (frame) => {
      if (frame === 30) baseline.game.jump("keyboard");
    });
    withSeam.advanceFrames(90, (frame) => {
      if (frame === 30) withSeam.game.jump("keyboard");
      layer.setParallaxDistance(frame * 8, true);
    });

    expect(withSeam.game.canonicalDeterministicState())
      .toEqual(baseline.game.canonicalDeterministicState());
    expect(withSeam.game.isReplayValid).toBe(true);
    expect(baseline.game.isReplayValid).toBe(true);
    baseline.game.destroy();
    withSeam.game.destroy();
  });

  it("keeps the stage covered without requiring mask capability", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    const panels = [...host.querySelectorAll<HTMLImageElement>("[data-world-panel]")];
    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    panels[0]!.dataset.worldId = "million-finale";
    panels[1]!.dataset.worldId = "first-mile";
    layer.setParallaxDistance(480, true);

    expect(host.dataset.worldSeamMask).toBeUndefined();
    expect(panels.every(({ dataset }) => dataset.worldSeamSide === undefined)).toBe(true);
    expectPanelsCoverStage(panels);
  });

  it("keeps the visible panel interpolated while recycling only the offscreen panel", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    const panels = [...host.querySelectorAll<HTMLElement>("[data-world-panel]")];

    layer.setParallaxDistance(240, true);
    layer.setParallaxDistance(260, true);
    expect(panels.every((panel) => panel.style.transition === "none")).toBe(true);

    layer.setParallaxDistance(959, true);
    layer.setParallaxDistance(961, true);
    expect(panels.filter((panel) => panel.style.transition === "none")).toHaveLength(2);

    layer.setParallaxDistance(970, true);
    expect(panels.every((panel) => panel.style.transition === "none")).toBe(true);
  });

  it("preserves absolute phase across world, story and challenge changes", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    layer.setParallaxDistance(480, true);
    const before = host.style.getPropertyValue("--world-phase-px");
    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "story" });
    layer.setParallaxDistance(480, false);
    layer.show({ worldId: "quality-service", stateId: "epoch_2.resolve", phase: "game" });
    layer.setParallaxDistance(480, true);

    expect(host.style.getPropertyValue("--world-phase-px")).toBe(before);
  });

  it("commits adjacent world panels without a connector or a gap", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "game" });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));

    layer.setParallaxDistance(240, true);
    layer.show({ worldId: "quality-service", stateId: "epoch_2.resolve", phase: "game" });
    const qualityImage = images.find(({ src }) => src.includes("world-03-quality-service"));
    expect(qualityImage).toBeDefined();
    qualityImage!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(960, true);

    const panels = [...host.querySelectorAll<HTMLElement>("[data-world-panel]")];
    expect(new Set(panels.map(({ style }) => style.transform))).toEqual(new Set([
      "translate3d(0%, 0, 0)",
      "translate3d(100%, 0, 0)"
    ]));
    expect(host.querySelector("[data-world-connector]")).toBeNull();
  });

  it("keeps the current world until pause prepares a pending challenge panel", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    const panels = [...host.querySelectorAll<HTMLImageElement>("[data-world-panel]")];

    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(240, true);

    layer.show({
      worldId: "quality-service",
      stateId: "epoch_2.resolve",
      phase: "game",
      transitionMode: "offscreen"
    });
    const qualityImage = images.find(({ src }) => src.includes("world-03-quality-service"));
    expect(qualityImage).toBeDefined();
    qualityImage!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    expect(panels.filter(({ dataset }) => dataset.assetPath?.includes("world-03")))
      .toHaveLength(0);

    layer.setParallaxDistance(600, true);
    expect(panels.filter(({ dataset }) => dataset.assetPath?.includes("world-03")))
      .toHaveLength(0);

    layer.setParallaxDistance(961, true);
    await Promise.resolve();
    expect(panels.filter(({ dataset }) => dataset.assetPath?.includes("world-03")))
      .toHaveLength(0);
    expect(panels.every(({ dataset }) => dataset.worldId === "first-mile")).toBe(true);

    layer.setPaused(true);
    await vi.waitFor(() => {
      expect(panels.find(({ dataset }) => dataset.assetPath?.includes("world-03"))
        ?.dataset.presentationReady).toBe("true");
    });
    layer.setPaused(false);
    layer.setParallaxDistance(1_921, true);
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="current"]')
      ?.dataset.worldId).toBe("quality-service");
  });

  it("promotes a prepared challenge panel within one rendered pixel without transition effects", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(240, true);

    layer.show({
      worldId: "order-process",
      stateId: "epoch_1.challenge",
      phase: "game",
      transitionMode: "offscreen"
    });
    const orderImage = images.find(({ src }) => src.includes("world-02-order-process"));
    expect(orderImage).toBeDefined();
    orderImage!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setPaused(true);
    await vi.waitFor(() => {
      expect(host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
        ?.dataset.presentationReady).toBe("true");
    });
    layer.setPaused(false);

    layer.setParallaxDistance(959, true);
    const incoming = host.querySelector<HTMLImageElement>('[data-world-panel="next"]')!;
    const before = panelXPercent(incoming);
    expect(incoming.dataset.worldSeamSide).toBeUndefined();

    layer.setParallaxDistance(960, true);

    const promoted = host.querySelector<HTMLImageElement>('[data-world-panel="current"]')!;
    const pooled = host.querySelector<HTMLImageElement>("[data-world-staged-panel]")!;
    const after = panelXPercent(promoted);
    expect(promoted).toBe(incoming);
    expect(Math.abs(after - before) * (WORLD_WIDTH / 100)).toBeLessThanOrEqual(1 + 1e-6);
    expect(host.dataset.worldSeamBetween).toBeUndefined();
    expect(promoted.dataset.worldSeamSide).toBeUndefined();
    expect(pooled.dataset.worldSeamSide).toBeUndefined();
    expect(pooled.style.getPropertyValue("--world-seam-overlap")).toBe("");
  });

  it("keeps the seam hidden for an atomically prepared world swap", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(240, true);
    expect(host.dataset.worldSeamBetween).toBeUndefined();

    layer.show({
      worldId: "quality-service",
      stateId: "epoch_2.resolve",
      phase: "game",
      transitionMode: "offscreen"
    });
    const qualityImage = images.find(({ src }) => src.includes("world-03-quality-service"));
    qualityImage!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setPaused(true);
    await vi.waitFor(() => {
      const nextPanel = host.querySelector<HTMLImageElement>('[data-world-panel="next"]');
      expect(nextPanel?.dataset.assetPath).toContain("world-03-quality-service");
      expect(nextPanel?.dataset.presentationReady).toBe("true");
    });
    const srcMutations: MutationRecord[] = [];
    const observer = new MutationObserver((records) => srcMutations.push(...records));
    observer.observe(host, {
      subtree: true,
      attributes: true,
      attributeFilter: ["src"]
    });
    layer.setPaused(false);

    layer.setParallaxDistance(961, true);
    await Promise.resolve();
    expect(host.dataset.worldSeamBetween).toBeUndefined();
    expect(srcMutations).toEqual([]);
    observer.disconnect();

    layer.setParallaxDistance(3_000, true, true);
    expect(host.dataset.worldSeamBetween).toBeUndefined();

    layer.setParallaxDistance(1_920, true);
    expect(host.dataset.worldSeamBetween).toBeUndefined();
  });

  it("commits a failed challenge world fallback at the next safe seam", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(240, true);

    layer.show({
      worldId: "quality-service",
      stateId: "epoch_2.resolve",
      phase: "game",
      transitionMode: "offscreen"
    });
    const qualityImage = images.find(({ src }) => src.includes("world-03-quality-service"))!;
    qualityImage.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(qualityImage.decode).toHaveBeenCalledTimes(2));
    qualityImage.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(qualityImage.decode).toHaveBeenCalledTimes(3));
    qualityImage.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("fallback-pending"));

    layer.setPaused(true);
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("fallback"));
    layer.setPaused(false);
    layer.setParallaxDistance(961, true);
    expect([...host.querySelectorAll<HTMLImageElement>("[data-world-panel]")]
      .every(({ dataset }) =>
        dataset.worldId === "quality-service" && dataset.assetFallback === "true"
      )).toBe(true);
    expect(host.dataset.worldSeamBetween).toBeUndefined();
    expect(host.dataset.assetState).toBe("fallback");
  });

  it("uses a pending fallback when paused panel presentation decode fails", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(240, true);
    vi.mocked(HTMLImageElement.prototype.decode)
      .mockRejectedValue(new Error("world_panel_decode_failed"));

    layer.show({
      worldId: "quality-service",
      stateId: "epoch_2.resolve",
      phase: "game",
      transitionMode: "offscreen"
    });
    images.find(({ src }) => src.includes("world-03-quality-service"))!
      .dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));

    layer.setPaused(true);
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("fallback"));
    layer.setPaused(false);
    layer.setParallaxDistance(961, true);
    expect([...host.querySelectorAll<HTMLImageElement>("[data-world-panel]")]
      .every(({ dataset }) => dataset.assetFallback === "true")).toBe(true);
  });

  it("repeats the current world when the next decoded asset misses its seam", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    const panels = [...host.querySelectorAll<HTMLImageElement>("[data-world-panel]")];

    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(240, true);

    layer.show({
      worldId: "quality-service",
      stateId: "epoch_2.resolve",
      phase: "game",
      transitionMode: "offscreen"
    });
    layer.setParallaxDistance(961, true);
    expect(panels.every(({ dataset }) => dataset.worldId === "first-mile")).toBe(true);

    const qualityImage = images.find(({ src }) => src.includes("world-03-quality-service"))!;
    qualityImage.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(1_200, true);
    expect(panels.every(({ dataset }) => dataset.worldId === "first-mile")).toBe(true);

    layer.setParallaxDistance(1_921, true);
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="current"]')
      ?.dataset.worldId).toBe("first-mile");
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
      ?.dataset.worldId).toBe("first-mile");
  });

  it("resynchronizes skipped cycles and distance resets without an animated swap", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    const panels = [...host.querySelectorAll<HTMLElement>("[data-world-panel]")];

    layer.setParallaxDistance(240, true);
    layer.setParallaxDistance(3_120, true);
    expect(panels.every((panel) => panel.style.transition === "none")).toBe(true);
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(-25%, 0, 0)",
      "translate3d(75%, 0, 0)"
    ]);

    layer.setParallaxDistance(120, true);
    expect(panels.every((panel) => panel.style.transition === "none")).toBe(true);
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(-12.5%, 0, 0)",
      "translate3d(87.5%, 0, 0)"
    ]);
  });

  it("resynchronizes prepared panels during gameplay without decoding them again", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "game" });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));

    layer.show({
      worldId: "quality-service",
      stateId: "epoch_2.resolve",
      phase: "game",
      transitionMode: "offscreen"
    });
    const qualityImage = images.find(({ src }) => src.includes("world-03-quality-service"));
    expect(qualityImage).toBeDefined();
    qualityImage!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));

    layer.setPaused(true);
    await vi.waitFor(() => {
      const nextPanel = host.querySelector<HTMLImageElement>('[data-world-panel="next"]');
      expect(nextPanel?.dataset.assetPath).toContain("world-03-quality-service");
      expect(nextPanel?.dataset.presentationReady).toBe("true");
    });
    layer.setPaused(false);
    const panelDecode = vi.mocked(HTMLImageElement.prototype.decode);
    const decodeCountBeforeResynchronization = panelDecode.mock.calls.length;
    const srcMutations: MutationRecord[] = [];
    const observer = new MutationObserver((records) => srcMutations.push(...records));
    observer.observe(host, {
      subtree: true,
      attributes: true,
      attributeFilter: ["src"]
    });

    layer.setParallaxDistance(240, true);
    layer.setParallaxDistance(3_120, true);
    await Promise.resolve();

    expect(panelDecode).toHaveBeenCalledTimes(decodeCountBeforeResynchronization);
    expect(srcMutations).toEqual([]);
    observer.disconnect();
  });

  it("finishes the prepared offscreen world before queuing a newer request", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    const showOffscreen = (
      worldId: WorldVisualSelection["worldId"],
      stateId: string
    ): void => {
      layer.show({ worldId, stateId, phase: "game", transitionMode: "offscreen" });
    };

    showOffscreen("first-mile", "story.first_package");
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(240, true);

    showOffscreen("quality-service", "epoch_2.resolve");
    const qualityImage = images.find(({ src }) => src.includes("world-03-quality-service"));
    expect(qualityImage).toBeDefined();
    qualityImage!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setPaused(true);
    await vi.waitFor(() => {
      expect(host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
        ?.dataset.presentationReady).toBe("true");
    });

    showOffscreen("client-paths", "epoch_3.start");
    const clientImage = images.find(({ src }) => src.includes("world-04-client-paths"));
    expect(clientImage).toBeDefined();
    clientImage!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setPaused(false);

    layer.setParallaxDistance(961, true);
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="current"]')
      ?.dataset.assetPath).toContain("world-03-quality-service");

    layer.setParallaxDistance(1_921, true);
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="current"]')
      ?.dataset.assetPath).toContain("world-03-quality-service");

    layer.setPaused(true);
    await vi.waitFor(() => {
      const nextPanel = host.querySelector<HTMLImageElement>('[data-world-panel="next"]');
      expect(nextPanel?.dataset.assetPath).toContain("world-04-client-paths");
      expect(nextPanel?.dataset.presentationReady).toBe("true");
    });
    layer.setPaused(false);
    layer.setParallaxDistance(2_881, true);
    expect([...host.querySelectorAll<HTMLImageElement>("[data-world-panel]")]
      .some(({ dataset }) => dataset.assetPath?.includes("world-04-client-paths")))
      .toBe(true);
  });

  it("preloads the following world only after the pending world is committed", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    await vi.waitFor(() => expect(images).toHaveLength(2));
    images[1]!.dispatchEvent(new Event("load"));
    layer.setPaused(true);
    await vi.waitFor(() => {
      const panel = host.querySelector<HTMLImageElement>('[data-world-panel="next"]');
      expect(panel?.dataset.assetPath).toContain("world-02");
      expect(panel?.dataset.presentationReady).toBe("true");
    });
    layer.setPaused(false);

    layer.show({
      worldId: "order-process",
      stateId: "epoch_1.challenge",
      phase: "game",
      transitionMode: "offscreen"
    });
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));

    expect(images).toHaveLength(2);
    layer.setParallaxDistance(240, true);
    layer.setParallaxDistance(961, true);
    layer.setPhase("story");
    await vi.waitFor(() => expect(images).toHaveLength(3));
  });

  it("prepares the quality-service DOM panel during story before gameplay", async () => {
    vi.useFakeTimers();
    const compositeFrames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      compositeFrames.push(callback);
      return compositeFrames.length;
    });
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({ worldId: "order-process", stateId: "epoch_1.challenge", phase: "story" });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    await vi.advanceTimersByTimeAsync(50);
    const qualityImage = images.find(({ src }) => src.includes("world-03-quality-service"));
    expect(qualityImage).toBeDefined();
    qualityImage!.dispatchEvent(new Event("load"));
    await vi.advanceTimersByTimeAsync(0);

    const nextPanel = host.querySelector<HTMLImageElement>('[data-world-panel="next"]');
    const stagedPanel = host.querySelector<HTMLImageElement>("[data-world-staged-panel]");
    expect(stagedPanel?.dataset.assetPath).toContain("world-03-quality-service");
    for (const timestamp of [16, 32]) {
      expect(compositeFrames).toHaveLength(1);
      compositeFrames.shift()?.(timestamp);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    }
    expect(nextPanel?.dataset.assetPath).toContain("world-03-quality-service");
    expect(nextPanel?.hidden).toBe(false);
    for (const timestamp of [48, 64]) {
      expect(compositeFrames).toHaveLength(1);
      compositeFrames.shift()?.(timestamp);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    }
    await vi.waitFor(() => expect(nextPanel?.dataset.presentationReady).toBe("true"));

    const panelDecode = vi.mocked(HTMLImageElement.prototype.decode);
    const decodeCountBeforeGameplay = panelDecode.mock.calls.length;
    layer.show({
      worldId: "quality-service",
      stateId: "epoch_2.resolve",
      phase: "game",
      transitionMode: "offscreen"
    });
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(240, true);
    layer.setParallaxDistance(961, true);

    expect(host.querySelector<HTMLImageElement>('[data-world-panel="current"]')
      ?.dataset.worldId).toBe("quality-service");
    expect(panelDecode).toHaveBeenCalledTimes(decodeCountBeforeGameplay);
  });

  it("starts sequential panel warmup immediately outside active gameplay", async () => {
    const requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
      void callback;
      return 1;
    });
    vi.stubGlobal("requestIdleCallback", requestIdleCallback);
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "story" });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));

    expect(images).toHaveLength(2);
    expect(images[1]!.src).toContain("world-02-order-process");
  });

  it("keeps the seventh world on both panels for a seamless finale loop", async () => {
    vi.useFakeTimers();
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({
      worldId: "million-finale",
      stateId: "story.million_finale",
      phase: "story"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    await vi.advanceTimersByTimeAsync(50);

    expect(images.some(({ src }) => src.includes("world-01-first-mile"))).toBe(false);
    expect(host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
      ?.dataset.worldId).toBe("million-finale");
  });

  it("keeps the seventh-to-first cycle for endless challenge gameplay", async () => {
    vi.useFakeTimers();
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({
      worldId: "million-finale",
      stateId: "story.million_finale",
      phase: "game",
      transitionMode: "offscreen"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setPaused(true);
    await vi.advanceTimersByTimeAsync(50);

    expect(images.some(({ src }) => src.includes("world-01-first-mile"))).toBe(true);
  });

  it("ignores a pending panel decode completion after destroy", async () => {
    vi.useFakeTimers();
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    layer.show({ worldId: "order-process", stateId: "epoch_1.challenge", phase: "story" });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));

    let resolvePanelDecode: (() => void) | undefined;
    vi.mocked(HTMLImageElement.prototype.decode).mockImplementationOnce(() =>
      new Promise<void>((resolve) => { resolvePanelDecode = resolve; })
    );
    await vi.advanceTimersByTimeAsync(50);
    images.find(({ src }) => src.includes("world-03-quality-service"))!
      .dispatchEvent(new Event("load"));
    await vi.waitFor(() => {
      expect(host.querySelector<HTMLImageElement>("[data-world-staged-panel]")
        ?.dataset.assetPath).toContain("world-03-quality-service");
    });

    layer.destroy();
    resolvePanelDecode?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(host.querySelectorAll("[data-world-panel]")).toHaveLength(0);
    expect(host.querySelector("[data-world-staged-panel]")).toBeNull();
    expect(host.querySelectorAll("img")).toHaveLength(0);
  });

  it("presents a world selected by a story card immediately at its authored frame", async () => {
    vi.useFakeTimers();
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "story" });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(240, false);
    const panels = [...host.querySelectorAll<HTMLElement>("[data-world-panel]")];
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(-25%, 0, 0)",
      "translate3d(75%, 0, 0)"
    ]);

    layer.show({ worldId: "order-process", stateId: "epoch_1.challenge", phase: "story" });
    const orderImage = images.find(({ src }) => src.includes("world-02-order-process"));
    expect(orderImage).toBeDefined();
    orderImage!.dispatchEvent(new Event("load"));
    await layer.waitForCurrentPresentation();
    expect(host.querySelector("[data-world-connector]")).toBeNull();

    await vi.advanceTimersByTimeAsync(800);
    expect(host.style.getPropertyValue("--world-phase-px")).toBe("0px");
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(0%, 0, 0)",
      "translate3d(100%, 0, 0)"
    ]);
    expect(panels.every(({ dataset }) => dataset.assetPath?.includes("world-02")))
      .toBe(true);
    expect(host.dataset.assetState).toBe("loaded");
    vi.useRealTimers();
  });

  it("keeps a bright branded fallback without retrying during active gameplay", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "game" });
    images[0]!.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(images[0]!.decode).toHaveBeenCalledTimes(2));
    images[0]!.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(images[0]!.decode).toHaveBeenCalledTimes(3));
    images[0]!.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("fallback"));
    expect(host.dataset.worldId).toBe("first-mile");

    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "game" });
    expect(images).toHaveLength(1);
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("fallback"));
  });

  it("treats a story fallback as a ready first frame", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({ worldId: "order-process", stateId: "epoch_1.challenge", phase: "story" });
    const ready = layer.waitForCurrentPresentation();
    images[0]!.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(images[0]!.decode).toHaveBeenCalledTimes(2));
    images[0]!.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(images[0]!.decode).toHaveBeenCalledTimes(3));
    images[0]!.dispatchEvent(new Event("error"));

    await expect(ready).resolves.toBeUndefined();
    expect(host.dataset.assetState).toBe("fallback");
    expect(host.dataset.worldId).toBe("order-process");
  });

  it("falls back when a decoded story asset cannot be presented by its panels", async () => {
    vi.spyOn(HTMLImageElement.prototype, "decode")
      .mockRejectedValue(new Error("world_panel_decode_failed"));
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({ worldId: "order-process", stateId: "epoch_1.challenge", phase: "story" });
    const ready = layer.waitForCurrentPresentation();
    images[0]!.dispatchEvent(new Event("load"));

    await expect(ready).resolves.toBeUndefined();
    expect(host.dataset.assetState).toBe("fallback");
    expect(host.dataset.worldId).toBe("order-process");
  });
});
