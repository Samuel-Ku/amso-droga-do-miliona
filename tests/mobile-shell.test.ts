// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CampaignShell,
  isCampaignViewportTooNarrow,
  type CampaignShellCallbacks
} from "../src/ui/CampaignShell";

function createShell(overrides: Partial<CampaignShellCallbacks> = {}): CampaignShell {
  const callbacks: CampaignShellCallbacks = {
    onStart: vi.fn(), onPause: vi.fn(), onResume: vi.fn(), onRestart: vi.fn(),
    onReturnToMenu: vi.fn(), onRetryLoad: vi.fn(), onJump: vi.fn(), onSlide: vi.fn(),
    onMuteChange: vi.fn(), onFullscreenPreferenceChange: vi.fn(), onStoryContinue: vi.fn(),
    ...overrides
  };
  const host = document.createElement("div");
  document.body.append(host);
  return new CampaignShell(host, callbacks);
}

describe("mobile campaign shell", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    Object.defineProperties(window, {
      innerWidth: { configurable: true, value: 960 },
      innerHeight: { configurable: true, value: 315 },
      matchMedia: {
        configurable: true,
        value: vi.fn(() => ({
          matches: true,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }))
      }
    });
  });

  it("does not duplicate the million badge below the landing records", () => {
    const shell = createShell();

    expect(document.querySelector("[data-campaign-landing-milestone]")).toBeNull();
    shell.destroy();
  });

  it("uses the header logo instead of a duplicate landing campaign link", () => {
    const shell = createShell();

    expect(document.querySelector(".amso-million-runner-2026__landing-campaign-link")).toBeNull();
    expect(document.querySelector<HTMLAnchorElement>(
      ".amso-million-runner-2026__brand[data-campaign-link]"
    )?.getAttribute("href")).toBe("/million");
    shell.destroy();
  });

  it("hides the contextual HUD panel while keeping gameplay stats available", () => {
    const shell = createShell();
    const context = document.querySelector<HTMLElement>(".amso-million-runner-2026__hud-context")!;
    const stats = document.querySelector<HTMLElement>(".amso-million-runner-2026__hud-stats")!;

    expect(context.hidden).toBe(true);
    expect(stats.hidden).toBe(false);
    shell.destroy();
  });

  it("keeps a newer identical pickup notice visible for its own full lifetime", () => {
    vi.useFakeTimers();
    const shell = createShell();
    const notice = document.querySelector<HTMLElement>("[data-campaign-hud-notice]")!;

    shell.showPickupNotice("+100", "parcel", 600);
    const firstPulse = notice.dataset.pulse;
    vi.advanceTimersByTime(400);
    shell.showPickupNotice("+100", "parcel", 600);
    expect(notice.dataset.pulse).toBeDefined();
    expect(notice.dataset.pulse).not.toBe(firstPulse);
    vi.advanceTimersByTime(250);
    expect(notice.hidden).toBe(false);
    vi.advanceTimersByTime(350);
    expect(notice.hidden).toBe(true);
    shell.destroy();
    vi.useRealTimers();
  });

  it("accepts a wide Android landscape viewport while preserving minimums", () => {
    expect(isCampaignViewportTooNarrow(960, 315)).toBe(false);
    expect(isCampaignViewportTooNarrow(640, 280)).toBe(false);
    expect(isCampaignViewportTooNarrow(568, 320)).toBe(true);
    expect(isCampaignViewportTooNarrow(479, 320)).toBe(true);
    expect(isCampaignViewportTooNarrow(960, 219)).toBe(true);
    expect(isCampaignViewportTooNarrow(279, 844)).toBe(true);
    expect(isCampaignViewportTooNarrow(390, 844)).toBe(false);
  });

  it("opens compact instructions as an overlay and restores focus without scrolling the page", () => {
    Object.defineProperties(window, {
      innerWidth: { configurable: true, value: 844 },
      innerHeight: { configurable: true, value: 390 }
    });
    const shell = createShell();
    shell.showLanding({ challengeUnlocked: true, fullscreenPreference: null, muted: false });
    const root = document.querySelector<HTMLElement>(".amso-million-runner-2026")!;
    const trigger = document.querySelector<HTMLElement>("[data-campaign-how-to-trigger]")!;
    const overlay = document.querySelector<HTMLElement>("[data-campaign-how-to-panel]")!;

    expect(root.dataset.mobileLayout).toBe("true");
    expect(overlay.hidden).toBe(true);
    trigger.click();
    expect(overlay.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(overlay.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    shell.destroy();
  });

  it("turns the fullscreen control into an honest CSS game mode without the API", async () => {
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: false
    });
    const shell = createShell();
    const root = document.querySelector<HTMLElement>(".amso-million-runner-2026")!;
    const button = document.querySelector<HTMLButtonElement>("[data-campaign-fullscreen]")!;

    expect(button.textContent).toContain("Tryb gry");
    button.click();
    await vi.waitFor(() => expect(root.dataset.cssGameMode).toBe("true"));
    expect(button.getAttribute("aria-pressed")).toBe("true");

    button.click();
    await vi.waitFor(() => expect(root.dataset.cssGameMode).toBeUndefined());
    expect(button.getAttribute("aria-pressed")).toBe("false");
    shell.destroy();
  });

  it("falls back to CSS game mode when the fullscreen promise is rejected", async () => {
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: true
    });
    const onFullscreenPreferenceChange = vi.fn();
    const shell = createShell({ onFullscreenPreferenceChange });
    const root = document.querySelector<HTMLElement>(".amso-million-runner-2026")!;
    Object.defineProperty(root, "requestFullscreen", {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error("fullscreen_denied"))
    });
    const button = document.querySelector<HTMLButtonElement>("[data-campaign-fullscreen]")!;

    button.click();
    await vi.waitFor(() => expect(root.dataset.cssGameMode).toBe("true"));
    expect(button.textContent).toContain("Wyjdź z trybu gry");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(onFullscreenPreferenceChange).not.toHaveBeenCalledWith("fullscreen");
    shell.destroy();
  });

  it("enters and exits the real Fullscreen API when the browser supports it", async () => {
    let fullscreenElement: Element | null = null;
    Object.defineProperties(document, {
      fullscreenEnabled: { configurable: true, value: true },
      fullscreenElement: { configurable: true, get: () => fullscreenElement },
      exitFullscreen: {
        configurable: true,
        value: vi.fn(async () => {
          fullscreenElement = null;
          document.dispatchEvent(new Event("fullscreenchange"));
        })
      }
    });
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value: vi.fn(async function requestFullscreen(this: HTMLElement) {
        fullscreenElement = this;
        document.dispatchEvent(new Event("fullscreenchange"));
      })
    });
    const shell = createShell();
    const button = document.querySelector<HTMLButtonElement>("[data-campaign-fullscreen]")!;

    button.click();
    await vi.waitFor(() => expect(button.textContent).toContain("Wyjdź z pełnego"));
    expect(button.getAttribute("aria-pressed")).toBe("true");
    button.click();
    await vi.waitFor(() => expect(button.textContent).toContain("Pełny ekran"));
    expect(button.getAttribute("aria-pressed")).toBe("false");
    shell.destroy();
    delete (HTMLElement.prototype as Partial<HTMLElement>).requestFullscreen;
  });

  it("requests fullscreen from the Play with AMSO history gesture", async () => {
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: true
    });
    const onStart = vi.fn();
    const shell = createShell({ onStart });
    shell.showLanding({ challengeUnlocked: false, fullscreenPreference: null, muted: false });
    const root = document.querySelector<HTMLElement>(".amso-million-runner-2026")!;
    let resolveFullscreen!: () => void;
    const fullscreenSettled = new Promise<void>((resolve) => {
      resolveFullscreen = resolve;
    });
    const requestFullscreen = vi.fn().mockReturnValue(fullscreenSettled);
    Object.defineProperty(root, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen
    });

    document.querySelector<HTMLButtonElement>(
      ".amso-million-runner-2026__landing-actions button"
    )!.click();

    expect(requestFullscreen).toHaveBeenCalledWith({ navigationUI: "hide" });
    expect(document.querySelector<HTMLButtonElement>(
      ".amso-million-runner-2026__landing-actions button"
    )!.disabled).toBe(true);
    expect(onStart).not.toHaveBeenCalled();
    resolveFullscreen();
    await vi.waitFor(() => {
      expect(onStart).toHaveBeenCalledWith({ mode: "story", restartStory: false });
    });
    expect(root.dataset.cssGameMode).toBe("true");
    shell.destroy();
  });

  it("uses a bounded CSS fallback when fullscreen does not settle", async () => {
    vi.useFakeTimers();
    let fullscreenElement: Element | null = null;
    const exitFullscreen = vi.fn(async () => {
      fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    Object.defineProperties(document, {
      fullscreenEnabled: { configurable: true, value: true },
      fullscreenElement: { configurable: true, get: () => fullscreenElement },
      exitFullscreen: { configurable: true, value: exitFullscreen }
    });
    const onStart = vi.fn();
    const onPause = vi.fn();
    const shell = createShell({ onStart, onPause });
    shell.showLanding({ challengeUnlocked: false, fullscreenPreference: null, muted: false });
    const root = document.querySelector<HTMLElement>(".amso-million-runner-2026")!;
    let resolveFullscreen!: () => void;
    Object.defineProperty(root, "requestFullscreen", {
      configurable: true,
      value: vi.fn(() => new Promise<void>((resolve) => {
        resolveFullscreen = resolve;
      }))
    });
    const animationFrame = vi.spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        window.setTimeout(() => callback(0), 16);
        return 1;
      });

    document.querySelector<HTMLButtonElement>(
      ".amso-million-runner-2026__landing-actions button"
    )!.click();
    await vi.advanceTimersByTimeAsync(500);

    expect(root.dataset.cssGameMode).toBe("true");
    expect(onStart).toHaveBeenCalledWith({ mode: "story", restartStory: false });
    fullscreenElement = root;
    document.dispatchEvent(new Event("fullscreenchange"));
    resolveFullscreen();
    await vi.runAllTimersAsync();
    expect(exitFullscreen).toHaveBeenCalledTimes(1);
    expect(fullscreenElement).toBeNull();
    expect(root.dataset.cssGameMode).toBe("true");
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onPause).not.toHaveBeenCalled();
    animationFrame.mockRestore();
    shell.destroy();
    vi.useRealTimers();
  });

  it("locks the landing path while the story fullscreen request is pending", async () => {
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: true
    });
    const onStart = vi.fn();
    const shell = createShell({ onStart });
    shell.showLanding({ challengeUnlocked: true, fullscreenPreference: null, muted: false });
    const root = document.querySelector<HTMLElement>(".amso-million-runner-2026")!;
    let resolveFullscreen!: () => void;
    Object.defineProperty(root, "requestFullscreen", {
      configurable: true,
      value: vi.fn(() => new Promise<void>((resolve) => {
        resolveFullscreen = resolve;
      }))
    });
    const buttons = [...document.querySelectorAll<HTMLButtonElement>(
      ".amso-million-runner-2026__landing-actions button"
    )];
    const storyButton = buttons.find((button) => button.classList.contains(
      "amso-million-runner-2026__button--secondary"
    ))!;
    const challengeButton = buttons.find((button) => button !== storyButton)!;

    storyButton.click();
    expect(buttons.every((button) => button.disabled)).toBe(true);
    challengeButton.click();
    expect(onStart).not.toHaveBeenCalled();
    resolveFullscreen();
    await vi.waitFor(() => expect(onStart).toHaveBeenCalledTimes(1));
    expect(onStart).toHaveBeenCalledWith({ mode: "story", restartStory: true });
    shell.destroy();
  });

  it("accepts gameplay input from the full canvas but blocks it under system UI", () => {
    const onJump = vi.fn();
    const shell = createShell({ onJump });
    shell.showGame("challenge");
    const canvas = document.querySelector<HTMLCanvasElement>("[data-campaign-canvas]")!;

    canvas.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      isPrimary: true,
      clientX: 2,
      clientY: 2,
      pointerType: "mouse"
    }));
    expect(onJump).toHaveBeenCalledWith("pointer");

    shell.setPaused(true);
    expect(document.querySelector<HTMLElement>(".amso-million-runner-2026__world-visual")
      ?.dataset.paused).toBe("true");
    canvas.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      isPrimary: true,
      clientX: 2,
      clientY: 2,
      pointerType: "mouse"
    }));
    expect(onJump).toHaveBeenCalledTimes(1);
    shell.showGame("challenge");
    expect(document.querySelector<HTMLElement>(".amso-million-runner-2026__world-visual")
      ?.dataset.paused).toBe("false");
    shell.destroy();
  });

  it("maps a mobile tap to jump and a downward swipe to held slide", () => {
    const onJump = vi.fn();
    const onSlide = vi.fn();
    const shell = createShell({ onJump, onSlide });
    shell.showGame("challenge");
    const canvas = document.querySelector<HTMLCanvasElement>("[data-campaign-canvas]")!;
    const touch = (type: string, y: number) => new PointerEvent(type, {
      bubbles: true,
      button: 0,
      isPrimary: true,
      clientX: 20,
      clientY: y,
      pointerType: "touch"
    });

    canvas.dispatchEvent(touch("pointerdown", 20));
    canvas.dispatchEvent(touch("pointerup", 20));
    canvas.dispatchEvent(touch("pointerdown", 20));
    canvas.dispatchEvent(touch("pointermove", 50));
    canvas.dispatchEvent(touch("pointerup", 50));

    expect(onJump).toHaveBeenCalledExactlyOnceWith("touch");
    expect(onSlide.mock.calls).toEqual([
      [true, "touch"],
      [false, "touch"]
    ]);
    shell.destroy();
  });
});
