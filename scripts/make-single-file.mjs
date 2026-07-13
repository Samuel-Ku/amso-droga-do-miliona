import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const demoDir = path.join(root, "dist-demo");
const indexPath = path.join(demoDir, "index.html");
const outputPath = path.join(root, "droga-do-miliona-qa.html");
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

function inlineCampaignAvifAssets(document) {
  const avifPaths = collectFiles(campaignAssetDir).filter(
    (assetPath) => path.extname(assetPath).toLowerCase() === ".avif",
  );

  if (avifPaths.length === 0) {
    throw new Error("Nie znaleziono plikow AVIF kampanii do osadzenia");
  }

  let inlinedDocument = document;
  let inlinedReferenceCount = 0;

  for (const assetPath of avifPaths) {
    const assetRelativePath = path
      .relative(path.join(root, "public"), assetPath)
      .split(path.sep)
      .join("/");
    const publicPath = `/${assetRelativePath}`;
    const dataUri = `data:image/avif;base64,${fs.readFileSync(assetPath).toString("base64")}`;
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
    assetCount: avifPaths.length,
    referenceCount: inlinedReferenceCount,
  };
}

let html = fs.readFileSync(indexPath, "utf8");
const scriptMatch = html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/i);
const styleMatch = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/i);

if (!scriptMatch || !styleMatch) {
  throw new Error("Nie znaleziono bundle JS/CSS w dist-demo/index.html");
}

const scriptPath = path.resolve(demoDir, scriptMatch[1]);
const stylePath = path.resolve(demoDir, styleMatch[1]);
let script = fs.readFileSync(scriptPath, "utf8");
const style = fs.readFileSync(stylePath, "utf8");

script = script.replace(/\n?\/\/#[ ]sourceMappingURL=.*$/m, "");
script = script.replace(/<\/script/gi, "<\\/script");

// The bundle contains no imports, so place it at the end of <body> as a classic
// script. This waits for the controls to exist and also works reliably via file://.
html = html.replace(scriptMatch[0], "");
html = html.replace(
  "</body>",
  () => "<script>\n" + script + "\n</script>\n</body>",
);
html = html.replace(styleMatch[0], () => "<style>\n" + style + "\n</style>");
html = html.replace("</head>", "<meta name=\"generator\" content=\"AMSO QA preview\">\n</head>");

// Vite intentionally leaves files from public/ as external URLs. The production
// demo keeps that behaviour, while this QA artifact embeds the campaign artwork
// so it remains complete when opened directly via file:// without a web server.
const inlineResult = inlineCampaignAvifAssets(html);
html = inlineResult.html;

fs.writeFileSync(outputPath, html, "utf8");
console.log(
  "single-file QA preview:",
  path.basename(outputPath),
  fs.statSync(outputPath).size,
  "bytes; embedded",
  inlineResult.assetCount,
  "AVIF files in",
  inlineResult.referenceCount,
  "references",
);
