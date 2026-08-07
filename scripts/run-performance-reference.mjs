import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import os from "node:os";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");

const usage = `Usage: node scripts/run-performance-reference.mjs [options]

Options:
  --artifact PATH                  Autonomous HTML to profile
  --audio enabled|disabled         Audio mode for this run
  --variant before|after           Comparison label
  --output PATH                    Write machine-readable evidence JSON
  --help                           Show this help
`;

function option(name, fallback = undefined) {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? fallback : process.argv[index + 1];
}

if (process.argv.includes("--help")) {
  process.stdout.write(usage);
  process.exit(0);
}

const artifactPath = path.resolve(root, option("artifact", "droga-do-miliona-qa.html"));
const audioMode = option("audio", "enabled");
const variant = option("variant", "after");
const outputPath = option("output");
if (!(["enabled", "disabled"].includes(audioMode)) ||
    !(["before", "after"].includes(variant))) {
  console.error(usage);
  process.exit(1);
}
const timeoutMs = Number.parseInt(
  process.env.AMSO_PERFORMANCE_SCENARIO_TIMEOUT_MS ?? "90000",
  10
);

function percentile(values, percentileValue) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * percentileValue) - 1)];
}

function rounded(value) {
  return value === null ? null : Math.round(value * 1_000) / 1_000;
}

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
  const browserRuntime = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    deviceMemoryGiB: navigator.deviceMemory ?? null
  }));
  const navigationStartedAt = Date.now();
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
      activeFrameIntervals: [],
      activeFrameTimeline: [],
      activeFramesOver33Ms: 0,
      maxActiveFrameMs: 0,
      decodeTimings: [],
      worldTransitions: [],
      qualityHistory: [{ level: "full", atMs: 0, reason: "force-full" }]
    };
    const isActiveGameplay = () => {
      const worldVisual = document.querySelector("[data-campaign-world-visual]");
      return document.querySelector(".amso-campaign")?.getAttribute("data-view") === "game" &&
        worldVisual?.getAttribute("data-phase") === "game" &&
        worldVisual.getAttribute("data-paused") !== "true";
    };
    const originalDecode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = function trackedDecode() {
      const startedAt = performance.now();
      const active = isActiveGameplay();
      if (active) {
        window.__performanceScenarioRuntime.activeDecodeStarts += 1;
      }
      const record = (status) => {
        window.__performanceScenarioRuntime.decodeTimings.push({
          startedAtMs: startedAt,
          durationMs: performance.now() - startedAt,
          active,
          status,
          worldId: this.dataset.worldId ?? null,
          panel: this.dataset.worldPanel ??
            (this.hasAttribute("data-world-staged-panel") ? "staged" : null)
        });
      };
      try {
        return Promise.resolve(originalDecode.call(this)).then(
          (value) => {
            record("fulfilled");
            return value;
          },
          (error) => {
            record("rejected");
            throw error;
          }
        );
      } catch (error) {
        record("threw");
        throw error;
      }
    };
    let previousActiveFrame = null;
    const observeFrame = (timestamp) => {
      const active = document.visibilityState === "visible" && isActiveGameplay();
      if (active && previousActiveFrame !== null) {
        const interval = timestamp - previousActiveFrame;
        window.__performanceScenarioRuntime.maxActiveFrameMs = Math.max(
          window.__performanceScenarioRuntime.maxActiveFrameMs,
          interval
        );
        window.__performanceScenarioRuntime.activeFrameIntervals.push(interval);
        window.__performanceScenarioRuntime.activeFrameTimeline.push({
          atMs: timestamp,
          intervalMs: interval
        });
        if (interval > 33) {
          window.__performanceScenarioRuntime.activeFramesOver33Ms += 1;
        }
      }
      previousActiveFrame = active ? timestamp : null;
      requestAnimationFrame(observeFrame);
    };
    requestAnimationFrame(observeFrame);
    document.addEventListener("DOMContentLoaded", () => {
      const worldVisual = document.querySelector("[data-campaign-world-visual]");
      if (!(worldVisual instanceof HTMLElement)) return;
      let previousWorldId = worldVisual.dataset.worldId ?? null;
      new MutationObserver(() => {
        const worldId = worldVisual.dataset.worldId ?? null;
        if (worldId === null || worldId === previousWorldId) return;
        previousWorldId = worldId;
        window.__performanceScenarioRuntime.worldTransitions.push({
          worldId,
          atMs: performance.now(),
          phase: worldVisual.dataset.phase ?? null,
          paused: worldVisual.dataset.paused === "true"
        });
      }).observe(worldVisual, { attributes: true, attributeFilter: ["data-world-id"] });
    }, { once: true });
  });

  const url = new URL(pathToFileURL(artifactPath));
  url.searchParams.set("qa", "performance");
  url.searchParams.set("scenario", "performance-reference-v1");
  url.searchParams.set("quality", "force-full");
  url.searchParams.set("motion", "system");
  url.searchParams.set("audio", audioMode);
  url.searchParams.set("dpr", "1");
  await page.goto(url.href, { waitUntil: "load", timeout: 30_000 });
  await page.waitForSelector("[data-campaign-landing-actions] button", {
    timeout: 30_000
  });
  const coldStartMs = Date.now() - navigationStartedAt;
  const startRequestedAt = Date.now();
  await page.click("[data-campaign-landing-actions] button");
  await page.waitForFunction(
    () => document.querySelector(".amso-campaign")?.getAttribute("data-view") === "game",
    undefined,
    { timeout: 30_000 }
  );
  const criticalReadyMs = Date.now() - startRequestedAt;
  const initialJsHeapBytes = await page.evaluate(() =>
    "memory" in performance && Number.isFinite(performance.memory?.usedJSHeapSize)
      ? performance.memory.usedJSHeapSize
      : null
  );

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

  const runtime = await page.evaluate(() => window.__performanceScenarioRuntime);
  const finalJsHeapBytes = await page.evaluate(() =>
    "memory" in performance && Number.isFinite(performance.memory?.usedJSHeapSize)
      ? performance.memory.usedJSHeapSize
      : null
  );
  const intervals = runtime.activeFrameIntervals;
  const checkpointsPassed = Array.isArray(report?.scenarioCheckpoints) &&
    report.scenarioCheckpoints.length > 1 &&
    report.scenarioCheckpoints.every(({ passed }) => passed === true);
  const evidence = {
    schema: "amso-performance-run-v1",
    variant,
    artifact: {
      name: path.basename(artifactPath),
      bytes: fs.statSync(artifactPath).size,
      sha256: createHash("sha256").update(fs.readFileSync(artifactPath)).digest("hex")
    },
    configuration: {
      scenarioId: report?.qaRunConfiguration?.scenarioId ?? "performance-reference-v1",
      scenarioConfigVersion: report?.qaRunConfiguration?.scenarioConfigVersion ?? null,
      seed: report?.qaRunConfiguration?.seed ?? null,
      inputTraceDigest: report?.qaRunConfiguration?.inputTraceDigest ?? null,
      challengeWorldDurationSeconds:
        report?.qaRunConfiguration?.challengeWorldDurationSeconds ?? null,
      viewport: { width: 960, height: 540 },
      dpr: 1,
      quality: "force-full",
      motion: "system",
      audioMode
    },
    environment: {
      host: {
        platform: process.platform,
        architecture: process.arch,
        release: os.release(),
        cpuModel: os.cpus()[0]?.model ?? null
      },
      browser: {
        engine: "chromium",
        version: browser.version(),
        executableSource: executablePath ?? "playwright-bundled",
        userAgent: browserRuntime.userAgent,
        headless: true
      },
      profiler: {
        name: "playwright-init-script",
        version: 1
      },
      hardwareConcurrency: browserRuntime.hardwareConcurrency,
      deviceMemoryGiB: browserRuntime.deviceMemoryGiB
    },
    frames: {
      sampleCount: intervals.length,
      p50Ms: rounded(percentile(intervals, 0.5)),
      p95Ms: rounded(percentile(intervals, 0.95)),
      p99Ms: rounded(percentile(intervals, 0.99)),
      maxMs: rounded(intervals.length === 0 ? null : Math.max(...intervals)),
      over33Ms: intervals.filter((interval) => interval > 33).length,
      over100Ms: intervals.filter((interval) => interval > 100).length
    },
    frameTimeline: runtime.activeFrameTimeline,
    qualityHistory: runtime.qualityHistory,
    decodeTimings: runtime.decodeTimings,
    worldTransitions: runtime.worldTransitions,
    scenario: {
      checkpointsPassed,
      coveragePassed: report?.scenarioValidation?.coveragePassed === true,
      digestPassed: report?.scenarioValidation?.digestPassed === true,
      finalDigest: report?.scenarioArtifact?.digest ?? null,
      canonicalState: report?.scenarioArtifact?.canonicalState ?? null,
      replayValid: report?.session?.replayValid === true,
      inputQueueOverflows: report?.session?.inputQueueOverflows ?? null,
      session: report?.session ?? null
    },
    diagnostics: { consoleErrors, externalRequests },
    readiness: { coldStartMs, criticalReadyMs },
    memory: {
      available: false,
      reason: "physical-device-process-memory-required",
      auxiliaryJsHeapStartBytes: initialJsHeapBytes,
      auxiliaryJsHeapEndBytes: finalJsHeapBytes
    },
    offlineProductionParityPassed: null,
    visualFixturesPassed: null,
    view: await page.locator(".amso-campaign").getAttribute("data-view")
  };
  const serializedEvidence = `${JSON.stringify(evidence, null, 2)}\n`;
  if (outputPath) {
    const absoluteOutputPath = path.resolve(root, outputPath);
    fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
    fs.writeFileSync(absoluteOutputPath, serializedEvidence);
    process.stdout.write(`${JSON.stringify({
      output: absoluteOutputPath,
      variant,
      audioMode,
      frames: evidence.frames,
      activeDecodeStarts: runtime.activeDecodeStarts,
      worldTransitions: evidence.worldTransitions,
      scenarioPassed: report?.scenarioValidation?.passed === true
    }, null, 2)}\n`);
  } else {
    process.stdout.write(serializedEvidence);
  }
  if (report?.scenarioValidation?.passed === true &&
      checkpointsPassed &&
      evidence.scenario.inputQueueOverflows === 0 &&
      evidence.scenario.replayValid === true &&
      runtime.activeDecodeStarts === 0 &&
      evidence.frames.over33Ms === 0 &&
      consoleErrors.length === 0 &&
      externalRequests.length === 0) {
    exitCode = 0;
  }
} finally {
  await browser.close();
}

process.exitCode = exitCode;
