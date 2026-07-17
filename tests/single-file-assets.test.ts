import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EMBEDDED_AVIF_MAX_LENGTH } from "../src/config/schema";

const qaPreview = readFileSync(
  new URL("../droga-do-miliona-qa.html", import.meta.url),
  "utf8"
);
const productionEntry = readFileSync(
  new URL("../index.html", import.meta.url),
  "utf8"
);
const campaignStyles = readFileSync(
  new URL("../src/styles/campaign.css", import.meta.url),
  "utf8"
);

const campaignImagePaths = [
  "/assets/milion-runner/brand/mz-main-lockup-v1.avif",
  "/assets/milion-runner/brand/mz-compact-lockup-v1.avif",
  "/assets/milion-runner/worlds/world-01-first-mile-v2.webp",
  "/assets/milion-runner/worlds/world-02-order-process-v2.webp",
  "/assets/milion-runner/worlds/world-03-quality-service-v2.webp",
  "/assets/milion-runner/worlds/world-04-client-paths-v2.webp",
  "/assets/milion-runner/worlds/world-05-scale-logistics-v2.webp",
  "/assets/milion-runner/worlds/world-06-million-approach-v2.webp",
  "/assets/milion-runner/worlds/world-07-million-finale-v2.webp"
] as const;

describe("single-file QA artwork", () => {
  it("keeps the production entry compatible with a self-only script and style CSP", () => {
    expect(productionEntry).not.toContain("<style");
    const scripts = [...productionEntry.matchAll(/<script([^>]*)><\/script>/gi)];
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) {
      expect(script[1]).toMatch(/\bsrc="[^"]+"/i);
    }
  });

  it("parses the visible boot fallback before loading its watchdog", () => {
    const bootPosition = productionEntry.indexOf("data-campaign-boot");
    const watchdogPosition = productionEntry.indexOf("boot-watchdog.js");

    expect(bootPosition).toBeGreaterThan(-1);
    expect(watchdogPosition).toBeGreaterThan(bootPosition);
  });

  it("shows a readable boot state before JavaScript initializes the campaign", () => {
    const campaignRoot = qaPreview.match(
      /<main id="amso-campaign-root"[^>]*>([\s\S]*?)<\/main>/
    )?.[1];

    expect(campaignRoot).toContain("data-campaign-boot");
    expect(campaignRoot).toContain("Droga do Miliona");
  });

  it("provides recovery states when campaign JavaScript fails or is disabled", () => {
    expect(qaPreview).toContain("campaignScripting");
    expect(qaPreview).toContain("data-campaign-noscript");
    expect(qaPreview).toContain("otwórz ją w innej przeglądarce");
    expect(campaignStyles).toMatch(
      /\[data-campaign-js-only\]\s*{\s*display:\s*none;/
    );
    expect(campaignStyles).toMatch(
      /html\[data-campaign-scripting="enabled"\]\s+\[data-campaign-js-only\]\s*{\s*display:\s*inline;/
    );
    expect(campaignStyles).toMatch(
      /html\[data-campaign-scripting="enabled"\]\s+\[data-campaign-noscript\]\s*{\s*display:\s*none;/
    );
  });

  it("inlines parseable watchdog and app scripts for direct file opening", () => {
    expect(qaPreview).not.toMatch(/<script[^>]+src=/i);
    expect(qaPreview).not.toMatch(/<link[^>]+rel="stylesheet"/i);

    const inlineScripts = [
      ...qaPreview.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)
    ];
    expect(inlineScripts).toHaveLength(2);
    expect(inlineScripts[0]?.[1]).toContain("campaignScripting");
    expect(inlineScripts[1]?.[1]).toContain("AMSO campaign bootstrap failed");
    const bootMarkupPosition = qaPreview.indexOf(
      '<section class="amso-campaign-boot" data-campaign-boot'
    );
    const watchdogPosition = qaPreview.indexOf("campaignScripting");
    const appPosition = qaPreview.indexOf("AMSO campaign bootstrap failed");
    expect(bootMarkupPosition).toBeGreaterThan(-1);
    expect(watchdogPosition).toBeGreaterThan(bootMarkupPosition);
    expect(appPosition).toBeGreaterThan(watchdogPosition);
    for (const script of inlineScripts) {
      expect(() => new Function(script[1] ?? "")).not.toThrow();
    }
  });

  it("embeds every campaign image instead of retaining public URLs", () => {
    for (const assetPath of campaignImagePaths) {
      expect(qaPreview).not.toContain(assetPath);
    }

    const embeddedAvifs = new Set(
      qaPreview.match(/data:image\/avif;base64,[A-Za-z0-9+/=]+/g) ?? []
    );

    expect(embeddedAvifs.size).toBe(2);
    for (const embeddedAvif of embeddedAvifs) {
      expect(embeddedAvif.length).toBeLessThanOrEqual(
        EMBEDDED_AVIF_MAX_LENGTH
      );
    }
    const embeddedWebps = new Set(
      qaPreview.match(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g) ?? []
    );
    expect(embeddedWebps.size).toBe(10);
    const embeddedSvgs = new Set(
      qaPreview.match(/data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+/g) ?? []
    );
    expect(embeddedSvgs.size).toBe(0);
  });
});
