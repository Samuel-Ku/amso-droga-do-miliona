// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCampaignI18n } from "../src/localization";
import { CampaignShell, type CampaignShellCallbacks } from "../src/ui/CampaignShell";
import { RecordsClient } from "../src/records-client";
import { RecordBoard } from "../src/ui/record-board";

describe("localized campaign public UI", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    });
  });

  it("renders the landing and accessible controls from the active English catalog", () => {
    const callbacks: CampaignShellCallbacks = {
      onStart: vi.fn(), onPause: vi.fn(), onResume: vi.fn(), onRestart: vi.fn(),
      onReturnToMenu: vi.fn(), onRetryLoad: vi.fn(), onJump: vi.fn(), onSlide: vi.fn(),
      onMuteChange: vi.fn(), onFullscreenPreferenceChange: vi.fn(), onStoryContinue: vi.fn()
    };
    const host = document.createElement("div");
    document.body.append(host);
    const shell = new CampaignShell(host, callbacks, { i18n: createCampaignI18n("en") });

    shell.showLanding({ challengeUnlocked: false, fullscreenPreference: null, muted: false });

    expect(host.querySelector("[data-campaign-copy='landingTitleAccent']")?.textContent)
      .toBe("Road to a Million");
    expect(host.querySelector("[data-campaign-mute-label]")?.textContent).toBe("Mute");
    expect(host.textContent).toContain("Help the courier");
    expect(host.textContent).not.toContain("Pomóż kurierowi");
    expect(host.querySelector("[data-campaign-how-to-trigger]")?.textContent)
      .not.toBe("Jak działa gra?");

    shell.destroy();
  });

  it("formats and announces challenge results in the active German locale", () => {
    const callbacks: CampaignShellCallbacks = {
      onStart: vi.fn(), onPause: vi.fn(), onResume: vi.fn(), onRestart: vi.fn(),
      onReturnToMenu: vi.fn(), onRetryLoad: vi.fn(), onJump: vi.fn(), onSlide: vi.fn(),
      onMuteChange: vi.fn(), onFullscreenPreferenceChange: vi.fn(), onStoryContinue: vi.fn()
    };
    const host = document.createElement("div");
    document.body.append(host);
    const shell = new CampaignShell(host, callbacks, { i18n: createCampaignI18n("de") });

    shell.showChallengeResult({
      orders: 352,
      totalScore: 455_677,
      challengeScore: 450_000,
      bestScore: 455_677,
      firstChallengeResult: false,
      distanceM: 1_234,
      warrantySaves: 0
    });

    expect(host.querySelector("[data-campaign-challenge-total]")?.textContent).toBe("455.677");
    expect(host.querySelector("[data-campaign-result-metric='total']")?.getAttribute("aria-label"))
      .not.toContain("Wynik");
    expect(host.querySelector("[data-campaign-live]")?.textContent).not.toContain("Wynik");

    shell.destroy();
  });

  it("renders leaderboard labels and values in the active Ukrainian locale", () => {
    const host = document.createElement("div");
    const board = new RecordBoard(host, new RecordsClient("/api/records"), {
      i18n: createCampaignI18n("uk")
    });

    board.renderFrom([{ name: "Олена", challengeScore: 695_741, orders: 745, updatedAt: 1 }]);

    expect(host.querySelector("caption")?.textContent).toContain("Таблиця");
    expect(host.querySelector("[data-record-score]")?.textContent).toBe("695 741");
    expect(host.textContent).toContain("745 замовлень");
    expect(host.textContent).not.toContain("Tablica rekordów");
  });
});
