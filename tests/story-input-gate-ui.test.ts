// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CampaignShell, type CampaignShellCallbacks } from "../src/ui/CampaignShell";

function createShell(): {
  shell: CampaignShell;
  callbacks: CampaignShellCallbacks;
  onStoryContinue: ReturnType<typeof vi.fn>;
  onSlide: ReturnType<typeof vi.fn>;
} {
  const onStoryContinue = vi.fn();
  const onSlide = vi.fn();
  const callbacks: CampaignShellCallbacks = {
    onStart: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onRestart: vi.fn(),
    onReturnToMenu: vi.fn(),
    onRetryLoad: vi.fn(),
    onJump: vi.fn(),
    onSlide,
    onMuteChange: vi.fn(),
    onFullscreenPreferenceChange: vi.fn(),
    onStoryContinue,
  };
  const host = document.createElement("div");
  document.body.append(host);
  return { shell: new CampaignShell(host, callbacks), callbacks, onStoryContinue, onSlide };
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

describe("story input safety gate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("discards early Space, Enter, click and tap instead of queueing them", () => {
    const { shell, onStoryContinue } = createShell();
    const button = showScene(shell);

    expect(button.disabled).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { code: "Enter", key: "Enter", bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    button.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
    button.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch" }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    vi.advanceTimersByTime(1_500);
    expect(button.disabled).toBe(false);
    expect(onStoryContinue).not.toHaveBeenCalled();

    document.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { code: "Enter", key: "Enter", bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onStoryContinue).toHaveBeenCalledTimes(1);
    expect(onStoryContinue).toHaveBeenCalledWith("story.client");
    shell.destroy();
  });

  it("uses a 500 ms lock when reduced motion is requested", () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const { shell } = createShell();
    const button = showScene(shell);

    vi.advanceTimersByTime(499);
    expect(button.disabled).toBe(true);
    vi.advanceTimersByTime(1);
    expect(button.disabled).toBe(false);
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
});
