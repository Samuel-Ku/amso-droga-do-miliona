import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const report = readFileSync(
  new URL("../qa/raport-rc-v8.md", import.meta.url),
  "utf8"
);

describe("v8 browser acceptance handoff", () => {
  it("defines the complete browser, viewport, DPR and motion matrix", () => {
    for (const id of [
      "C-D1", "C-D2", "C-P3", "C-L3", "W-D1", "W-D2", "W-P3", "W-L3",
      "C-RM", "W-RM"
    ]) expect(report).toContain(`| ${id} |`);

    expect(report).toContain("390×844");
    expect(report).toContain("844×390");
    expect(report).toContain("1600×900");
    expect(report).toContain("ograniczony");
  });

  it("covers every unresolved v8 visual acceptance contract", () => {
    expect(report).toMatch(/intro[\s\S]*Tryb Historii/u);
    expect(report).toMatch(/Trybu Wyzwania/u);
    expect(report).toMatch(/białej szczeliny/u);
    expect(report).toMatch(/centralnego\s+kadru/u);
    expect(report).toMatch(/GWARANCJA 48 M ×1/u);
    expect(report).toMatch(/3,5×/u);
    expect(report).toMatch(/W.*↑.*Spację/u);
    expect(report).toMatch(/S.*↓/u);
    expect(report).toMatch(/AMSOMillionRunnerQA\.copyQaReport/u);
  });
});
