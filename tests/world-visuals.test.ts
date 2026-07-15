import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import {
  CAMPAIGN_SCENE_MANIFEST,
  ChallengeWorldDirector,
  resolvePlaySegmentVisual,
  sceneVisualState
} from "../src/visuals/scene-manifest";

describe("world visual continuity", () => {
  it("maps every authored scene event to a concrete reveal motion", () => {
    const css = readFileSync(new URL("../src/styles/campaign.css", import.meta.url), "utf8");
    for (const { revealMotion, visualEvent } of CAMPAIGN_SCENE_MANIFEST) {
      expect(visualEvent.length).toBeGreaterThan(0);
      expect(css).toContain(`[data-reveal="${revealMotion}"]`);
    }
  });

  it("keeps art, semantic overlays and gameplay on one contained 16:9 plane", () => {
    const css = readFileSync(new URL("../src/styles/campaign.css", import.meta.url), "utf8");
    const semanticSvg = readFileSync(
      new URL("../src/visuals/semantic-world-svg.ts", import.meta.url),
      "utf8"
    );
    const renderer = readFileSync(new URL("../src/game/renderer.ts", import.meta.url), "utf8");

    expect(css).toContain("object-fit: contain");
    expect(semanticSvg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(renderer).toContain("drawGameplayRoute(context)");
  });

  it("builds the first package as layered editorial SVG without embedded copy", () => {
    const semanticSvg = readFileSync(
      new URL("../src/visuals/semantic-world-svg.ts", import.meta.url),
      "utf8"
    );
    const start = semanticSvg.indexOf('data-editorial-scene="first-package"');
    const end = semanticSvg.indexOf('data-world-fallback="order-process"');
    const firstPackage = semanticSvg.slice(start, end);

    expect(start).toBeGreaterThan(0);
    for (const layer of ["small-shop", "apartment-warehouse", "anonymous-team", "hand-packed-package"]) {
      expect(firstPackage).toContain(`data-editorial-layer="${layer}"`);
    }
    expect(firstPackage).not.toContain("<text");
    const scene = productionConfig.story.scenes[0]!;
    expect(scene.eyebrow).toBe("Nasza historia");
    const editorialCopy = scene.steps.flatMap(({ body }) => body).join(" ");
    expect(editorialCopy).toContain("sklep był mały");
    expect(editorialCopy).toContain("powierzchnię zbliżoną do kawalerki");
    expect(editorialCopy).toContain("Własnymi rękami");
  });

  it("keeps the animated million value inside its own responsive counter plate", () => {
    const css = readFileSync(new URL("../src/styles/campaign.css", import.meta.url), "utf8");
    const semanticSvg = readFileSync(
      new URL("../src/visuals/semantic-world-svg.ts", import.meta.url),
      "utf8"
    );

    expect(semanticSvg.match(/data-world-counter-plate/gu)).toHaveLength(2);
    expect(semanticSvg.match(/data-world-counter(?:\s|>)/gu)).toHaveLength(2);
    expect(semanticSvg).toContain("999 970");
    expect(semanticSvg).toContain("999 999");
    expect(css).toContain("color-scheme: only light");
  });

  it("removes narrative lettering from challenge-world overlays", () => {
    const css = readFileSync(new URL("../src/styles/campaign.css", import.meta.url), "utf8");
    expect(css).toContain(
      '.amso-campaign[data-mode="challenge"] .amso-world-visual__state text'
    );
  });

  it("keeps the confirmed annual device figures in the scale background", () => {
    const semanticSvg = readFileSync(
      new URL("../src/visuals/semantic-world-svg.ts", import.meta.url),
      "utf8"
    );
    for (const fact of ["41 tys. PC", "76 tys. notebooków", "40 tys. monitorów", "28 tys. telefonów"]) {
      expect(semanticSvg).toContain(fact);
    }
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
    expect(director.snapshot.stateId).toBe("story.first_process");
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
      "story.first_process",
      "epoch_2.resolve",
      "client.b2b_trust",
      "story.scale",
      "challenge.million_wave",
      "story.million_finale",
      "story.first_package"
    ]);
  });
});
