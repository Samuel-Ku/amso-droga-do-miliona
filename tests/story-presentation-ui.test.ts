import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  fullscreenPreferenceFromElement,
  formatAuthoredWaveHud,
  formatPowerUpHud,
  formatStoryControlsHud,
  formatStoryObjectiveHud,
  formatStoryPerspective,
  getTrappedFocusIndex,
  snapshotStoryScene,
  StoryContinuationGate
} from "../src/ui/story-presentation";
import { StoryObjectiveDirector } from "../src/game/story-objectives";
import {
  campaignVisualStateAtProgress,
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
  it("distinguishes AMSO, client and challenge perspectives", () => {
    expect(formatStoryPerspective("amso")).toBe("Nasza historia");
    expect(formatStoryPerspective("client")).toBe("Historia klienta");
    expect(formatStoryPerspective("challenge")).toBe("Wyzwanie");
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

  it("uses a page presentation id without changing the scene continuation id", () => {
    const first = snapshotStoryScene({
      sceneId: "client.story",
      presentationId: "client.story:budget",
      title: "Budżet",
      body: "Pierwszy krok.",
      vignette: "creative-desk",
      continueLabel: "Dalej"
    });
    expect(first.presentationId).toBe("client.story:budget");
    expect(first.sceneId).toBe("client.story");
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
    expect(formatPowerUpHud(["podwojny_wynik", "gwarancja_48"]))
      .toBe("×2 WYNIK · GWARANCJA 48 M ×1");
    expect(formatPowerUpHud(["podwojny_wynik"], [{
      kind: "podwojny_wynik",
      remainingSeconds: 6.2
    }])).toBe("×2 WYNIK 7 s");
  });

  it("uses one semantic objective slot for every authored microlevel", () => {
    const base = {
      waveIndex: 0,
      wavesCompleted: 3,
      waveTarget: 8,
      currentWaveId: "wave",
      attemptsOnCurrentWave: 1,
      ordersCollectedOnCurrentWave: 2,
      packagesAvailableOnCurrentWave: 3,
      totalOrdersCollected: 3,
      totalOrderTarget: null,
      elapsedSeconds: 20,
      minimumDurationSeconds: 45,
      completed: false,
      lastResult: null
    } as const;
    expect(formatAuthoredWaveHud({
      ...base,
      microlevelId: "order-backlog",
      currentActions: ["jump", "slide"]
    })).toBe("📦 FALE ZATORU 3/8 · ↑ SKOK + ↓ ŚLIZG");
    expect(formatAuthoredWaveHud({
      ...base,
      microlevelId: "million-threshold",
      totalOrdersCollected: 12,
      totalOrderTarget: 50
    })).toBe("999 962");
  });

  it("uses recognizable object and process symbols in authored HUD slots", () => {
    const source = readFileSync(
      new URL("../src/ui/story-presentation.ts", import.meta.url),
      "utf8"
    );
    for (const symbol of ["📦", "💻", "👥", "🏢", "📥", "🚚"]) {
      expect(source).toContain(symbol);
    }
  });

  it("keeps controls in the top HUD and removes visible bottom gameplay text", () => {
    expect(formatStoryControlsHud("epoch_1.training"))
      .toBe("Skok: W/↑/Spacja/tap · Ślizg: S/↓");
    expect(formatStoryControlsHud("epoch_2.quality_series")).toBeNull();
    expect(campaignShellSource).toContain("data-campaign-hud-controls");
    expect(campaignShellSource).not.toContain("data-campaign-gameplay-hint");
    expect(campaignShellSource).not.toContain("data-campaign-story-caption");
  });

  it("separates total and challenge results and hides an unused protection stat", () => {
    expect(campaignShellSource).toContain("Wynik łączny");
    expect(campaignShellSource).toContain("Wynik wyzwania");
    expect(campaignShellSource).toContain("Pierwszy wynik wyzwania");
    expect(campaignShellSource).toContain("Twój rekord wyzwania");
    expect(campaignShellSource).toContain("result.warrantySaves === 0");
  });

  it("formats live order, peak, counter and finale progress for the HUD", () => {
    const director = new StoryObjectiveDirector();

    director.enterSegment("epoch_4.order_peak", 45);
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

    director.recordElapsed(24);
    director.enterSegment("epoch_4.order_peak_final", 48);
    expect(formatStoryObjectiveHud(director.snapshot, []))
      .toBe("Szczyt Zamówień · Sortowanie · 1/3");

    director.enterSegment("epoch_5.million_threshold", 72);
    for (let index = 0; index < 12; index += 1) director.recordMillionOrder();
    for (let index = 0; index < 3; index += 1) director.recordMillionCombination();
    expect(formatStoryObjectiveHud(director.snapshot, []))
      .toBe("Próg Miliona · ZAMÓWIENIA 12/50 · KOMBINACJE 3/12");
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

  it("uses the MZ palette and shared generated worlds instead of generic vignette blobs", () => {
    expect(campaignCss).toContain("--campaign-orange: #f47100");
    expect(campaignCss).toContain("--campaign-coral: #f04f45");
    expect(campaignCss).toContain("--campaign-magenta: #eb32a4");
    expect(campaignCss).toContain(".amso-campaign__world-visual");
    expect(campaignCss).toContain(".amso-world-visual__image");
    expect(campaignCss).toContain(".amso-world-visual__route");
    expect(campaignShellSource).toContain("data-campaign-world-visual");
    expect(campaignShellSource).toContain("amso-campaign__story-final-lockup");
    expect(campaignShellSource).not.toContain("story-vignette");
  });

  it("grows milestone typography with its reward intensity", () => {
    for (const intensity of [2, 3, 4, 5, 6]) {
      expect(campaignCss).toContain(
        `.amso-campaign__milestone-message[data-intensity="${intensity}"]`
      );
    }
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

  it("keeps a complete light fallback and freezes generated-world transitions for reduced motion", () => {
    const worldLayerSource = readFileSync(
      new URL("../src/visuals/WorldVisualLayer.ts", import.meta.url),
      "utf8"
    );
    expect(worldLayerSource).toContain('dataset.assetState = "fallback"');
    expect(campaignCss).toContain("background: var(--campaign-paper)");
    expect(campaignCss).toContain('[data-phase="story"] .amso-world-visual__image-stack');
    expect(campaignCss).toContain("opacity: 0.8");
    expect(campaignCss).toContain("transition: none");
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

  it("removes the runner from every reading card", () => {
    expect(campaignCss).toContain('[data-view="story_scene"] .amso-campaign__canvas');
    expect(campaignCss).toContain("visibility: hidden");
    expect(campaignCss).toContain('[data-phase="story"] .amso-world-visual__image-stack');
  });

  it("enforces 390 px portrait width and a separate landscape minimum", () => {
    expect(isCampaignViewportTooNarrow(389, 844)).toBe(true);
    expect(isCampaignViewportTooNarrow(390, 844)).toBe(false);
    expect(isCampaignViewportTooNarrow(844, 315)).toBe(false);
    expect(isCampaignViewportTooNarrow(844, 279)).toBe(true);
    expect(campaignShellSource).toContain("this.callbacks.onPause(\"layout_change\")");
    expect(campaignShellSource).toContain('activeView === "story_reframe"');
    expect(campaignShellSource).toContain("!this.tooNarrowActive");
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
