import { describe, expect, it } from "vitest";
import { StoryClimaxDirector } from "../src/game/story-climax";
import { StoryObstacleTransformer } from "../src/game/story-effects";
import type { ObstacleModel } from "../src/game/types";

const CLIMAXES = [
  [0, "Zator Zamówień", "order-backlog"],
  [1, "Próba Jakości", "quality-trial"],
  [2, "Wyzwanie Dopasowania", "matching-challenge"],
  [3, "Szczyt Zamówień", "order-peak"]
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
    director.enterEpoch(3, "Szczyt Zamówień", 20);

    for (let elapsed = 0; elapsed <= 20; elapsed += 0.1) {
      director.advance(0.1, elapsed, true, false, false);
    }
    director.advance(0, 20, true, false, false);

    expect(director.model.completed).toBe(true);
    expect(director.model.phase).toBe("completed");
  });

  it("authors Zator Zamówień as alternating jump and slide hazards", () => {
    const director = new StoryClimaxDirector();
    director.enterEpoch(0, "Zator Zamówień", 15);
    const attacks: string[] = [];
    let hazardActive = false;
    for (let elapsed = 0; elapsed < 15; elapsed += 0.1) {
      const command = director.advance(0.1, elapsed, false, true, hazardActive);
      if (command.type === "attack") {
        attacks.push(command.kind);
        hazardActive = true;
      } else if (hazardActive) {
        hazardActive = false;
      }
    }

    expect(attacks.slice(0, 4)).toEqual(["pallet", "overhead", "box-stack", "overhead"]);
  });

  it("requeues only the unfinished action after a story collision", () => {
    const director = new StoryClimaxDirector();
    director.enterEpoch(3, "Szczyt Zamówień", 24);
    let firstAttack: string | null = null;
    for (let elapsed = 0; elapsed < 8 && firstAttack === null; elapsed += 0.1) {
      const command = director.advance(0.1, elapsed, false, true, false);
      if (command.type === "attack") firstAttack = command.kind;
    }

    expect(firstAttack).not.toBeNull();
    director.retryCurrentAttack();
    const retry = director.advance(0.1, 8, false, true, false);
    expect(retry).toEqual({ type: "attack", kind: firstAttack });
    expect(director.model.attacksResolved).toBe(0);
  });

  it("holds the section boundary until a collided action is retried", () => {
    const director = new StoryClimaxDirector();
    director.enterEpoch(3, "Szczyt Zamówień", 24);
    let firstAttack: string | null = null;
    for (let elapsed = 0; elapsed < 8 && firstAttack === null; elapsed += 0.1) {
      const command = director.advance(0.1, elapsed, false, true, false);
      if (command.type === "attack") firstAttack = command.kind;
    }

    director.retryCurrentAttack();
    const retry = director.advance(0.1, 24, false, true, false);

    expect(retry).toEqual({ type: "attack", kind: firstAttack });
    expect(director.model.completed).toBe(false);
    expect(director.model.phase).toBe("challenge");
  });

  it("fits all four Zator Zamówień attacks inside the production window", () => {
    const director = new StoryClimaxDirector();
    director.enterEpoch(0, "Zator Zamówień", 15);
    const attacks: string[] = [];
    let hazardSeconds = 0;

    for (let elapsed = 0; elapsed < 15; elapsed += 0.05) {
      hazardSeconds = Math.max(0, hazardSeconds - 0.05);
      const hazardActive = hazardSeconds > 0;
      const command = director.advance(
        0.05,
        elapsed,
        false,
        !hazardActive,
        hazardActive
      );
      if (command.type === "attack") {
        attacks.push(command.kind);
        // Conservative travel time from the authored x=730 spawn at epoch-one speed.
        hazardSeconds = 2.9;
      }
    }

    expect(attacks).toEqual(["pallet", "overhead", "box-stack", "overhead"]);
  });

  it("does not cut off an in-flight Zator Zamówień attack for the transformation", () => {
    const director = new StoryClimaxDirector();
    director.enterEpoch(0, "Zator Zamówień", 15);

    let elapsed = 0;
    let fourthAttackStarted = false;
    while (!fourthAttackStarted && elapsed < 14) {
      elapsed += 0.1;
      const command = director.advance(0.1, elapsed, false, true, false);
      if (command.type !== "attack") continue;
      fourthAttackStarted = director.model.attacksLaunched === 4;
      if (!fourthAttackStarted) {
        director.advance(0.1, elapsed + 0.1, false, false, true);
        director.advance(0.1, elapsed + 0.2, false, true, false);
        elapsed += 0.2;
      }
    }

    expect(fourthAttackStarted).toBe(true);
    const beforeResolution = director.advance(0.1, 13.9, false, false, true);
    expect(beforeResolution.type).toBe("none");
    expect(director.model.phase).toBe("challenge");

    const resolved = director.advance(0.1, 14, false, true, false);
    expect(resolved.type).toBe("complete");
    expect(director.model.attacksResolved).toBe(4);
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

    transformer.begin([obstacle], "matched-order");
    expect(transformer.models).toMatchObject([
      { active: true, motif: "matched-order", obstacleKind: "pallet" }
    ]);

    transformer.advance(0.4);
    expect(transformer.models[0]?.progress).toBeGreaterThan(0);
    expect(transformer.models[0]?.active).toBe(true);

    transformer.advance(1);
    expect(transformer.models).toHaveLength(0);
  });
});
