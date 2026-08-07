import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const locales = ["pl", "de", "en", "es", "cs", "it", "fr", "uk"];
const catalogPath = path.join(root, "src/localization/generated-catalogs.json");
const catalogs = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const sourceKeys = Object.keys(catalogs.pl ?? {}).sort();

if (sourceKeys.length < 300) throw new Error("localization_catalog_incomplete");
for (const locale of locales) {
  const catalogue = catalogs[locale];
  if (!catalogue || JSON.stringify(Object.keys(catalogue).sort()) !== JSON.stringify(sourceKeys)) {
    throw new Error(`localization_key_mismatch:${locale}`);
  }
  if (Object.values(catalogue).some((value) => typeof value !== "string" || value.trim() === "")) {
    throw new Error(`localization_empty_message:${locale}`);
  }
}

const config = fs.readFileSync(path.join(root, "public/assets/milion-runner/runner-config.json"), "utf8");
if (/mz-(?:main|compact)-lockup-v1/u.test(config)) throw new Error("legacy_polish_lockup");
for (const asset of ["million-neutral-main.svg", "million-neutral-compact.svg"]) {
  if (!fs.existsSync(path.join(root, "public/assets/milion-runner/brand", asset))) {
    throw new Error(`neutral_lockup_missing:${asset}`);
  }
}

const deployment = fs.readFileSync(
  path.join(root, "src/localization/idosell-deployment.ts"),
  "utf8"
);
for (const locale of locales) {
  if (!deployment.includes(`locale: "${locale}"`)) throw new Error(`idosell_row_missing:${locale}`);
}
if (!deployment.includes('"x-default"')) throw new Error("idosell_x_default_missing");

console.log(`localization release gate: ${locales.length} locales, ${sourceKeys.length} messages`);
