// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DecodedImageStore } from "../src/assets/DecodedImageStore";
import type { GameSnapshot } from "../src/game/contracts";
import {
  CampaignShell,
  type CampaignShellCallbacks,
  type CampaignShellOptions
} from "../src/ui/CampaignShell";

function createShell(options: CampaignShellOptions = {}): {
  shell: CampaignShell;
  callbacks: CampaignShellCallbacks;
  onStoryContinue: ReturnType<typeof vi.fn>;
  onJump: ReturnType<typeof vi.fn>;
  onSlide: ReturnType<typeof vi.fn>;
} {
  const onStoryContinue = vi.fn();
  const onJump = vi.fn();
  const onSlide = vi.fn();
  const callbacks: CampaignShellCallbacks = {
    onStart: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onRestart: vi.fn(),
    onReturnToMenu: vi.fn(),
    onRetryLoad: vi.fn(),
    onJump,
    onSlide,
    onMuteChange: vi.fn(),
    onFullscreenPreferenceChange: vi.fn(),
    onStoryContinue,
  };
  const host = document.createElement("div");
  document.body.append(host);
  const decodedImageStore = new DecodedImageStore({
    imageFactory: () => {
      const image = document.createElement("img");
      Object.defineProperties(image, {
        complete: { configurable: true, value: true },
        naturalWidth: { configurable: true, value: 1780 },
        naturalHeight: { configurable: true, value: 941 },
      });
      return image;
    },
  });
  return {
    shell: new CampaignShell(host, callbacks, { decodedImageStore, ...options }),
    callbacks,
    onStoryContinue,
    onJump,
    onSlide
  };
}

function showScene(shell: CampaignShell, presentationId = "story.client:budget"): HTMLButtonElement {
  shell.showStoryScene({
    sceneId: "story.client",
    presentationId,
    visualStateId: "epoch_3.business",
    title: "Budżet do 400 zł",
    body: "Klient rozpoczynał działalność.",
    vignette: "client",
    continueLabel: "Dalej",
    action: "Klient przekazuje budżet pracownikowi AMSO.",
    finalFrame: "Ten sam klient siedzi przy biurku obok pierwszego laptopa.",
  });
  const button = document.querySelector<HTMLButtonElement>("[data-campaign-story-continue]");
  if (button === null) throw new Error("Missing story continue button");
  return button;
}

function challengeSnapshot(
  worldId: GameSnapshot["visualWorldId"],
  stateId: string,
): GameSnapshot {
  return {
    mode: "challenge",
    visualWorldId: worldId,
    visualStateId: stateId,
    visualNextStateId: stateId,
    visualProgress: 0,
    visualWorldIndex: 0,
    visualTransitionPending: false,
    millionCounterValue: 0,
    milestoneCelebration: null,
    authoredWave: null,
    packagesCollected: 0,
    score: 0,
    combo: 1,
    activePowerUps: [],
    activePowerUpStatuses: [],
    storyObjectiveSegmentId: "",
  } as unknown as GameSnapshot;
}

describe("story input safety gate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLImageElement.prototype, "decode").mockResolvedValue();
    document.body.replaceChildren();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)" ? false : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("enables Dalej after world readiness without carrying a held gameplay Space into the story", async () => {
    const { shell, onStoryContinue } = createShell();
    shell.showGame("story");
    document.dispatchEvent(new KeyboardEvent("keydown", {
      code: "Space", key: " ", bubbles: true
    }));
    const button = showScene(shell);
    await shell.waitForWorldPresentation();

    expect(button.disabled).toBe(false);
    document.dispatchEvent(new KeyboardEvent("keydown", {
      code: "Space", key: " ", repeat: true, bubbles: true
    }));
    expect(onStoryContinue).not.toHaveBeenCalled();

    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onStoryContinue).toHaveBeenCalledTimes(1);
    expect(onStoryContinue).toHaveBeenCalledWith("story.client");
    shell.destroy();
  });

  it("does not expose the story continuation before the new world is ready", async () => {
    let resolveFirstDecode: () => void = () => {
      throw new Error("first decode was not requested");
    };
    let firstDecode = true;
    vi.spyOn(HTMLImageElement.prototype, "decode").mockImplementation(() => {
      if (!firstDecode) return Promise.resolve();
      firstDecode = false;
      return new Promise<void>((resolve) => { resolveFirstDecode = resolve; });
    });
    const { shell, onStoryContinue } = createShell();
    const button = showScene(shell);
    const presentation = document.querySelector<HTMLElement>(
      "[data-campaign-story-presentation]"
    );

    expect(button.disabled).toBe(true);
    expect(presentation?.hidden).toBe(true);
    button.click();
    expect(onStoryContinue).not.toHaveBeenCalled();

    resolveFirstDecode();
    await shell.waitForWorldPresentation();
    await Promise.resolve();

    expect(button.disabled).toBe(false);
    expect(presentation?.hidden).toBe(false);
    button.click();
    expect(onStoryContinue).toHaveBeenCalledWith("story.client");
    shell.destroy();
  });

  it("lets a fresh Space continue the story immediately after its world is ready", async () => {
    const { shell, onStoryContinue } = createShell();
    showScene(shell);
    await shell.waitForWorldPresentation();

    document.dispatchEvent(new KeyboardEvent("keydown", {
      code: "Space", key: " ", bubbles: true
    }));

    expect(onStoryContinue).toHaveBeenCalledTimes(1);
    expect(onStoryContinue).toHaveBeenCalledWith("story.client");
    shell.destroy();
  });

  it("keeps W as the jump key and blocks arrow keys without triggering gameplay", () => {
    const { shell, onJump } = createShell();
    shell.showGame("story");
    const w = new KeyboardEvent("keydown", { code: "KeyW", key: "w", bubbles: true, cancelable: true });
    const up = new KeyboardEvent("keydown", {
      code: "ArrowUp", key: "ArrowUp", bubbles: true, cancelable: true
    });
    const left = new KeyboardEvent("keydown", {
      code: "ArrowLeft", key: "ArrowLeft", bubbles: true, cancelable: true
    });

    document.dispatchEvent(w);
    document.dispatchEvent(up);
    document.dispatchEvent(left);

    expect(onJump.mock.calls).toEqual([["keyboard"]]);
    expect(up.defaultPrevented).toBe(true);
    expect(left.defaultPrevented).toBe(true);
    shell.destroy();
  });

  it("uses ArrowUp and ArrowDown as gameplay controls in the Vercel profile", () => {
    const { shell, onJump, onSlide } = createShell({ keyboardProfile: "vercel" });
    shell.showGame("story");
    const up = new KeyboardEvent("keydown", {
      code: "ArrowUp", key: "ArrowUp", bubbles: true, cancelable: true
    });
    const down = new KeyboardEvent("keydown", {
      code: "ArrowDown", key: "ArrowDown", bubbles: true, cancelable: true
    });

    document.dispatchEvent(up);
    document.dispatchEvent(down);
    document.dispatchEvent(new KeyboardEvent("keyup", {
      code: "ArrowDown", key: "ArrowDown", bubbles: true
    }));

    expect(onJump.mock.calls).toEqual([["keyboard"]]);
    expect(onSlide.mock.calls).toEqual([
      [true, "keyboard"],
      [false, "keyboard"]
    ]);
    expect(up.defaultPrevented).toBe(true);
    expect(down.defaultPrevented).toBe(true);
    shell.destroy();
  });

  it("documents Space, W, S and touch without advertising arrow controls", () => {
    const { shell } = createShell();
    const canvas = document.querySelector<HTMLCanvasElement>("[data-campaign-canvas]");

    expect(canvas?.getAttribute("aria-label")).toContain("Spacja lub W");
    expect(canvas?.getAttribute("aria-label")).toContain("dotknij ekranu");
    expect(canvas?.getAttribute("aria-label")).toContain("Ślizg: S");
    expect(canvas?.getAttribute("aria-label")).toContain("przesuń palcem w dół");
    expect(canvas?.getAttribute("aria-label")).not.toMatch(/[↑↓]/u);
    shell.destroy();
  });

  it("documents the restored arrow controls only in the Vercel profile", () => {
    const { shell } = createShell({ keyboardProfile: "vercel" });
    const canvas = document.querySelector<HTMLCanvasElement>("[data-campaign-canvas]");

    expect(canvas?.getAttribute("aria-label")).toContain("↑");
    expect(canvas?.getAttribute("aria-label")).toContain("↓");
    shell.destroy();
  });

  it("exposes the main action and final frame to assistive technology", () => {
    const { shell } = createShell();
    showScene(shell);
    const description = document.querySelector("[data-campaign-story-visual-description]");

    expect(description?.textContent).toContain("Klient przekazuje budżet");
    expect(description?.textContent).toContain("Ten sam klient siedzi przy biurku");
    expect(document.querySelector("[data-campaign-story-scene]")?.getAttribute("aria-describedby"))
      .toContain("amso-million-runner-2026-story-visual-description");
    shell.destroy();
  });

  it("keeps S as the held slide key and blocks ArrowDown without sliding", () => {
    const { shell, onSlide } = createShell();
    shell.showGame("story");

    document.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS", key: "s", bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyS", key: "s", bubbles: true }));
    const down = new KeyboardEvent("keydown", {
      code: "ArrowDown", key: "ArrowDown", bubbles: true, cancelable: true
    });
    document.dispatchEvent(down);
    document.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown", key: "ArrowDown", bubbles: true }));

    expect(onSlide.mock.calls).toEqual([
      [true, "keyboard"],
      [false, "keyboard"],
    ]);
    expect(down.defaultPrevented).toBe(true);
    shell.destroy();
  });

  it("blocks page-scrolling arrow defaults before gameplay starts", () => {
    const { shell, onJump, onSlide } = createShell();
    const arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].map((code) =>
      new KeyboardEvent("keydown", { code, key: code, bubbles: true, cancelable: true })
    );

    arrows.forEach((event) => document.dispatchEvent(event));

    expect(arrows.every((event) => event.defaultPrevented)).toBe(true);
    expect(onJump).not.toHaveBeenCalled();
    expect(onSlide).not.toHaveBeenCalled();
    shell.destroy();
  });

  it("blocks IdoSell arrow defaults even when a form field owns focus", () => {
    const { shell } = createShell();
    const input = document.createElement("input");
    document.body.append(input);
    const down = new KeyboardEvent("keydown", {
      code: "ArrowDown", key: "ArrowDown", bubbles: true, cancelable: true
    });

    input.dispatchEvent(down);

    expect(down.defaultPrevented).toBe(true);
    shell.destroy();
  });

  it("releases a held slide when entering and leaving a story card", () => {
    const { shell, onSlide } = createShell();
    shell.showGame("story");
    document.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS", key: "s", bubbles: true }));

    showScene(shell);
    shell.showGame("story");

    expect(onSlide.mock.calls).toEqual([
      [true, "keyboard"],
      [false, "keyboard"],
      [false, "keyboard"],
    ]);
    shell.destroy();
  });

  it("holds the new world's first frame through countdown and resumes from its local origin", () => {
    const { shell } = createShell();
    const world = document.querySelector<HTMLElement>("[data-campaign-world-visual]");
    const panels = [...document.querySelectorAll<HTMLElement>("[data-world-panel]")];

    shell.showGame("story");
    shell.updateVisualFrame(480, 0, false);
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(-50%, 0, 0)",
      "translate3d(50%, 0, 0)",
    ]);

    showScene(shell);
    expect(world?.dataset.motionState).toBe("reading");
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(0%, 0, 0)",
      "translate3d(100%, 0, 0)",
    ]);

    shell.showStoryReframe();
    shell.updateVisualFrame(600, 0, false);
    expect(world?.dataset.motionState).toBe("reading");
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(0%, 0, 0)",
      "translate3d(100%, 0, 0)",
    ]);

    shell.showStoryCountdown(3);
    shell.updateVisualFrame(600, 0, false);
    expect(world?.dataset.motionState).toBe("reading");
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(0%, 0, 0)",
      "translate3d(100%, 0, 0)",
    ]);

    shell.showStoryCountdown(2);
    shell.updateVisualFrame(600, 0, false);
    shell.showStoryCountdown(1);
    shell.updateVisualFrame(600, 0, false);
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(0%, 0, 0)",
      "translate3d(100%, 0, 0)",
    ]);

    shell.returnToGame();
    shell.updateVisualFrame(600, 0, false);
    expect(world?.dataset.motionState).toBe("moving");
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(0%, 0, 0)",
      "translate3d(100%, 0, 0)",
    ]);

    shell.updateVisualFrame(650, 0, false);
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(-5.208333333333334%, 0, 0)",
      "translate3d(94.79166666666667%, 0, 0)",
    ]);
    shell.destroy();
  });

  it("keeps the same frozen origin with reduced motion enabled", () => {
    const { shell } = createShell();
    const world = document.querySelector<HTMLElement>("[data-campaign-world-visual]");
    const panels = [...document.querySelectorAll<HTMLElement>("[data-world-panel]")];

    shell.showGame("story");
    showScene(shell);
    shell.showStoryReframe();
    shell.updateVisualFrame(600, 0, true);
    for (const value of [3, 2, 1] as const) {
      shell.showStoryCountdown(value);
      shell.updateVisualFrame(600, 0, true);
      expect(world?.dataset.motionState).toBe("reading");
      expect(world?.style.getPropertyValue("--world-phase-px")).toBe("0px");
      expect(panels.map(({ style }) => style.transform)).toEqual([
        "translate3d(0%, 0, 0)",
        "translate3d(100%, 0, 0)",
      ]);
    }

    shell.returnToGame();
    shell.updateVisualFrame(600, 0, true);
    expect(world?.style.getPropertyValue("--world-phase-px")).toBe("0px");
    shell.updateVisualFrame(650, 0, true);
    expect(world?.dataset.motionState).toBe("moving");
    expect(world?.style.getPropertyValue("--world-phase-px")).toBe("17.5px");
    expect(panels[0]?.style.transform).not.toBe("translate3d(0%, 0, 0)");
    shell.destroy();
  });

  it("applies the frozen local start to same-world and different-world transitions", async () => {
    const { shell } = createShell();
    const world = document.querySelector<HTMLElement>("[data-campaign-world-visual]");
    const panels = [...document.querySelectorAll<HTMLElement>("[data-world-panel]")];
    shell.showGame("story");

    const presentTransition = async (
      presentationId: string,
      visualStateId: string,
      absoluteDistance: number
    ): Promise<string | undefined> => {
      shell.showStoryScene({
        sceneId: presentationId,
        presentationId,
        visualStateId,
        title: presentationId,
        body: "Historia",
        vignette: "story",
        continueLabel: "Dalej"
      });
      await shell.waitForWorldPresentation();
      shell.showStoryReframe();
      shell.updateVisualFrame(absoluteDistance, 0, false);
      shell.showStoryCountdown(3);
      shell.updateVisualFrame(absoluteDistance, 0, false);
      expect(world?.dataset.motionState).toBe("reading");
      expect(panels.map(({ style }) => style.transform)).toEqual([
        "translate3d(0%, 0, 0)",
        "translate3d(100%, 0, 0)",
      ]);
      shell.returnToGame();
      shell.updateVisualFrame(absoluteDistance, 0, false);
      shell.updateVisualFrame(absoluteDistance + 10, 0, false);
      expect(world?.style.getPropertyValue("--world-phase-px")).toBe("10px");
      return world?.dataset.worldId;
    };

    const firstWorld = await presentTransition("epoch-1-challenge", "epoch_1.challenge", 400);
    const sameWorld = await presentTransition("epoch-1-resolve", "epoch_1.resolve", 800);
    const differentWorld = await presentTransition("epoch-2-resolve", "epoch_2.resolve", 1_200);

    expect(firstWorld).toBe("order-process");
    expect(sameWorld).toBe(firstWorld);
    expect(differentWorld).toBe("quality-service");
    shell.destroy();
  });

  it("keeps the seam hidden when pause prepares an atomic challenge swap", async () => {
    const { shell } = createShell();
    const seam = document.querySelector<HTMLElement>("[data-world-seam-blur]");
    const world = document.querySelector<HTMLElement>("[data-campaign-world-visual]");

    shell.showGame("challenge");
    shell.update(challengeSnapshot("first-mile", "story.first_package"));
    await shell.waitForWorldPresentation();
    shell.updateVisualFrame(240, 0, false);
    expect(seam?.hidden).toBe(true);

    shell.update(challengeSnapshot("quality-service", "epoch_2.resolve"));
    await vi.waitFor(() => expect(world?.dataset.assetState).toBe("loaded"));
    shell.setPaused(true);
    await vi.waitFor(() => {
      expect(document.querySelector<HTMLImageElement>('[data-world-panel="next"]')
        ?.dataset.presentationReady).toBe("true");
    });
    shell.setPaused(false);
    shell.updateVisualFrame(961, 0, false);
    expect(seam?.hidden).toBe(true);
    expect(seam?.dataset.betweenWorlds).toBeUndefined();

    shell.updateVisualFrame(1_921, 0, false);
    expect(seam?.hidden).toBe(true);
    shell.destroy();
  });
});
