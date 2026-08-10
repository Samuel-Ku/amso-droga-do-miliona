import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const builtDir = path.join(root, "dist-demo");
const indexPath = path.join(builtDir, "index.html");
const outputPath = path.join(root, "million-idosell.html");
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
const embeddedWebpMaxLength =
  embeddedResourcePolicy.maxEmbeddedWebpDataUriLength;
if (!Number.isSafeInteger(embeddedAvifMaxLength) || embeddedAvifMaxLength <= 0) {
  throw new Error("Nieprawidlowy limit osadzonych plikow AVIF");
}
if (!Number.isSafeInteger(embeddedWebpMaxLength) || embeddedWebpMaxLength <= 0) {
  throw new Error("Nieprawidlowy limit osadzonych plikow WebP");
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
  return path.join(builtDir, cleanSource);
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
  const embeddedAssets = {};

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
    if (extension === ".webp" && dataUri.length > embeddedWebpMaxLength) {
      throw new Error(
        `Osadzony WebP ${assetRelativePath} przekracza limit ${embeddedWebpMaxLength} znakow`,
      );
    }
    const sourceVariants = [`.${publicPath}`, publicPath, assetRelativePath];
    const token = `__AMSO_EMBEDDED_ASSET_${Object.keys(embeddedAssets).length}__`;
    let assetUsed = false;

    for (const source of sourceVariants) {
      const occurrenceCount = inlinedDocument.split(source).length - 1;
      if (occurrenceCount === 0) continue;

      inlinedDocument = inlinedDocument.replaceAll(source, token);
      inlinedReferenceCount += occurrenceCount;
      assetUsed = true;
    }
    if (assetUsed) embeddedAssets[token] = dataUri;
  }

  return {
    html: inlinedDocument,
    assetCount: imagePaths.length,
    referenceCount: inlinedReferenceCount,
    embeddedAssets,
  };
}

let html = fs.readFileSync(indexPath, "utf8");

// IdoSell owns the outer document locale and all indexable metadata. Keeping
// those values inside the reusable fragment would force localized pages to
// inherit Polish metadata.
html = html.replace(/\s*<meta\s+name="description"[\s\S]*?>/giu, "");
html = html.replace(/\s*<link\s+rel="canonical"[\s\S]*?>/giu, "");
html = html.replace(/\s*<meta\s+property="og:[^"]+"[\s\S]*?>/giu, "");
html = html.replace(/\s*<title>[\s\S]*?<\/title>/iu, "");
const scriptMatches = [
  ...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/giu),
];
const styleMatch = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/iu);

if (scriptMatches.length === 0 || !styleMatch?.[1]) {
  throw new Error(`Nie znaleziono bundli JS/CSS w ${path.basename(builtDir)}/index.html`);
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
    deferredScripts.push(script);
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
  () => `<script type="application/json" id="amso-deferred-scripts">${JSON.stringify(deferredScripts).replace(/<\/script/giu, "<\\/script")}</script>\n</body>`,
);
html = html.replace(styleMatch[0], () => `<style>\n${style}\n</style>`);

html = html.replace(
  "</head>",
  `<meta name="generator" content="AMSO IdoSell autonomous campaign">\n</head>`,
);

// Vite intentionally leaves files from public/ as external URLs. Both generated
// autonomous artifacts embed the campaign artwork for file:// and CMS use.
const inlineResult = inlineCampaignImageAssets(html);
html = inlineResult.html;
const assetBootstrap = `<script>(()=>{const nonce=document.currentScript?.nonce||"";const assets=${JSON.stringify(inlineResult.embeddedAssets)};const replace=(value)=>typeof value==="string"?value.replace(/__AMSO_EMBEDDED_ASSET_\\d+__/g,(token)=>assets[token]||token):value;const holder=document.getElementById("amso-deferred-scripts");const sources=holder?JSON.parse(holder.textContent||"[]"):[];holder?.remove();for(const source of sources){const script=document.createElement("script");if(nonce)script.nonce=nonce;script.text=replace(source);document.body.appendChild(script)}})();</script>`;
html = html.replace("</body>", `${assetBootstrap}\n</body>`);
html = html.replace(/^[\t ]+$/gmu, "");

{
  const headStart = html.indexOf("<head>");
  const headEnd = html.indexOf("</head>", headStart);
  const bodyStart = html.indexOf("<body>", headEnd);
  const bodyEnd = html.lastIndexOf("</body>");
  if (headStart < 0 || headEnd < 0 || bodyStart < 0 || bodyEnd < 0) {
    throw new Error("Nie znaleziono powloki dokumentu dla fragmentu IdoSell");
  }
  const head = html.slice(headStart + "<head>".length, headEnd);
  const body = html.slice(bodyStart + "<body>".length, bodyEnd);
  const executableHead = [];
  let cursor = 0;
  while (cursor < head.length) {
    const styleStart = head.indexOf("<style", cursor);
    const scriptStart = head.indexOf("<script", cursor);
    const start = [styleStart, scriptStart]
      .filter((position) => position >= 0)
      .sort((left, right) => left - right)[0];
    if (start === undefined) break;
    const tag = start === styleStart ? "style" : "script";
    const endTag = `</${tag}>`;
    const end = head.indexOf(endTag, start);
    if (end < 0) throw new Error(`Nie zamknieto elementu ${tag} w pakiecie IdoSell`);
    executableHead.push(head.slice(start, end + endTag.length));
    cursor = end + endTag.length;
  }
  html = [
    "<!-- AMSO Million: autonomous IdoSell CMS fragment -->",
    ...executableHead,
    body.trim(),
    ""
  ].join("\n");
}

fs.writeFileSync(outputPath, html, "utf8");
console.log(
  "IdoSell autonomous HTML:",
  path.basename(outputPath),
  fs.statSync(outputPath).size,
  "bytes; embedded",
  inlineResult.assetCount,
  "image files in",
  inlineResult.referenceCount,
  "references",
);
