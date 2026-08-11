// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import {
  VERCEL_LOCALE_STORAGE_KEY,
  applyVercelCampaignLocale,
  detectVercelCampaignLocale,
  persistVercelCampaignLocale,
  safeVercelLocaleStorage,
  vercelLocaleSelectionUrl
} from "../src/localization/vercel-locale";

describe("Vercel campaign locale", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "pl";
  });

  it("uses the first supported browser language and falls back to English", () => {
    expect(detectVercelCampaignLocale(["nl-NL", "uk-UA", "pl-PL"], null)).toBe("uk");
    expect(detectVercelCampaignLocale(["nl-NL", "sv-SE"], null)).toBe("en");
  });

  it("gives a persisted manual choice priority over browser languages", () => {
    expect(detectVercelCampaignLocale(["de-DE", "en-GB"], "fr")).toBe("fr");
    expect(detectVercelCampaignLocale(["de-DE"], "unsupported")).toBe("de");
  });

  it("gives a locale URL fallback priority when storage is unavailable", () => {
    expect(detectVercelCampaignLocale(["de-DE"], null, "fr")).toBe("fr");
    expect(applyVercelCampaignLocale(document, { languages: ["de-DE"] }, null, "uk"))
      .toBe("uk");
    expect(document.documentElement.lang).toBe("uk");
  });

  it("applies and persists the selected language through the Vercel bootstrap boundary", () => {
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: ["cs-CZ", "en-GB"]
    });

    expect(applyVercelCampaignLocale(document, window.navigator, window.localStorage)).toBe("cs");
    expect(document.documentElement.lang).toBe("cs");

    persistVercelCampaignLocale("it", window.localStorage);
    expect(window.localStorage.getItem(VERCEL_LOCALE_STORAGE_KEY)).toBe("it");
    expect(applyVercelCampaignLocale(document, window.navigator, window.localStorage)).toBe("it");
  });

  it("survives a blocked localStorage getter and keeps manual choice in the URL", () => {
    const blockedWindow = {
      get localStorage(): Storage {
        throw new DOMException("Blocked", "SecurityError");
      }
    };

    expect(safeVercelLocaleStorage(blockedWindow)).toBeNull();
    expect(persistVercelCampaignLocale("fr", null)).toBe(false);
    expect(vercelLocaleSelectionUrl("https://game.example/million?qa=1#run", "fr", false))
      .toBe("https://game.example/million?qa=1&lang=fr#run");
  });
});
