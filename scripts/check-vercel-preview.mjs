import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist-vercel");
const recordsWorkerOrigin = "https://droga-do-miliona-records.s-kutsenko.workers.dev";
const contentTypes = new Map([
  [".avif", "image/avif"], [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"], [".webp", "image/webp"]
]);

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const relative = pathname === "/" || pathname === "/million"
    ? "index.html"
    : pathname.replace(/^\//u, "");
  const filePath = path.resolve(root, relative);
  if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath)) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.setHeader("Content-Type", contentTypes.get(path.extname(filePath)) ?? "application/octet-stream");
  response.end(fs.readFileSync(filePath));
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

let browser;
try {
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Vercel preview port unavailable");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const failures = [];
  await page.route(`${recordsWorkerOrigin}/**`, (route) => route.abort("failed"));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.location().url.startsWith(recordsWorkerOrigin)) {
      failures.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    if (!request.url().startsWith(recordsWorkerOrigin)) {
      failures.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ""}`);
    }
  });

  await page.goto(`http://127.0.0.1:${address.port}/million`, { waitUntil: "networkidle" });
  await page.locator("#amso-million-runner-2026-root .amso-million-runner-2026[data-view=landing]")
    .waitFor({ state: "visible" });
  const state = await page.evaluate(() => ({
    profile: document.querySelector("#amso-million-runner-2026-root")
      ?.getAttribute("data-campaign-keyboard-profile"),
    canvasLabel: document.querySelector("[data-campaign-canvas]")?.getAttribute("aria-label"),
    qaGlobal: "AMSOMillionRunnerQA" in window
  }));
  if (state.profile !== "vercel") failures.push(`unexpected keyboard profile: ${state.profile}`);
  if (!state.canvasLabel?.includes("↑") || !state.canvasLabel.includes("↓")) {
    failures.push("Vercel arrow controls are not advertised");
  }
  if (state.qaGlobal) failures.push("production Vercel page exposed QA global");
  if (failures.length > 0) throw new Error(failures.join("\n"));
  console.log("Vercel browser smoke: /million mounted with restored arrow controls");
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
