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

  it("accepts a wide Android landscape viewport while preserving minimums", () => {
    expect(isCampaignViewportTooNarrow(960, 315)).toBe(false);
    expect(isCampaignViewportTooNarrow(640, 280)).toBe(false);
    expect(isCampaignViewportTooNarrow(639, 315)).toBe(true);
    expect(isCampaignViewportTooNarrow(960, 279)).toBe(true);
    expect(isCampaignViewportTooNarrow(389, 844)).toBe(true);
    expect(isCampaignViewportTooNarrow(390, 844)).toBe(false);
  });

  it("turns the fullscreen control into an honest CSS game mode without the API", async () => {
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: false
    });
    const shell = createShell();
    const root = document.querySelector<HTMLElement>(".amso-campaign")!;
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
    const root = document.querySelector<HTMLElement>(".amso-campaign")!;
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
});
