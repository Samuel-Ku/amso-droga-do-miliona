// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import {
  BACKGROUND_PARALLAX_SPEED_RATIO,
  backgroundTravelPixels
} from "../src/visuals/background-parallax";
import { WorldVisualLayer } from "../src/visuals/WorldVisualLayer";

describe("cyclic gameplay background", () => {
  it("keeps the outgoing world above the incoming world on every crossfade", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    const panels = [...host.querySelectorAll<HTMLElement>("[data-world-panel]")];

    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "story" });
    expect(panels[0]!.style.zIndex).toBe("2");
    expect(panels[1]!.style.zIndex).toBe("1");
    host.querySelector<HTMLImageElement>('[data-world-image="1"]')!
      .dispatchEvent(new Event("load"));

    layer.show({ worldId: "quality-service", stateId: "epoch_2.resolve", phase: "story" });
    expect(panels[1]!.style.zIndex).toBe("2");
    expect(panels[0]!.style.zIndex).toBe("1");
  });

  it("publishes one blend-width token for the CSS seam mask", () => {
    const host = document.createElement("div");
    new WorldVisualLayer(host);

    expect(host.style.getPropertyValue("--world-tile-blend-width")).toBe("32px");
  });

  it("moves at exactly ten percent of gameplay travel", () => {
    expect(BACKGROUND_PARALLAX_SPEED_RATIO).toBe(0.1);
    expect(backgroundTravelPixels(2_400)).toBe(240);
  });

  it("ties world-entry duration to gameplay speed", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    layer.setParallaxDistance(100, true, false, 280);
    const slow = host.style.getPropertyValue("--world-transition-ms");
    layer.setParallaxDistance(200, true, false, 700);
    const fast = host.style.getPropertyValue("--world-transition-ms");
    expect(Number.parseInt(fast)).toBeLessThan(Number.parseInt(slow));
  });

  it("uses two equally oriented blended tiles and preserves the phase across worlds", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);

    layer.setParallaxDistance(480, true);
    const firstTiles = [...host.querySelectorAll<HTMLElement>('[data-world-panel="0"] [data-world-tile]')];
    expect(firstTiles).toHaveLength(2);
    expect(firstTiles[0]!.style.transform).toMatch(/^translateX\(calc\(-/u);
    expect(firstTiles[1]!.style.transform).toMatch(/^translateX\(calc\([^-]/u);
    expect(firstTiles.every(({ style }) => !style.transform.includes("scaleX"))).toBe(true);

    layer.show({ worldId: "quality-service", stateId: "epoch_2.resolve", phase: "game" });
    const secondTiles = [...host.querySelectorAll<HTMLElement>('[data-world-panel="1"] [data-world-tile]')];
    expect(secondTiles[0]!.style.transform).toBe(firstTiles[0]!.style.transform);
    expect(secondTiles[1]!.style.transform).toBe(firstTiles[1]!.style.transform);
  });

  it("recenters in story and pause while reduced motion keeps slow linear travel", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    const tile = host.querySelector<HTMLElement>('[data-world-tile="0"]')!;

    layer.setParallaxDistance(200, true);
    const activeTransform = tile.style.transform;
    layer.setParallaxDistance(220, true);
    expect(tile.style.transition).toBe("transform 140ms linear");
    layer.setParallaxDistance(400, false);
    expect(tile.style.transform).not.toBe(activeTransform);
    expect(tile.style.transform).toBe("translateX(0px)");
    const centeredTransform = tile.style.transform;
    expect(tile.style.transition).toContain("720ms");
    layer.setParallaxDistance(600, true, true);
    expect(tile.style.transform).not.toBe(centeredTransform);
    expect(tile.style.transition).toBe("transform 280ms linear");
  });

  it("moves to a whole centered frame when a story card is opened", () => {
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    const tiles = [...host.querySelectorAll<HTMLElement>('[data-world-panel="0"] [data-world-tile]')];
    layer.setParallaxDistance(480, true);
    layer.show({ worldId: "first-mile", stateId: "story.first_package", phase: "story" });
    layer.setParallaxDistance(600, false);
    expect(tiles.map(({ style }) => style.transform)).toEqual([
      "translateX(0px)",
      "translateX(calc(100% - 35px))"
    ]);
    expect(tiles.every(({ style }) => style.transition.includes("720ms"))).toBe(true);

    layer.setParallaxDistance(480, true);
    expect(tiles[0]!.style.transform).not.toBe("translateX(0px)");
  });
});
