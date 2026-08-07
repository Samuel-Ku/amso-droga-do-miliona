import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import os from "node:os";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import {
  headersForPerformanceRequest,
  isExpectedPerformanceRequest
} from "./performance-request-policy.mjs";

const root = path.resolve(import.meta.dirname, "..");

const usage = `Usage: node scripts/run-performance-reference.mjs [options]

Options:
  --artifact PATH                  Autonomous HTML to profile
  --url URL                        Deployed autonomous HTML to profile
  --audio enabled|disabled         Audio mode for this run
  --process cold|warm              Browser-process state for the measured run
  --profile cold-audio-enabled|cold-audio-disabled|warm-audio-enabled|full-session
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

const deploymentUrl = option("url");
const artifactPath = deploymentUrl === undefined
  ? path.resolve(root, option("artifact", "droga-do-miliona-qa.html"))
  : null;
const audioMode = option("audio", "enabled");
const processState = option("process", "cold");
const profile = option("profile", "full-session");
const variant = option("variant", "after");
const outputPath = option("output");
if (!(["enabled", "disabled"].includes(audioMode)) ||
    !(["before", "after"].includes(variant)) ||
    !(["cold", "warm"].includes(processState)) ||
    !(["cold-audio-enabled", "cold-audio-disabled", "warm-audio-enabled",
      "full-session"].includes(profile)) ||
    (deploymentUrl !== undefined && option("artifact") !== undefined)) {
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

if (artifactPath !== null && !fs.existsSync(artifactPath)) {
  console.error("performance scenario failed: autonomous HTML artifact is missing");
  process.exit(1);
}
const targetUrl = deploymentUrl === undefined
  ? new URL(pathToFileURL(artifactPath))
  : new URL(deploymentUrl);

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
  const vercelAutomationBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const page = await browser.newPage({
    viewport: { width: 960, height: 540 }
  });
  if (vercelAutomationBypass) {
    await page.route("**/*", async (route) => {
      const request = route.request();
      const requestUrl = new URL(request.url());
      await route.continue({
        headers: headersForPerformanceRequest(
          requestUrl, targetUrl, request.headers(), vercelAutomationBypass
        )
      });
    });
  }
  const browserRuntime = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    deviceMemoryGiB: navigator.deviceMemory ?? null
  }));
  const consoleErrors = [];
  const consoleErrorDetails = [];
  const externalRequests = [];
  const failedResponses = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    consoleErrors.push(message.text());
    consoleErrorDetails.push({ text: message.text(), location: message.location() });
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
    consoleErrorDetails.push({ text: error.message, location: null });
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const responseUrl = new URL(response.url());
    failedResponses.push({
      status: response.status(),
      resource: `${responseUrl.origin}${responseUrl.pathname}`
    });
  });
  page.on("request", (request) => {
    const requestUrl = new URL(request.url());
    if (!isExpectedPerformanceRequest(requestUrl, targetUrl)) {
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
      panelTransitions: [],
      qualityHistory: [{ level: "full", atMs: 0, reason: "force-full" }],
      longTasks: { support: "unsupported", count: 0, totalDurationMs: 0,
        maxDurationMs: 0, entries: [] },
      longAnimationFrames: { support: "unsupported", count: 0,
        totalBlockingDurationMs: 0, entries: [] },
      dom: { initialNodeCount: 0, maxNodeCount: 0, finalNodeCount: 0,
        addedNodeCount: 0, removedNodeCount: 0, samples: [] },
      memorySamples: []
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
        const rawSource = this.dataset.assetPath || this.currentSrc || this.src || null;
        window.__performanceScenarioRuntime.decodeTimings.push({
          startedAtMs: startedAt,
          durationMs: performance.now() - startedAt,
          active,
          status,
          assetId: this.dataset.assetId ?? null,
          source: typeof rawSource === "string" && rawSource.startsWith("data:")
            ? this.dataset.assetId ?? rawSource.slice(0, rawSource.indexOf(",") + 1)
            : rawSource,
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
    const supportedEntries = PerformanceObserver.supportedEntryTypes ?? [];
    if (supportedEntries.includes("longtask")) {
      window.__performanceScenarioRuntime.longTasks.support = "supported";
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const summary = window.__performanceScenarioRuntime.longTasks;
          summary.count += 1;
          summary.totalDurationMs += entry.duration;
          summary.maxDurationMs = Math.max(summary.maxDurationMs, entry.duration);
          if (summary.entries.length < 128) {
            summary.entries.push({ startedAtMs: entry.startTime, durationMs: entry.duration,
              active: isActiveGameplay() });
          }
        }
      }).observe({ entryTypes: ["longtask"] });
    }
    if (supportedEntries.includes("long-animation-frame")) {
      window.__performanceScenarioRuntime.longAnimationFrames.support = "supported";
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const summary = window.__performanceScenarioRuntime.longAnimationFrames;
          const scripts = Array.from(entry.scripts ?? []).map((script) => ({
            durationMs: script.duration ?? 0,
            executionStartMs: script.executionStart ?? null,
            invokerType: script.invokerType ?? null,
            source: script.sourceFunctionName || script.sourceURL || "anonymous"
          }));
          summary.count += 1;
          summary.totalBlockingDurationMs += entry.blockingDuration ?? 0;
          if (summary.entries.length < 128) {
            summary.entries.push({
              startedAtMs: entry.startTime,
              durationMs: entry.duration,
              blockingDurationMs: entry.blockingDuration ?? 0,
              renderStartMs: entry.renderStart ?? null,
              styleAndLayoutStartMs: entry.styleAndLayoutStart ?? null,
              scripts,
              active: isActiveGameplay()
            });
          }
        }
      }).observe({ entryTypes: ["long-animation-frame"] });
    }
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
      const runtime = window.__performanceScenarioRuntime;
      const countNodes = () => document.getElementsByTagName("*").length;
      runtime.dom.initialNodeCount = countNodes();
      runtime.dom.maxNodeCount = runtime.dom.initialNodeCount;
      const sampleRuntime = () => {
        const nodeCount = countNodes();
        runtime.dom.finalNodeCount = nodeCount;
        runtime.dom.maxNodeCount = Math.max(runtime.dom.maxNodeCount, nodeCount);
        if (runtime.dom.samples.length < 128) runtime.dom.samples.push(nodeCount);
        const heap = performance.memory?.usedJSHeapSize;
        if (Number.isFinite(heap) && runtime.memorySamples.length < 128) {
          runtime.memorySamples.push(heap);
        }
      };
      sampleRuntime();
      setInterval(sampleRuntime, 1_000);
      new MutationObserver((records) => {
        for (const record of records) {
          runtime.dom.addedNodeCount += record.addedNodes.length;
          runtime.dom.removedNodeCount += record.removedNodes.length;
        }
        runtime.dom.maxNodeCount = Math.max(runtime.dom.maxNodeCount, countNodes());
      }).observe(document.documentElement, { childList: true, subtree: true });
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
      let previousCurrentPanel = null;
      let previousCurrentPanelWorldId = null;
      const recordCurrentPanel = () => {
        const panel = worldVisual.querySelector('[data-world-panel="current"]');
        if (!(panel instanceof HTMLImageElement)) return;
        const worldId = panel.dataset.worldId ?? null;
        if (worldId === null ||
            (panel === previousCurrentPanel && worldId === previousCurrentPanelWorldId)) return;
        previousCurrentPanel = panel;
        previousCurrentPanelWorldId = worldId;
        runtime.panelTransitions.push({
          worldId,
          atMs: performance.now(),
          assetPath: panel.dataset.assetPath ?? null,
          presentationReady: panel.dataset.presentationReady === "true",
          hidden: panel.hidden
        });
      };
      recordCurrentPanel();
      new MutationObserver(recordCurrentPanel).observe(worldVisual, {
        subtree: true,
        attributes: true,
        attributeFilter: ["data-world-panel", "data-world-id", "data-presentation-ready", "hidden"]
      });
    }, { once: true });
  });

  const url = new URL(targetUrl);
  url.searchParams.set("qa", "performance");
  url.searchParams.set("scenario", "performance-reference-v1");
  url.searchParams.set("quality", "force-full");
  url.searchParams.set("motion", "system");
  url.searchParams.set("audio", audioMode);
  url.searchParams.set("dpr", "1");
  if (processState === "warm") {
    await page.goto(url.href, { waitUntil: "load", timeout: 30_000 });
    await page.waitForSelector("[data-campaign-landing-actions] button", { timeout: 30_000 });
    await page.goto("about:blank");
  }
  const navigationStartedAt = Date.now();
  const navigationResponse = await page.goto(url.href, { waitUntil: "load", timeout: 30_000 });
  const deployedArtifactBody = artifactPath === null && navigationResponse !== null
    ? await navigationResponse.body()
    : null;
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

  const runtime = await page.evaluate(() => {
    const runtime = window.__performanceScenarioRuntime;
    runtime.dom.finalNodeCount = document.getElementsByTagName("*").length;
    const timingEntries = [
      ...performance.getEntriesByType("navigation"),
      ...performance.getEntriesByType("resource")
    ];
    runtime.resourceTimings = timingEntries.map((entry) => {
      let resource = entry.name;
      try {
        const url = new URL(entry.name);
        resource = `${url.origin}${url.pathname}`;
      } catch {
        resource = entry.name.split(",", 1)[0];
      }
      return {
        resource,
        initiatorType: entry.entryType === "navigation" ? "navigation" : entry.initiatorType,
        startedAtMs: entry.startTime,
        durationMs: entry.duration,
        transferSizeBytes: entry.transferSize ?? 0,
        decodedBodySizeBytes: entry.decodedBodySize ?? 0
      };
    });
    return runtime;
  });
  const finalJsHeapBytes = await page.evaluate(() =>
    "memory" in performance && Number.isFinite(performance.memory?.usedJSHeapSize)
      ? performance.memory.usedJSHeapSize
      : null
  );
  const intervals = runtime.activeFrameIntervals;
  const scriptDurationMs = runtime.longAnimationFrames.entries.reduce((total, entry) =>
    total + entry.scripts.reduce((nested, script) => nested + script.durationMs, 0), 0);
  const renderingProxyDurationMs = runtime.longAnimationFrames.entries.reduce((total, entry) => {
    const nestedScriptDuration = entry.scripts.reduce((nested, script) =>
      nested + script.durationMs, 0);
    return total + Math.max(0, entry.durationMs - nestedScriptDuration);
  }, 0);
  const resourceDurationMs = runtime.resourceTimings.reduce((total, entry) =>
    total + entry.durationMs, 0);
  const transferSizeBytes = runtime.resourceTimings.reduce((total, entry) =>
    total + entry.transferSizeBytes, 0);
  const decodeDurationMs = runtime.decodeTimings.reduce((total, entry) =>
    total + entry.durationMs, 0);
  const checkpointsPassed = Array.isArray(report?.scenarioCheckpoints) &&
    report.scenarioCheckpoints.length > 1 &&
    report.scenarioCheckpoints.every(({ passed }) => passed === true);
  const transitionActiveDecodeStarts = runtime.decodeTimings.filter(({ active, startedAtMs }) =>
    active === true && runtime.panelTransitions.some(({ atMs }) =>
      Math.abs(startedAtMs - atMs) <= 500)).length;
  const requiredPanelTransitionsPassed = ["order-process", "quality-service"].every((worldId) =>
    runtime.panelTransitions.some((transition) => transition.worldId === worldId &&
      transition.presentationReady === true && transition.hidden === false &&
      transition.assetPath?.includes(`world-0${worldId === "order-process" ? "2" : "3"}-`)));
  const capturePassed = report?.scenarioValidation?.passed === true &&
    checkpointsPassed &&
    report?.session?.inputQueueOverflows === 0 &&
    report?.session?.replayValid === true &&
    transitionActiveDecodeStarts === 0 &&
    requiredPanelTransitionsPassed &&
    intervals.filter((interval) => interval > 33).length === 0 &&
    consoleErrors.length === 0 &&
    externalRequests.length === 0 &&
    failedResponses.length === 0;
  const evidence = {
    schema: "amso-performance-run-v1",
    capturePassed,
    variant,
    profile,
    processState,
    target: deploymentUrl === undefined
      ? { kind: "artifact", value: path.basename(artifactPath) }
      : { kind: "url", value: targetUrl.href },
    artifact: {
      name: artifactPath === null ? targetUrl.href : path.basename(artifactPath),
      bytes: artifactPath === null ? deployedArtifactBody?.byteLength ?? null
        : fs.statSync(artifactPath).size,
      sha256: artifactPath === null
        ? deployedArtifactBody === null ? null
          : createHash("sha256").update(deployedArtifactBody).digest("hex")
        : createHash("sha256").update(fs.readFileSync(artifactPath)).digest("hex")
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
        name: "playwright-browser-attribution",
        version: 2
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
      over50Ms: intervals.filter((interval) => interval > 50).length,
      over100Ms: intervals.filter((interval) => interval > 100).length
    },
    frameTimeline: runtime.activeFrameTimeline,
    qualityHistory: runtime.qualityHistory,
    decodeTimings: runtime.decodeTimings,
    worldTransitions: runtime.worldTransitions,
    panelTransitions: runtime.panelTransitions,
    longTasks: runtime.longTasks,
    longAnimationFrames: runtime.longAnimationFrames,
    resourceTimings: runtime.resourceTimings,
    attribution: {
      network: { support: "supported", durationMs: rounded(resourceDurationMs),
        transferSizeBytes },
      decode: { support: "supported", durationMs: rounded(decodeDurationMs) },
      gpuCompositing: { support: runtime.longAnimationFrames.support === "supported"
        ? "proxy" : "unsupported", durationMs: runtime.longAnimationFrames.support === "supported"
          ? rounded(renderingProxyDurationMs) : null },
      javascript: { support: runtime.longAnimationFrames.support === "supported"
        ? "proxy" : runtime.longTasks.support, durationMs: rounded(
          scriptDurationMs || runtime.longTasks.totalDurationMs) },
      gc: { support: "unsupported", durationMs: null,
        reason: "browser-process-trace-required" }
    },
    dom: runtime.dom,
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
    diagnostics: { consoleErrors, consoleErrorDetails, externalRequests, failedResponses },
    readiness: { coldStartMs, criticalReadyMs },
    memory: {
      available: false,
      reason: "physical-device-process-memory-required",
      auxiliaryJsHeapStartBytes: initialJsHeapBytes,
      auxiliaryJsHeapEndBytes: finalJsHeapBytes,
      samples: runtime.memorySamples
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
      profile,
      processState,
      frames: evidence.frames,
      activeDecodeStarts: runtime.activeDecodeStarts,
      transitionActiveDecodeStarts,
      worldTransitions: evidence.worldTransitions,
      scenarioPassed: report?.scenarioValidation?.passed === true
    }, null, 2)}\n`);
  } else {
    process.stdout.write(serializedEvidence);
  }
  if (capturePassed) {
    exitCode = 0;
  }
} finally {
  await browser.close();
}

process.exitCode = exitCode;
