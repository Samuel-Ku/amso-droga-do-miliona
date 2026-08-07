// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BACKGROUND_PARALLAX_SPEED_RATIO,
  backgroundTravelPixels
} from "../src/visuals/background-parallax";
import {
  WorldAssetStore,
  WorldVisualLayer,
  type WorldVisualSelection
} from "../src/visuals/WorldVisualLayer";

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

  it("uses adjacent, equally oriented panels without overlap or crossfade", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    layer.setParallaxDistance(480, true);

    const panels = [...host.querySelectorAll<HTMLElement>("[data-world-panel]")];
    expect(panels).toHaveLength(2);
    expect(panels.every((panel) => panel.style.opacity === "")).toBe(true);
    expect(panels.every((panel) => !panel.style.transform.includes("scaleX"))).toBe(true);
    expect(host.querySelector("[data-world-connector]")).toBeNull();
    expect(host.style.getPropertyValue("--world-overlap")).toBe("0px");
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

  it("keeps the seam hidden for an atomically prepared world swap", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    const seam = host.querySelector<HTMLElement>("[data-world-seam-blur]");

    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game",
      transitionMode: "offscreen"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setParallaxDistance(240, true);
    expect(seam?.hidden).toBe(true);

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
    expect(seam?.hidden).toBe(true);
    expect(seam?.dataset.betweenWorlds).toBeUndefined();
    expect(srcMutations).toEqual([]);
    observer.disconnect();

    layer.setParallaxDistance(3_000, true, true);
    expect(seam?.hidden).toBe(true);

    layer.setParallaxDistance(1_920, true);
    expect(seam?.hidden).toBe(true);
  });

  it("commits a failed challenge world fallback at the next safe seam", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    const seam = host.querySelector<HTMLElement>("[data-world-seam-blur]");

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
    expect(seam?.hidden).toBe(true);
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
    expect(images).toHaveLength(1);
    layer.setParallaxDistance(240, true);

    layer.show({
      worldId: "order-process",
      stateId: "epoch_1.challenge",
      phase: "game",
      transitionMode: "offscreen"
    });
    images[1]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));

    expect(images).toHaveLength(2);
    layer.setPaused(true);
    await vi.waitFor(() => {
      const panel = host.querySelector<HTMLImageElement>('[data-world-panel="next"]');
      expect(panel?.dataset.assetPath).toContain("world-02");
      expect(panel?.dataset.presentationReady).toBe("true");
    });
    layer.setPaused(false);
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

  it("schedules sequential panel warmup through requestIdleCallback when available", async () => {
    let idleCallback: IdleRequestCallback | undefined;
    const requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
      idleCallback = callback;
      return 1;
    });
    vi.stubGlobal("requestIdleCallback", requestIdleCallback);
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "story" });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));

    expect(requestIdleCallback).toHaveBeenCalledOnce();
    expect(images).toHaveLength(1);
    idleCallback?.({ didTimeout: false, timeRemaining: () => 50 });
    await vi.waitFor(() => expect(images).toHaveLength(2));
    expect(images[1]!.src).toContain("world-02-order-process");
  });

  it("continues sequential panel warmup from the seventh world to first-mile", async () => {
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
