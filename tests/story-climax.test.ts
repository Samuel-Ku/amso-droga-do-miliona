import { describe, expect, it } from "vitest";
import { StoryClimaxDirector } from "../src/game/story-climax";
import {
  FinaleSymbolDirector,
  StoryObstacleTransformer
} from "../src/game/story-effects";
import type { ObstacleModel } from "../src/game/types";

const CLIMAXES = [
  [0, "Kablowy Chaos", "cable-chaos"],
  [1, "Chmura Wątpliwości", "doubt-cloud"],
  [2, "Budżetożerca", "budget-eater"],
  [3, "Logistyczna Hydra", "logistics-hydra"]
] as const;

describe("story micro-climaxes", () => {
  it.each(CLIMAXES)(
    "completes epoch %i as %s with its own playable identity",
    (epochIndex, challengeName, identity) => {
      const director = new StoryClimaxDirector();
      director.enterEpoch(epochIndex, challengeName, 20);
      let elapsed = 0;
      let hazardActive = false;
      const attacks: string[] = [];

      while (elapsed < 20) {
        elapsed += 0.1;
        const command = director.advance(0.1, elapsed, false, true, hazardActive);
        if (command.type === "attack") {
          attacks.push(command.kind);
          hazardActive = true;
        } else if (hazardActive) {
          hazardActive = false;
        }
      }

      expect(director.model.identity).toBe(identity);
      expect(director.model.challengeName).toBe(challengeName);
      expect(attacks.length).toBeGreaterThan(0);
      expect(director.model.completed).toBe(true);
      expect(["transforming", "completed"]).toContain(director.model.phase);
    }
  );

  it("finishes positively by the section end even when every hazard is missed", () => {
    const director = new StoryClimaxDirector();
    director.enterEpoch(3, "Logistyczna Hydra", 20);

    for (let elapsed = 0; elapsed <= 20; elapsed += 0.1) {
      director.advance(0.1, elapsed, true, false, false);
    }
    director.advance(0, 20, true, false, false);

    expect(director.model.completed).toBe(true);
    expect(director.model.phase).toBe("completed");
  });
});

describe("finale story symbols", () => {
  it("requeues a missed symbol and never queues an already collected one", () => {
    const director = new FinaleSymbolDirector();

    expect(director.planSpawns([], [], 1)).toEqual([0]);
    director.recordSpawn(0);
    director.recordMiss(0);
    expect(director.planSpawns([], [], 1)).toEqual([0]);
    director.recordSpawn(0);
    expect(director.respawnCount).toBe(1);

    director.recordCollected(0);
    expect(director.planSpawns([0], [], 8)).not.toContain(0);
  });

  it("plans every still-missing symbol for the guaranteed final pickup", () => {
    const director = new FinaleSymbolDirector();
    for (const index of [0, 2, 5]) director.recordCollected(index);

    expect(director.planGuaranteedSpawns([0, 2, 5])).toEqual([1, 3, 4, 6, 7]);
  });
});

describe("trust-corridor obstacle transformations", () => {
  it("keeps a positive replacement visible briefly after removing the hazard", () => {
    const transformer = new StoryObstacleTransformer();
    const obstacle: ObstacleModel = {
      active: true,
      kind: "pallet",
      source: "normal",
      x: 610,
      y: 396,
      width: 78,
      height: 36
    };

    transformer.begin([obstacle], "piggy-bank");
    expect(transformer.models).toMatchObject([
      { active: true, motif: "piggy-bank", obstacleKind: "pallet" }
    ]);

    transformer.advance(0.4);
    expect(transformer.models[0]?.progress).toBeGreaterThan(0);
    expect(transformer.models[0]?.active).toBe(true);

    transformer.advance(1);
    expect(transformer.models).toHaveLength(0);
  });
});
