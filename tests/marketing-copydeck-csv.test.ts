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
  it("exports every editable story page and every approval fact", () => {
    const rows = parseSemicolonCsv(csv);
    const header = rows[0] ?? [];
    const records = rows.slice(1);
    const textRows = records.filter(([type]) => type === "TEKST");
    const factRows = records.filter(([type]) => type === "FAKT");

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(header).toContain("decyzja_marketingu");
    expect(header).toContain("nowy_tekst_1");
    expect(header).toHaveLength(19);
    expect(textRows).toHaveLength(42);
    expect(factRows).toHaveLength(13);
    expect(new Set(textRows.map((row) => row[2]))).toEqual(
      new Set(productionConfig.story.scenes.map(({ id }) => id))
    );
    expect(textRows.find((row) => row[6] === "boeing-comparison")?.[17])
      .toBe("OCZEKUJE NA AKCEPTACJĘ");

    for (const scene of productionConfig.story.scenes) {
      for (const page of scene.steps) {
        const row = textRows.find((candidate) =>
          candidate[2] === scene.id && candidate[6] === page.id
        );
        expect(row, `${scene.id}/${page.id}`).toBeDefined();
        expect(row?.[7]).toBe(page.title ?? "");
        expect(row?.[8]).toBe(page.body[0] ?? "");
        expect(row?.[9]).toBe(page.body[1] ?? "");
        expect(row?.[10]).toBe(page.continueLabel);
        expect(row?.[11]).toBe("AKCEPT / ZMIANA / ODRZUĆ");
      }
    }

    const boeingFact = factRows.find((row) => (row[7] ?? "").includes("Boeing"));
    expect(boeingFact?.[11]).toBe("AKCEPT / ZMIANA / ODRZUĆ");
    expect(boeingFact?.[17]).toBe("OCZEKUJE NA AKCEPTACJĘ");
    expect(boeingFact?.[18]).toContain("jawnie oznaczone");
  });
});
