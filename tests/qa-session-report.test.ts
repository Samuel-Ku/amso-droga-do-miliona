import { describe, expect, it } from "vitest";
import { QaSessionReportCollector } from "../src/qa/session-report";
import type { GameSnapshot } from "../src/game/contracts";

describe("local QA session report", () => {
  it("deduplicates snapshots and exports only balance metrics", () => {
    const collector = new QaSessionReportCollector();
    const snapshot = {
      mode: "story",
      durationSeconds: 25,
      packagesCollected: 7,
      collisions: 1,
      bestCombo: 3,
      speed: 322,
      challengePressureAxis: null,
      authoredWave: {
        microlevelId: "first-package",
        lastResult: {
          waveId: "guided-low-stack",
          attempts: 2,
          passed: true,
          perfect: false,
          collectionRatio: 2 / 3
        }
      }
    } as GameSnapshot;
    collector.record(snapshot);
    collector.record(snapshot);

    expect(collector.snapshot().waves).toHaveLength(1);
    expect(collector.text()).not.toMatch(/name|email|userId/i);
  });
});
