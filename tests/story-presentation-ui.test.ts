import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  fullscreenPreferenceFromElement,
  formatPowerUpHud,
  formatStoryObjectiveHud,
  getTrappedFocusIndex,
  snapshotStoryScene,
  StoryContinuationGate
} from "../src/ui/story-presentation";
import { StoryObjectiveDirector } from "../src/game/story-objectives";

const campaignCss = readFileSync(
  new URL("../src/styles/campaign.css", import.meta.url),
  "utf8"
);

describe("player-paced story presentation", () => {
  it("derives the saved preference from the campaign fullscreen element", () => {
    const campaignRoot = {} as Element;
    const unrelatedFullscreenElement = {} as Element;

    expect(fullscreenPreferenceFromElement(campaignRoot, campaignRoot)).toBe("fullscreen");
    expect(fullscreenPreferenceFromElement(null, campaignRoot)).toBe("portrait");
    expect(fullscreenPreferenceFromElement(unrelatedFullscreenElement, campaignRoot)).toBe("portrait");
  });

  it("takes an immutable copy of a scene before it reaches the DOM", () => {
    const sourceBody = [" Pierwszy akapit. ", "Drugi akapit."];
    const scene = snapshotStoryScene({
      sceneId: "intro.first-package",
      eyebrow: "Pierwsza paczka",
      title: "Dobra. Pierwsza gotowa.",
      body: sourceBody,
      vignette: "first-package",
      continueLabel: "Dalej"
    });

    sourceBody[0] = "Zmieniony tekst";
    sourceBody.push("Trzeci akapit");

    expect(scene.body).toEqual(["Pierwszy akapit.", "Drugi akapit."]);
    expect(Object.isFrozen(scene)).toBe(true);
    expect(Object.isFrozen(scene.body)).toBe(true);
  });

  it("accepts the active scene id once and rejects stale or double clicks", () => {
    const gate = new StoryContinuationGate();

    expect(gate.arm("intro.1")).toBe(true);
    expect(gate.consume("intro.0")).toBe(false);
    expect(gate.consume("intro.1")).toBe(true);
    expect(gate.consume("intro.1")).toBe(false);
    expect(gate.arm("intro.1")).toBe(false);
    expect(gate.consume("intro.1")).toBe(false);

    expect(gate.arm("intro.2")).toBe(true);
    expect(gate.consume("intro.2")).toBe(true);
  });

  it("formats carried powers compactly for the persistent HUD", () => {
    expect(formatPowerUpHud([])).toBe("");
    expect(formatPowerUpHud(["audyt_jakosci", "drugie_zycie", "gwarancja_48"]))
      .toBe("Audyt · 2× punkty · Gwarancja");
  });

  it("formats live order, Hydra, counter and finale progress for the HUD", () => {
    const director = new StoryObjectiveDirector();

    director.enterSegment("epoch_4.orders", 45);
    for (const type of ["pc", "notebook", "lcd", "telefon"] as const) {
      director.recordOrder(type);
    }
    expect(formatStoryObjectiveHud(director.snapshot, ["pc"]))
      .toBe("Kolejka zamówień · PC · 4/6");
    director.recordOrder("pc");
    director.recordOrder("notebook");
    director.recordOrder("lcd");
    director.recordOrder("telefon");
    expect(formatStoryObjectiveHud(director.snapshot, []))
      .toBe("✓ Kolejka gotowa · 6/6 · bonus +2");

    director.enterSegment("epoch_4.logistic_hydra", 20);
    director.recordElapsed(7);
    expect(formatStoryObjectiveHud(director.snapshot, []))
      .toBe("Logistyczna Hydra · Sortowanie · 1/3");

    director.enterSegment("epoch_5.counter", 15);
    director.recordElapsed(10);
    expect(formatStoryObjectiveHud(director.snapshot, []))
      .toBe("Licznik zamówień · 999 990");

    director.enterSegment("epoch_5.million_wave", 60);
    director.recordElapsed(12);
    director.recordSymbol(0);
    director.recordSymbol(1);
    director.recordSymbol(2);
    expect(formatStoryObjectiveHud(director.snapshot, []))
      .toBe("Fala Miliona · Jakość · faza 2/5 · symbole 3/8");
  });

  it("wraps keyboard focus inside the two-control story dialog", () => {
    expect(getTrappedFocusIndex(0, 2, true)).toBe(1);
    expect(getTrappedFocusIndex(1, 2, false)).toBe(0);
    expect(getTrappedFocusIndex(-1, 2, false)).toBe(0);
    expect(getTrappedFocusIndex(-1, 2, true)).toBe(1);
  });

  it("keeps the full live objective visible in the compact HUD through 720 px", () => {
    const compactMediaMatch = /@media\s*\(max-width:\s*720px\)\s*\{/u.exec(campaignCss);
    expect(compactMediaMatch).not.toBeNull();
    const compactMediaStart = compactMediaMatch?.index ?? -1;

    const nextMediaStart = campaignCss.indexOf("@media", compactMediaStart + 1);
    const compactHudCss = campaignCss.slice(
      compactMediaStart,
      nextMediaStart < 0 ? campaignCss.length : nextMediaStart
    );

    expect(compactHudCss).toContain('"context pause"');
    expect(compactHudCss).toContain('"stats stats"');
    expect(compactHudCss).toContain("[data-campaign-hud-objective]");
    expect(compactHudCss).toContain("white-space: normal");
    expect(compactHudCss).toContain("text-overflow: clip");
  });
});
