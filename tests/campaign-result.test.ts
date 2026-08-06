// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CampaignShell,
  type CampaignShellCallbacks,
  type CampaignChallengeResult
} from "../src/ui/CampaignShell";

const RESULT: CampaignChallengeResult = {
  orders: 352,
  totalScore: 455_677,
  challengeScore: 450_000,
  bestScore: 455_677,
  firstChallengeResult: false,
  distanceM: 1_234,
  warrantySaves: 3
};

function createShell(): CampaignShell {
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
  const host = document.createElement("div");
  document.body.append(host);
  return new CampaignShell(host, callbacks);
}

describe("challenge result screen", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    });
  });

  it("renders only the five result metrics and keeps complete accessible labels", () => {
    const shell = createShell();

    shell.showChallengeResult(RESULT);

    const result = document.querySelector<HTMLElement>("[data-campaign-challenge-result]")!;
    const stats = result.querySelectorAll("[data-campaign-result-metric]");
    expect(stats).toHaveLength(5);
    expect(result.querySelector("[data-campaign-challenge-saves-stat]")).toBeNull();
    expect(result.querySelector("[data-campaign-restart-story]")).toBeNull();
    expect(result.textContent).not.toContain("Gwarancja AMSO Care uratowała bieg");
    expect(result.textContent).not.toContain("Pełna historia i instrukcja");

    expect(result.querySelector("[data-campaign-result-metric='orders']")?.getAttribute("aria-label"))
      .toBe("Zrealizowane zamówienia: 352");
    expect(result.querySelector("[data-campaign-result-metric='best']")?.getAttribute("aria-label"))
      .toBe("Twój rekord wyzwania: 455 677");
    expect(result.querySelector("[data-campaign-mobile-label='orders']")?.textContent)
      .toBe("Zamówienia");
    expect(result.querySelector("[data-campaign-mobile-label='best']")?.textContent)
      .toBe("Rekord");

    shell.destroy();
  });

  it("keeps actions, share panel, leaderboard, and exit link in DOM order", () => {
    const shell = createShell();
    shell.showChallengeResult(RESULT);

    const card = document.querySelector<HTMLElement>(
      "[data-campaign-challenge-result] .amso-campaign__result-card"
    )!;
    const actions = card.querySelector<HTMLElement>("[data-campaign-result-actions]")!;
    const toggle = actions.querySelector<HTMLButtonElement>("[data-campaign-toggle-share]")!;
    const panel = card.querySelector<HTMLElement>("[data-campaign-share-panel]")!;
    const leaderboard = card.querySelector<HTMLElement>("[data-campaign-result-records]")!;
    const exit = card.querySelector<HTMLElement>("[data-campaign-result-exit]")!;

    expect(Array.from(card.children).indexOf(actions))
      .toBeLessThan(Array.from(card.children).indexOf(panel));
    expect(Array.from(card.children).indexOf(panel))
      .toBeLessThan(Array.from(card.children).indexOf(leaderboard));
    expect(Array.from(card.children).indexOf(leaderboard))
      .toBeLessThan(Array.from(card.children).indexOf(exit));

    expect(panel.hidden).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-controls")).toBe(panel.id);
    toggle.click();
    expect(panel.hidden).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    toggle.click();
    expect(panel.hidden).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    shell.destroy();
  });

  it("opens mobile sharing as an overlay and restores focus on close", () => {
    Object.defineProperties(window, {
      innerWidth: { configurable: true, value: 844 },
      innerHeight: { configurable: true, value: 390 }
    });
    const shell = createShell();
    shell.showChallengeResult(RESULT);
    const root = document.querySelector<HTMLElement>(".amso-campaign")!;
    const trigger = document.querySelector<HTMLButtonElement>("[data-campaign-toggle-share]")!;
    const panel = document.querySelector<HTMLElement>("[data-campaign-share-panel]")!;
    const stage = document.querySelector<HTMLElement>("[data-campaign-stage]")!;
    const header = document.querySelector<HTMLElement>(".amso-campaign__header")!;

    expect(root.dataset.mobileLayout).toBe("true");
    trigger.click();
    expect(panel.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel.parentElement).toBe(stage);
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.getAttribute("aria-modal")).toBe("true");
    expect(header.inert).toBe(true);
    panel.querySelector<HTMLButtonElement>("[data-campaign-close-overlay]")?.click();
    expect(panel.hidden).toBe(true);
    expect(panel.getAttribute("role")).toBe("region");
    expect(panel.hasAttribute("aria-modal")).toBe(false);
    expect(header.inert).toBe(false);
    expect(document.activeElement).toBe(trigger);
    shell.destroy();
  });
});
