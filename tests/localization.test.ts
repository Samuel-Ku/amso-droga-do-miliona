import { describe, expect, it, vi } from "vitest";
import {
  CAMPAIGN_LOCALES,
  createCampaignI18n,
  createPseudoCampaignI18n,
  resolveCampaignLocale
} from "../src/localization";
import { CAMPAIGN_TRANSLATIONS } from "../src/localization/catalogs";

describe("campaign locale contract", () => {
  it.each([
    ["pl", "pl"],
    ["de-DE", "de"],
    ["EN-gb", "en"],
    ["es-ES", "es"],
    ["cs-CZ", "cs"],
    ["it-IT", "it"],
    ["fr-FR", "fr"],
    ["uk-UA", "uk"]
  ] as const)("resolves %s to %s", (input, expected) => {
    expect(resolveCampaignLocale(input).locale).toBe(expected);
  });

  it("uses one complete English fallback and warns for unsupported lang", () => {
    const warn = vi.fn();
    const resolved = resolveCampaignLocale("nl-NL", warn);
    const i18n = createCampaignI18n(resolved.locale);

    expect(resolved).toEqual({ locale: "en", fallback: true });
    expect(warn).toHaveBeenCalledWith("campaign_locale_fallback", "nl-NL");
    expect(i18n.translate("Droga do Miliona")).toBe("Road to a Million");
    expect(i18n.translate("Wycisz")).toBe("Mute");
  });

  it("exposes all public locales with locale-aware integer formatting", () => {
    expect(CAMPAIGN_LOCALES).toEqual(["pl", "de", "en", "es", "cs", "it", "fr", "uk"]);
    expect(createCampaignI18n("pl").formatInteger(1_000_000)).toBe("1 000 000");
    expect(createCampaignI18n("en").formatInteger(1_000_000)).toBe("1,000,000");
    expect(createCampaignI18n("de").formatInteger(1_000_000)).toBe("1.000.000");
  });

  it("keeps an identical, non-empty message contract in all catalogues", () => {
    const sourceKeys = Object.keys(CAMPAIGN_TRANSLATIONS.pl).sort();
    expect(sourceKeys.length).toBeGreaterThan(300);
    for (const locale of CAMPAIGN_LOCALES) {
      expect(Object.keys(CAMPAIGN_TRANSLATIONS[locale]).sort()).toEqual(sourceKeys);
      expect(Object.values(CAMPAIGN_TRANSLATIONS[locale]).every(Boolean)).toBe(true);
    }
  });

  it("provides a non-public expanded pseudo locale", () => {
    const pseudo = createPseudoCampaignI18n();
    const value = pseudo.translate("Droga do Miliona");
    expect(pseudo.qaPseudo).toBe(true);
    expect(value).toMatch(/^［/u);
    expect(value.length).toBeGreaterThan("Droga do Miliona".length * 1.3);
    expect(CAMPAIGN_LOCALES).not.toContain("pseudo");
  });
});
