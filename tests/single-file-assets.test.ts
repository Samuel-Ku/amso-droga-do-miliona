import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EMBEDDED_AVIF_MAX_LENGTH,
  EMBEDDED_WEBP_MAX_LENGTH
} from "../src/config/schema";
import {
  WORLD_ARTWORK_CONTRACT,
  calculateWorldPlateTransform
} from "../src/visuals/world-plate-transform";

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
  "/assets/milion-runner/brand/million-neutral-main.svg",
  "/assets/milion-runner/brand/million-neutral-compact.svg",
  "/assets/milion-runner/courier/courier-run-sheet.webp",
  "/assets/milion-runner/courier/courier-jump-sheet.webp",
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

  it("declares a self-contained favicon so preview captures stay console-clean", () => {
    expect(productionEntry).toMatch(
      /<link\s+rel="icon"\s+href="data:image\/svg\+xml,[^"]+"\s*\/?>/i
    );
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
    // watchdog + embedded runner config + app bundle
    expect(inlineScripts.length).toBeGreaterThanOrEqual(3);
    expect(
      inlineScripts.some((script) => script[1]?.includes("campaignScripting"))
    ).toBe(true);
    expect(
      inlineScripts.some((script) => script[1]?.includes("__RUNNER_CONFIG__"))
    ).toBe(true);
    const appScript = inlineScripts.find((script) =>
      script[1]?.includes("AMSO campaign bootstrap failed")
    );
    expect(appScript?.[1]).toContain("AMSO campaign bootstrap failed");
    const bootMarkupPosition = qaPreview.indexOf(
      '<section class="amso-campaign-boot" data-campaign-boot'
    );
    const watchdogPosition = qaPreview.indexOf("campaignScripting");
    const appPosition = qaPreview.lastIndexOf("AMSO campaign bootstrap failed");
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

    expect(embeddedAvifs.size).toBe(0);
    for (const embeddedAvif of embeddedAvifs) {
      expect(embeddedAvif.length).toBeLessThanOrEqual(
        EMBEDDED_AVIF_MAX_LENGTH
      );
    }
    const embeddedWebps = new Set(
      qaPreview.match(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g) ?? []
    );
    for (const embeddedWebp of embeddedWebps) {
      expect(embeddedWebp.length).toBeLessThanOrEqual(
        EMBEDDED_WEBP_MAX_LENGTH
      );
    }
    // Seven worlds, two atlases, run + crouch + jump couriers, four parcel frames,
    // four ground/primary obstacles, two extra overhead variants and exact A.
    expect(embeddedWebps.size).toBe(20);
    const embeddedSvgs = new Set(
      qaPreview.match(/data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+/g) ?? []
    );
    expect(embeddedSvgs.size).toBe(2);
  });

  it("embeds the runner config so it can load from a file:// origin", () => {
    const match = qaPreview.match(
      /window\.__RUNNER_CONFIG__=([^]*?)<\/script>/
    );
    expect(match).not.toBeNull();
    const embedded = JSON.parse(match?.[1] ?? "null");
    expect(embedded.schemaVersion).toBe(4);
    expect(embedded.enabled).toBe(true);
    const threshold =
      embedded.millionThreshold ?? embedded.story?.millionThreshold;
    expect(threshold).toBeTruthy();
    expect(threshold.orderTarget ?? threshold.counterTarget).toBeGreaterThan(0);
  });

  it("contains the same canonical geometry runtime as the development build", () => {
    const assignment = "window.__RUNNER_MODULE__=";
    const assignmentStart = qaPreview.indexOf(assignment);
    const valueStart = assignmentStart + assignment.length;
    const valueEnd = qaPreview.indexOf("</script>", valueStart);
    const moduleSource = JSON.parse(qaPreview.slice(valueStart, valueEnd)) as string;
    const metadataIndex = moduleSource.indexOf("artWidth: 1780");
    const sectionEnd = moduleSource.indexOf("//#endregion", metadataIndex);
    const geometrySection = moduleSource.slice(metadataIndex - 100, sectionEnd);
    const metadataMatch = geometrySection.match(
      /([A-Za-z_$][\w$]*)\s*=\s*Object\.freeze\((\{\s*artWidth:\s*1780,\s*artHeight:\s*941,\s*artGroundY:\s*771\s*\})\);/u
    );
    const calculateMatch = geometrySection.match(
      /(function\s+([A-Za-z_$][\w$]*)\(e, t, n\)\s*\{\s*if\s*\(!Number\.isFinite[\s\S]*\n\})\s*$/u
    );
    expect(metadataMatch).not.toBeNull();
    expect(calculateMatch).not.toBeNull();
    const metadataName = metadataMatch![1]!;
    const calculateName = calculateMatch![2]!;
    const artifact = new Function(
      `const ${metadataName} = Object.freeze(${metadataMatch![2]});` +
      `${calculateMatch![1]};` +
      `return { metadata: ${metadataName}, calculate: ${calculateName} };`
    )() as {
      metadata: typeof WORLD_ARTWORK_CONTRACT;
      calculate: typeof calculateWorldPlateTransform;
    };

    expect(artifact.metadata).toEqual(WORLD_ARTWORK_CONTRACT);
    for (const [width, height] of [
      [390, 844],
      [844, 390],
      [1024, 1024],
      [1440, 900],
      [2560, 1080]
    ] as const) {
      expect(artifact.calculate(width, height, artifact.metadata)).toEqual(
        calculateWorldPlateTransform(width, height, WORLD_ARTWORK_CONTRACT)
      );
    }
    expect(artifact.calculate(0, 900, artifact.metadata)).toBeNull();
    expect(moduleSource).toContain("world_geometry_coordinator_destroyed");
    expect(moduleSource).toContain("data-world-plate");
    expect(moduleSource).toContain("measurementsReceived");
    expect(moduleSource).not.toContain("drawFullWidthGameplayRoute");
  });
});
