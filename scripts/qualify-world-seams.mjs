import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright";
import {
  assessChallengeSeamSample,
  assessStorySeamSample
} from "./world-seam-browser-policy.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildRoot = path.join(repositoryRoot, "dist-vercel");
const evidenceRoot = path.join(
  repositoryRoot,
  ".scratch/challenge-soft-world-seams/evidence/ticket-03"
);
const recordsWorkerOrigin = "https://droga-do-miliona-records.s-kutsenko.workers.dev";
const contentTypes = new Map([
  [".avif", "image/avif"], [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"], [".webp", "image/webp"]
]);

if (!fs.existsSync(path.join(buildRoot, "index.html"))) {
  throw new Error("world seam qualification requires dist-vercel; run npm run build:vercel first");
}
fs.mkdirSync(evidenceRoot, { recursive: true });

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const relative = pathname === "/" || pathname === "/million"
    ? "index.html"
    : pathname.replace(/^\//u, "");
  const filePath = path.resolve(buildRoot, relative);
  if (!filePath.startsWith(`${buildRoot}${path.sep}`) || !fs.existsSync(filePath)) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.setHeader(
    "Content-Type",
    contentTypes.get(path.extname(filePath)) ?? "application/octet-stream"
  );
  response.end(fs.readFileSync(filePath));
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

const address = server.address();
if (address === null || typeof address === "string") throw new Error("preview port unavailable");
const baseUrl = `http://127.0.0.1:${address.port}`;

function installFailureCollection(page, failures) {
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    failures.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ""}`);
  });
}

function fulfillRecordsWorker(route) {
  return route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ entries: [] })
  });
}

async function readChallengeSample(page) {
  return page.evaluate(() => {
    const host = document.querySelector("[data-campaign-world-visual]");
    const stage = document.querySelector("[data-campaign-stage]");
    const plate = host?.querySelector("[data-world-plate]");
    const route = plate?.querySelector("svg");
    const panels = [...(host?.querySelectorAll("[data-world-panel]") ?? [])];
    if (!(host instanceof HTMLElement) || !(stage instanceof HTMLElement) ||
        !(plate instanceof HTMLElement) || panels.length !== 2 ||
        panels.some((panel) => !(panel instanceof HTMLImageElement))) {
      throw new Error("challenge_seam_fixture_missing");
    }
    const rect = (element) => {
      const value = element.getBoundingClientRect();
      return { left: value.left, right: value.right, width: value.width };
    };
    const plateRect = plate.getBoundingClientRect();
    const panelRects = panels.map(rect);
    const panelXPercent = panelRects.map(({ left }) => plateRect.width === 0
      ? Number.NaN
      : ((left - plateRect.left) / plateRect.width) * 100);
    const progress = -panelXPercent[0] / 100;
    const phasePixels = Number.parseFloat(host.style.getPropertyValue("--world-phase-px"));
    const canonicalWorldWidth = route instanceof SVGSVGElement ? route.viewBox.baseVal.width : 0;
    const canonicalPhase = canonicalWorldWidth > 0
      ? ((phasePixels % canonicalWorldWidth) + canonicalWorldWidth) % canonicalWorldWidth
      : Number.NaN;
    const rawPhaseResidualPx = canonicalWorldWidth > 0
      ? Math.abs(progress * canonicalWorldWidth - canonicalPhase)
      : Number.NaN;
    const styles = panels.map((panel) => getComputedStyle(panel));
    return {
      overlap: host.style.getPropertyValue("--world-overlap"),
      progress,
      phasePixels,
      plateWidth: plateRect.width,
      canonicalWorldWidth,
      phaseResidualPx: canonicalWorldWidth > 0
        ? Math.min(rawPhaseResidualPx, canonicalWorldWidth - rawPhaseResidualPx)
        : Number.NaN,
      renderedPixelTolerancePx: plateRect.width > 0
        ? canonicalWorldWidth / plateRect.width / (window.devicePixelRatio || 1)
        : Number.NaN,
      panelXPercent,
      standardMasks: styles.map((style) => style.maskImage),
      prefixedMasks: styles.map((style) => style.webkitMaskImage),
      panelOpacity: styles.map((style) => Number.parseFloat(style.opacity)),
      panelRects,
      paintedStageRect: rect(plate),
      visibleStageRect: rect(stage),
      panelWorlds: panels.map((panel) => panel.dataset.worldId ?? null),
      panelSides: panels.map((panel) => panel.dataset.worldSeamSide ?? null),
      phase: host.dataset.phase ?? null,
      fullscreen: document.fullscreenElement !== null,
      cssGameMode: document.querySelector(".amso-million-runner-2026")
        ?.getAttribute("data-css-game-mode") ?? null
    };
  });
}

async function captureChallengeSample(page) {
  const before = await readChallengeSample(page);
  await page.evaluate(() => new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const after = await readChallengeSample(page);
  const panelTravelPx = Math.abs(
    (after.panelXPercent[0] - before.panelXPercent[0]) / 100 * after.plateWidth
  );
  const phaseTravelPx = Math.abs(after.phasePixels - before.phasePixels);
  const expectedPanelTravelPx = after.canonicalWorldWidth > 0
    ? phaseTravelPx / after.canonicalWorldWidth * after.plateWidth
    : Number.NaN;
  return {
    ...after,
    velocityRatio: expectedPanelTravelPx > 0
      ? panelTravelPx / expectedPanelTravelPx
      : Number.NaN,
    motionDiagnostic: {
      beforeXPercent: before.panelXPercent[0],
      afterXPercent: after.panelXPercent[0],
      beforePhasePixels: before.phasePixels,
      afterPhasePixels: after.phasePixels,
      panelTravelPx,
      expectedPanelTravelPx
    }
  };
}

async function waitForProgress(page, target) {
  await page.waitForFunction((minimum) => {
    const host = document.querySelector("[data-campaign-world-visual]");
    const plate = host?.querySelector("[data-world-plate]");
    const current = host?.querySelector('[data-world-panel="current"]');
    const panels = [...(host?.querySelectorAll("[data-world-panel]") ?? [])];
    if (!(host instanceof HTMLElement) || !(plate instanceof HTMLElement) ||
        !(current instanceof HTMLImageElement) || panels.length !== 2 ||
        panels.some((panel) => !(panel instanceof HTMLImageElement)) ||
        panels[0].dataset.worldId === panels[1].dataset.worldId) return false;
    const plateRect = plate.getBoundingClientRect();
    const currentRect = current.getBoundingClientRect();
    const currentX = ((currentRect.left - plateRect.left) / plateRect.width) * 100;
    return -currentX / 100 >= minimum;
  }, target, { timeout: 20_000, polling: "raf" });
}

async function qualifyEngine(name, browserType) {
  const browser = await browserType.launch({ headless: true });
  const failures = [];
  const samples = [];
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      locale: "pl-PL",
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    installFailureCollection(page, failures);
    await page.route(`${recordsWorkerOrigin}/**`, fulfillRecordsWorker);
    const scenarioUrl = new URL("/million", baseUrl);
    scenarioUrl.searchParams.set("qa", "performance");
    scenarioUrl.searchParams.set("scenario", "performance-reference-v1");
    scenarioUrl.searchParams.set("quality", "force-full");
    scenarioUrl.searchParams.set("motion", "system");
    scenarioUrl.searchParams.set("audio", "disabled");
    scenarioUrl.searchParams.set("dpr", "1");
    await page.goto(scenarioUrl.href, { waitUntil: "networkidle" });
    await page.locator("[data-campaign-landing-actions] button").first().click();
    await page.locator('.amso-million-runner-2026[data-view="game"]')
      .waitFor({ state: "visible", timeout: 30_000 });

    for (const point of [
      { name: "start", progress: 0.1 },
      { name: "middle", progress: 0.5 },
      { name: "end", progress: 0.82 }
    ]) {
      await waitForProgress(page, point.progress);
      const sample = await captureChallengeSample(page);
      const reasons = assessChallengeSeamSample(sample);
      failures.push(...reasons.map((reason) => `${point.name}: ${reason}`));
      const screenshot = path.join(evidenceRoot, `${name}-${point.name}.png`);
      await page.locator("[data-campaign-stage]").screenshot({ path: screenshot });
      samples.push({ point: point.name, screenshot: path.basename(screenshot), ...sample, reasons });

      if (point.name === "middle") {
        const beforePair = sample.panelWorlds.join(":");
        const beforeProgress = sample.progress;
        const fullscreenBefore = {
          active: sample.fullscreen,
          cssGameMode: sample.cssGameMode
        };
        await page.locator("[data-campaign-fullscreen]").click();
        await page.waitForTimeout(150);
        const resume = page.locator("[data-campaign-resume]");
        if (await resume.isVisible()) await resume.click();
        const afterFullscreen = await captureChallengeSample(page);
        const fullscreenReasons = assessChallengeSeamSample(afterFullscreen, {
          requireVelocity: false
        });
        if (afterFullscreen.panelWorlds.join(":") !== beforePair) {
          fullscreenReasons.push("fullscreen-changed-world-pair");
        }
        if (afterFullscreen.fullscreen === fullscreenBefore.active &&
            afterFullscreen.cssGameMode === fullscreenBefore.cssGameMode) {
          fullscreenReasons.push("fullscreen-control-did-not-change-layout-mode");
        }
        failures.push(...fullscreenReasons.map((reason) => `fullscreen: ${reason}`));

        await page.setViewportSize({ width: 1100, height: 760 });
        await page.waitForTimeout(150);
        const afterResize = await captureChallengeSample(page);
        const resizeReasons = assessChallengeSeamSample(afterResize, { requireVelocity: false });
        if (afterResize.panelWorlds.join(":") !== beforePair) {
          resizeReasons.push("resize-changed-world-pair");
        }
        failures.push(...resizeReasons.map((reason) => `resize: ${reason}`));
        samples.push({
          point: "resize-fullscreen",
          before: { progress: beforeProgress, pair: beforePair, ...fullscreenBefore },
          afterResize,
          afterFullscreen,
          reasons: [...resizeReasons, ...fullscreenReasons]
        });
      }
    }

    const storyPage = await context.newPage();
    installFailureCollection(storyPage, failures);
    await storyPage.route(`${recordsWorkerOrigin}/**`, fulfillRecordsWorker);
    await storyPage.goto(`${baseUrl}/million?lang=pl`, { waitUntil: "networkidle" });
    await storyPage.getByRole("button", { name: /Zagraj z historią AMSO/ }).click();
    await storyPage.getByRole("button", { name: "Rozpocznij historię" })
      .click({ timeout: 20_000 });
    await storyPage.waitForFunction(() =>
      document.querySelector("[data-campaign-world-visual]")?.getAttribute("data-phase") === "story",
    undefined, { timeout: 20_000 });
    const storySample = await storyPage.evaluate(() => {
      const host = document.querySelector("[data-campaign-world-visual]");
      const panels = [...(host?.querySelectorAll("[data-world-panel]") ?? [])];
      if (!(host instanceof HTMLElement)) throw new Error("story_world_fixture_missing");
      return {
        phase: host.dataset.phase ?? null,
        overlap: host.style.getPropertyValue("--world-overlap"),
        panelSides: panels.map((panel) => panel.getAttribute("data-world-seam-side")),
        standardMasks: panels.map((panel) => getComputedStyle(panel).maskImage),
        prefixedMasks: panels.map((panel) => getComputedStyle(panel).webkitMaskImage)
      };
    });
    const storyReasons = assessStorySeamSample(storySample);
    failures.push(...storyReasons.map((reason) => `story: ${reason}`));
    const storyScreenshot = path.join(evidenceRoot, `${name}-story.png`);
    await storyPage.locator("[data-campaign-stage]").screenshot({ path: storyScreenshot });
    await context.close();
    return {
      engine: name,
      browserVersion: browser.version(),
      passed: failures.length === 0,
      failures,
      samples,
      story: { screenshot: path.basename(storyScreenshot), ...storySample, reasons: storyReasons }
    };
  } finally {
    await browser.close();
  }
}

let results;
try {
  results = [
    await qualifyEngine("chromium", chromium),
    await qualifyEngine("webkit", webkit)
  ];
} finally {
  await new Promise((resolve) => server.close(resolve));
}

const html = fs.readFileSync(path.join(buildRoot, "index.html"));
const evidence = {
  schema: "amso-world-seam-browser-qualification-v1",
  capturedAt: new Date().toISOString(),
  target: "dist-vercel",
  artifactSha256: crypto.createHash("sha256").update(html).digest("hex"),
  passed: results.every(({ passed }) => passed),
  engines: results
};
const evidencePath = path.join(evidenceRoot, "browser-qualification.json");
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
if (!evidence.passed) {
  throw new Error(results.flatMap(({ engine, failures }) =>
    failures.map((failure) => `${engine}: ${failure}`)).join("\n"));
}
console.log(`World seam browser qualification passed: ${evidencePath}`);
