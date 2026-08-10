import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const packageDirectory = path.resolve("dist-idosell-external");
const readPackageFile = (name: string): string =>
  readFileSync(path.join(packageDirectory, name), "utf8");

describe("IdoSell external deployment package", () => {
  it("contains the complete handoff with stable filenames", () => {
    for (const name of [
      "idosell-snippet.html",
      "million.css",
      "million.js",
      "preview.html",
      "README.txt"
    ]) {
      expect(existsSync(path.join(packageDirectory, name)), name).toBe(true);
    }
  });

  it("keeps the CMS snippet tiny with only the fallback watchdog inline", () => {
    const snippet = readPackageFile("idosell-snippet.html");

    expect(Buffer.byteLength(snippet)).toBeLessThan(8 * 1024);
    expect(snippet).toContain('id="amso-campaign-root"');
    expect(snippet).toContain("__AMSO_PUBLIC_BASE_URL__/million.css");
    expect(snippet).toContain("__AMSO_PUBLIC_BASE_URL__/million.js");
    expect(snippet).not.toMatch(/<style(?:\s|>)/iu);
    expect(snippet).toContain("document.documentElement.dataset.campaignScripting");
    expect(snippet).toMatch(/CSP script-src hash[^\n]+sha256-/u);
    expect(
      snippet.match(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/giu),
    ).toHaveLength(1);
    expect(snippet).not.toContain("data:image/");
  });

  it("ships a directly parseable classic script with embedded campaign artwork", () => {
    const application = readPackageFile("million.js");

    expect(() => new Function(application)).not.toThrow();
    expect(application).toContain("data:image/webp;base64,");
    expect(application).toContain("data:image/avif;base64,");
    expect(application).not.toContain("__AMSO_EMBEDDED_ASSET_");
    expect(application).not.toMatch(
      /\/assets\/milion-runner\/[^`"']+\.(?:avif|svg|webp)/u,
    );
    expect(statSync(path.join(packageDirectory, "million.js")).size)
      .toBeLessThan(14 * 1024 * 1024);
  });

  it("keeps CSS scoped and provides a standalone local preview", () => {
    const css = readPackageFile("million.css");
    const preview = readPackageFile("preview.html");

    expect(css).toContain("#amso-campaign-root");
    expect(css).not.toMatch(/^body\s*\{/mu);
    expect(preview).toContain('<link rel="stylesheet" href="./million.css"');
    expect(preview).toContain('<script src="./million.js" defer></script>');
    expect(preview).toContain("document.documentElement.dataset.campaignScripting");
    expect(preview).not.toContain("__AMSO_PUBLIC_BASE_URL__");
  });
});
