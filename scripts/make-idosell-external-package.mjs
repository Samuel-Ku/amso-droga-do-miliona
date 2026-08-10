import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const sourcePath = path.join(root, "million-idosell.html");
const outputDirectory = path.join(root, "dist-idosell-external");
const zipPath = path.join(root, "amso-million-idosell-external.zip");
const watchdogPath = path.join(
  root,
  "public",
  "assets",
  "milion-runner",
  "boot-watchdog.js",
);
const watchdog = fs.readFileSync(watchdogPath, "utf8").trim();
const watchdogCspHash = `sha256-${createHash("sha256").update(watchdog).digest("base64")}`;
const packageFileNames = [
  "README.txt",
  "idosell-snippet.html",
  "million.css",
  "million.js",
  "preview.html",
];

const html = fs.readFileSync(sourcePath, "utf8");
const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/iu);
const deferredMatch = html.match(
  /<script type="application\/json" id="amso-million-runner-2026-deferred-scripts">([\s\S]*?)<\/script>/iu,
);
const assetsMatch = html.match(/const assets=(\{[\s\S]*?\});const replace=/u);
const rootMatch = html.match(
  /<!-- AMSO MILLION RUNNER 2026 ROOT START -->[\s\S]*?<!-- AMSO MILLION RUNNER 2026 ROOT END -->/u,
);

if (!styleMatch?.[1] || !deferredMatch?.[1] || !assetsMatch?.[1] || !rootMatch?.[0]) {
  throw new Error("Nie znaleziono kompletnego runtime kampanii w million-idosell.html");
}

const deferredSources = JSON.parse(deferredMatch[1]);
const embeddedAssets = JSON.parse(assetsMatch[1]);
if (!Array.isArray(deferredSources) || deferredSources.length === 0) {
  throw new Error("Brak glownego bundle aplikacji w artefakcie IdoSell");
}

let applicationSource = deferredSources.join("\n;\n");
const embeddedAssetEntries = Object.entries(embeddedAssets);
for (const [assetIndex, [token]] of embeddedAssetEntries.entries()) {
  const tokenLiteral = `\`${token}\``;
  if (!applicationSource.includes(tokenLiteral)) continue;
  applicationSource = applicationSource.replaceAll(
    tokenLiteral,
    `__AMSO_ASSETS__[${assetIndex}]`,
  );
}

const unresolvedTokens = applicationSource.match(/__AMSO_EMBEDDED_ASSET_\d+__/gu);
if (unresolvedTokens) {
  throw new Error(
    `Nie rozwiazano ${unresolvedTokens.length} referencji do osadzonych assetow`,
  );
}

const application = [
  "(()=>{\"use strict\";",
  `const __AMSO_ASSETS__=${JSON.stringify(embeddedAssetEntries.map(([, value]) => value))};`,
  applicationSource,
  "})();",
  "",
].join("\n");

// Parse before publishing: the external file is deliberately a classic script,
// so the CMS does not need module/CORS handling for the application bundle.
new Function(application);

const snippet = [
  "<!-- AMSO Million: paste into the IdoSell HTML editor -->",
  '<link rel="stylesheet" href="__AMSO_PUBLIC_BASE_URL__/million.css">',
  rootMatch[0],
  `<!-- CSP script-src hash for the fallback below: '${watchdogCspHash}' -->`,
  `<script>${watchdog.replace(/<\/script/giu, "<\\/script")}</script>`,
  '<script src="__AMSO_PUBLIC_BASE_URL__/million.js" defer></script>',
  "",
].join("\n");

const preview = [
  "<!doctype html>",
  '<html lang="pl">',
  "<head>",
  '  <meta charset="UTF-8">',
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
  "  <title>AMSO — Droga do Miliona — external preview</title>",
  '  <link rel="stylesheet" href="./million.css">',
  "</head>",
  "<body>",
  rootMatch[0],
  `  <script>${watchdog.replace(/<\/script/giu, "<\\/script")}</script>`,
  '  <script src="./million.js" defer></script>',
  "</body>",
  "</html>",
  "",
].join("\n");

const readme = `AMSO — DROGA DO MILIONA / PAKIET DLA IDOSELL
================================================

CEL
---
Ten pakiet rozdziela kampanie na maly fragment HTML oraz zewnetrzne CSS/JS.
Nie wklejaj pliku million.js bezposrednio do pola CMS — jest za duzy.

PLIKI DO PUBLIKACJI NA OTWARTEJ DOMENIE HTTPS
----------------------------------------------
1. million.css
2. million.js

Oba pliki musza byc publicznie dostepne bez logowania i przekierowan.
Serwer powinien zwracac poprawne Content-Type: text/css i text/javascript.

IDOSELL
-------
1. Otworz idosell-snippet.html w edytorze tekstowym.
2. Zamien kazde __AMSO_PUBLIC_BASE_URL__ na pelny adres katalogu z plikami,
   np. https://static.example.com/amso-million (bez koncowego slash).
3. Wklej wynik jako kod HTML, nie przez edytor wizualny/WYSIWYG.
4. Alternatywnie dodaj link CSS i skrypt aplikacji przez
   Sklep > Dodatki HTML i JavaScript,
   ograniczajac dodatek do stron kampanii /million.
5. IdoSell pozostaje wlascicielem lang, title, canonical, OG i hreflang.
6. Snippet nie dodaje drugiego <main>. Klasy i ID kampanii sa odizolowane
   prefiksem amso-million-runner-2026.

CSP
---
Snippet zawiera tylko jeden maly inline watchdog. Jego gotowy hash CSP to:
'${watchdogCspHash}'
Dodaj ten hash do script-src razem z domena hostujaca million.js. Jezeli IdoSell
zarzadza nonce, mozna zamiast hasha dodac jego nonce do tego elementu <script>.

JEZYKI
------
Ten sam zestaw plikow obsluguje PL, EN, DE, ES, CS, IT, FR i UK.
Gra wybiera jezyk oraz jubileuszowy znak na podstawie <html lang> strony IdoSell.

TEST
----
Najpierw otworz preview.html z tego samego katalogu przez serwer HTTP.
Po publikacji sprawdz landing, Start, pauze, wynik/share i konsole przegladarki.
Opcjonalny leaderboard laczy sie z:
https://droga-do-miliona-records.s-kutsenko.workers.dev

AKTUALIZACJE
------------
Przy kazdej nowej wersji podmien razem million.css i million.js. Zalecane jest
wersjonowanie URL katalogu albo czyszczenie cache CDN, aby pliki nie mieszaly sie
miedzy wydaniami.
`;

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "million.css"), `${styleMatch[1]}\n`);
fs.writeFileSync(path.join(outputDirectory, "million.js"), application);
fs.writeFileSync(path.join(outputDirectory, "idosell-snippet.html"), snippet);
fs.writeFileSync(path.join(outputDirectory, "preview.html"), preview);
fs.writeFileSync(path.join(outputDirectory, "README.txt"), readme);

// ZIP entry timestamps are normalized so identical sources yield an identical
// handoff checksum across consecutive builds and machines.
const normalizedTimestamp = new Date("2020-01-01T00:00:00.000Z");
for (const name of packageFileNames) {
  fs.utimesSync(
    path.join(outputDirectory, name),
    normalizedTimestamp,
    normalizedTimestamp,
  );
}

fs.rmSync(zipPath, { force: true });
const zipped = spawnSync("zip", ["-X", "-q", zipPath, ...packageFileNames], {
  cwd: outputDirectory,
  encoding: "utf8",
  env: { ...process.env, TZ: "UTC" },
});
if (zipped.status !== 0) {
  throw new Error(`Nie udalo sie utworzyc ZIP: ${zipped.stderr || zipped.stdout}`);
}

console.log(
  "IdoSell external package:",
  path.basename(zipPath),
  fs.statSync(zipPath).size,
  "bytes; application:",
  fs.statSync(path.join(outputDirectory, "million.js")).size,
  "bytes",
);
