// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCampaignI18n, type CampaignLocale } from "../src/localization";
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

  it("keeps the Polish campaign lockup for the Polish storefront", () => {
    const callbacks: CampaignShellCallbacks = {
      onStart: vi.fn(), onPause: vi.fn(), onResume: vi.fn(), onRestart: vi.fn(),
      onReturnToMenu: vi.fn(), onRetryLoad: vi.fn(), onJump: vi.fn(), onSlide: vi.fn(),
      onMuteChange: vi.fn(), onFullscreenPreferenceChange: vi.fn(), onStoryContinue: vi.fn()
    };
    const host = document.createElement("div");
    document.body.append(host);
    const shell = new CampaignShell(host, callbacks, { i18n: createCampaignI18n("pl") });

    expect(host.querySelector<HTMLImageElement>(".amso-million-runner-2026__main-lockup")?.getAttribute("src"))
      .toBe("/assets/milion-runner/brand/mz-main-lockup-v1.avif");
    expect(host.querySelector<HTMLImageElement>(".amso-million-runner-2026__compact-lockup")?.getAttribute("src"))
      .toBe("/assets/milion-runner/brand/mz-compact-lockup-v1.avif");

    shell.destroy();
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
    expect(host.querySelector<HTMLImageElement>(".amso-million-runner-2026__main-lockup")?.getAttribute("src"))
      .toBe("/assets/milion-runner/brand/mz-main-lockup-en-v1.webp");
    expect(host.querySelector<HTMLImageElement>(".amso-million-runner-2026__compact-lockup")?.getAttribute("src"))
      .toBe("/assets/milion-runner/brand/mz-compact-lockup-en-v1.webp");

    shell.destroy();
  });

  it("offers all eight languages in the Vercel header and reports a manual selection", () => {
    const onLanguageChange = vi.fn();
    const callbacks: CampaignShellCallbacks = {
      onStart: vi.fn(), onPause: vi.fn(), onResume: vi.fn(), onRestart: vi.fn(),
      onReturnToMenu: vi.fn(), onRetryLoad: vi.fn(), onJump: vi.fn(), onSlide: vi.fn(),
      onMuteChange: vi.fn(), onFullscreenPreferenceChange: vi.fn(), onStoryContinue: vi.fn(),
      onLanguageChange
    };
    const host = document.createElement("div");
    document.body.append(host);
    const shell = new CampaignShell(host, callbacks, {
      i18n: createCampaignI18n("uk"),
      keyboardProfile: "vercel",
      languageSelector: true
    });
    const select = host.querySelector<HTMLSelectElement>("[data-campaign-language]");

    expect(select?.value).toBe("uk");
    expect(select?.getAttribute("aria-label")).toBe("Змінити мову");
    expect(Array.from(select?.options ?? [], (option) => option.value))
      .toEqual(["pl", "de", "en", "es", "cs", "it", "fr", "uk"]);
    expect(select?.selectedOptions[0]?.textContent).toContain("🇺🇦");
    expect(host.querySelector(".amso-million-runner-2026__language-flag")?.textContent?.trim())
      .toBe("🇺🇦");

    if (!select) throw new Error("language_selector_missing");
    select.value = "fr";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(onLanguageChange).toHaveBeenCalledWith("fr");

    shell.destroy();
  });

  it.each([
    ["de", "/assets/milion-runner/brand/mz-main-lockup-de-v1.webp", "/assets/milion-runner/brand/mz-compact-lockup-de-v1.webp"],
    ["es", "/assets/milion-runner/brand/mz-main-lockup-es-v1.webp", "/assets/milion-runner/brand/mz-compact-lockup-es-v1.webp"],
    ["cs", "/assets/milion-runner/brand/mz-main-lockup-cs-v1.webp", "/assets/milion-runner/brand/mz-compact-lockup-cs-v1.webp"],
    ["it", "/assets/milion-runner/brand/mz-main-lockup-it-v1.webp", "/assets/milion-runner/brand/mz-compact-lockup-it-v1.webp"],
    ["uk", "/assets/milion-runner/brand/mz-main-lockup-uk-v1.webp", "/assets/milion-runner/brand/mz-compact-lockup-uk-v1.webp"],
    ["fr", "/assets/milion-runner/brand/mz-main-lockup-fr-v1.webp", "/assets/milion-runner/brand/mz-compact-lockup-fr-v1.webp"]
  ] satisfies ReadonlyArray<readonly [CampaignLocale, string, string]>) (
    "uses the matching %s main and compact lockups throughout the localized campaign UI",
    (locale, expectedLandingLockup, expectedCompactLockup) => {
      const callbacks: CampaignShellCallbacks = {
        onStart: vi.fn(), onPause: vi.fn(), onResume: vi.fn(), onRestart: vi.fn(),
        onReturnToMenu: vi.fn(), onRetryLoad: vi.fn(), onJump: vi.fn(), onSlide: vi.fn(),
        onMuteChange: vi.fn(), onFullscreenPreferenceChange: vi.fn(), onStoryContinue: vi.fn()
      };
      const host = document.createElement("div");
      document.body.append(host);
      const shell = new CampaignShell(host, callbacks, { i18n: createCampaignI18n(locale) });

      expect(host.querySelector<HTMLImageElement>(".amso-million-runner-2026__brand-logo")?.src)
        .toContain(expectedCompactLockup);
      expect(host.querySelector<HTMLImageElement>(".amso-million-runner-2026__main-lockup")?.src)
        .toContain(expectedLandingLockup);
      for (const selector of [
        ".amso-million-runner-2026__main-lockup",
        ".amso-million-runner-2026__result-lockup--main",
        ".amso-million-runner-2026__story-final-lockup"
      ]) {
        expect(host.querySelector<HTMLImageElement>(selector)?.src)
          .toContain(expectedLandingLockup);
      }
      for (const selector of [
        ".amso-million-runner-2026__compact-lockup",
        ".amso-million-runner-2026__result-lockup:not(.amso-million-runner-2026__result-lockup--main)",
        ".amso-million-runner-2026__share-lockup"
      ]) {
        expect(host.querySelector<HTMLImageElement>(selector)?.src)
          .toContain(expectedCompactLockup);
      }

      shell.destroy();
    }
  );

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
