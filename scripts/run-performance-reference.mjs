import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const artifactPath = path.join(root, "droga-do-miliona-qa.html");
const timeoutMs = Number.parseInt(
  process.env.AMSO_PERFORMANCE_SCENARIO_TIMEOUT_MS ?? "90000",
  10
);

if (!fs.existsSync(artifactPath)) {
  console.error("performance scenario failed: autonomous HTML artifact is missing");
  process.exit(1);
}

const systemChromeCandidates = process.platform === "darwin"
  ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
  : process.platform === "win32"
    ? [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
      ]
    : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
const configuredExecutable = process.env.AMSO_CHROME_EXECUTABLE;
const executablePath = configuredExecutable && fs.existsSync(configuredExecutable)
  ? configuredExecutable
  : systemChromeCandidates.find((candidate) => fs.existsSync(candidate));
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
  args: [
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows"
  ]
});

let exitCode = 1;
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const consoleErrors = [];
  const externalRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("request", (request) => {
    const protocol = new URL(request.url()).protocol;
    if (protocol === "http:" || protocol === "https:") {
      externalRequests.push(request.url());
    }
  });
  await page.addInitScript(() => {
    window.__performanceScenarioRuntime = {
      activeDecodeStarts: 0,
      activeFramesOver33Ms: 0,
      maxActiveFrameMs: 0
    };
    const originalDecode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = function trackedDecode() {
      if (document.querySelector(".amso-campaign")?.getAttribute("data-view") === "game") {
        window.__performanceScenarioRuntime.activeDecodeStarts += 1;
      }
      return originalDecode.call(this);
    };
    let previousActiveFrame = null;
    const observeFrame = (timestamp) => {
      const active = document.visibilityState === "visible" &&
        document.querySelector(".amso-campaign")?.getAttribute("data-view") === "game";
      if (active && previousActiveFrame !== null) {
        const interval = timestamp - previousActiveFrame;
        window.__performanceScenarioRuntime.maxActiveFrameMs = Math.max(
          window.__performanceScenarioRuntime.maxActiveFrameMs,
          interval
        );
        if (interval > 33) {
          window.__performanceScenarioRuntime.activeFramesOver33Ms += 1;
        }
      }
      previousActiveFrame = active ? timestamp : null;
      requestAnimationFrame(observeFrame);
    };
    requestAnimationFrame(observeFrame);
  });

  const url = new URL(pathToFileURL(artifactPath));
  url.searchParams.set("qa", "performance");
  url.searchParams.set("scenario", "performance-reference-v1");
  url.searchParams.set("quality", "force-full");
  url.searchParams.set("motion", "system");
  url.searchParams.set("audio", "enabled");
  url.searchParams.set("dpr", "1");
  await page.goto(url.href, { waitUntil: "load", timeout: 30_000 });
  await page.waitForSelector("[data-campaign-landing-actions] button", {
    timeout: 30_000
  });
  await page.click("[data-campaign-landing-actions] button");

  const deadline = Date.now() + timeoutMs;
  let report = null;
  while (Date.now() < deadline) {
    await page.waitForTimeout(1_000);
    report = JSON.parse(await page.evaluate(
      () => window.AMSOMillionRunnerQA?.qaReport() ?? "null"
    ));
    if (report?.scenarioValidation !== null) break;
    if (await page.locator(".amso-campaign").getAttribute("data-view") ===
        "challenge_result") {
      break;
    }
  }

  const evidence = {
    artifact: path.basename(artifactPath),
    view: await page.locator(".amso-campaign").getAttribute("data-view"),
    scenarioCheckpoints: report?.scenarioCheckpoints ?? null,
    scenarioValidation: report?.scenarioValidation ?? null,
    scenarioArtifact: report?.scenarioArtifact
      ? { digest: report.scenarioArtifact.digest }
      : null,
    session: report?.session
      ? {
          durationSeconds: report.session.durationSeconds,
          collisions: report.session.collisions,
          inputQueueOverflows: report.session.inputQueueOverflows,
          replayValid: report.session.replayValid,
          ordersCollected: report.session.ordersCollected
        }
      : null,
    consoleErrors,
    externalRequests,
    runtimePerformance: await page.evaluate(
      () => window.__performanceScenarioRuntime
    )
  };
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
  const checkpointsPassed = Array.isArray(evidence.scenarioCheckpoints) &&
    evidence.scenarioCheckpoints.length > 1 &&
    evidence.scenarioCheckpoints.every(({ passed }) => passed === true);
  if (evidence.scenarioValidation?.passed === true &&
      checkpointsPassed &&
      evidence.session?.inputQueueOverflows === 0 &&
      evidence.session?.replayValid === true &&
      evidence.runtimePerformance?.activeDecodeStarts === 0 &&
      evidence.runtimePerformance?.activeFramesOver33Ms === 0 &&
      consoleErrors.length === 0 &&
      externalRequests.length === 0) {
    exitCode = 0;
  }
} finally {
  await browser.close();
}

process.exitCode = exitCode;
