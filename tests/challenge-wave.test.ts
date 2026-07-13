import { describe, expect, it } from "vitest";
import { getChallengeDifficulty } from "../src/game/difficulty";
import { LogisticWaveDirector } from "../src/game/logistic-wave";

describe("Próba Miliona pacing", () => {
  it("starts at its configured speed and never exceeds the tested cap", () => {
    const settings = { speedStartMultiplier: 1.15, speedMaxMultiplier: 1.55 };
    expect(getChallengeDifficulty(0, settings).speedMultiplier).toBe(1.15);
    expect(getChallengeDifficulty(10_000, settings).speedMultiplier).toBe(1.55);
  });

  it("announces a three-pattern logistics wave in the configured 45–60 second window", () => {
    const director = new LogisticWaveDirector(45, 60);
    expect(director.advance(0.1, 44.9, true, false).type).toBe("none");
    director.advance(0.1, 45, true, false);
    expect(director.snapshot.phase).toBe("warning");

    let elapsed = 45;
    const attacks: string[] = [];
    let completed = false;
    for (let step = 0; step < 500 && !completed; step += 1) {
      elapsed += 0.1;
      const command = director.advance(0.1, elapsed, true, false);
      if (command.type !== "attack") continue;
      attacks.push(command.kind);
      director.advance(0.1, elapsed + 0.1, false, true);
      const result = director.advance(0.1, elapsed + 0.2, true, false);
      completed = result.type === "complete";
    }

    expect(attacks).toEqual(["pallet", "overhead", "trolley"]);
    expect(completed).toBe(true);
    expect(director.snapshot.phase).toBe("reward");
    expect(director.snapshot.nextWaveAtSeconds - elapsed).toBeGreaterThanOrEqual(45);
    expect(director.snapshot.nextWaveAtSeconds - elapsed).toBeLessThanOrEqual(60.5);
  });
});
