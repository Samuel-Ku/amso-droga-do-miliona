import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const demoDir = path.join(root, "dist-demo");
const indexPath = path.join(demoDir, "index.html");
const outputPath = path.join(root, "droga-do-miliona-qa.html");
const embeddedResourcePolicyPath = path.join(
  root,
  "src",
  "config",
  "embedded-resource-policy.json",
);
const embeddedResourcePolicy = JSON.parse(
  fs.readFileSync(embeddedResourcePolicyPath, "utf8"),
);
const embeddedAvifMaxLength =
  embeddedResourcePolicy.maxEmbeddedAvifDataUriLength;
if (!Number.isSafeInteger(embeddedAvifMaxLength) || embeddedAvifMaxLength <= 0) {
  throw new Error("Nieprawidlowy limit osadzonych plikow AVIF");
}
const campaignAssetDir = path.join(
  root,
  "public",
  "assets",
  "milion-runner",
);

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
  });
}

function builtAssetPath(source) {
  const cleanSource = source.split(/[?#]/u, 1)[0].replace(/^\.?\//u, "");
  return path.join(demoDir, cleanSource);
}

function inlineCampaignImageAssets(document) {
  const imagePaths = collectFiles(campaignAssetDir).filter(
    (assetPath) => [".avif", ".svg", ".webp"].includes(path.extname(assetPath).toLowerCase()),
  );

  if (imagePaths.length === 0) {
    throw new Error("Nie znaleziono grafik kampanii do osadzenia");
  }

  let inlinedDocument = document;
  let inlinedReferenceCount = 0;

  for (const assetPath of imagePaths) {
    const assetRelativePath = path
      .relative(path.join(root, "public"), assetPath)
      .split(path.sep)
      .join("/");
    const publicPath = `/${assetRelativePath}`;
    const extension = path.extname(assetPath).toLowerCase();
    const mimeType = extension === ".svg"
      ? "image/svg+xml"
      : extension === ".webp"
        ? "image/webp"
        : "image/avif";
    const dataUri = `data:${mimeType};base64,${fs.readFileSync(assetPath).toString("base64")}`;
    if (extension === ".avif" && dataUri.length > embeddedAvifMaxLength) {
      throw new Error(
        `Osadzony AVIF ${assetRelativePath} przekracza limit ${embeddedAvifMaxLength} znakow`,
      );
    }
    const sourceVariants = [`.${publicPath}`, publicPath, assetRelativePath];

    for (const source of sourceVariants) {
      const occurrenceCount = inlinedDocument.split(source).length - 1;
      if (occurrenceCount === 0) continue;

      inlinedDocument = inlinedDocument.replaceAll(source, dataUri);
      inlinedReferenceCount += occurrenceCount;
    }
  }

  return {
    html: inlinedDocument,
    assetCount: imagePaths.length,
    referenceCount: inlinedReferenceCount,
  };
}

let html = fs.readFileSync(indexPath, "utf8");
const scriptMatches = [
  ...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/giu),
];
const styleMatch = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/iu);

if (scriptMatches.length === 0 || !styleMatch?.[1]) {
  throw new Error("Nie znaleziono bundli JS/CSS w dist-demo/index.html");
}

const style = fs.readFileSync(builtAssetPath(styleMatch[1]), "utf8");
const deferredScripts = [];

for (const scriptMatch of scriptMatches) {
  const source = scriptMatch[1];
  if (!source) throw new Error("Bundle JS bez sciezki zrodlowej");

  let script = fs.readFileSync(builtAssetPath(source), "utf8");
  script = script.replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  script = script.replace(/<\/script/giu, "<\\/script");
  const inlineScript = `<script>\n${script}\n</script>`;

  if (/\btype="module"/iu.test(scriptMatch[0])) {
    // Vite's entry bundle contains no imports. Defer it until the campaign root
    // exists and convert it to a classic script for reliable file:// execution.
    html = html.replace(scriptMatch[0], "");
    deferredScripts.push(inlineScript);
  } else {
    // Preserve the watchdog after the parsed fallback and before the deferred app.
    html = html.replace(scriptMatch[0], inlineScript);
  }
}

if (deferredScripts.length === 0) {
  throw new Error("Nie znaleziono glownego bundle module w dist-demo/index.html");
}

html = html.replace(
  "</body>",
  () => `${deferredScripts.join("\n")}\n</body>`,
);
html = html.replace(styleMatch[0], () => `<style>\n${style}\n</style>`);
html = html.replace(
  "</head>",
  '<meta name="generator" content="AMSO QA preview">\n</head>',
);

// Vite intentionally leaves files from public/ as external URLs. The production
// demo keeps that behaviour, while this QA artifact embeds the campaign artwork
// so it remains complete when opened directly via file:// without a web server.
const inlineResult = inlineCampaignImageAssets(html);
html = inlineResult.html;
html = html.replace(/^[\t ]+$/gmu, "");

fs.writeFileSync(outputPath, html, "utf8");
console.log(
  "single-file QA preview:",
  path.basename(outputPath),
  fs.statSync(outputPath).size,
  "bytes; embedded",
  inlineResult.assetCount,
  "image files in",
  inlineResult.referenceCount,
  "references",
);
