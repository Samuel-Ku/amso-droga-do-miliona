import { describe, expect, it } from "vitest";
import { FactEngine, MAX_FACTS_PER_RUN, epochSpeed } from "../src/game/narrative";
import type { NarrativeFact } from "../src/shared/types";
import { parseRunnerConfig } from "../src/config/schema";
import productionConfig from "../public/assets/milion-runner/runner-config.json";

const baseFacts: NarrativeFact[] = [
  { id: "f1", text: "a", enabled: true, trigger: { type: "epoch_completed", epochIndex: 0 } },
  { id: "f2", text: "b", enabled: true, trigger: { type: "epoch_completed_clean", epochIndex: 1 } },
  { id: "f3", text: "c", enabled: true, trigger: { type: "collect_type", packageType: "notebook", threshold: 3 } },
  { id: "f4", text: "d", enabled: true, trigger: { type: "collect_weight", threshold: 50 } },
  { id: "f5", text: "e", enabled: true, trigger: { type: "epoch_completed", epochIndex: 2 } },
  { id: "f6", text: "f", enabled: true, trigger: { type: "epoch_completed", epochIndex: 3 } },
  { id: "f7", text: "g", enabled: true, trigger: { type: "epoch_completed", epochIndex: 4 } }
];

describe("FactEngine", () => {
  it("fires epoch_completed facts once per run", () => {
    const engine = new FactEngine(baseFacts);
    expect(engine.evaluate()).toEqual([]);
    engine.recordEpochCompleted(0, false);
    expect(engine.evaluate()).toEqual(["f1"]);
    expect(engine.evaluate()).toEqual([]);
  });

  it("only fires epoch_completed_clean when the epoch was clean", () => {
    const engine = new FactEngine(baseFacts);
    engine.recordEpochCompleted(1, false);
    expect(engine.evaluate()).toEqual([]);
    engine.recordEpochCompleted(1, true);
    expect(engine.evaluate()).toEqual(["f2"]);
  });

  it("fires typed-collect and weight triggers", () => {
    const engine = new FactEngine(baseFacts);
    engine.recordPackage("notebook", 0);
    engine.recordPackage("notebook", 0);
    expect(engine.evaluate()).toEqual([]);
    engine.recordPackage("notebook", 0);
    expect(engine.evaluate()).toEqual(["f3"]);
    engine.recordPackage("pc", 50);
    expect(engine.evaluate()).toEqual(["f4"]);
  });

  it("caps the number of facts unlocked per run", () => {
    const engine = new FactEngine(baseFacts);
    engine.recordEpochCompleted(0, true);
    engine.recordEpochCompleted(1, true);
    engine.recordEpochCompleted(2, true);
    engine.recordEpochCompleted(3, true);
    engine.recordEpochCompleted(4, true);
    engine.recordPackage("notebook", 0);
    engine.recordPackage("notebook", 0);
    engine.recordPackage("notebook", 0);
    engine.recordPackage("pc", 50);
    const fired = engine.evaluate();
    expect(fired.length).toBe(MAX_FACTS_PER_RUN);
    expect(engine.evaluate()).toEqual([]);
  });

  it("ignores disabled facts", () => {
    const facts: NarrativeFact[] = [
      { id: "off", text: "x", enabled: false, trigger: { type: "epoch_completed", epochIndex: 0 } }
    ];
    const engine = new FactEngine(facts);
    engine.recordEpochCompleted(0, true);
    expect(engine.evaluate()).toEqual([]);
  });
});

describe("epochSpeed", () => {
  it("ramps from difficultyStart to difficultyEnd across the epoch", () => {
    const epoch = {
      index: 0,
      id: "p",
      name: "Początek",
      year: "2008",
      themeIndex: 0,
      durationSeconds: 30,
      obstaclePool: ["box-stack"],
      difficultyStart: 1,
      difficultyEnd: 1.5
    };
    expect(epochSpeed(epoch, 0)).toBeCloseTo(280);
    expect(epochSpeed(epoch, 30)).toBeCloseTo(420);
  });
});

describe("v3 migration boundary", () => {
  it("accepts the production story and derives only a transitional narrative view", () => {
    const config = parseRunnerConfig(productionConfig);
    expect(config).not.toBeNull();
    expect(config?.schemaVersion).toBe(3);
    expect(config?.story.epochs).toHaveLength(5);
    expect(config?.narrative?.epochs).toHaveLength(5);
  });

  it("rejects the archived v1 modal/discount configuration", () => {
    expect(parseRunnerConfig({
      schemaVersion: 1,
      enabled: true,
      gameVersion: "0.1.0",
      claim: "1 000 000+",
      cta: { id: "c", label: "CTA", path: "/milion" },
      facts: [{ id: "legacy", text: "legacy", enabled: true }],
      narrativeMode: true,
      discountCode: { code: "TEST123", label: "Kod testowy" }
    })).toBeNull();
  });
});
