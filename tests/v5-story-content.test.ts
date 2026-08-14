import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import { parseRunnerConfig } from "../src/config/schema";

const parsedConfig = parseRunnerConfig(productionConfig);
if (parsedConfig === null) throw new Error("Production config should parse");
const scenes = parsedConfig.story.scenes;
const scene = (id: string) => {
  const found = scenes.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing scene: ${id}`);
  return found;
};
const text = (id: string) => JSON.stringify(scene(id));

describe("v6 player-paced story content", () => {
  it("uses explicit perspectives and safe, concrete active beats", () => {
    const activeSceneIds = new Set(parsedConfig.story.sequence
      .filter((step) => step.type === "scene")
      .map((step) => step.sceneId));
    const activeScenes = scenes.filter(({ id }) => activeSceneIds.has(id));
    for (const candidate of activeScenes) {
      const steps = candidate.steps ?? [];
      expect(["amso", "client", "challenge"]).toContain(candidate.perspective);
      expect(steps.length).toBeGreaterThanOrEqual(1);
      expect(steps.every((step) => step.safe === true && step.continueLabel.length > 0))
        .toBe(true);
      expect(steps.every((step) =>
        "fact" in step && "action" in step && "finalFrame" in step
      )).toBe(true);
    }
    expect(scene("client.business_start").steps).toHaveLength(1);
    expect(scene("client.business_growth").steps).toHaveLength(3);
    expect(activeScenes.flatMap(({ steps }) => steps ?? [])).toHaveLength(14);
  });

  it("preserves the approved 300 zł to 100 000 zł growth facts", () => {
    const story = `${text("client.business_start")} ${text("client.business_growth")}`;
    for (const fact of ["do 400 zł", "za 300 zł", "Po roku", "100 000 zł", "siedem lat"]) {
      expect(story).toContain(fact);
    }
    expect(story).not.toContain("300 000");
  });

  it("reveals client outcomes and annual scale only after their gameplay", () => {
    const sequence = parsedConfig.story.sequence.map((step) =>
      step.type === "scene" ? `scene:${step.sceneId}` : `play:${step.id}`
    );
    expect(sequence.indexOf("scene:client.business_start"))
      .toBeLessThan(sequence.indexOf("play:epoch_3.client_growth"));
    expect(sequence.indexOf("scene:client.business_growth"))
      .toBeGreaterThan(sequence.indexOf("play:epoch_3.client_growth"));
    expect(sequence.indexOf("scene:story.scale"))
      .toBeGreaterThan(sequence.indexOf("play:epoch_4.order_scale"));
  });

  it("keeps removed client stories out of production while acknowledging many stories", () => {
    expect(scenes.some(({ id }) => id === "client.b2b_trust")).toBe(false);
    expect(scenes.some(({ id }) => id === "client.creative_start")).toBe(false);
    expect(text("story.matching_result")).toContain("wiele odrębnych historii klientów");
  });

  it("uses one annual PKiN comparison and removes the Boeing comparison", () => {
    const steps = scene("story.scale").steps ?? [];
    expect(steps).toHaveLength(1);
    expect(JSON.stringify(steps[0])).toContain("28 000");
    expect(JSON.stringify(steps[0])).toContain("240 metrów");
    expect(JSON.stringify(steps[0])).toContain("PKiN");
    expect(JSON.stringify(steps[0])).not.toContain("Boeing");
  });

  it("does not publish unconfirmed component-test promises", () => {
    const qualityStory = text("story.quality_promise").toLocaleLowerCase("pl");
    for (const unconfirmedTest of ["test ekranu", "test portów", "test baterii"]) {
      expect(qualityStory).not.toContain(unconfirmedTest);
    }
  });
});
