import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  fullscreenPreferenceFromElement,
  formatPowerUpHud,
  formatStoryControlsHud,
  formatStoryObjectiveHud,
  formatStoryPerspective,
  getTrappedFocusIndex,
  snapshotStoryScene,
  StoryContinuationGate
} from "../src/ui/story-presentation";
import { V5_CHALLENGE_SEMANTICS } from "../src/game/v5-contracts";
import { StoryObjectiveDirector } from "../src/game/story-objectives";
import {
  campaignVisualStateAtProgress,
  campaignWorldCounterValue,
  isCampaignViewportTooNarrow
} from "../src/ui/CampaignShell";

const campaignCss = readFileSync(
  new URL("../src/styles/campaign.css", import.meta.url),
  "utf8"
);
const campaignShellSource = readFileSync(
  new URL("../src/ui/CampaignShell.ts", import.meta.url),
  "utf8"
);

describe("player-paced story presentation", () => {
  it("distinguishes AMSO, client and challenge perspectives beside legacy ids", () => {
    expect(formatStoryPerspective("amso")).toBe("Nasza historia");
    expect(formatStoryPerspective("client")).toBe("Historia klienta");
    expect(formatStoryPerspective("challenge")).toBe("Wyzwanie");
    expect(V5_CHALLENGE_SEMANTICS["epoch_5.million_wave"]).toEqual({
      id: "epoch_5.million_threshold", name: "Próg Miliona"
    });
  });
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

  it("keeps controls in the top HUD and removes visible bottom gameplay text", () => {
    expect(formatStoryControlsHud("epoch_1.training"))
      .toBe("Skok: tap/Spacja · Ślizg: ↓");
    expect(formatStoryControlsHud("epoch_2.quality_series")).toBeNull();
    expect(campaignShellSource).toContain("data-campaign-hud-controls");
    expect(campaignShellSource).not.toContain("data-campaign-gameplay-hint");
    expect(campaignShellSource).not.toContain("data-campaign-story-caption");
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
    expect(formatStoryObjectiveHud(director.snapshot, [], {
      encounterPhase: 2,
      progress: 3,
      attackCount: 8
    })).toBe("Fala Miliona · faza 2/3 · kombinacje 3/8");
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

  it("uses the MZ palette and a shared semantic world instead of generic vignette blobs", () => {
    expect(campaignCss).toContain("--campaign-orange: #f47100");
    expect(campaignCss).toContain("--campaign-coral: #f04f45");
    expect(campaignCss).toContain("--campaign-magenta: #eb32a4");
    expect(campaignCss).toContain(".amso-campaign__world-visual");
    expect(campaignCss).toContain(".amso-world-visual__semantic");
    expect(campaignShellSource).toContain("data-campaign-world-visual");
    expect(campaignShellSource).toContain("amso-campaign__story-final-lockup");
    expect(campaignShellSource).not.toContain("story-vignette");
  });

  it("keeps story art visible beside copy and uses a portrait bottom sheet", () => {
    expect(campaignCss).toContain('data-copy-placement="right"');
    expect(campaignCss).toContain("grid-template-columns: minmax(19rem, 42fr) minmax(0, 58fr)");
    expect(campaignCss).toContain("@media (max-width: 756px)");
    expect(campaignCss).toContain("max-height: 100%");
    expect(campaignCss).not.toContain("backdrop-filter: blur(9px)");
  });

  it("uses the editorial 58/42 split at 757 px and stacks art above copy below it", () => {
    expect(campaignCss).toContain("grid-template-columns: minmax(0, 58fr) minmax(19rem, 42fr)");
    expect(campaignCss).toContain("@media (max-width: 756px)");
    expect(campaignCss).toContain("grid-template-rows: minmax(0, 42%) minmax(0, 58%)");
    expect(campaignCss).toContain("width: min(100%, 1600px)");
    expect(campaignCss).toContain("max(15px, env(safe-area-inset-left))");
  });

  it("keeps a complete light fallback and freezes every editorial layer for reduced motion", () => {
    const worldLayerSource = readFileSync(
      new URL("../src/visuals/WorldVisualLayer.ts", import.meta.url),
      "utf8"
    );
    expect(worldLayerSource).toContain('dataset.assetState = "fallback"');
    expect(campaignCss).toContain('[data-asset-state="fallback"] .amso-world-visual__semantic-base');
    expect(campaignCss).toContain('[data-state-id="story.first_package"] .amso-world-visual__semantic-base');
    expect(campaignCss).toContain('[data-state-id="story.first_package"] .amso-world-visual__image-stack');
    expect(campaignCss).toContain("[data-editorial-layer]");
    expect(campaignCss).toContain("animation: none");
    expect(campaignCss).toContain("color-scheme: only light");
  });

  it("keeps the countdown route visible after every responsive scrim rule", () => {
    const countdownOverride =
      '.amso-campaign__story-presentation[data-state="countdown"][data-copy-placement="right"]';
    expect(campaignCss.lastIndexOf(countdownOverride)).toBeGreaterThan(
      campaignCss.lastIndexOf("@media (orientation: portrait)")
    );
    expect(campaignCss.slice(campaignCss.lastIndexOf(countdownOverride)))
      .toContain("background: rgb(250 247 240 / 8%)");
  });

  it("removes the runner from the three intro cards and keeps it quiet later", () => {
    expect(campaignCss).toContain('[data-view="story_scene"] .amso-campaign__canvas');
    expect(campaignCss).toContain('[data-visual-state^="intro."] .amso-campaign__canvas');
    expect(campaignCss).toContain("opacity: 0.24");
  });

  it("enforces the approved 390 px minimum viewport", () => {
    expect(isCampaignViewportTooNarrow(389, 844)).toBe(true);
    expect(isCampaignViewportTooNarrow(390, 844)).toBe(false);
    expect(isCampaignViewportTooNarrow(844, 389)).toBe(true);
    expect(isCampaignViewportTooNarrow(844, 390)).toBe(false);
    expect(campaignShellSource).toContain("this.callbacks.onPause(\"layout_change\")");
    expect(campaignShellSource).toContain('activeView === "story_reframe"');
    expect(campaignShellSource).toContain("!this.tooNarrowActive");
  });

  it("keeps the completed counter in direct challenge worlds", () => {
    expect(campaignWorldCounterValue("challenge", "epoch_5.wave", 999_970))
      .toBe(999_999);
    expect(campaignWorldCounterValue("story", "epoch_5.wave", 999_982))
      .toBe(999_982);
  });

  it("reveals the next semantic state as a gameplay segment develops", () => {
    expect(campaignVisualStateAtProgress(
      "epoch_2.setup",
      "epoch_2.resolve",
      0.35,
    )).toBe("epoch_2.setup");
    expect(campaignVisualStateAtProgress(
      "epoch_2.setup",
      "epoch_2.resolve",
      0.8,
    )).toBe("epoch_2.resolve");
    expect(campaignVisualStateAtProgress(
      "epoch_5.wave",
      "epoch_5.wave",
      1,
    )).toBe("epoch_5.wave");
  });
});
