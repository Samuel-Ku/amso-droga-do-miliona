import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const demoDir = path.join(root, "dist-demo");
const indexPath = path.join(demoDir, "index.html");
const outputPath = path.join(root, "droga-do-miliona-qa.html");

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

fs.writeFileSync(outputPath, html, "utf8");
console.log("single-file QA preview:", path.basename(outputPath), fs.statSync(outputPath).size, "bytes");
