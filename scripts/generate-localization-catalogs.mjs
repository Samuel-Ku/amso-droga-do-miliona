import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const targets = ["de", "en", "es", "cs", "it", "fr", "uk"];
const sourceFiles = [
  "src/ui/CampaignShell.ts",
  "src/ui/name-prompt.ts",
  "src/ui/record-board.ts",
  "src/ui/story-presentation.ts",
  "src/config/game-instructions-copy.ts",
  "src/CampaignController.ts",
  "src/loader.ts",
  "src/demo.ts",
  "src/game/renderer.ts",
  "public/assets/milion-runner/boot-watchdog.js"
];

const oneWordCopy = new Set([
  "Bonusy", "Dalej", "Facebook", "Gracz", "Instagram", "Pauza", "Rekord",
  "Wycisz", "Wynik", "Wyzwanie", "Zamówienia", "Zapisz", "AMSO"
]);
const extraCopy = [
  "Droga do Miliona",
  "KARTA WYNIKU",
  "Jubileuszowa gra",
  "MÓJ WYNIK",
  "ZREALIZOWANE ZAMÓWIENIA",
  "Wynik biegu",
  "Pole gry",
  "Jak działa gra?",
  "Zamknij instrukcję",
  "Zamknij udostępnianie",
  "Wynik łączny",
  "Wynik wyzwania",
  "Twój rekord wyzwania",
  "Pierwszy wynik wyzwania",
  "Przebyta droga",
  "Miejsce",
  "Ty",
  "zamówień",
  "metrów",
  "Gracz",
  "Ta nazwa jest niedozwolona.",
  "Nazwa może mieć maksymalnie 14 znaków.",
  "Wpisano Cię na tablicę rekordów!",
  "Ta nazwa jest już zajęta. Wybierz inną.",
  "Gra gotowa. Wybierz swoją drogę.",
  "Tryb Wyzwania",
  "Tablica rekordów",
  "Tablica rekordów — Tryb Wyzwania",
  "Ładowanie tablicy…",
  "Tablica niedostępna.",
  "Bądź pierwszy na liście!"
];

function looksLikeCopy(value) {
  const text = value.trim();
  if (text.length < 2 || text.length > 700) return false;
  if (oneWordCopy.has(text)) return true;
  if (/^(https?:|\/|\.|#|\[|data-|aria-|amso-|campaign_|runner_|story\.|epoch_|challenge\.)/iu.test(text)) return false;
  if (/[{}<>]/u.test(text) || /\.(?:avif|webp|svg|png|html|json|js|ts)$/iu.test(text)) return false;
  if (/^[a-z0-9_.:/-]+$/u.test(text)) return false;
  return /[ĄĆĘŁŃÓŚŹŻąćęłńóśźż]/u.test(text) || /\s/u.test(text) || /^[A-ZĄĆĘŁŃÓŚŹŻ]{2,}$/u.test(text);
}

function collectJsonStrings(value, output) {
  if (typeof value === "string") {
    if (looksLikeCopy(value)) output.add(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectJsonStrings(item, output);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectJsonStrings(item, output);
  }
}

function collectSourceStrings(source, filename, output) {
  const literalPattern = /(["'`])((?:\\.|(?!\1)[^\\\r\n])*)\1/gu;
  for (const match of source.matchAll(literalPattern)) {
    const raw = match[2] ?? "";
    if (raw.includes("${")) continue;
    const value = raw
      .replace(/\\n/gu, "\n")
      .replace(/\\(["'`\\])/gu, "$1");
    if (looksLikeCopy(value)) output.add(value.trim());
  }
  void filename;
}

async function translateBatch(strings, target) {
  const marker = "[[AMSO_SPLIT_7F3A]]";
  const query = strings.join(`\n${marker}\n`);
  const params = new URLSearchParams({ client: "gtx", sl: "pl", tl: target, dt: "t", q: query });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);
  if (!response.ok) throw new Error(`translation_${target}_${response.status}`);
  const payload = await response.json();
  const combined = payload[0].map((part) => part[0]).join("");
  const translated = combined.split(marker).map((value) => value.trim());
  if (translated.length !== strings.length) {
    throw new Error(`translation_split_${target}_${translated.length}_${strings.length}`);
  }
  return translated;
}

const strings = new Set(extraCopy);
const config = JSON.parse(await readFile(resolve(root, "public/assets/milion-runner/runner-config.json"), "utf8"));
collectJsonStrings(config, strings);
for (const filename of sourceFiles) {
  collectSourceStrings(await readFile(resolve(root, filename), "utf8"), filename, strings);
}
const ordered = [...strings].sort((a, b) => a.localeCompare(b, "pl"));
const catalogs = { pl: Object.fromEntries(ordered.map((source) => [source, source])) };

for (const target of targets) {
  const entries = [];
  for (let index = 0; index < ordered.length; index += 20) {
    const sources = ordered.slice(index, index + 20);
    const translated = await translateBatch(sources, target);
    entries.push(...sources.map((source, offset) => [source, translated[offset]]));
  }
  catalogs[target] = Object.fromEntries(entries);
}

const titleOverrides = {
  de: "Der Weg zur Million",
  en: "Road to a Million",
  es: "Camino al millón",
  cs: "Cesta k milionu",
  it: "La strada verso il milione",
  fr: "En route vers le million",
  uk: "Шлях до мільйона"
};
for (const target of targets) catalogs[target]["Droga do Miliona"] = titleOverrides[target];
for (const target of targets) {
  for (const brand of ["AMSO", "AMSO Care", "Selkea", "Triadyn", "Facebook", "Instagram"]) {
    if (brand in catalogs[target]) catalogs[target][brand] = brand;
  }
}

await writeFile(
  resolve(root, "src/localization/generated-catalogs.json"),
  `${JSON.stringify(catalogs, null, 2)}\n`,
  "utf8"
);
console.log(`Generated ${ordered.length} source messages for ${targets.length + 1} locales.`);
