// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
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
    public decode = vi.fn(async () => undefined);

    public override dispatchEvent(event: Event): boolean {
      if (event.type === "load") this.onload?.(event);
      if (event.type === "error") this.onerror?.(event);
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
    await Promise.resolve();
    images[0]!.dispatchEvent(new Event("load"));
    await expect(loading).resolves.toMatchObject({ path: "data:image/webp;base64,BBB" });

    const failed = store.load("data:image/webp;base64,CCC");
    images[1]!.dispatchEvent(new Event("error"));
    await Promise.resolve();
    images[1]!.dispatchEvent(new Event("error"));
    await expect(failed).rejects.toThrow("world_asset_decode_failed");
  });
});

describe("edge-to-edge gameplay background", () => {
  it("moves at exactly ten percent of gameplay travel", () => {
    expect(BACKGROUND_PARALLAX_SPEED_RATIO).toBe(0.1);
    expect(backgroundTravelPixels(2_400)).toBe(240);
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
    expect(panels.every((panel) => panel.style.transition === "transform 140ms linear"))
      .toBe(true);

    layer.setParallaxDistance(959, true);
    layer.setParallaxDistance(961, true);
    expect(panels.filter((panel) => panel.style.transition === "none"))
      .toHaveLength(1);
    expect(panels.filter((panel) => panel.style.transition === "transform 140ms linear"))
      .toHaveLength(1);

    layer.setParallaxDistance(970, true);
    expect(panels.every((panel) => panel.style.transition === "transform 140ms linear"))
      .toBe(true);
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

  it("waits for an offscreen seam before drawing a pending challenge world", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    const panelDraws = new Map<HTMLCanvasElement, ReturnType<typeof vi.fn>>();
    const drawPositions: string[] = [];
    host.querySelectorAll<HTMLCanvasElement>("[data-world-panel]").forEach((panel) => {
      const drawImage = vi.fn();
      panelDraws.set(panel, drawImage);
      Object.defineProperty(panel, "getContext", {
        value: () => ({
          clearRect: vi.fn(),
          drawImage: (...args: unknown[]) => {
            drawPositions.push(panel.style.transform);
            drawImage(...args);
          }
        })
      });
    });
    const totalDraws = (): number => [...panelDraws.values()]
      .reduce((total, drawImage) => total + drawImage.mock.calls.length, 0);

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
    const drawsBeforeSeam = totalDraws();

    layer.setParallaxDistance(600, true);
    expect(totalDraws()).toBe(drawsBeforeSeam);

    layer.setParallaxDistance(961, true);
    expect(totalDraws()).toBe(drawsBeforeSeam + 1);
    expect(drawPositions.at(-1)).toBe("translate3d(99.89583333333333%, 0, 0)");
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

  it("finishes the prepared offscreen world before queuing a newer request", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    const drawImage = vi.fn();
    host.querySelectorAll<HTMLCanvasElement>("[data-world-panel]").forEach((panel) => {
      Object.defineProperty(panel, "getContext", {
        value: () => ({ clearRect: vi.fn(), drawImage })
      });
    });
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
    layer.setParallaxDistance(961, true);

    showOffscreen("client-paths", "epoch_3.start");
    const clientImage = images.find(({ src }) => src.includes("world-04-client-paths"));
    expect(clientImage).toBeDefined();
    clientImage!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    const callsBeforeCommit = drawImage.mock.calls.length;

    layer.setParallaxDistance(1_921, true);
    expect(drawImage).toHaveBeenCalledTimes(callsBeforeCommit + 1);
    expect(drawImage.mock.calls.at(-1)?.[0]).toBe(qualityImage);

    layer.setParallaxDistance(2_881, true);
    expect(drawImage.mock.calls.at(-1)?.[0]).toBe(clientImage);
  });

  it("preloads the following world only after the pending world is committed", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);

    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "game" });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(images).toHaveLength(2));

    layer.show({ worldId: "order-process", stateId: "epoch_1.challenge", phase: "game" });
    images[1]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));

    expect(images).toHaveLength(2);
    layer.setParallaxDistance(960, true);
    await vi.waitFor(() => expect(images).toHaveLength(3));
  });

  it("defers a world selected by a story card until gameplay resumes", async () => {
    vi.useFakeTimers();
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    const drawImage = vi.fn();
    host.querySelectorAll<HTMLCanvasElement>("[data-world-panel]").forEach((panel) => {
      Object.defineProperty(panel, "getContext", {
        value: () => ({ clearRect: vi.fn(), drawImage })
      });
    });
    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "story" });
    images[0]!.dispatchEvent(new Event("load"));
    await Promise.resolve();
    await Promise.resolve();
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
    await Promise.resolve();
    await Promise.resolve();
    const phaseBefore = host.style.getPropertyValue("--world-phase-px");
    expect(host.querySelector("[data-world-connector]")).toBeNull();

    await vi.advanceTimersByTimeAsync(800);
    expect(host.style.getPropertyValue("--world-phase-px")).toBe(phaseBefore);
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(-25%, 0, 0)",
      "translate3d(75%, 0, 0)"
    ]);
    expect(drawImage).toHaveBeenCalledTimes(2);
    layer.setParallaxDistance(960, true);
    expect(drawImage).toHaveBeenCalledTimes(5);
    expect(host.dataset.assetState).toBe("loaded");
    vi.useRealTimers();
  });

  it("keeps a bright branded fallback instead of a black or global error screen", async () => {
    const { store, images } = imageHarness();
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host, store);
    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "game" });
    images[0]!.dispatchEvent(new Event("error"));
    await Promise.resolve();
    images[0]!.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("fallback"));
    expect(host.dataset.worldId).toBe("first-mile");
  });
});
