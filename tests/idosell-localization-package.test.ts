import { describe, expect, it } from "vitest";
import { CAMPAIGN_LOCALES } from "../src/localization";
import { IDOSELL_HREFLANG, IDOSELL_LOCALE_ROWS } from "../src/localization/idosell-deployment";

describe("IdoSell localization deployment package", () => {
  it("defines one complete, self-canonical row per locale", () => {
    expect(IDOSELL_LOCALE_ROWS.map(({ locale }) => locale)).toEqual(CAMPAIGN_LOCALES);
    for (const row of IDOSELL_LOCALE_ROWS) {
      expect(row.url).toBe(row.canonical);
      expect(row.pageTitle).toBeTruthy();
      expect(row.metaDescription).toBeTruthy();
      expect(row.teaser).toBeTruthy();
      expect(row.cta).toBeTruthy();
      expect(row.socialTitle).toBeTruthy();
      expect(row.socialDescription).toBeTruthy();
      expect(row.meaningfulAlt).toBeTruthy();
    }
  });

  it("uses English as x-default and exposes all reciprocal hreflang targets", () => {
    expect(Object.keys(IDOSELL_HREFLANG)).toHaveLength(9);
    expect(IDOSELL_HREFLANG["x-default"]).toBe(IDOSELL_LOCALE_ROWS[2]!.url);
  });
});
