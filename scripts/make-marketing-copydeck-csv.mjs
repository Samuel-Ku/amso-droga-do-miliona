import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const configPath = path.join(root, "public", "assets", "milion-runner", "runner-config.json");
const copydeckPath = path.join(root, "copydeck_droga_do_miliona_dla_marketingu_v1.md");
const outputPath = path.join(root, "copydeck_droga_do_miliona_dla_marketingu_v2.csv");

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const copydeck = fs.readFileSync(copydeckPath, "utf8");

const perspectiveLabels = {
  amso: "Nasza historia",
  client: "Historia klienta",
  challenge: "Wyzwanie"
};

const headers = [
  "typ_rekordu",
  "nr",
  "scena_id",
  "perspektywa",
  "cel_sceny",
  "fakty_obowiazkowe",
  "ekran_id_lub_fakt",
  "tytul_aktualny",
  "tekst_1_aktualny",
  "tekst_2_aktualny",
  "cta_aktualne",
  "decyzja_marketingu",
  "nowy_tytul",
  "nowy_tekst_1",
  "nowy_tekst_2",
  "nowe_cta",
  "anonimizacja",
  "status_biezacy",
  "uwagi_marketingu"
];

function regexEscape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function sceneMetadata(sceneId) {
  const pattern = new RegExp(
    "###\\s+\\d+\\.\\s+`" + regexEscape(sceneId) +
      "`[^\\n]*\\n([\\s\\S]*?)(?=\\n###\\s+\\d+\\.|\\n##\\s+Fakty wymagające)",
    "u"
  );
  const section = pattern.exec(copydeck)?.[1];
  if (!section) throw new Error(`Brak sekcji copydecku dla ${sceneId}`);
  return {
    goal: /\*\*Cel:\*\*\s*([^\n]+)/u.exec(section)?.[1]?.trim() ?? "",
    facts: /\*\*Fakty:\*\*\s*([^\n]+)/u.exec(section)?.[1]?.trim() ?? "",
    requiresAnonymization: section.includes("**Anonimizacja potwierdzona:**")
  };
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

const rows = [];
for (const [sceneIndex, scene] of config.story.scenes.entries()) {
  const metadata = sceneMetadata(scene.id);
  for (const [pageIndex, page] of scene.steps.entries()) {
    rows.push([
      "TEKST",
      `${sceneIndex + 1}.${pageIndex + 1}`,
      scene.id,
      perspectiveLabels[scene.perspective] ?? scene.perspective,
      metadata.goal,
      metadata.facts,
      page.id,
      page.title ?? "",
      page.body[0] ?? "",
      page.body[1] ?? "",
      page.continueLabel,
      "AKCEPT / ZMIANA / ODRZUĆ",
      "",
      "",
      "",
      "",
      metadata.requiresAnonymization ? "TAK / NIE" : "nie dotyczy",
      page.id === "boeing-comparison" ? "OCZEKUJE NA AKCEPTACJĘ" : "ROBOCZY",
      ""
    ]);
  }
}

const factsSection = /## Fakty wymagające finalnego potwierdzenia([\s\S]*?)\n## Kontrola przed publikacją/u
  .exec(copydeck)?.[1];
if (!factsSection) throw new Error("Brak tabeli faktów w copydecku");

const factLines = factsSection.split("\n").filter((line) =>
  /^\|[^|-]/u.test(line.trim()) && !line.includes("Fakt lub sformułowanie")
);
for (const [factIndex, line] of factLines.entries()) {
  const cells = line.split("|").slice(1, -1).map((cell) =>
    cell.trim().replaceAll("`", "")
  );
  rows.push([
    "FAKT", // typ_rekordu
    `F${factIndex + 1}`, // nr
    "", // scena_id
    "", // perspektywa
    "", // cel_sceny
    "", // fakty_obowiazkowe
    `fakt-${factIndex + 1}`, // ekran_id_lub_fakt
    cells[0] ?? "", // tytul_aktualny
    "", // tekst_1_aktualny
    "", // tekst_2_aktualny
    "", // cta_aktualne
    cells[1] ?? "AKCEPT / ZMIANA / ODRZUĆ", // decyzja_marketingu
    "", // nowy_tytul
    "", // nowy_tekst_1
    "", // nowy_tekst_2
    "", // nowe_cta
    "nie dotyczy", // anonimizacja
    cells[2]?.length ? "OCZEKUJE NA AKCEPTACJĘ" : "ROBOCZY", // status_biezacy
    cells[2] ?? "" // uwagi_marketingu
  ]);
}

const expectedTextRows = config.story.scenes.reduce(
  (total, scene) => total + scene.steps.length,
  0
);
if (expectedTextRows !== 42 || rows.length !== 55) {
  throw new Error(`Nieoczekiwany zakres CSV: ${expectedTextRows} tekstów, ${rows.length} wszystkich wierszy`);
}

const csv = `\uFEFF${[headers, ...rows]
  .map((row) => row.map(csvCell).join(";"))
  .join("\r\n")}\r\n`;
fs.writeFileSync(outputPath, csv, "utf8");
console.log(`marketing CSV: ${path.basename(outputPath)}; ${rows.length} wierszy`);
