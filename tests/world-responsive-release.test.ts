// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  CampaignShell,
  type CampaignShellCallbacks
} from "../src/ui/CampaignShell";
import { BossDirector } from "../src/game/boss";
import { createRunnerModel } from "../src/game/physics";
import { WarehouseRenderer } from "../src/game/renderer";
import { createObstaclePool } from "../src/game/spawning";
import type { RenderScene } from "../src/game/types";
import {
  WorldAssetStore,
  WorldVisualLayer
} from "../src/visuals/WorldVisualLayer";
import {
  WORLD_ARTWORK_CONTRACT,
  calculateWorldPlateTransform
} from "../src/visuals/world-plate-transform";

const MATRIX = [
  [390, 844],
  [844, 390],
  [1024, 1024],
  [1440, 900],
  [2560, 1080]
] as const;
const campaignStyles = readFileSync(
  "src/styles/campaign.css",
  "utf8"
);
const PAUSE_ACTION_SELECTOR = "[data-campaign-pause-screen] .amso-campaign__actions";

function isPauseActionRule(rule: CSSRule): rule is CSSStyleRule {
  return rule instanceof CSSStyleRule && rule.selectorText === PAUSE_ACTION_SELECTOR;
}

function setTestViewport(width: number, height: number): void {
  const happyDOM = (window as unknown as {
    happyDOM: { setWindowSize(size: { width: number; height: number }): void };
  }).happyDOM;
  happyDOM.setWindowSize({ width, height });
}

function createShell(): CampaignShell {
  vi.stubGlobal("ResizeObserver", class {
    public observe(): void {}
    public disconnect(): void {}
    public unobserve(): void {}
  });
  const callbacks: CampaignShellCallbacks = {
    onStart: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onRestart: vi.fn(),
    onReturnToMenu: vi.fn(),
    onRetryLoad: vi.fn(),
    onJump: vi.fn(),
    onSlide: vi.fn(),
    onMuteChange: vi.fn(),
    onFullscreenPreferenceChange: vi.fn(),
    onStoryContinue: vi.fn()
  };
  const style = document.createElement("style");
  style.textContent = campaignStyles;
  document.head.append(style);
  const host = document.createElement("div");
  document.body.append(host);
  return new CampaignShell(host, callbacks);
}

function scene(state: "running" | "paused"): RenderScene {
  const overhead = createObstaclePool(1)[0]!;
  Object.assign(overhead, {
    active: true,
    kind: "overhead",
    x: 420,
    y: 200,
    width: 76,
    height: 178
  });
  return {
    state,
    runner: createRunnerModel(),
    obstacles: [overhead],
    packages: [],
    boss: new BossDirector().model,
    elapsedSeconds: 1,
    distancePixels: 100,
    speed: 280,
    reducedMotion: false,
    impact: false,
    epochIndex: 0,
    epochName: "",
    epochYear: "",
    themeIndex: 0,
    cutscene: null,
    activePowerUps: [],
    worldVisual: {
      worldId: "first-mile",
      stateId: "story.first_package",
      nextStateId: "epoch_1.resolve",
      progress: 0.5
    }
  };
}

describe("responsive world release contract", () => {
  it("keeps pause actions visibly separated from bonuses across responsive layouts", () => {
    const shell = createShell();
    shell.showGame("challenge");
    shell.setPaused(true);

    const pauseScreen = document.querySelector<HTMLElement>("[data-campaign-pause-screen]")!;
    const pauseActions = pauseScreen.querySelector<HTMLElement>(".amso-campaign__actions")!;
    const pauseBonuses = pauseScreen.querySelector<HTMLElement>(".amso-campaign__pause-bonuses")!;
    const buttons = [...pauseActions.querySelectorAll<HTMLButtonElement>("button")];
    const rules = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]);
    const baseRule = rules.find(isPauseActionRule);
    const compactMediaRule = rules.find((rule): rule is CSSMediaRule =>
      rule instanceof CSSMediaRule &&
      rule.conditionText === "(orientation: landscape) and (max-height: 520px)"
    );
    const compactRule = [...(compactMediaRule?.cssRules ?? [])].find(isPauseActionRule);
    const initialViewport = [window.innerWidth, window.innerHeight] as const;

    expect(pauseScreen.hidden).toBe(false);
    expect(pauseScreen.querySelector("h2")?.textContent).toBe("Gra wstrzymana");
    expect(pauseBonuses.querySelector("strong")?.textContent).toBe("Bonusy");
    expect([...pauseBonuses.querySelectorAll("span")].map(({ textContent }) => textContent))
      .toEqual([
        "×2 WYNIK — przez 7 s podwaja punkty za zamówienia.",
        "GWARANCJA AMSO CARE — uratuje jedną próbę w Trybie Wyzwania."
      ]);
    expect(buttons.map(({ textContent }) => textContent)).toEqual(["Wznów", "Wróć do menu"]);
    expect(getComputedStyle(pauseActions).justifyContent).toBe("center");
    expect(baseRule).toBeDefined();
    expect(campaignStyles).toContain(
      `${PAUSE_ACTION_SELECTOR} {\n` +
      "  margin-top: clamp(20px, 3vw, 28px);\n" +
      "}"
    );
    expect(compactRule?.style.marginTop).toBe("16px");
    expect(rules.indexOf(compactMediaRule!)).toBeGreaterThan(rules.indexOf(baseRule!));

    setTestViewport(1440, 900);
    expect(window.matchMedia(compactMediaRule!.conditionText).matches).toBe(false);
    setTestViewport(844, 390);
    expect(window.matchMedia(compactMediaRule!.conditionText).matches).toBe(true);
    setTestViewport(initialViewport[0], initialViewport[1]);

    shell.destroy();
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it.each(MATRIX.flatMap(([width, height]) => [
    [width, height, 1] as const,
    [width, height, 2] as const
  ]))("keeps gameplay, two-panel parallax and pause on one plate at %s × %s DPR %s", async (
    width,
    height,
    dpr
  ) => {
    const transform = calculateWorldPlateTransform(width, height, WORLD_ARTWORK_CONTRACT)!;
    const host = document.createElement("div");
    const images: HTMLImageElement[] = [];
    const store = new WorldAssetStore(() => {
      const image = document.createElement("img");
      Object.defineProperties(image, {
        complete: { configurable: true, value: false },
        naturalWidth: { configurable: true, value: 1780 },
        naturalHeight: { configurable: true, value: 941 },
        decode: { configurable: true, value: vi.fn(async () => undefined) }
      });
      images.push(image);
      return image;
    });
    const layer = new WorldVisualLayer(host, store);
    layer.applyGeometry(transform);
    const plate = host.querySelector<HTMLElement>("[data-world-plate]")!;
    const initialRect = [plate.style.left, plate.style.top, plate.style.width, plate.style.height];
    layer.show({
      worldId: "first-mile",
      stateId: "story.first_package",
      phase: "game"
    });
    images[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.show({
      worldId: "order-process",
      stateId: "epoch_1.challenge",
      phase: "game"
    });
    images.find(({ src }) => src.includes("world-02-order-process"))!
      .dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(host.dataset.assetState).toBe("loaded"));
    layer.setPaused(true);
    await vi.waitFor(() => {
      expect(host.querySelector<HTMLImageElement>('[data-world-panel="next"]')
        ?.dataset.presentationReady).toBe("true");
    });
    layer.setPaused(false);
    layer.setParallaxDistance(480, true);
    expect([plate.style.left, plate.style.top, plate.style.width, plate.style.height])
      .toEqual(initialRect);
    const panels = [...host.querySelectorAll<HTMLImageElement>("[data-world-panel]")];
    expect(new Set(panels.map(({ dataset }) => dataset.assetPath))).toEqual(new Set([
      "/assets/milion-runner/worlds/world-01-first-mile-v2.webp",
      "/assets/milion-runner/worlds/world-02-order-process-v2.webp"
    ]));
    expect(new Set(panels.map(({ style }) => style.transform))).toEqual(new Set([
      "translate3d(-50%, 0, 0)",
      "translate3d(50%, 0, 0)"
    ]));
    const route = plate.querySelector<SVGElement>(".amso-world-visual__route")!;
    const routeGroundY = transform.plateRect.y + Number.parseFloat(route.style.top) +
      432 * Number.parseFloat(route.style.height) / 540;
    expect(routeGroundY).toBeCloseTo(
      transform.plateRect.y + 771 * transform.artScale,
      5
    );

    const shell = createShell();
    const stage = document.querySelector<HTMLElement>("[data-campaign-stage]")!;
    stage.style.width = `${width}px`;
    stage.style.height = `${height}px`;
    shell.showGame("challenge");
    shell.setPaused(true);
    const pauseOverlay = stage.querySelector<HTMLElement>("[data-campaign-pause-screen]")!;
    const pauseStyle = getComputedStyle(pauseOverlay);
    expect(pauseOverlay.hidden).toBe(false);
    expect(pauseOverlay.parentElement).toBe(stage);
    expect(pauseOverlay.closest("[data-world-plate]")).toBeNull();
    expect(pauseStyle.position).toBe("absolute");
    expect(pauseStyle.getPropertyValue("inset")).toMatch(/^0(?:px)?$/u);
    expect([stage.style.width, stage.style.height]).toEqual([`${width}px`, `${height}px`]);

    for (const state of ["running", "paused"] as const) {
      const rects: number[][] = [];
      const scales: number[][] = [];
      const moveTos: number[][] = [];
      const lineTos: number[][] = [];
      const fillRects: number[][] = [];
      const target: Record<PropertyKey, unknown> = {
        rect: (...values: number[]) => rects.push(values),
        scale: (...values: number[]) => scales.push(values),
        moveTo: (...values: number[]) => moveTos.push(values),
        lineTo: (...values: number[]) => lineTos.push(values),
        fillRect: (...values: number[]) => fillRects.push(values),
        createLinearGradient: () => ({ addColorStop(): void {} })
      };
      const context = new Proxy(target, {
        get(record, key) { return key in record ? record[key] : vi.fn(); },
        set(record, key, value) { record[key] = value; return true; }
      }) as unknown as CanvasRenderingContext2D;
      const renderer = new WarehouseRenderer();
      renderer.applyGeometry(transform, { width, height, dpr });
      renderer.render(context, width * dpr, height * dpr, scene(state));

      expect(rects[0]).toEqual([
        transform.plateRect.x,
        transform.plateRect.y,
        transform.plateRect.width,
        transform.plateRect.height
      ]);
      expect(scales[0]).toEqual([transform.worldScale, transform.worldScale]);
      expect(moveTos).toContainEqual([-12, 437]);
      expect(lineTos).toContainEqual([972, 437]);
      expect(fillRects).toContainEqual([412, 0, 10, 208]);
    }
    shell.destroy();
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

});
