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

// Embed the runner config inline so the loader can run from a file:// origin
// where fetching /assets/... is blocked by the browser's unique-origin policy.
// It is injected BEFORE the artwork inlining below so the config's own asset
// source URLs (bundles, worlds) are also rewritten to data: URIs, keeping the
// artifact fully offline.
const runnerConfigPath = path.join(campaignAssetDir, "runner-config.json");
const runnerConfigJson = fs.readFileSync(runnerConfigPath, "utf8");
const embeddedConfigScript = `<script>window.__RUNNER_CONFIG__=${JSON.stringify(
  JSON.parse(runnerConfigJson)
)}</script>`;

// Embed the runtime module and stylesheet inline as strings so the loader can
// boot them from a file:// origin (where /assets/... URLs are blocked) via Blob
// URL / <style> injection instead of a same-origin fetch.
const runtimeModulePath = path.join(root, "dist", "assets", "milion-runner", "runner.js");
const runtimeStylePath = path.join(root, "dist", "assets", "milion-runner", "runner.css");
const embeddedRuntimeScript = `<script>window.__RUNNER_MODULE__=${JSON.stringify(
  fs.readFileSync(runtimeModulePath, "utf8")
)}</script>`;
const embeddedStyleScript = `<script>window.__RUNNER_STYLE__=${JSON.stringify(
  fs.readFileSync(runtimeStylePath, "utf8")
)}</script>`;

html = html.replace(
  "</head>",
  `${embeddedConfigScript}\n${embeddedRuntimeScript}\n${embeddedStyleScript}\n<meta name="generator" content="AMSO QA preview">\n</head>`,
);

// Vite intentionally leaves files from public/ as external URLs. The production
// demo keeps that behaviour, while this QA artifact embeds the campaign artwork
// so it remains complete when opened directly via file:// without a web server.
const inlineResult = inlineCampaignImageAssets(html);
html = inlineResult.html;
const assetBootstrap = `<script>(()=>{const assets=${JSON.stringify(inlineResult.embeddedAssets)};const replace=(value)=>typeof value==="string"?value.replace(/__AMSO_EMBEDDED_ASSET_\\d+__/g,(token)=>assets[token]||token):value;const resolve=(value)=>{if(Array.isArray(value)){for(let i=0;i<value.length;i+=1)value[i]=resolve(value[i]);return value}if(value&&typeof value==="object"){for(const key of Object.keys(value))value[key]=resolve(value[key]);return value}return replace(value)};window.__RUNNER_CONFIG__=resolve(window.__RUNNER_CONFIG__);window.__RUNNER_MODULE__=replace(window.__RUNNER_MODULE__);window.__RUNNER_STYLE__=replace(window.__RUNNER_STYLE__);const holder=document.getElementById("amso-deferred-scripts");const sources=holder?JSON.parse(holder.textContent||"[]"):[];holder?.remove();for(const source of sources){const script=document.createElement("script");script.text=replace(source);document.body.appendChild(script)}})();</script>`;
html = html.replace("</body>", `${assetBootstrap}\n</body>`);
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
