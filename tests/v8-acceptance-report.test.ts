import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const report = readFileSync(
  new URL("../qa/raport-rc-v8.md", import.meta.url),
  "utf8"
);

describe("v8 browser acceptance handoff document", () => {
  it("defines the complete browser, viewport, DPR and motion matrix", () => {
    for (const id of [
      "chromium-standalone-desktop-dpr1",
      "chromium-site-container-dpr2",
      "chromium-standalone-portrait-dpr3",
      "chromium-standalone-landscape-dpr3",
      "webkit-standalone-desktop-dpr1",
      "webkit-site-container-dpr2",
      "webkit-standalone-portrait-dpr3",
      "webkit-standalone-landscape-dpr3",
      "chromium-standalone-reduced-motion",
      "webkit-standalone-reduced-motion"
    ]) expect(report).toContain(`| ${id} |`);

    expect(report).toContain("390×844");
    expect(report).toContain("844×390");
    expect(report).toContain("1920×1080");
    expect(report).toContain("ograniczone do 1600 px");
    expect(report).toContain("ograniczony");
  });

  it("documents every unresolved v8 visual acceptance step", () => {
    expect(report).toMatch(/intro[\s\S]*Tryb Historii/u);
    expect(report).toMatch(/Trybu Wyzwania/u);
    expect(report).toMatch(/białej szczeliny/u);
    expect(report).toMatch(/centralnego\s+kadru/u);
    expect(report).toMatch(/GWARANCJA 48 M ×1/u);
    expect(report).toMatch(/3,5×/u);
    expect(report).toMatch(/W.*↑.*Spację/u);
    expect(report).toMatch(/S.*↓/u);
    expect(report).toMatch(/osobno skok[\s\S]*klik myszą[\s\S]*tap na ekranie dotykowym/u);
    expect(report).toMatch(/jeden pełny cykl paralaksy/u);
    expect(report).toMatch(/Pełne zawinięcie/u);
    expect(report).toMatch(/nowe, krótkie naciśnięcie Spacji/u);
    expect(report).toMatch(/stan bez shielda/u);
    expect(report).toMatch(/Z aktywną\s+Gwarancją wykonaj skok i ślizg/u);
    expect(report).toMatch(/http:\/\/localhost:5173\//u);
    expect(report).toMatch(/AMSOMillionRunnerQA\.copyQaReport/u);
  });
});
