import { chromium } from "playwright";

const productionUrl = process.env.AMSO_VERCEL_PRODUCTION_URL ?? "https://game.amso.pl/";
const recordsWorkerOrigin = "https://droga-do-miliona-records.s-kutsenko.workers.dev";
const failures = [];
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ locale: "es-ES" });
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
  const url = new URL(productionUrl);
  url.searchParams.set("lang", "es");
  await page.goto(url.href, { waitUntil: "networkidle", timeout: 30_000 });
  await page.locator("#amso-million-runner-2026-root .amso-million-runner-2026[data-view=landing]")
    .waitFor({ state: "visible" });
  const state = await page.evaluate(() => ({
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    locale: document.documentElement.lang,
    title: document.querySelector("[data-campaign-copy='landingTitleAccent']")?.textContent,
    qaGlobal: "AMSOMillionRunnerQA" in window
  }));
  if (state.canonical !== "https://game.amso.pl/") failures.push(`canonical: ${state.canonical}`);
  if (state.locale !== "es" || state.title !== "Camino al millón") {
    failures.push(`locale: ${JSON.stringify(state)}`);
  }
  if (state.qaGlobal) failures.push("production page exposed QA global");
  if (failures.length > 0) throw new Error(failures.join("\n"));
  console.log(`Vercel live smoke passed: ${productionUrl}`);
} finally {
  await browser.close();
}
