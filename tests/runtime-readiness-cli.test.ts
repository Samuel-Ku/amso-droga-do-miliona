import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("runtime readiness CLI", () => {
  it("plans the exact-artifact 60-second, cold-start and four-cycle captures", () => {
    const result = spawnSync(process.execPath, [
      "scripts/qualify-runtime-readiness.mjs",
      "--target", "https://game.amso.pl/",
      "--reference", ".scratch/reference.json",
      "--output-dir", ".scratch/runtime-readiness",
      "--dry-run"
    ], { cwd: process.cwd(), encoding: "utf8", timeout: 2_000 });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      schema: "amso-runtime-readiness-plan-v1",
      target: "https://game.amso.pl/",
      scenarios: {
        sixtySecond: "performance-reference-v1",
        fourCycle: "four-cycle-memory-v1"
      }
    });
  });

  it("fails fast as incomplete when the final comparison reference is absent", () => {
    const outputDirectory = mkdtempSync(join(tmpdir(), "amso-runtime-readiness-"));
    const result = spawnSync(process.execPath, [
      "scripts/qualify-runtime-readiness.mjs",
      "--reference", join(outputDirectory, "missing-reference.json"),
      "--output-dir", outputDirectory
    ], { cwd: process.cwd(), encoding: "utf8", timeout: 2_000 });
    expect(result.status).toBe(2);
    expect(JSON.parse(readFileSync(join(outputDirectory, "runtime-readiness.json"), "utf8")))
      .toMatchObject({
        status: "incomplete",
        gates: { reference: ["full-story-reference-evidence-missing"] }
      });
  });
});
