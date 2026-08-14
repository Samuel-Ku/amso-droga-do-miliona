import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chromium, webkit } from "playwright";
import { assessFullStoryEvidence } from "./full-story-performance-policy.mjs";
import { nextFullStoryDriverCommand } from "./full-story-driver-policy.mjs";
import { contextForTimelineEntry } from "./full-story-runtime-profile-policy.mjs";

const root = path.resolve(import.meta.dirname, "..");
const recordsWorkerOrigin = "https://droga-do-miliona-records.s-kutsenko.workers.dev";
const option = (name, fallback = undefined) => {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? fallback : process.argv[index + 1];
};
const browserName = option("browser", "chromium");
const deploymentUrl = option("url");
const outputPath = option("output");
const buildRoot = path.resolve(option("build-root", path.join(root, "dist-vercel")));
const stopAfterChapter = option("stop-after-chapter");
const audioMode = option("audio", "enabled");
const timeoutMs = Number.parseInt(option("timeout-ms", "480000"), 10);
const hostDeviceClass = process.env.AMSO_PROFILE_DEVICE_CLASS?.trim() || null;
const baseCommitSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const workingTreePatch = execFileSync("git", ["diff", "--binary", "HEAD"], {
  cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024
});
const localSourceIdentity = createHash("sha256").update(`${baseCommitSha}\n${workingTreePatch}`).digest("hex");
if (!["chromium", "webkit"].includes(browserName) ||
    !["enabled", "muted", "disabled"].includes(audioMode)) {
  throw new Error("Usage: run-full-story-reference.mjs --browser chromium|webkit [--url URL] [--output PATH] [--stop-after-chapter ID]");
}
if (deploymentUrl === undefined && !fs.existsSync(path.join(buildRoot, "index.html"))) {
  throw new Error(`${buildRoot}/index.html missing; run npm run build:vercel first`);
}

const percentile = (values, p) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)];
};

const summarizeIntervals = (values, diagnosticOnly = false) => ({
  diagnosticOnly,
  sampleCount: values.length,
  p50Ms: percentile(values, 0.5),
  p95Ms: percentile(values, 0.95),
  p99Ms: percentile(values, 0.99),
  maxMs: values.length > 0 ? Math.max(...values) : null,
  over33Ms: values.filter((value) => value > 33).length
});

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"], [".json", "application/json; charset=utf-8"],
  [".webp", "image/webp"], [".avif", "image/avif"], [".svg", "image/svg+xml"]
]);
const localServer = deploymentUrl === undefined ? http.createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const relative = pathname === "/" || pathname === "/million"
    ? "index.html"
    : decodeURIComponent(pathname).replace(/^\/+/, "");
  const filePath = path.resolve(buildRoot, relative);
  if (!filePath.startsWith(`${buildRoot}${path.sep}`) || !fs.existsSync(filePath)) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.setHeader("content-type", contentTypes.get(path.extname(filePath)) ?? "application/octet-stream");
  response.setHeader("cache-control", "no-store");
  response.end(fs.readFileSync(filePath));
}) : null;
if (localServer) await new Promise((resolve) => localServer.listen(0, "127.0.0.1", resolve));
const address = localServer?.address();
const target = deploymentUrl === undefined
  ? new URL(`http://127.0.0.1:${address.port}/million`)
  : new URL(deploymentUrl);
target.searchParams.set("qa", "performance");
target.searchParams.set("scenario", "full-story-reference-v1");
target.searchParams.set("quality", "force-full");
target.searchParams.set("motion", "full");
target.searchParams.set("audio", audioMode);
target.searchParams.set("dpr", "1");

const browserType = browserName === "webkit" ? webkit : chromium;
const browser = await browserType.launch({ headless: true });
let exitCode = 1;
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: "pl-PL",
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  const emptyRafIntervals = await page.evaluate(async () => new Promise((resolve) => {
    const intervals = [];
    let previous = null;
    let warmupFrames = 8;
    const sample = (now) => {
      if (warmupFrames > 0) {
        warmupFrames -= 1;
        previous = now;
        requestAnimationFrame(sample);
        return;
      }
      if (previous !== null) intervals.push(now - previous);
      previous = now;
      if (intervals.length >= 120) resolve(intervals);
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  const emptyRafBaseline = {
    browser: browserName,
    ...summarizeIntervals(emptyRafIntervals, true)
  };
  const failures = [];
  const responses = [];
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console:${message.text()}`);
  });
  page.on("pageerror", (error) => failures.push(`pageerror:${error.message}`));
  page.on("requestfailed", (request) => failures.push(`requestfailed:${request.url()}:${request.failure()?.errorText ?? ""}`));
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(`response:${response.status()}:${response.url()}`);
    if (/\.(?:js|css|webp)(?:\?|$)/u.test(response.url())) responses.push(response.url());
  });
  await page.route(`${recordsWorkerOrigin}/**`, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ entries: [] })
  }));
  await page.addInitScript(({ timelineContextSource }) => {
    const timelineContext = (0, eval)(`(${timelineContextSource})`);
    const metrics = window.__amsoFullStoryMetrics = {
      frames: [], decodes: [], longTasks: [], longAnimationFrames: [], imageNodes: [],
      transitions: [], panelPromotions: [], blankFrames: [], countdowns: [], collectorCost: [],
      collectorEnabledFrames: [], collectorDisabledFrames: [],
      collectorEnabledExecution: [], collectorDisabledExecution: [],
      collectorEnabledLayoutReads: 0, collectorDisabledLayoutReads: 0,
      historyTruncations: {},
      runtimeProfile: {
        schemaVersion: "full-story-runtime-profile-v1",
        sampleStride: 12,
        sampledActiveFrames: 0,
        canvas: { support: "instrumented", totals: {
          calls: 0, durationMs: 0, shadowedPaintCalls: 0,
          shadowedPaintDurationMs: 0, gradientAllocations: 0
        }, bySegment: {}, byWorld: {} },
        rendering: { support: "unsupported", entries: 0, totalRenderDurationMs: 0,
          totalStyleAndLayoutDurationMs: 0, activeEntries: 0, activeRenderDurationMs: 0,
          activeStyleAndLayoutDurationMs: 0, bySegment: {}, byWorld: {} },
        gc: { support: "unsupported", entries: 0, totalDurationMs: 0,
          activeEntries: 0, activeDurationMs: 0, bySegment: {}, byWorld: {} },
        heap: { support: "unsupported", samples: 0, firstBytes: null, lastBytes: null,
          minBytes: null, maxBytes: null, growthBytes: null },
        paint: { support: "unsupported", entries: [] }
      }
    };
    let root = null;
    let worldHost = null;
    let storyPresentation = null;
    let storyCountdown = null;
    let worldPanels = null;
    const context = () => {
      root ??= document.querySelector(".amso-million-runner-2026");
      worldHost ??= document.querySelector("[data-campaign-world-visual]");
      storyPresentation ??= document.querySelector("[data-campaign-story-presentation]");
      storyCountdown ??= document.querySelector("[data-campaign-story-countdown]");
      const driver = window.__amsoFullStoryDriver;
      const observation = driver?.currentObservation;
      const view = root?.getAttribute("data-view") ?? "loading";
      const storyVisible = storyPresentation instanceof HTMLElement && !storyPresentation.hidden;
      const countdownVisible = storyCountdown instanceof HTMLElement && !storyCountdown.hidden;
      const phase = countdownVisible ? "countdown" : storyVisible ? "story-scene" : view === "game" ?
        (observation?.storyState === "countdown" ? "countdown" :
        observation?.controlsEnabled === false ? "story-scene" :
        observation?.authoredWave?.completed === true ? "story-scene" :
        observation?.gameState === "paused" ? "pause" : "active-gameplay") :
        view === "story_scene" || view === "story_reframe" ? "story-scene" :
        view === "story_countdown" ? "countdown" : view.includes("result") ? "result" : view;
      return { phase, segmentId: observation?.sectionId ?? null,
        worldId: observation?.worldId ?? worldHost?.getAttribute("data-world-id") ?? null };
    };
    let runtimeProfileEnabled = false;
    let runtimeProfileContext = { phase: "loading", segmentId: null, worldId: null };
    const createProfileBucket = (group) => group === "canvas"
        ? { calls: 0, durationMs: 0, shadowedPaintCalls: 0,
          shadowedPaintDurationMs: 0, gradientAllocations: 0 }
        : group === "rendering"
          ? { entries: 0, renderDurationMs: 0, styleAndLayoutDurationMs: 0 }
          : { entries: 0, durationMs: 0 };
    const profileBuckets = (group, attributionContext = runtimeProfileContext) => {
      const profile = metrics.runtimeProfile[group];
      const segmentId = attributionContext.segmentId ?? "unattributed";
      const worldId = attributionContext.worldId ?? "unattributed";
      return [
        profile.bySegment[segmentId] ??= createProfileBucket(group),
        profile.byWorld[worldId] ??= createProfileBucket(group)
      ];
    };
    const canvasPrototype = window.CanvasRenderingContext2D?.prototype;
    const wrapCanvasMethod = (name, { gradient = false, paint = false } = {}) => {
      const native = canvasPrototype?.[name];
      if (typeof native !== "function") return;
      Object.defineProperty(canvasPrototype, name, { configurable: true, writable: true,
        value: function (...args) {
          if (!runtimeProfileEnabled) return native.apply(this, args);
          const startedAt = performance.now();
          const result = native.apply(this, args);
          const duration = performance.now() - startedAt;
          const totals = metrics.runtimeProfile.canvas.totals;
          const buckets = profileBuckets("canvas");
          totals.calls += 1;
          totals.durationMs += duration;
          for (const bucket of buckets) {
            bucket.calls += 1;
            bucket.durationMs += duration;
          }
          if (gradient) {
            totals.gradientAllocations += 1;
            for (const bucket of buckets) bucket.gradientAllocations += 1;
          }
          if (paint && Number(this.shadowBlur) > 0) {
            totals.shadowedPaintCalls += 1;
            totals.shadowedPaintDurationMs += duration;
            for (const bucket of buckets) {
              bucket.shadowedPaintCalls += 1;
              bucket.shadowedPaintDurationMs += duration;
            }
          }
          return result;
        }
      });
    };
    wrapCanvasMethod("createLinearGradient", { gradient: true });
    wrapCanvasMethod("createRadialGradient", { gradient: true });
    for (const name of ["fill", "stroke", "fillRect", "strokeRect", "fillText", "strokeText", "drawImage"]) {
      wrapCanvasMethod(name, { paint: true });
    }
    let previous = null;
    let previousCollectorEnabled = null;
    let previousContext = null;
    let activeSampleIndex = 0;
    let previousPanelState = null;
    let previousObservedWorldId = null;
    let pendingWorldTransition = null;
    const boundedPush = (items, value, label, limit = 50_000) => {
      if (items.length < limit) items.push(value);
      else metrics.historyTruncations[label] = (metrics.historyTruncations[label] ?? 0) + 1;
    };
    const translatePercent = (panel) => {
      const match = panel?.style.transform.match(/translate3d\((-?[\d.]+)%/u);
      return match ? Number(match[1]) : null;
    };
    const sample = (now) => {
      const started = performance.now();
      const current = context();
      const activeCollectorEnabled = current.phase !== "active-gameplay" ||
        Math.floor(activeSampleIndex / 120) % 2 === 0;
      runtimeProfileContext = current;
      runtimeProfileEnabled = current.phase === "active-gameplay" && activeCollectorEnabled &&
        activeSampleIndex % metrics.runtimeProfile.sampleStride === 0;
      if (runtimeProfileEnabled) metrics.runtimeProfile.sampledActiveFrames += 1;
      const memory = performance.memory;
      if (runtimeProfileEnabled && Number.isFinite(memory?.usedJSHeapSize)) {
        const heap = metrics.runtimeProfile.heap;
        heap.support = "performance-memory";
        heap.samples += 1;
        heap.firstBytes ??= memory.usedJSHeapSize;
        heap.lastBytes = memory.usedJSHeapSize;
        heap.minBytes = heap.minBytes === null ? memory.usedJSHeapSize : Math.min(heap.minBytes, memory.usedJSHeapSize);
        heap.maxBytes = heap.maxBytes === null ? memory.usedJSHeapSize : Math.max(heap.maxBytes, memory.usedJSHeapSize);
        heap.growthBytes = heap.lastBytes - heap.firstBytes;
      }
      if (previousObservedWorldId && current.worldId && previousObservedWorldId !== current.worldId) {
        const priorPercent = previousPanelState?.nextWorldId === current.worldId
          ? previousPanelState.nextTranslatePercent : null;
        pendingWorldTransition = { startedAt: now, fromWorldId: previousObservedWorldId,
          toWorldId: current.worldId, priorPercent };
      }
      if (activeCollectorEnabled && (worldPanels === null || worldPanels.length < 2)) {
        worldPanels = [...document.querySelectorAll('[data-world-panel="current"], [data-world-panel="next"]')]
          .filter((panel) => panel instanceof HTMLImageElement);
      }
      if (activeCollectorEnabled && worldPanels?.length > 0) {
        const currentPanel = worldPanels.find((panel) => panel.dataset.worldPanel === "current");
        const nextPanel = worldPanels.find((panel) => panel.dataset.worldPanel === "next");
        const currentReady = currentPanel instanceof HTMLImageElement && !currentPanel.hidden &&
          (currentPanel.dataset.presentationReady === "true" || currentPanel.naturalWidth > 0);
        const nextReady = nextPanel instanceof HTMLImageElement && !nextPanel.hidden &&
          (nextPanel.dataset.presentationReady === "true" || nextPanel.naturalWidth > 0);
        if (current.phase === "active-gameplay" && !currentReady && !nextReady) {
          boundedPush(metrics.blankFrames, { at: now, ...current }, "blankFrames");
        }
        const detailedPanelSampleDue = current.phase !== "active-gameplay" ||
          activeSampleIndex % 24 === 0 || pendingWorldTransition !== null;
        if (detailedPanelSampleDue) {
          const panelState = {
            currentWorldId: currentPanel?.dataset.worldId ?? null,
            currentTranslatePercent: translatePercent(currentPanel),
            currentReady,
            currentHidden: currentPanel?.hidden ?? true,
            nextWorldId: nextPanel?.dataset.worldId ?? null,
            nextTranslatePercent: translatePercent(nextPanel)
          };
          if (pendingWorldTransition) {
            const destinationPanel = worldPanels.find((panel) => panel.dataset.worldId === pendingWorldTransition.toWorldId &&
              !panel.hidden && (panel.dataset.presentationReady === "true" || panel.naturalWidth > 0));
            if (destinationPanel instanceof HTMLImageElement) {
              const destinationPercent = translatePercent(destinationPanel);
              metrics.collectorEnabledLayoutReads += 1;
              const plateWidth = document.querySelector("[data-world-plate]")?.getBoundingClientRect().width ?? 0;
              boundedPush(metrics.panelPromotions, { at: now, fromWorldId: pendingWorldTransition.fromWorldId,
                toWorldId: pendingWorldTransition.toWorldId, presentationReady: true, hidden: false,
                phase: current.phase,
                narrativeGapMs: now - pendingWorldTransition.startedAt,
                phaseResidualPx: pendingWorldTransition.priorPercent === null || destinationPercent === null
                  ? null : Math.abs(pendingWorldTransition.priorPercent - destinationPercent) * plateWidth / 100 },
              "panelPromotions");
              pendingWorldTransition = null;
            }
          }
          previousPanelState = panelState;
        }
      }
      if (previous !== null && previousContext?.phase === "active-gameplay" &&
          previousCollectorEnabled !== null) {
        boundedPush(previousCollectorEnabled ? metrics.collectorEnabledFrames : metrics.collectorDisabledFrames,
          now - previous, previousCollectorEnabled ? "collectorEnabledFrames" : "collectorDisabledFrames");
      }
      if (current.phase === "active-gameplay") {
        activeSampleIndex += 1;
      }
      if (current.worldId) previousObservedWorldId = current.worldId;
      if (previous !== null && previousContext !== null) boundedPush(metrics.frames,
        { at: now, duration: now - previous, ...previousContext }, "frames");
      previous = now;
      const collectorDuration = performance.now() - started;
      boundedPush(metrics.collectorCost, collectorDuration, "collectorCost");
      if (current.phase === "active-gameplay") {
        boundedPush(activeCollectorEnabled ? metrics.collectorEnabledExecution : metrics.collectorDisabledExecution,
          collectorDuration, activeCollectorEnabled ? "collectorEnabledExecution" : "collectorDisabledExecution");
        previousCollectorEnabled = activeCollectorEnabled;
      } else {
        previousCollectorEnabled = null;
      }
      previousContext = current;
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    const decode = HTMLImageElement.prototype.decode;
    const imageNodeIds = new WeakMap();
    let nextImageNodeId = 1;
    if (decode) HTMLImageElement.prototype.decode = function (...args) {
      if (!imageNodeIds.has(this)) imageNodeIds.set(this, nextImageNodeId++);
      const startedAt = performance.now();
      const entry = { source: this.currentSrc || this.src, nodeId: imageNodeIds.get(this),
        panelRole: this.dataset.worldPanel ?? (this.hasAttribute("data-world-staged-panel") ? "staged" : "asset"),
        startedAt, ...context(), duration: null };
      boundedPush(metrics.decodes, entry, "decodes");
      return decode.apply(this, args).finally(() => { entry.duration = performance.now() - startedAt; });
    };
    const createElement = Document.prototype.createElement;
    Document.prototype.createElement = function (name, options) {
      const element = createElement.call(this, name, options);
      if (String(name).toLowerCase() === "img") boundedPush(metrics.imageNodes,
        { at: performance.now(), ...context() }, "imageNodes");
      return element;
    };
    const NativeImage = window.Image;
    function InstrumentedImage(width, height) {
      boundedPush(metrics.imageNodes, { at: performance.now(), constructor: "Image", ...context() }, "imageNodes");
      return Reflect.construct(NativeImage, width === undefined ? [] : height === undefined ? [width] : [width, height]);
    }
    InstrumentedImage.prototype = NativeImage.prototype;
    Object.defineProperty(window, "Image", { configurable: true, writable: true, value: InstrumentedImage });
    const contextAt = (at) => {
      return timelineContext(metrics.frames, at, context());
    };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) boundedPush(metrics.longTasks, {
          at: entry.startTime, duration: entry.duration,
          blockingDuration: Math.max(0, entry.duration - 50), ...contextAt(entry.startTime)
        }, "longTasks");
      }).observe({ type: "longtask", buffered: true });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        metrics.runtimeProfile.rendering.support = "long-animation-frame";
        for (const entry of list.getEntries()) {
          const observedContext = contextAt(entry.startTime);
          const frameEnd = entry.startTime + entry.duration;
          const renderDuration = Number.isFinite(entry.renderStart)
            ? Math.max(0, frameEnd - entry.renderStart) : 0;
          const styleAndLayoutDuration = Number.isFinite(entry.styleAndLayoutStart)
            ? Math.max(0, frameEnd - entry.styleAndLayoutStart) : 0;
          boundedPush(metrics.longAnimationFrames, {
            at: entry.startTime, duration: entry.duration,
            blockingDuration: entry.blockingDuration ?? Math.max(0, entry.duration - 50),
            renderDuration, styleAndLayoutDuration, ...observedContext
          }, "longAnimationFrames");
          const rendering = metrics.runtimeProfile.rendering;
          rendering.entries += 1;
          rendering.totalRenderDurationMs += renderDuration;
          rendering.totalStyleAndLayoutDurationMs += styleAndLayoutDuration;
          if (observedContext.phase === "active-gameplay") {
            rendering.activeEntries += 1;
            rendering.activeRenderDurationMs += renderDuration;
            rendering.activeStyleAndLayoutDurationMs += styleAndLayoutDuration;
            for (const bucket of profileBuckets("rendering", observedContext)) {
              bucket.entries += 1;
              bucket.renderDurationMs += renderDuration;
              bucket.styleAndLayoutDurationMs += styleAndLayoutDuration;
            }
          }
        }
      }).observe({ type: "long-animation-frame", buffered: true });
    } catch {}
    if (PerformanceObserver.supportedEntryTypes?.includes("gc")) {
      metrics.runtimeProfile.gc.support = "supported";
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const observedContext = contextAt(entry.startTime);
            const gc = metrics.runtimeProfile.gc;
            gc.entries += 1;
            gc.totalDurationMs += entry.duration;
            if (observedContext.phase === "active-gameplay") {
              gc.activeEntries += 1;
              gc.activeDurationMs += entry.duration;
              for (const bucket of profileBuckets("gc", observedContext)) {
                bucket.entries += 1;
                bucket.durationMs += entry.duration;
              }
            }
          }
        }).observe({ type: "gc", buffered: true });
      } catch {
        metrics.runtimeProfile.gc.support = "unsupported";
      }
    }
    if (PerformanceObserver.supportedEntryTypes?.includes("paint")) {
      metrics.runtimeProfile.paint.support = "paint-timing";
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) boundedPush(metrics.runtimeProfile.paint.entries, {
            name: entry.name, at: entry.startTime, duration: entry.duration
          }, "paintEntries");
        }).observe({ type: "paint", buffered: true });
      } catch {
        metrics.runtimeProfile.paint.support = "unsupported";
      }
    }
    const transitionObserver = new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target;
        if (!(target instanceof HTMLImageElement) || target.dataset.worldPanel !== "current") continue;
        boundedPush(metrics.transitions, { at: performance.now(), attribute: record.attributeName,
          worldId: target.dataset.worldId ?? null,
          presentationReady: target.dataset.presentationReady === "true", hidden: target.hidden, ...context() },
        "transitions");
      }
    });
    addEventListener("DOMContentLoaded", () => transitionObserver.observe(document.documentElement, {
      subtree: true, attributes: true,
      attributeFilter: ["data-world-id", "data-presentation-ready", "hidden"]
    }), { once: true });
    addEventListener("DOMContentLoaded", () => {
      const host = document.querySelector("[data-campaign-story-countdown]");
      const value = document.querySelector("[data-campaign-story-countdown-value]");
      if (!(host instanceof HTMLElement) || !(value instanceof HTMLElement)) return;
      const recordValue = (text) => {
        const normalized = String(text ?? "").trim();
        if (!/^[123]$/u.test(normalized)) return;
        const observation = window.AMSOMillionRunnerQA?.qaStoryObservation?.();
        const entry = { sectionId: observation?.sectionId ?? "", value: Number(normalized) };
        const previous = metrics.countdowns.at(-1);
        const expectedValue = previous?.value === 3 ? 2 : previous?.value === 2 ? 1 : 3;
        if (entry.sectionId && entry.value === expectedValue &&
            (entry.value === 3 || previous?.sectionId === entry.sectionId)) {
          boundedPush(metrics.countdowns, entry, "countdowns");
        }
      };
      const record = (records = []) => {
        for (const mutation of records) {
          for (const node of mutation.removedNodes ?? []) recordValue(node.textContent);
        }
        if (host.hidden) return;
        recordValue(value.textContent);
      };
      new MutationObserver(record).observe(host, { subtree: true, childList: true, characterData: true, attributes: true });
      record();
    }, { once: true });
  }, { timelineContextSource: contextForTimelineEntry.toString() });
  const navigationResponse = await page.goto(target.href, { waitUntil: "networkidle", timeout: 60_000 });
  const finalUrl = page.url();
  const responseHeaders = navigationResponse?.headers() ?? {};
  const rawHtml = navigationResponse ? Buffer.from(await navigationResponse.body()) : Buffer.from("");
  const artifactSourceIdentity = rawHtml.toString("utf8")
    .match(/<meta name="amso-build-source" content="([a-f0-9]{64})">/u)?.[1] ?? null;
  await page.locator("[data-campaign-landing-actions] button").first().click();
  await page.waitForFunction(() => window.AMSOMillionRunnerQA !== undefined, null, { timeout: 30_000 });

  await page.evaluate(({ chapterLimit, driverPolicySource }) => {
    const nextDriverCommand = (0, eval)(`(${driverPolicySource})`);
    const runtime = window.__amsoFullStoryDriver = {
      done: false, failure: null, actedToken: null, slideToken: null,
      startedAt: performance.now(), inputTrace: [], waveResults: [], checkpoints: [],
      storyScenes: [], countdownTrace: [],
      countdownProbe: null,
      lastWaveResultSequence: 0, lastMicrolevel: null, seenMicrolevels: [],
      currentObservation: null, previousObservation: null, lastChapterObservation: null
    };
    const dispatch = (type, code, key) => document.dispatchEvent(new KeyboardEvent(type, {
      code, key, bubbles: true, cancelable: true
    }));
    const qaStepEventName = window.AMSOMillionRunnerQA.qaStoryStepEventName();
    const processDriverObservation = (observation) => {
      if (!observation || runtime.done || runtime.failure) return;
      runtime.previousObservation = runtime.currentObservation;
      runtime.currentObservation = observation;
      const wave = observation.authoredWave;
      if (wave && !runtime.seenMicrolevels.includes(wave.microlevelId)) {
        runtime.seenMicrolevels.push(wave.microlevelId);
      }
      const completed = observation.lastCompletedWave;
      if (completed && completed.sequence !== runtime.lastWaveResultSequence) {
        runtime.lastWaveResultSequence = completed.sequence;
        runtime.waveResults.push({ at: performance.now(), microlevelId: completed.microlevelId,
          ...completed.result, canonicalState: completed.canonicalCheckpoint });
        if (completed.result.attempts > 1 || !completed.result.passed) {
          runtime.failure = `wave-failed:${completed.microlevelId}:${completed.result.waveId}:${completed.sequence}`;
        }
      }
      if (wave && wave.attemptsOnCurrentWave > 1) {
        runtime.failure = `wave-retry:${wave.microlevelId}:${wave.currentWaveId}`;
      }
      const command = nextDriverCommand(observation, {
        actedToken: runtime.actedToken,
        slideToken: runtime.slideToken
      });
      if (runtime.done || runtime.failure) return;
      if (command?.type === "fail") {
        runtime.failure = `${command.reason}:${observation.authoredWave?.currentWaveId ?? "unknown"}`;
      }
      if (command?.type === "slide-end") {
        dispatch("keyup", "ArrowDown", "ArrowDown");
        runtime.inputTrace.push({ step: observation.simulationStep, action: "slide", active: false,
          token: runtime.slideToken });
        runtime.slideToken = null;
      }
      if (command?.type === "jump") {
        runtime.actedToken = command.token;
        dispatch("keydown", "ArrowUp", "ArrowUp");
        dispatch("keyup", "ArrowUp", "ArrowUp");
        runtime.inputTrace.push({ step: observation.simulationStep, action: "jump", active: true,
          token: command.token });
      } else if (command?.type === "slide-start") {
        runtime.slideToken = command.token;
        dispatch("keydown", "ArrowDown", "ArrowDown");
        runtime.inputTrace.push({ step: observation.simulationStep, action: "slide", active: true,
          token: command.token });
      }
      if (runtime.lastMicrolevel && wave && wave.microlevelId !== runtime.lastMicrolevel) {
        const checkpointObservation = runtime.lastChapterObservation ?? runtime.previousObservation ?? observation;
        const expected = window.AMSOMillionRunnerQA.qaStoryManifest().checkpoints
          .find((item) => item.microlevelId === runtime.lastMicrolevel);
        const lastCompletedState = runtime.waveResults
          .filter((item) => item.microlevelId === runtime.lastMicrolevel)
          .at(-1)?.canonicalState ?? null;
        runtime.checkpoints.push({
          microlevelId: runtime.lastMicrolevel,
          segmentId: expected?.segmentId ?? null,
          completedWaves: runtime.waveResults
            .filter((item) => item.microlevelId === runtime.lastMicrolevel).length,
          packagesCollected: checkpointObservation.packagesCollected,
          millionCounterValue: checkpointObservation.millionCounterValue,
          worldId: checkpointObservation.worldId,
          canonicalState: lastCompletedState ?? checkpointObservation.canonicalCheckpoint ?? null
        });
        if (chapterLimit === runtime.lastMicrolevel) runtime.done = true;
      }
      if (wave) runtime.lastChapterObservation = observation;
      if (wave) runtime.lastMicrolevel = wave.microlevelId;
    };
    const handleQaStep = (event) => {
      if (event instanceof CustomEvent) processDriverObservation(event.detail);
    };
    document.addEventListener(qaStepEventName, handleQaStep);
    const stopDriver = () => {
      document.removeEventListener(qaStepEventName, handleQaStep);
      if (runtime.slideToken) dispatch("keyup", "ArrowDown", "ArrowDown");
    };
    const interval = setInterval(() => {
      if (runtime.done || runtime.failure) return;
      try {
        const api = window.AMSOMillionRunnerQA;
        const result = document.querySelector("[data-campaign-story-result]");
        if (result instanceof HTMLElement && !result.hidden) {
          const liveObservation = api?.qaStoryObservation?.();
          const completed = liveObservation?.lastCompletedWave;
          if (completed && completed.sequence !== runtime.lastWaveResultSequence) {
            runtime.lastWaveResultSequence = completed.sequence;
            runtime.waveResults.push({ at: performance.now(), microlevelId: completed.microlevelId,
              ...completed.result, canonicalState: completed.canonicalCheckpoint });
          }
          // The result snapshot owns the authoritative final counter. A cached
          // active-play observation may precede the bounded recovery pickup by
          // one polling interval and must never replace it.
          const finalObservation = liveObservation ?? runtime.lastChapterObservation ?? runtime.currentObservation;
          const expected = api?.qaStoryManifest?.().checkpoints.find((item) => item.microlevelId === runtime.lastMicrolevel);
          runtime.checkpoints.push({
            microlevelId: runtime.lastMicrolevel,
            segmentId: expected?.segmentId ?? null,
            completedWaves: runtime.waveResults.filter((item) => item.microlevelId === runtime.lastMicrolevel).length,
            packagesCollected: finalObservation?.packagesCollected ?? null,
            millionCounterValue: finalObservation?.millionCounterValue ?? null,
            // Chapter attribution belongs to the last active play frame; the
            // live result observation has already installed million-finale.
            worldId: runtime.lastChapterObservation?.worldId ?? finalObservation?.worldId ?? null,
            canonicalState: finalObservation?.canonicalCheckpoint ?? null
          });
          runtime.done = true;
          stopDriver();
          clearInterval(interval);
          return;
        }
        const observation = api?.qaStoryObservation?.();
        const sceneId = observation?.sceneId;
        if (sceneId && runtime.storyScenes.at(-1) !== sceneId) runtime.storyScenes.push(sceneId);
        if (observation?.storyState === "countdown") {
          if (runtime.countdownProbe === null) {
            runtime.countdownProbe = { sectionId: observation.sectionId, runner: observation.runner };
            dispatch("keydown", "Space", " ");
            dispatch("keyup", "Space", " ");
          } else if (runtime.countdownProbe.sectionId === observation.sectionId &&
              (observation.runner.y !== runtime.countdownProbe.runner.y ||
                observation.runner.velocityY !== runtime.countdownProbe.runner.velocityY)) {
            runtime.failure = `countdown-input-leaked:${observation.sectionId}`;
          }
        } else {
          runtime.countdownProbe = null;
        }
        const continueButton = document.querySelector("[data-campaign-story-continue]:not([hidden])");
        const currentPanel = document.querySelector('[data-world-panel="current"]');
        const preparedPanel = document.querySelector('[data-world-panel="next"][data-presentation-ready="true"]');
        const successorReady = preparedPanel instanceof HTMLImageElement &&
          currentPanel instanceof HTMLImageElement &&
          preparedPanel.dataset.worldId !== currentPanel.dataset.worldId;
        // The automated reader waits for the same quiet story-time preparation
        // a human naturally gives the card. The click itself remains the public
        // visible CTA; no private state transition is used.
        if (continueButton instanceof HTMLButtonElement && !continueButton.disabled && successorReady) {
          continueButton.click();
        }
        if (runtime.failure || runtime.done) {
          stopDriver();
          clearInterval(interval);
          return;
        }
      } catch (error) {
        runtime.failure = error instanceof Error ? error.message : String(error);
        stopDriver();
        clearInterval(interval);
      }
    }, 4);
  }, { chapterLimit: stopAfterChapter ?? null, driverPolicySource: nextFullStoryDriverCommand.toString() });

  try {
    await page.waitForFunction(() => window.__amsoFullStoryDriver?.done || window.__amsoFullStoryDriver?.failure,
      null, { timeout: timeoutMs, polling: 100 });
  } catch (error) {
    await page.evaluate((message) => {
      if (window.__amsoFullStoryDriver) window.__amsoFullStoryDriver.failure = `timeout:${message}`;
    }, error instanceof Error ? error.message : String(error));
  }
  await page.waitForTimeout(50);
  const captured = await page.evaluate(async () => ({
    driver: window.__amsoFullStoryDriver,
    metrics: window.__amsoFullStoryMetrics,
    resultVisible: (() => {
      const result = document.querySelector("[data-campaign-story-result]");
      return result instanceof HTMLElement && !result.hidden;
    })(),
    qaReport: window.AMSOMillionRunnerQA?.qaReport?.() ?? null,
    manifest: window.AMSOMillionRunnerQA?.qaStoryManifest?.() ?? null,
    countdownTrace: window.AMSOMillionRunnerQA?.qaStoryCountdownTrace?.() ?? [],
    finalPresentation: await (async () => {
      const host = document.querySelector("[data-campaign-world-visual]");
      const startedAt = performance.now();
      const deadline = performance.now() + 5_000;
      while (performance.now() < deadline) {
        const panels = [...document.querySelectorAll('[data-world-panel="current"], [data-world-panel="next"]')];
        const panel = panels.find((candidate) => candidate instanceof HTMLImageElement &&
          candidate.dataset.worldId === "million-finale" && !candidate.hidden && candidate.naturalWidth > 0);
        if (panel instanceof HTMLImageElement) return {
          worldId: panel.dataset.worldId ?? null,
          ready: panel.dataset.presentationReady === "true" || panel.naturalWidth > 0,
          hidden: panel.hidden,
          naturalWidth: panel.naturalWidth,
          hostWorldId: host?.getAttribute("data-world-id") ?? null,
          readyDelayMs: performance.now() - startedAt
        };
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return null;
    })()
  }));
  const activeFrames = captured.metrics.frames
    .filter((frame) => frame.phase === "active-gameplay")
    .map((frame) => frame.duration);
  const summarizeFrameValues = (values) => ({
    frameCount: values.length,
    p50Ms: percentile(values, 0.5),
    p95Ms: percentile(values, 0.95),
    p99Ms: percentile(values, 0.99),
    maxMs: values.length ? Math.max(...values) : null,
    over33Ms: values.filter((value) => value > 33).length,
    over100Ms: values.filter((value) => value > 100).length
  });
  const activeAttribution = (key) => Object.fromEntries([...new Set(captured.metrics.frames
    .filter((frame) => frame.phase === "active-gameplay").map((frame) => frame[key]).filter(Boolean))]
    .map((id) => [id, summarizeFrameValues(captured.metrics.frames.filter((frame) =>
      frame.phase === "active-gameplay" && frame[key] === id).map((frame) => frame.duration))]));
  const activeSegments = activeAttribution("segmentId");
  const activeWorlds = activeAttribution("worldId");
  const normalizedDigestPayload = {
    waves: captured.driver.waveResults.map(({ waveId, attempts, actionSucceeded, passed }) =>
      ({ waveId, attempts, actionSucceeded, passed })),
    checkpoints: captured.driver.checkpoints.map((checkpoint, index) => ({
      microlevelId: checkpoint.microlevelId,
      worldId: checkpoint.worldId,
      completedWaves: checkpoint.completedWaves,
      minimumPackagesReached: checkpoint.packagesCollected >=
        (captured.manifest?.checkpoints?.[index]?.minimumCumulativePackages ?? Infinity),
      millionCounterValue: checkpoint.millionCounterValue,
      canonicalGameplay: checkpoint.canonicalState === null ? null : {
        simulationStep: checkpoint.canonicalState.simulationStep,
        rngState: checkpoint.canonicalState.rngState,
        score: checkpoint.canonicalState.score,
        distance: checkpoint.canonicalState.distance,
        worldIndex: checkpoint.canonicalState.worldIndex,
        collisionCount: checkpoint.canonicalState.collisionCount,
        pickupCount: checkpoint.canonicalState.pickupCount
      }
    }))
  };
  const assetUrls = [...new Set(responses)].sort();
  const assetIdentities = await Promise.all(assetUrls.map(async (url) => {
    const response = await fetch(url);
    const bytes = Buffer.from(await response.arrayBuffer());
    return { url, status: response.status, bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex") };
  }));
  const metricPercentile = (values, p) => percentile(values.filter(Number.isFinite), p);
  const phaseAggregates = Object.fromEntries([...new Set(captured.metrics.frames.map((frame) => frame.phase))]
    .map((phase) => {
      const values = captured.metrics.frames.filter((frame) => frame.phase === phase).map((frame) => frame.duration);
      return [phase, { frameCount: values.length, p95Ms: percentile(values, 0.95), maxMs: values.length ? Math.max(...values) : null }];
    }));
  const transitionWindows = captured.metrics.panelPromotions.map((promotion) => ({
    ...promotion,
    blankFrames: captured.metrics.blankFrames.filter((blank) => Math.abs(blank.at - promotion.at) <= 500).length
  }));
  const evidence = {
    schemaVersion: "full-story-reference-evidence-v2",
    capturedAt: new Date().toISOString(),
    browser: browserName,
    target: deploymentUrl === undefined ? "local-dist-vercel" : deploymentUrl,
    provenance: {
      requestedUrl: target.href,
      finalUrl,
      status: navigationResponse?.status() ?? null,
      vercelId: responseHeaders["x-vercel-id"] ?? null,
      server: responseHeaders.server ?? null,
      htmlSha256: createHash("sha256").update(rawHtml).digest("hex"),
      baseCommitSha,
      sourceIdentity: artifactSourceIdentity,
      runnerSourceIdentity: localSourceIdentity,
      browserVersion: browser.version(),
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
      hostDeviceClass,
      assetIdentities
    },
    configuration: {
      scenarioId: "full-story-reference-v1",
      scenarioConfigVersion: captured.manifest?.configVersion ?? null,
      seed: captured.manifest?.seed ?? null,
      inputTraceDigest: createHash("sha256")
        .update(JSON.stringify(captured.driver.inputTrace)).digest("hex"),
      audioMode, quality: "force-full", motion: "full", requestedDpr: 1,
      stopAfterChapter: stopAfterChapter ?? null
    },
    correctness: {
      completed: captured.driver.done === true,
      failure: captured.driver.failure,
      resultVisible: captured.resultVisible,
      seenMicrolevels: captured.driver.seenMicrolevels,
      waveResults: captured.driver.waveResults,
      checkpoints: captured.driver.checkpoints,
      inputTrace: captured.driver.inputTrace,
      storyScenes: captured.driver.storyScenes,
      countdownTrace: captured.countdownTrace,
      finalPresentation: captured.finalPresentation,
      finalDigest: captured.driver.done
        ? createHash("sha256").update(JSON.stringify(normalizedDigestPayload)).digest("hex")
        : null,
      manifest: captured.manifest
    },
    performance: {
      activeFrameCount: activeFrames.length,
      p50Ms: percentile(activeFrames, 0.5),
      p95Ms: percentile(activeFrames, 0.95),
      p99Ms: percentile(activeFrames, 0.99),
      maxMs: activeFrames.length ? Math.max(...activeFrames) : null,
      over33Ms: activeFrames.filter((value) => value > 33).length,
      over100Ms: activeFrames.filter((value) => value > 100).length,
      activeDecodeStarts: captured.metrics.decodes.filter((decode) => decode.phase === "active-gameplay").length,
      hotPathImageNodesCreated: captured.metrics.imageNodes.filter((entry) => entry.phase === "active-gameplay").length,
      phaseAggregates,
      activeSegments,
      activeWorlds,
      blankFrameCount: captured.metrics.blankFrames.length,
      collectorCostP95Ms: metricPercentile(captured.metrics.collectorCost, 0.95),
      emptyRafBaseline,
      collectorComparison: {
        mode: "alternating-active-trace-ab-v2",
        sampledIntervalP95Ms: metricPercentile(captured.metrics.collectorEnabledFrames, 0.95),
        controlIntervalP95Ms: metricPercentile(captured.metrics.collectorDisabledFrames, 0.95),
        intervalDeltaP95Ms: Math.max(0,
          (metricPercentile(captured.metrics.collectorEnabledFrames, 0.95) ?? Infinity) -
          (metricPercentile(captured.metrics.collectorDisabledFrames, 0.95) ?? 0)),
        sampledExecutionP95Ms: metricPercentile(captured.metrics.collectorEnabledExecution, 0.95),
        controlExecutionP95Ms: metricPercentile(captured.metrics.collectorDisabledExecution, 0.95),
        executionDeltaP95Ms: Math.max(0,
          (metricPercentile(captured.metrics.collectorEnabledExecution, 0.95) ?? Infinity) -
          (metricPercentile(captured.metrics.collectorDisabledExecution, 0.95) ?? 0)),
        sampledLayoutReads: captured.metrics.collectorEnabledLayoutReads,
        controlLayoutReads: captured.metrics.collectorDisabledLayoutReads
      },
      historyTruncations: captured.metrics.historyTruncations,
      runtimeProfile: captured.metrics.runtimeProfile,
      decodes: captured.metrics.decodes,
      longTasks: captured.metrics.longTasks,
      longAnimationFrames: captured.metrics.longAnimationFrames,
      transitions: captured.metrics.transitions,
      transitionWindows,
      repeatedWorldDecodeSources: [...new Set(captured.metrics.decodes
        .filter((entry, index, all) => entry.panelRole !== "asset" && all.some((prior, priorIndex) =>
          priorIndex < index && prior.panelRole === entry.panelRole && prior.source === entry.source))
        .map((entry) => entry.source))]
    },
    browserFailures: failures,
    passed: false
  };
  const policyReasons = stopAfterChapter === undefined ? assessFullStoryEvidence(evidence) : [];
  if (stopAfterChapter !== undefined && !(captured.driver.done === true && captured.driver.failure === null && failures.length === 0)) {
    policyReasons.push("chapter-tracer-failed");
  }
  evidence.policyReasons = policyReasons;
  evidence.passed = policyReasons.length === 0;
  if (outputPath) {
    const absolute = path.resolve(root, outputPath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, `${JSON.stringify(evidence, null, 2)}\n`);
  }
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
  exitCode = evidence.passed ? 0 : 1;
  await context.close();
} finally {
  await browser.close();
  if (localServer) await new Promise((resolve) => localServer.close(resolve));
}
process.exitCode = exitCode;
