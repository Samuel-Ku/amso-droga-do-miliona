import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";

const matrix = readFileSync(
  new URL("../qa/final-frame-matrix-v6.csv", import.meta.url),
  "utf8"
).trim().split("\n").slice(1).map((row) => row.split(";"));
const review = readFileSync(
  new URL("../qa/test-kadrow-v6.html", import.meta.url),
  "utf8"
);

describe("v6 five-second comprehension frame matrix", () => {
  it("prepares one copy-free identifier per active beat and viewport", () => {
    const active = productionConfig.story.sequence
      .filter((step) => step.type === "scene")
      .flatMap((step) => {
        const scene = productionConfig.story.scenes.find(({ id }) => id === step.sceneId);
        if (!scene) throw new Error(`Missing active scene: ${step.sceneId}`);
        return scene.steps.map(({ id }) => `${scene.id}:${id}`);
      });

    expect(matrix).toHaveLength(28);
    expect(new Set(matrix.map(([frameId]) => frameId)).size).toBe(28);
    expect(new Set(matrix.map(([, sceneId, pageId]) => `${sceneId}:${pageId}`)))
      .toEqual(new Set(active));
    for (const [, , , viewport, width, height] of matrix) {
      expect(["desktop", "mobile"]).toContain(viewport);
      expect(viewport === "mobile" ? width : height).toBe(viewport === "mobile" ? "390" : "900");
    }
  });

  it("ships a real copy-free frame viewer with every matrix identifier", () => {
    expect(review).toContain("data-world-fallback");
    expect(review).toContain("data-state-overlay");
    expect(review).not.toContain("finalny_kadr");
    for (const [frameId] of matrix) expect(review).toContain(`\"frameId\":\"${frameId}\"`);
  });
});
