// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DecodedImageStore } from "../src/assets/DecodedImageStore";
import type { GameSnapshot } from "../src/game/contracts";
import { CampaignShell, type CampaignShellCallbacks } from "../src/ui/CampaignShell";

function createShell(): {
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
    shell: new CampaignShell(host, callbacks, { decodedImageStore }),
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

  it("enables Dalej immediately without carrying a held gameplay Space into the story", () => {
    const { shell, onStoryContinue } = createShell();
    shell.showGame("story");
    document.dispatchEvent(new KeyboardEvent("keydown", {
      code: "Space", key: " ", bubbles: true
    }));
    const button = showScene(shell);

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

  it("treats W and ArrowUp as the same jump control", () => {
    const { shell, onJump } = createShell();
    shell.showGame("story");
    const w = new KeyboardEvent("keydown", { code: "KeyW", key: "w", bubbles: true, cancelable: true });
    const up = new KeyboardEvent("keydown", {
      code: "ArrowUp", key: "ArrowUp", bubbles: true, cancelable: true
    });

    document.dispatchEvent(w);
    document.dispatchEvent(up);

    expect(onJump.mock.calls).toEqual([["keyboard"], ["keyboard"]]);
    expect(up.defaultPrevented).toBe(true);
    shell.destroy();
  });

  it("documents both one-hand key pairs plus Space and touch", () => {
    const { shell } = createShell();
    const canvas = document.querySelector<HTMLCanvasElement>("[data-campaign-canvas]");

    expect(canvas?.getAttribute("aria-label")).toContain("Spacja, W lub ↑");
    expect(canvas?.getAttribute("aria-label")).toContain("dotknij ekranu");
    expect(canvas?.getAttribute("aria-label")).toContain("S lub ↓");
    expect(canvas?.getAttribute("aria-label")).toContain("przesuń palcem w dół");
    shell.destroy();
  });

  it("exposes the main action and final frame to assistive technology", () => {
    const { shell } = createShell();
    showScene(shell);
    const description = document.querySelector("[data-campaign-story-visual-description]");

    expect(description?.textContent).toContain("Klient przekazuje budżet");
    expect(description?.textContent).toContain("Ten sam klient siedzi przy biurku");
    expect(document.querySelector("[data-campaign-story-scene]")?.getAttribute("aria-describedby"))
      .toContain("amso-campaign-story-visual-description");
    shell.destroy();
  });

  it("treats S and ArrowDown as the same held slide control", () => {
    const { shell, onSlide } = createShell();
    shell.showGame("story");

    document.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS", key: "s", bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyS", key: "s", bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowDown", key: "ArrowDown", bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown", key: "ArrowDown", bubbles: true }));

    expect(onSlide.mock.calls).toEqual([
      [true, "keyboard"],
      [false, "keyboard"],
      [true, "keyboard"],
      [false, "keyboard"],
    ]);
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

  it("holds an authored story frame until the countdown starts the visual clock", () => {
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
    expect(world?.dataset.motionState).toBe("moving");
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(-62.5%, 0, 0)",
      "translate3d(37.5%, 0, 0)",
    ]);

    shell.showStoryCountdown(2);
    shell.updateVisualFrame(650, 0, false);
    shell.showStoryCountdown(1);
    shell.updateVisualFrame(700, 0, false);
    shell.returnToGame();
    shell.updateVisualFrame(750, 0, false);
    expect(world?.dataset.motionState).toBe("moving");
    expect(panels.map(({ style }) => style.transform)).toEqual([
      "translate3d(-78.125%, 0, 0)",
      "translate3d(21.875%, 0, 0)",
    ]);
    shell.destroy();
  });

  it("shows a moving seam only when challenge panels belong to different worlds", async () => {
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
    shell.updateVisualFrame(961, 0, false);
    expect(seam?.hidden).toBe(false);
    expect(seam?.dataset.betweenWorlds).toBe("first-mile:quality-service");

    shell.updateVisualFrame(1_921, 0, false);
    expect(seam?.hidden).toBe(true);
    shell.destroy();
  });
});
