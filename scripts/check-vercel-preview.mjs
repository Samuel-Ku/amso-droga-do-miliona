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

async function checkMobileOverlayContainment(browser, baseUrl, failures) {
  for (const viewport of [{ width: 390, height: 667 }, { width: 667, height: 390 }]) {
    const context = await browser.newContext({ viewport, locale: "de-DE" });
    const page = await context.newPage();
    await page.route(`${recordsWorkerOrigin}/**`, (route) => route.abort("failed"));
    await page.goto(`${baseUrl}/million?lang=de`, { waitUntil: "networkidle" });
    await page.locator("#amso-million-runner-2026-root .amso-million-runner-2026")
      .waitFor({ state: "visible" });
    const result = await page.evaluate(() => {
      const root = document.querySelector(".amso-million-runner-2026");
      const main = document.querySelector(".amso-million-runner-2026__main");
      const stage = document.querySelector("[data-campaign-stage]");
      const pause = document.querySelector("[data-campaign-pause-screen]");
      const pauseCard = pause?.querySelector(".amso-million-runner-2026__card");
      const pauseBonuses = pause?.querySelector(".amso-million-runner-2026__pause-bonuses");
      const story = document.querySelector("[data-campaign-story-presentation]");
      const storyCard = document.querySelector("[data-campaign-story-scene]");
      const storyBody = document.querySelector("[data-campaign-story-scene-body]");
      const countdown = document.querySelector("[data-campaign-story-countdown]");
      if (!(root instanceof HTMLElement) || !(main instanceof HTMLElement) || !(stage instanceof HTMLElement) ||
          !(pause instanceof HTMLElement) || !(pauseCard instanceof HTMLElement) ||
          !(pauseBonuses instanceof HTMLElement) || !(story instanceof HTMLElement) ||
          !(storyCard instanceof HTMLElement) || !(storyBody instanceof HTMLElement) ||
          !(countdown instanceof HTMLElement)) throw new Error("mobile_overlay_fixture_missing");
      const contained = (inner, outer) => {
        const innerRect = inner.getBoundingClientRect();
        const outerRect = outer.getBoundingClientRect();
        return innerRect.left >= outerRect.left - 1 && innerRect.top >= outerRect.top - 1 &&
          innerRect.right <= outerRect.right + 1 && innerRect.bottom <= outerRect.bottom + 1;
      };
      const rect = (element) => {
        const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
        return { left, top, right, bottom, width, height };
      };
      const longCopy = Array.from({ length: 24 }, (_, index) => {
        const line = document.createElement("span");
        line.textContent = `Mobile pause detail ${index + 1}: progress remains safe.`;
        return line;
      });
      root.dataset.view = "game";
      root.dataset.mobileLayout = "true";
      root.dataset.cssGameMode = "true";
      root.style.gridTemplateRows = "minmax(0, 1fr)";
      main.style.height = "100%";
      stage.hidden = false;
      pauseBonuses.replaceChildren(...longCopy);
      pause.hidden = false;
      const pauseContained = contained(pause, stage) && contained(pauseCard, pause);
      const pauseScrolls = pauseCard.scrollHeight > pauseCard.clientHeight;
      const pauseGeometry = { overlay: rect(pause), card: rect(pauseCard) };

      pause.hidden = true;
      root.dataset.view = "story_scene";
      story.hidden = false;
      storyCard.hidden = false;
      countdown.hidden = true;
      storyBody.replaceChildren(...Array.from({ length: 24 }, (_, index) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = `Mobile story paragraph ${index + 1}: the complete history stays readable.`;
        return paragraph;
      }));
      const storyContained = contained(story, stage) && contained(storyCard, story);
      const storyScrolls = storyBody.scrollHeight > storyBody.clientHeight;
      return {
        pauseContained,
        pauseScrolls,
        storyContained,
        storyScrolls,
        geometry: {
          root: rect(root),
          main: rect(main),
          stage: rect(stage),
          pause: pauseGeometry.overlay,
          pauseCard: pauseGeometry.card,
          story: rect(story),
          storyCard: rect(storyCard)
        }
      };
    });
    if (!result.pauseContained || !result.pauseScrolls ||
        !result.storyContained || !result.storyScrolls) {
      failures.push(`mobile overlays escaped ${viewport.width}x${viewport.height}: ${JSON.stringify(result)}`);
    }
    await context.close();
  }
}

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
  const context = await browser.newContext({ locale: "de-DE" });
  const page = await context.newPage();
  await page.addInitScript((storageKey) => {
    window.localStorage.setItem(storageKey, "fr");
  }, "amso-million-runner-locale");
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

  await page.goto(
    `http://127.0.0.1:${address.port}/million?utm_source=banner&lang=es`,
    { waitUntil: "networkidle" }
  );
  await page.locator("#amso-million-runner-2026-root .amso-million-runner-2026[data-view=landing]")
    .waitFor({ state: "visible" });
  const state = await page.evaluate(() => ({
    profile: document.querySelector("#amso-million-runner-2026-root")
      ?.getAttribute("data-campaign-keyboard-profile"),
    canvasLabel: document.querySelector("[data-campaign-canvas]")?.getAttribute("aria-label"),
    qaGlobal: "AMSOMillionRunnerQA" in window,
    documentLanguage: document.documentElement.lang,
    selectedLanguage: document.querySelector("[data-campaign-language]")?.value,
    landingTitle: document.querySelector("[data-campaign-copy='landingTitleAccent']")?.textContent
  }));
  if (state.profile !== "vercel") failures.push(`unexpected keyboard profile: ${state.profile}`);
  if (!state.canvasLabel?.includes("↑") || !state.canvasLabel.includes("↓")) {
    failures.push("Vercel arrow controls are not advertised");
  }
  if (state.documentLanguage !== "es" || state.selectedLanguage !== "es" ||
      state.landingTitle !== "Camino al millón") {
    failures.push(`banner URL locale did not override stored/browser locale: ${JSON.stringify(state)}`);
  }
  if (state.qaGlobal) failures.push("production Vercel page exposed QA global");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle" }),
    page.selectOption("[data-campaign-language]", "de")
  ]);
  const manualLocale = await page.evaluate(() => ({
    documentLanguage: document.documentElement.lang,
    selectedLanguage: document.querySelector("[data-campaign-language]")?.value,
    landingTitle: document.querySelector("[data-campaign-copy='landingTitleAccent']")?.textContent,
    requestedLanguage: new URL(window.location.href).searchParams.get("lang")
  }));
  if (manualLocale.documentLanguage !== "de" || manualLocale.selectedLanguage !== "de" ||
      manualLocale.landingTitle !== "Der Weg zur Million" ||
      manualLocale.requestedLanguage !== "de") {
    failures.push(`manual locale was not persisted: ${JSON.stringify(manualLocale)}`);
  }
  await checkMobileOverlayContainment(
    browser,
    `http://127.0.0.1:${address.port}`,
    failures
  );
  if (failures.length > 0) throw new Error(failures.join("\n"));
  console.log("Vercel browser smoke: /million mounted with arrows and URL/manual locale selection");
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
