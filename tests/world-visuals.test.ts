import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import {
  CAMPAIGN_WORLDS,
  ChallengeWorldDirector,
  resolvePlaySegmentVisual,
  sceneVisualState
} from "../src/visuals/scene-manifest";
import {
  WORLD_ROUTE_ACCENT_WIDTH,
  WORLD_ROUTE_BASE_COLOR,
  WORLD_ROUTE_GRADIENT_STOPS,
  WORLD_ROUTE_BASE_WIDTH,
  WORLD_ROUTE_Y
} from "../src/visuals/world-route";
import { GROUND_Y } from "../src/game/constants";

describe("world visual continuity", () => {
  it("keeps every generated background and the route on one canonical plate", () => {
    const css = readFileSync(new URL("../src/styles/campaign.css", import.meta.url), "utf8");
    const worldLayer = readFileSync(
      new URL("../src/visuals/WorldVisualLayer.ts", import.meta.url),
      "utf8"
    );
    const renderer = readFileSync(new URL("../src/game/renderer.ts", import.meta.url), "utf8");

    expect(css).not.toMatch(/\.amso-world-visual__panel\s*\{[^}]*object-fit:/u);
    expect(css).toMatch(/\.amso-world-visual__image-stack\s*\{[^}]*transition:\s*none/u);
    expect(css).toContain("--world-position-portrait");
    expect(css).toContain("--world-position-landscape");
    expect(css).not.toContain("--world-tile-blend-width");
    expect(css).not.toMatch(/\.amso-world-visual__panel\.is-leaving\s*\{/u);
    expect(worldLayer).toContain('this.host.style.setProperty("--world-overlap", "0px")');
    expect(worldLayer).toContain("data-world-plate");
    expect(worldLayer).toContain("public applyGeometry(");
    expect(worldLayer).toContain('<img class="amso-world-visual__panel"');
    expect(worldLayer).not.toContain("context.drawImage(asset.image");
    expect(renderer).not.toContain("drawFullWidthGameplayRoute");
    expect(renderer).toContain("drawGameplayRoute(context, resources.routeGradient)");
    expect(WORLD_ROUTE_Y).toBe(GROUND_Y);
    expect(WORLD_ROUTE_BASE_WIDTH).toBe(18);
    expect(WORLD_ROUTE_ACCENT_WIDTH).toBe(7);
    expect(WORLD_ROUTE_BASE_COLOR).toBe("#171717");
    expect(WORLD_ROUTE_GRADIENT_STOPS).toEqual([
      { offset: 0, color: "#f47100" },
      { offset: 0.52, color: "#f04f45" },
      { offset: 1, color: "#eb32a4" }
    ]);
    expect(renderer).toContain("WORLD_ROUTE_GRADIENT_STOPS");
    expect(renderer).toContain("createLinearGradient(0, 0, WORLD_WIDTH, 0)");
    expect(CAMPAIGN_WORLDS.every(({ assetPath }) => assetPath.endsWith("-v2.webp")))
      .toBe(true);
  });

  it("does not override canonical plate geometry at the 390 px breakpoint", () => {
    const css = readFileSync(new URL("../src/styles/campaign.css", import.meta.url), "utf8");
    const mobileRules = css.slice(css.indexOf("@media (max-width: 756px)"));

    expect(mobileRules).not.toContain("height: 42%");
  });

  it("keeps system UI and the input canvas full-stage", () => {
    const css = readFileSync(new URL("../src/styles/campaign.css", import.meta.url), "utf8");
    expect(css).toMatch(
      /\.amso-campaign__canvas\s*\{[^}]*inset:\s*0;[^}]*width:\s*100%;[^}]*height:\s*100%/su
    );
    expect(css).toMatch(
      /\[data-campaign-pause-screen\]\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0/su
    );
    expect(css).toMatch(/\.amso-world-visual__image-stack\s*\{[^}]*transition:\s*none/su);
  });

  it("uses generated plates without the removed semantic illustration layer", () => {
    const worldLayer = readFileSync(
      new URL("../src/visuals/WorldVisualLayer.ts", import.meta.url),
      "utf8"
    );

    expect(worldLayer).not.toContain("SEMANTIC_WORLD_SVG");
    expect(worldLayer).not.toContain("data-world-fallback");
    expect(worldLayer).toContain("data-world-counter");
  });

  it("keeps the first-package facts in editable copy instead of burning them into artwork", () => {
    const scene = productionConfig.story.scenes[0]!;
    expect(scene.eyebrow).toBe("Nasza historia");
    const editorialCopy = scene.steps.flatMap(({ body }) => body).join(" ");
    expect(editorialCopy).toContain("małego sklepu");
    expect(editorialCopy).toContain("magazynu wielkości kawalerki");
    expect(editorialCopy).toContain("własnymi rękami");
  });

  it("keeps the animated million value in one responsive programmatic counter", () => {
    const css = readFileSync(new URL("../src/styles/campaign.css", import.meta.url), "utf8");
    const worldLayer = readFileSync(
      new URL("../src/visuals/WorldVisualLayer.ts", import.meta.url),
      "utf8"
    );

    expect(worldLayer.match(/<span data-world-counter/gu)).toHaveLength(1);
    expect(worldLayer).toContain("999 970");
    expect(css).toContain(".amso-world-visual__counter");
    expect(css).toContain('[data-world-id="million-finale"]');
    expect(css).toContain("color-scheme: only light");
  });

  it("ships seven decodable WebP plates and no legacy semantic illustration", () => {
    const css = readFileSync(new URL("../src/styles/campaign.css", import.meta.url), "utf8");
    for (const { assetPath } of CAMPAIGN_WORLDS) {
      const assetUrl = new URL(`../public${assetPath}`, import.meta.url);
      expect(existsSync(assetUrl)).toBe(true);
      expect(statSync(assetUrl).size).toBeGreaterThan(100_000);
    }
    expect(existsSync(new URL("../src/visuals/semantic-world-svg.ts", import.meta.url)))
      .toBe(false);
    expect(css).not.toContain(".amso-world-visual__semantic");
  });

  it("keeps the confirmed scale figures in editable story copy", () => {
    const scale = productionConfig.story.scenes.find(({ id }) => id === "story.scale");
    const copy = JSON.stringify(scale);
    for (const fact of ["28 000", "240", "PKiN", "rok"]) expect(copy).toContain(fact);
  });

  it("keeps consecutive service play segments inside one evolving world", () => {
    const testing = resolvePlaySegmentVisual("epoch_2.quality_series", 0.5);
    const doubts = resolvePlaySegmentVisual("epoch_2.quality_trial", 0.5);

    expect(testing.worldId).toBe("quality-service");
    expect(doubts.worldId).toBe("quality-service");
    expect(testing.fromStateId).toBe("epoch_2.setup");
    expect(doubts.toStateId).toBe("epoch_2.resolve");
    expect(testing.progress).toBeLessThan(doubts.progress);
  });

  it("starts a direct challenge in the small warehouse and changes only on a clear route", () => {
    const director = new ChallengeWorldDirector("direct");
    expect(director.snapshot.stateId).toBe("story.first_package");

    director.advance(45, false);
    expect(director.snapshot.stateId).toBe("story.first_package");
    expect(director.snapshot.transitionPending).toBe(true);

    director.advance(0, true);
    expect(director.snapshot.stateId).toBe("epoch_1.resolve");
    expect(director.snapshot.worldElapsedSeconds).toBe(0);
  });

  it("continues from the finale after story, then returns to the first world after 45 seconds", () => {
    const director = new ChallengeWorldDirector("story-continuation");
    expect(director.snapshot.stateId).toBe("story.million_finale");
    expect(sceneVisualState(director.snapshot.stateId).worldId).toBe("million-finale");

    director.advance(44.99, true);
    expect(director.snapshot.stateId).toBe("story.million_finale");
    director.advance(0.01, true);
    expect(director.snapshot.stateId).toBe("story.first_package");
  });

  it("cycles all seven worlds in a fixed order", () => {
    const director = new ChallengeWorldDirector("direct");
    const seen = [director.snapshot.stateId];
    for (let index = 0; index < 7; index += 1) {
      director.advance(45, true);
      seen.push(director.snapshot.stateId);
    }
    expect(seen).toEqual([
      "story.first_package",
      "epoch_1.resolve",
      "epoch_2.resolve",
      "client.business_growth",
      "story.scale",
      "challenge.million_wave",
      "story.million_finale",
      "story.first_package"
    ]);
  });
});
