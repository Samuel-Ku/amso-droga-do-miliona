import { createHash } from "node:crypto";
import {
  assessFullStoryEvidence
}
  from "./full-story-performance-policy.mjs";

const RUNTIME_PROFILE_SCHEMA = "full-story-runtime-profile-v1";
const CONTROLLED_CONFIGURATION_KEYS = [
  "scenarioId", "scenarioConfigVersion", "seed", "inputTraceDigest", "audioMode",
  "quality", "motion", "requestedDpr", "stopAfterChapter"
];

function assetFingerprint(evidence) {
  return (evidence?.provenance?.assetIdentities ?? [])
    .map(({ url, bytes, sha256 }) => {
      let assetPath = "invalid-url";
      try {
        assetPath = new URL(url).pathname;
      } catch {}
      return `${assetPath}:${bytes}:${sha256}`;
    })
    .sort()
    .join("|");
}

function artifactCoverageReasons(evidence, target) {
  const assets = evidence?.provenance?.assetIdentities ?? [];
  const paths = assets.filter((asset) => asset.status === 200 && asset.bytes > 0 && asset.sha256)
    .map((asset) => {
      try { return new URL(asset.url).pathname; } catch { return ""; }
    });
  const reasons = [];
  if (!paths.some((assetPath) => assetPath.endsWith(".js"))) reasons.push(`profile-${target}-js-identity-missing`);
  if (!paths.some((assetPath) => assetPath.endsWith(".css"))) reasons.push(`profile-${target}-css-identity-missing`);
  for (let world = 1; world <= 7; world += 1) {
    const prefix = `/assets/milion-runner/worlds/world-0${world}-`;
    if (!paths.some((assetPath) => assetPath.startsWith(prefix) && assetPath.endsWith(".webp"))) {
      reasons.push(`profile-${target}-world-${world}-identity-missing`);
    }
  }
  return reasons;
}

function isExpectedRedPerformanceReason(reason) {
  return reason === "active-p95-over-18ms" ||
    reason === "active-p99-over-33ms" ||
    reason === "active-max-over-100ms" ||
    reason.startsWith("segment-performance-invalid:");
}

function validDistribution(distribution, { requireFrameCount = true } = {}) {
  const fields = ["p50Ms", "p95Ms", "p99Ms", "maxMs", "over33Ms", "over100Ms"];
  return (!requireFrameCount || (Number.isFinite(distribution?.frameCount) && distribution.frameCount > 0)) &&
    fields.every((field) => Number.isFinite(distribution?.[field]) && distribution[field] >= 0);
}

export function contextForTimelineEntry(frames, entryStartTime, fallback) {
  for (let index = frames.length - 1; index >= 0; index -= 1) {
    const frame = frames[index];
    const intervalStart = frame.at - frame.duration;
    if (entryStartTime >= intervalStart && entryStartTime <= frame.at) {
      return { phase: frame.phase, segmentId: frame.segmentId, worldId: frame.worldId };
    }
    if (frame.at <= entryStartTime) {
      return { phase: frame.phase, segmentId: frame.segmentId, worldId: frame.worldId };
    }
  }
  return fallback;
}

function validateEvidence(evidence, target) {
  const reasons = assessFullStoryEvidence(evidence, { production: target === "production" })
    .filter((reason) => !isExpectedRedPerformanceReason(reason))
    .map((reason) => `profile-${target}-${reason}`);
  reasons.push(...artifactCoverageReasons(evidence, target));
  if (!validDistribution(evidence?.performance, { requireFrameCount: false })) {
    reasons.push(`profile-${target}-frame-distribution-incomplete`);
  }
  const checkpoints = evidence?.correctness?.checkpoints ?? [];
  for (const checkpoint of checkpoints) {
    if (!validDistribution(evidence?.performance?.activeSegments?.[checkpoint.segmentId])) {
      reasons.push(`profile-${target}-segment-distribution-incomplete:${checkpoint.segmentId}`);
    }
    if (!validDistribution(evidence?.performance?.activeWorlds?.[checkpoint.worldId])) {
      reasons.push(`profile-${target}-world-distribution-incomplete:${checkpoint.worldId}`);
    }
  }
  if (!evidence?.performance?.historyTruncations ||
      Object.values(evidence.performance.historyTruncations).some((count) => count !== 0)) {
    reasons.push(`profile-${target}-history-truncated`);
  }
  if (evidence?.browser !== "webkit") reasons.push(`profile-${target}-browser-invalid`);
  if (target === "local" && evidence?.target !== "local-dist-vercel") {
    reasons.push("profile-local-target-invalid");
  }
  if (target === "production") {
    let origin = null;
    try {
      origin = new URL(evidence?.provenance?.finalUrl ?? "").origin;
    } catch {}
    if (origin !== "https://game.amso.pl" || !evidence?.provenance?.vercelId) {
      reasons.push("profile-production-provenance-invalid");
    }
  }
  const profile = evidence?.performance?.runtimeProfile;
  if (profile?.schemaVersion !== RUNTIME_PROFILE_SCHEMA ||
      (profile?.sampledActiveFrames ?? 0) <= 0 ||
      profile?.canvas?.support !== "instrumented" ||
      !profile?.canvas?.totals || !profile?.canvas?.bySegment || !profile?.canvas?.byWorld ||
      !profile?.rendering || !profile?.rendering?.bySegment || !profile?.rendering?.byWorld ||
      !Number.isFinite(profile?.rendering?.activeEntries) ||
      !Number.isFinite(profile?.rendering?.activeRenderDurationMs) ||
      !Number.isFinite(profile?.rendering?.activeStyleAndLayoutDurationMs) ||
      !profile?.gc || !profile?.gc?.bySegment || !profile?.gc?.byWorld ||
      !Number.isFinite(profile?.gc?.activeEntries) || !Number.isFinite(profile?.gc?.activeDurationMs) ||
      !profile?.heap) {
    reasons.push(`profile-${target}-runtime-attribution-incomplete`);
  }
  for (const [field, reason] of [
    ["activeDecodeStarts", "active-decode"],
    ["hotPathImageNodesCreated", "image-node-allocation"],
    ["blankFrameCount", "blank-frame"]
  ]) {
    if ((evidence?.performance?.[field] ?? Infinity) !== 0) {
      reasons.push(`profile-${target}-${reason}`);
    }
  }
  if ((evidence?.performance?.repeatedWorldDecodeSources?.length ?? Infinity) !== 0) {
    reasons.push(`profile-${target}-repeated-decode`);
  }
  const comparison = evidence?.performance?.collectorComparison;
  if (!Number.isFinite(comparison?.intervalDeltaP95Ms) ||
      !Number.isFinite(comparison?.executionDeltaP95Ms) ||
      comparison.intervalDeltaP95Ms > 0.5 || comparison.executionDeltaP95Ms > 0.5) {
    reasons.push(`profile-${target}-collector-overhead-invalid`);
  }
  return reasons;
}

function metric(evidence, path, fallback = 0) {
  let value = evidence;
  for (const part of path) value = value?.[part];
  return Number.isFinite(value) ? value : fallback;
}

function candidate(id, score, evidence, expectedMetric, reversibleExperiment, attribution) {
  return { id, score: Number(score.toFixed(3)), evidence, expectedMetric, reversibleExperiment, attribution };
}

function strongest(entries, metricName) {
  return Object.entries(entries ?? {})
    .sort(([, left], [, right]) => (right?.[metricName] ?? 0) - (left?.[metricName] ?? 0))[0]?.[0] ?? null;
}

function candidatesFor(evidence, target) {
  const profile = evidence.performance.runtimeProfile;
  const frames = Math.max(1, profile.sampledActiveFrames);
  const canvas = profile.canvas.totals;
  const candidates = [];
  const shadowedPaintPerFrame = metric({ canvas }, ["canvas", "shadowedPaintDurationMs"]) / frames;
  const gradientAllocationsPerFrame = metric({ canvas }, ["canvas", "gradientAllocations"]) / frames;
  if (shadowedPaintPerFrame >= 0.25 || gradientAllocationsPerFrame >= 0.5) {
    candidates.push(candidate(
      "canvas-effects",
      shadowedPaintPerFrame + gradientAllocationsPerFrame * 0.05,
      `${canvas.shadowedPaintCalls ?? 0} shadowed paint calls consumed ` +
        `${Number(canvas.shadowedPaintDurationMs ?? 0).toFixed(1)} ms across ${frames} sampled active frames; ` +
        `${canvas.gradientAllocations ?? 0} gradients were allocated`,
      "active WebKit p95 and frames over 33 ms",
      "Cache only the confirmed stable glow, shadow or gradient resources outside active gameplay; retain dynamic timing and alpha.",
      { target, segmentId: strongest(profile.canvas.bySegment, "durationMs"),
        worldId: strongest(profile.canvas.byWorld, "durationMs"),
        redSegments: Object.entries(evidence.performance.activeSegments ?? {})
          .filter(([, metrics]) => metrics.p95Ms > 18 || metrics.p99Ms > 33 || metrics.maxMs > 100)
          .map(([segmentId]) => segmentId) }
    ));
  }
  const rendering = profile.rendering;
  const renderAverage = rendering.activeEntries > 0
    ? rendering.activeRenderDurationMs / rendering.activeEntries : 0;
  if (rendering.support !== "unsupported" && rendering.activeEntries > 0 &&
      (renderAverage >= 20 || rendering.activeStyleAndLayoutDurationMs >= 100)) {
    candidates.push(candidate(
      "compositor-paint",
      renderAverage / 20 + rendering.activeStyleAndLayoutDurationMs / 500,
      `${rendering.activeEntries} active Long Animation Frames attributed ` +
        `${Number(rendering.activeRenderDurationMs).toFixed(1)} ms to rendering and ` +
        `${Number(rendering.activeStyleAndLayoutDurationMs).toFixed(1)} ms to style/layout`,
      "Long Animation Frame render duration and active WebKit p95",
      "Remove or precompose only the highest-cost confirmed composited operation, then repeat the identical trace.",
      { target, segmentId: strongest(rendering.bySegment, "renderDurationMs"),
        worldId: strongest(rendering.byWorld, "renderDurationMs"),
        redSegments: Object.entries(evidence.performance.activeSegments ?? {})
          .filter(([, metrics]) => metrics.p95Ms > 18 || metrics.p99Ms > 33 || metrics.maxMs > 100)
          .map(([segmentId]) => segmentId) }
    ));
  }
  const gc = profile.gc;
  if (gc.support === "supported" && (gc.activeEntries >= 2 || gc.activeDurationMs >= 10)) {
    candidates.push(candidate(
      "gc-pressure",
      gc.activeDurationMs / 10 + gc.activeEntries * 0.1,
      `${gc.activeEntries} active GC entries consumed ${Number(gc.activeDurationMs).toFixed(1)} ms`,
      "active long-frame count and GC duration",
      "Remove the highest-frequency confirmed active allocation without changing gameplay state or asset retention.",
      { target, segmentId: strongest(gc.bySegment, "durationMs"),
        worldId: strongest(gc.byWorld, "durationMs"),
        redSegments: Object.entries(evidence.performance.activeSegments ?? {})
          .filter(([, metrics]) => metrics.p95Ms > 18 || metrics.p99Ms > 33 || metrics.maxMs > 100)
          .map(([segmentId]) => segmentId) }
    ));
  }
  return candidates.filter((item) => item.attribution.segmentId !== null &&
    item.attribution.redSegments.includes(item.attribution.segmentId));
}

export function assessFullStoryRuntimeProfile(localEvidence, productionEvidence) {
  const reasons = [
    ...validateEvidence(localEvidence, "local"),
    ...validateEvidence(productionEvidence, "production")
  ];
  for (const key of CONTROLLED_CONFIGURATION_KEYS) {
    if (localEvidence?.configuration?.[key] !== productionEvidence?.configuration?.[key]) {
      reasons.push(`profile-configuration-mismatch:${key}`);
    }
  }
  const localTrace = JSON.stringify(localEvidence?.correctness?.inputTrace ?? null);
  const productionTrace = JSON.stringify(productionEvidence?.correctness?.inputTrace ?? null);
  if (localTrace === "null" || localTrace !== productionTrace) {
    reasons.push("profile-input-trace-mismatch");
  } else {
    const traceDigest = createHash("sha256").update(localTrace).digest("hex");
    if (traceDigest !== localEvidence?.configuration?.inputTraceDigest ||
        traceDigest !== productionEvidence?.configuration?.inputTraceDigest) {
      reasons.push("profile-input-trace-digest-invalid");
    }
  }
  if (!localEvidence?.provenance?.browserVersion ||
      localEvidence.provenance.browserVersion !== productionEvidence?.provenance?.browserVersion) {
    reasons.push("profile-browser-version-mismatch");
  }
  if (!localEvidence?.provenance?.viewport ||
      localEvidence.provenance.viewport.width !== productionEvidence?.provenance?.viewport?.width ||
      localEvidence.provenance.viewport.height !== productionEvidence?.provenance?.viewport?.height) {
    reasons.push("profile-viewport-mismatch");
  }
  if (!Number.isFinite(localEvidence?.provenance?.deviceScaleFactor) ||
      localEvidence.provenance.deviceScaleFactor !== productionEvidence?.provenance?.deviceScaleFactor) {
    reasons.push("profile-device-scale-factor-mismatch");
  }
  if (!localEvidence?.provenance?.hostDeviceClass ||
      localEvidence.provenance.hostDeviceClass !== productionEvidence?.provenance?.hostDeviceClass) {
    reasons.push("profile-host-device-class-mismatch");
  }
  if (!localEvidence?.provenance?.sourceIdentity ||
      localEvidence.provenance.sourceIdentity !== productionEvidence?.provenance?.sourceIdentity) {
    reasons.push("profile-source-identity-mismatch");
  }
  if (!localEvidence?.provenance?.htmlSha256 ||
      localEvidence.provenance.htmlSha256 !== productionEvidence?.provenance?.htmlSha256) {
    reasons.push("profile-html-identity-mismatch");
  }
  const localAssets = assetFingerprint(localEvidence);
  if (!localAssets || localAssets !== assetFingerprint(productionEvidence)) {
    reasons.push("profile-asset-identity-mismatch");
  }
  if (localEvidence?.correctness?.finalDigest !== productionEvidence?.correctness?.finalDigest) {
    reasons.push("profile-gameplay-digest-mismatch");
  }
  if (reasons.length > 0) {
    return { eligible: false, reasons: [...new Set(reasons)], diagnosis: "invalid-evidence",
      rankedCandidates: [], primaryCandidate: null };
  }

  const localCandidates = new Map(candidatesFor(localEvidence, "local").map((item) => [item.id, item]));
  const rankedCandidates = candidatesFor(productionEvidence, "production")
    .filter((item) => {
      const local = localCandidates.get(item.id);
      return local?.attribution.segmentId === item.attribution.segmentId &&
        local?.attribution.worldId === item.attribution.worldId;
    })
    .map((item) => ({ ...item,
      evidence: `${item.evidence}; local replay corroborated the same ${item.id} hot path` }))
    .sort((a, b) => b.score - a.score);
  const cadenceRuns = {
    local: {
      activeP95Ms: localEvidence.performance.p95Ms,
      emptyRafP95Ms: localEvidence.performance.emptyRafBaseline.p95Ms
    },
    production: {
      activeP95Ms: productionEvidence.performance.p95Ms,
      emptyRafP95Ms: productionEvidence.performance.emptyRafBaseline.p95Ms
    }
  };
  for (const run of Object.values(cadenceRuns)) {
    run.residualMs = Number((run.activeP95Ms - run.emptyRafP95Ms).toFixed(3));
  }
  const cadenceLimited = rankedCandidates.length === 0 &&
    Object.values(cadenceRuns).every((run) => run.residualMs <= 0.5);
  return {
    eligible: true,
    reasons: [],
    diagnosis: cadenceLimited ? "cadence-limited" : rankedCandidates.length > 0 ? "runtime-hot-path" : "inconclusive",
    rankedCandidates,
    primaryCandidate: rankedCandidates[0] ?? null,
    cadence: { runs: cadenceRuns, diagnosticOnly: true }
  };
}

export { RUNTIME_PROFILE_SCHEMA };
