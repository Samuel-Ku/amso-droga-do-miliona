import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageDirectory = path.resolve(here, "..", "dist-idosell-external");
const recordsWorkerOrigin = "https://droga-do-miliona-records.s-kutsenko.workers.dev";
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
]);

const server = http.createServer((request, response) => {
  const requestPath = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const fileName = requestPath === "/" ? "preview.html" : requestPath.slice(1);
  const filePath = path.join(packageDirectory, fileName);
  if (path.dirname(filePath) !== packageDirectory || !fs.existsSync(filePath)) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.setHeader(
    "Content-Type",
    contentTypes.get(path.extname(filePath)) ?? "application/octet-stream",
  );
  response.end(fs.readFileSync(filePath));
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

let browser;
try {
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Nie udalo sie ustalic portu preview");
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const failures = [];
  await page.route(`${recordsWorkerOrigin}/**`, (route) => route.abort("failed"));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (message.location().url.startsWith(recordsWorkerOrigin)) return;
    failures.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    if (request.url().startsWith(recordsWorkerOrigin)) return;
    failures.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ""}`);
  });

  await page.goto(`http://127.0.0.1:${address.port}/preview.html`, {
    waitUntil: "networkidle",
  });
  await page.locator("#amso-campaign-root .amso-campaign[data-view=landing]")
    .waitFor({ state: "visible" });
  await page.getByText("Tablica niedostępna.", { exact: true })
    .waitFor({ state: "visible" });

  const state = await page.evaluate(() => ({
    campaignScripting: document.documentElement.dataset.campaignScripting,
    externalScripts: [...document.scripts].filter((script) => script.src).length,
    inlineScripts: [...document.scripts].filter((script) => !script.src).length,
    qaGlobal: "AMSOMillionRunnerQA" in window,
  }));
  if (state.campaignScripting !== "enabled") failures.push("watchdog did not execute");
  if (state.externalScripts !== 1) failures.push("preview must load one external application script");
  if (state.inlineScripts !== 1) failures.push("preview must contain one inline watchdog");
  if (state.qaGlobal) failures.push("production preview exposed QA global");
  if (failures.length > 0) throw new Error(failures.join("\n"));

  console.log(
    "IdoSell external browser smoke: landing mounted without errors; optional records Worker unavailable",
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
