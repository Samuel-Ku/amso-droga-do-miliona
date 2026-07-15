import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";

const csv = readFileSync(
  new URL("../copydeck_droga_do_miliona_dla_marketingu_v2.csv", import.meta.url),
  "utf8"
);

function parseSemicolonCsv(value: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = value.replace(/^\uFEFF/u, "");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ";" && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  expect(quoted).toBe(false);
  return rows;
}

describe("marketing copydeck CSV", () => {
  it("exports only the 14 active v6 beats with limits, facts and decisions", () => {
    const rows = parseSemicolonCsv(csv);
    const header = rows[0] ?? [];
    const records = rows.slice(1);
    const textRows = records.filter(([type]) => type === "TEKST");

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(header).toContain("decyzja_marketingu");
    expect(header).toContain("limit_tytulu_slowa");
    expect(header).toContain("limit_tekstu_znaki");
    expect(header).toContain("fakt_kroku");
    expect(header).toContain("czynność");
    expect(header).toContain("finalny_kadr");
    expect(header).toContain("nowy_tekst_1");
    expect(textRows).toHaveLength(14);
    expect(records).toHaveLength(14);
    expect(new Set(textRows.map((row) => row[2]))).toEqual(
      new Set(productionConfig.story.sequence
        .filter((step) => step.type === "scene")
        .map((step) => step.sceneId))
    );
    expect(csv).not.toContain("Boeing");

    const activeSceneIds = new Set(productionConfig.story.sequence
      .filter((step) => step.type === "scene")
      .map((step) => step.sceneId));
    for (const scene of productionConfig.story.scenes.filter(({ id }) => activeSceneIds.has(id))) {
      for (const page of scene.steps) {
        const row = textRows.find((candidate) =>
          candidate[2] === scene.id && candidate[8] === page.id
        );
        expect(row, `${scene.id}/${page.id}`).toBeDefined();
        expect(row?.[5]).toBe("fact" in page ? page.fact : undefined);
        expect(row?.[6]).toBe("action" in page ? page.action : undefined);
        expect(row?.[7]).toBe("finalFrame" in page ? page.finalFrame : undefined);
        expect(row?.[9]).toBe("8");
        expect(row?.[10]).toBe("220");
        expect(row?.[11]).toBe(page.title ?? "");
        expect(row?.[12]).toBe(page.body[0] ?? "");
        expect(row?.[13]).toBe(page.body[1] ?? "");
        expect(row?.[14]).toBe(page.continueLabel);
        expect(row?.[15]).toBe("AKCEPT / ZMIANA / ODRZUĆ");
      }
    }
  });
});
