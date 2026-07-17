// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import {
  BACKGROUND_PARALLAX_SPEED_RATIO,
  backgroundTravelPixels
} from "../src/visuals/background-parallax";
import { WorldAssetStore, WorldVisualLayer } from "../src/visuals/WorldVisualLayer";

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

  it("interpolates ordinary movement but disables interpolation at a cycle wrap", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    const panels = [...host.querySelectorAll<HTMLElement>("[data-world-panel]")];

    layer.setParallaxDistance(240, true);
    layer.setParallaxDistance(260, true);
    expect(panels.every((panel) => panel.style.transition === "transform 140ms linear"))
      .toBe(true);

    layer.setParallaxDistance(959, true);
    layer.setParallaxDistance(961, true);
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
    expect(panels[0]!.style.transform).toBe("translate3d(0%, 0, 0)");
    expect(panels[1]!.style.transform).toBe("translate3d(100%, 0, 0)");
    expect(host.querySelector("[data-world-connector]")).toBeNull();
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
