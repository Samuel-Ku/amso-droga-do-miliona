import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";

const scenes = productionConfig.story.scenes;
const scene = (id: string) => {
  const found = scenes.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing scene: ${id}`);
  return found;
};
const text = (id: string) => JSON.stringify(scene(id));

describe("v5 player-paced story content", () => {
  it("uses explicit perspectives and safe player-paced pages", () => {
    for (const candidate of scenes) {
      expect(["amso", "client", "challenge"]).toContain(candidate.perspective);
      expect(candidate.steps.length).toBeGreaterThanOrEqual(2);
      expect(candidate.steps.every((step) => step.safe === true && step.continueLabel.length > 0))
        .toBe(true);
    }
    expect(scene("client.creative_start").steps).toHaveLength(4);
    expect(scene("client.business_growth").steps).toHaveLength(4);
    expect(scene("client.b2b_trust").steps).toHaveLength(5);
  });

  it("preserves the approved 300 zł to 100 000 zł growth facts", () => {
    const story = text("client.business_growth");
    for (const fact of ["do 400 zł", "za 300 zł", "Minął rok", "100 000 zł"]) {
      expect(story).toContain(fact);
    }
    expect(story).not.toContain("300 000");
  });

  it("describes the B2B test as budget, remaining purchase, and seven years", () => {
    const story = text("client.b2b_trust");
    expect(story).toContain("10% budżetu");
    expect(story).toContain("pozostałą część przygotowanego budżetu");
    expect(story).toContain("siedem lat");
    expect(story).not.toContain("siedmioletnią współprac");
  });

  it("grounds scale comparisons in annual category, period, and unit before comparison", () => {
    const steps = scene("story.scale").steps;
    expect(steps[0]?.title).toContain("28 000 smartfonów");
    expect(steps[0]?.body.join(" ")).toContain("roczna");
    expect(steps[1]?.title).toContain("240 metrów");
    expect(steps[2]?.title).toContain("400 000 kg komputerów");
    expect(steps[2]?.body.join(" ")).toContain("rocznym okresie");
    expect(steps[3]?.title).toContain("pięcioma załadowanymi Boeingami 737");
    expect(steps[3]?.body.join(" ")).toContain("oczekujące na końcową akceptację marketingu");
    expect(steps[4]?.title).toContain("ludzie");
  });

  it("does not publish unconfirmed component-test promises", () => {
    const qualityStory = `${text("story.quality_promise")} ${text("story.quality_result")}`
      .toLocaleLowerCase("pl");
    for (const unconfirmedTest of ["test ekranu", "test portów", "test baterii"]) {
      expect(qualityStory).not.toContain(unconfirmedTest);
    }
  });
});
