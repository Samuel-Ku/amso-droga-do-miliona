import { REQUIRED_WORLD_SEAM_DESTINATIONS } from "./performance-transition-policy.mjs";

const WORLD_ASSET_PATTERN = /\/world-0[1-7][^/]*\.webp(?:\?|$)/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const REQUIRED_WORLD_NUMBERS = new Set(["01", "02", "03", "04", "05", "06", "07"]);
const MAX_EVIDENCE_AGE_MS = 24 * 60 * 60 * 1_000;

function freshnessReason(evidence, prefix) {
  const capturedAt = Date.parse(evidence?.capturedAt ?? "");
  return Number.isFinite(capturedAt) && capturedAt <= Date.now() &&
    Date.now() - capturedAt <= MAX_EVIDENCE_AGE_MS
    ? []
    : [`${prefix}-evidence-stale-or-undated`];
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right)).map(([key, nested]) => [key, stable(nested)]));
  }
  return value;
}

export function artifactFingerprint(provenance) {
  if (!provenance || !SHA256_PATTERN.test(provenance.sourceIdentity ?? "") ||
      !SHA256_PATTERN.test(provenance.htmlSha256 ?? "") ||
      !Array.isArray(provenance.assetIdentities)) return null;
  const assets = provenance.assetIdentities.map(({ url, status, bytes, sha256 }) => ({
    path: (() => { try { return new URL(url).pathname; } catch { return url; } })(),
    status, bytes, sha256
  })).filter(({ path }) => /\.js$/u.test(path) || /\.css$/u.test(path) ||
    WORLD_ASSET_PATTERN.test(path)).sort((left, right) => left.path.localeCompare(right.path));
  const hasScript = assets.some(({ path, status }) => status === 200 && /\.js$/u.test(path));
  const hasStyle = assets.some(({ path, status }) => status === 200 && /\.css$/u.test(path));
  const worldNumbers = new Set(assets.filter(({ path, status }) => status === 200 &&
    WORLD_ASSET_PATTERN.test(path)).map(({ path }) => path.match(/\/world-(0[1-7])/u)?.[1])
    .filter(Boolean));
  const hasEveryWorld = worldNumbers.size === REQUIRED_WORLD_NUMBERS.size &&
    [...REQUIRED_WORLD_NUMBERS].every((worldNumber) => worldNumbers.has(worldNumber));
  if (!hasScript || !hasStyle || !hasEveryWorld || assets.some(({ status, bytes, sha256 }) =>
    status !== 200 || !Number.isFinite(bytes) || bytes <= 0 || typeof sha256 !== "string" ||
    !SHA256_PATTERN.test(sha256))) return null;
  return JSON.stringify(stable({
    sourceIdentity: provenance.sourceIdentity,
    htmlSha256: provenance.htmlSha256,
    assets: assets.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 }))
  }));
}

function identityReasons(evidence, expectedProvenance, prefix) {
  const expected = artifactFingerprint(expectedProvenance);
  const actual = artifactFingerprint(evidence?.provenance);
  return expected !== null && actual !== null && expected === actual
    ? []
    : [`${prefix}-artifact-mismatch`];
}

function browserFailureCount(evidence) {
  const diagnostics = evidence?.diagnostics;
  return (diagnostics?.consoleErrors?.length ?? Infinity) +
    (diagnostics?.externalRequests?.length ?? Infinity) +
    (diagnostics?.failedResponses?.length ?? Infinity);
}

function frameReasons(evidence, prefix) {
  const frames = evidence?.frames;
  const reasons = [];
  if (!Number.isFinite(frames?.sampleCount) || frames.sampleCount <= 0) reasons.push(`${prefix}-frames-missing`);
  if (!Number.isFinite(frames?.p95Ms) || frames.p95Ms > 18) reasons.push(`${prefix}-p95-over-18ms`);
  if (!Number.isFinite(frames?.p99Ms) || frames.p99Ms > 33) reasons.push(`${prefix}-p99-over-33ms`);
  if (!Number.isFinite(frames?.maxMs) || frames.maxMs > 100 || frames.over100Ms !== 0) {
    reasons.push(`${prefix}-max-over-100ms`);
  }
  return reasons;
}

export function assessSixtySecondEvidence(evidence, expectedProvenance) {
  if (!evidence || typeof evidence !== "object") return ["sixty-second-evidence-missing"];
  const reasons = [];
  if (evidence.schema !== "amso-performance-run-v1" ||
      evidence.configuration?.scenarioId !== "performance-reference-v1") {
    reasons.push("sixty-second-schema-or-scenario-invalid");
  }
  if (evidence.scenario?.session?.durationSeconds < 59.5) reasons.push("sixty-second-duration-incomplete");
  for (const field of ["checkpointsPassed", "coveragePassed", "digestPassed", "replayValid"]) {
    if (evidence.scenario?.[field] !== true) reasons.push(`sixty-second-${field}-invalid`);
  }
  if (evidence.scenario?.inputQueueOverflows !== 0) reasons.push("sixty-second-input-overflow");
  const requiredWorlds = ["order-process", "quality-service"];
  if (!requiredWorlds.every((worldId) => evidence.panelTransitions?.some((transition) =>
    transition.worldId === worldId && transition.presentationReady === true && transition.hidden === false))) {
    reasons.push("sixty-second-world-transitions-incomplete");
  }
  if ((evidence.decodeTimings ?? []).some(({ active }) => active === true)) reasons.push("sixty-second-active-decode");
  if (evidence.dom?.activeImageNodesAdded !== 0 || evidence.dom?.activeImageNodesCreated !== 0) {
    reasons.push("sixty-second-active-image-node");
  }
  if (browserFailureCount(evidence) !== 0) reasons.push("sixty-second-browser-errors");
  reasons.push(...frameReasons(evidence, "sixty-second"));
  reasons.push(...freshnessReason(evidence, "sixty-second"));
  reasons.push(...identityReasons(evidence, expectedProvenance, "sixty-second"));
  return reasons;
}

function orderedCycles(transitions) {
  const cycles = [];
  let destinationIndex = 0;
  let current = [];
  for (const transition of transitions ?? []) {
    if (transition.worldId !== REQUIRED_WORLD_SEAM_DESTINATIONS[destinationIndex]) continue;
    current.push(transition);
    destinationIndex += 1;
    if (destinationIndex !== REQUIRED_WORLD_SEAM_DESTINATIONS.length) continue;
    cycles.push(current);
    current = [];
    destinationIndex = 0;
    if (cycles.length === 4) break;
  }
  return cycles;
}

function memoryAt(timeline, atMs) {
  return [...(timeline ?? [])].filter((sample) => sample.atMs <= atMs &&
    Number.isFinite(sample.usedJsHeapSize)).at(-1)?.usedJsHeapSize ?? null;
}

function percentile(values, quantile) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)];
}

function cycleFrameSummary(frameTimeline, cycle) {
  const values = (frameTimeline ?? []).filter(({ atMs }) =>
    atMs >= cycle.startedAtMs && atMs <= cycle.completedAtMs).map(({ intervalMs }) => intervalMs);
  return {
    sampleCount: values.length,
    p95Ms: percentile(values, 0.95),
    p99Ms: percentile(values, 0.99),
    maxMs: values.length === 0 ? null : Math.max(...values),
    over33Ms: values.filter((value) => value > 33).length,
    over100Ms: values.filter((value) => value > 100).length
  };
}

export function buildFourCycleQualification(evidence, expectedProvenance) {
  const reasons = [];
  const incompleteReasons = [];
  if (!evidence || evidence.schema !== "amso-performance-run-v1" ||
      evidence.configuration?.scenarioId !== "four-cycle-memory-v1") {
    reasons.push("four-cycle-schema-or-scenario-invalid");
  }
  if (evidence?.configuration?.requestedCycles !== 4 ||
      evidence?.cycleResults?.length !== 4 || evidence.cycleResults.some(({ scenarioValidation }) =>
        scenarioValidation?.passed !== true)) {
    reasons.push("four-cycle-scenario-invalid");
  }
  const cycles = orderedCycles(evidence?.panelTransitions);
  if (cycles.length !== 4 || cycles.some((cycle) => cycle.length !== 7)) {
    reasons.push("four-cycle-route-incomplete");
  }
  if (cycles.some((cycle) => cycle.some((transition) => transition.presentationReady !== true ||
      transition.hidden !== false || transition.visual?.covered !== true ||
      !Number.isFinite(transition.visual?.panelContinuityResidualPx) ||
      transition.visual.panelContinuityResidualPx > transition.visual.renderedPixelTolerancePx))) {
    reasons.push("four-cycle-visual-transition-invalid");
  }
  const completedDecodes = (evidence?.decodeTimings ?? []).filter(({ status, source }) =>
    status === "fulfilled" && typeof source === "string");
  const seenDecodeRoles = new Set();
  let repeatedDecodeCount = 0;
  for (const decode of completedDecodes) {
    const panelRole = decode.panelRole ?? decode.panel ?? "asset";
    const key = `${panelRole}\u0000${decode.source}`;
    if (seenDecodeRoles.has(key)) repeatedDecodeCount += 1;
    else seenDecodeRoles.add(key);
  }
  if (repeatedDecodeCount !== 0) reasons.push("four-cycle-repeated-decode");
  if ((evidence?.decodeTimings ?? []).some(({ active }) => active === true)) reasons.push("four-cycle-active-decode");
  if (evidence?.dom?.activeImageNodesAdded !== 0 || evidence?.dom?.activeImageNodesCreated !== 0) {
    reasons.push("four-cycle-active-image-node");
  }
  if (browserFailureCount(evidence) !== 0) reasons.push("four-cycle-browser-errors");
  const lifecycleObservations = evidence?.lifecycleObservations;
  const observedInOrder = (name, first, second) => {
    const values = lifecycleObservations?.[name] ?? [];
    const firstIndex = values.findIndex(first);
    return firstIndex >= 0 && values.findIndex(second, firstIndex + 1) > firstIndex;
  };
  const observedLifecycle = {
    visibilityResumePassed: observedInOrder("visibility", ({ hidden }) => hidden === true,
      ({ hidden }) => hidden === false),
    orientationPassed: observedInOrder("orientation", ({ portrait }) => portrait === true,
      ({ portrait }) => portrait === false),
    fullscreenPassed: observedInOrder("fullscreen", ({ entered }) => entered === true,
      ({ entered }) => entered === false)
  };
  if (evidence?.lifecycleChecks?.resizePassed !== true) {
    reasons.push("four-cycle-lifecycle-failed:resizePassed");
  }
  for (const [checkName, observationPassed] of Object.entries(observedLifecycle)) {
    const observationName = checkName === "visibilityResumePassed" ? "visibility"
      : checkName === "orientationPassed" ? "orientation" : "fullscreen";
    if (!observationPassed) {
      incompleteReasons.push(`four-cycle-lifecycle-observation-incomplete:${observationName}`);
    } else if (evidence?.lifecycleChecks?.[checkName] !== true) {
      reasons.push(`four-cycle-lifecycle-failed:${checkName}`);
    }
  }
  reasons.push(...frameReasons(evidence, "four-cycle"));
  const cycleFrames = (evidence?.cycleResults ?? []).map((cycle) =>
    cycleFrameSummary(evidence?.frameTimeline, cycle));
  cycleFrames.forEach((summary, index) => {
    if (summary.sampleCount <= 0 || summary.p95Ms === null || summary.p95Ms > 18 ||
        summary.p99Ms === null || summary.p99Ms > 33 || summary.maxMs === null ||
        summary.maxMs > 100 || summary.over100Ms !== 0) {
      reasons.push(`four-cycle-frame-budget-invalid:${index + 1}`);
    }
  });
  const baselineFrames = cycleFrames[0];
  cycleFrames.slice(1).forEach((summary, offset) => {
    if (!baselineFrames || summary.sampleCount <= 0 ||
        summary.p95Ms > baselineFrames.p95Ms + 2 ||
        summary.p99Ms > baselineFrames.p99Ms + 4 ||
        summary.maxMs > baselineFrames.maxMs + 8 ||
        summary.over33Ms > baselineFrames.over33Ms ||
        summary.over100Ms > baselineFrames.over100Ms) {
      reasons.push(`four-cycle-frame-trend-regressed:${offset + 2}`);
    }
  });
  reasons.push(...freshnessReason(evidence, "four-cycle"));
  reasons.push(...identityReasons(evidence, expectedProvenance, "four-cycle"));
  const cycleMemoryBytes = cycles.map((cycle) => memoryAt(evidence?.memory?.timeline,
    cycle.at(-1)?.atMs ?? Infinity));
  const auxiliaryMaximumMb = cycleMemoryBytes.some((value) => value === null) ? null
    : Math.max(...cycleMemoryBytes) / 1024 / 1024;
  const auxiliaryGrowthMb = cycleMemoryBytes.length < 4 || cycleMemoryBytes.some((value) => value === null)
    ? null : (cycleMemoryBytes[3] - cycleMemoryBytes[0]) / 1024 / 1024;
  if (auxiliaryGrowthMb !== null && auxiliaryGrowthMb > 10) reasons.push("four-cycle-growth-over-10mb");
  const processMemoryAvailable = evidence?.memory?.available === true &&
    Number.isFinite(evidence.memory.maximumMb);
  if (processMemoryAvailable && evidence.memory.maximumMb > 220) reasons.push("four-cycle-memory-over-220mb");
  if (!processMemoryAvailable) incompleteReasons.push("physical-process-memory-evidence-unavailable");
  const status = reasons.length > 0 ? "failed" : incompleteReasons.length > 0 ? "incomplete" : "passed";
  return {
    schema: "amso-four-cycle-memory-v1",
    capturedAt: evidence?.capturedAt ?? null,
    provenance: evidence?.provenance ?? null,
    cycles: cycles.map((cycle, index) => ({
      index: index + 1,
      destinations: cycle.map(({ worldId }) => worldId),
      completedAtMs: cycle.at(-1)?.atMs ?? null,
      auxiliaryJsHeapMb: cycleMemoryBytes[index] === null ? null : cycleMemoryBytes[index] / 1024 / 1024,
      frames: cycleFrames[index] ?? null
    })),
    memory: { maximumMb: evidence?.memory?.maximumMb ?? null,
      auxiliaryMaximumMb, growthCycleOneToFourMb: auxiliaryGrowthMb },
    repeatedDecodeCount,
    lifecycleChecks: evidence?.lifecycleChecks ?? {},
    releaseGate: { status, reasons: [...reasons, ...incompleteReasons] }
  };
}

function assessColdStart(evidence, expectedProvenance) {
  if (!evidence || typeof evidence !== "object") return ["cold-start-evidence-missing"];
  const reasons = [];
  if (evidence.schema !== "amso-cold-start-qualification-v1") reasons.push("cold-start-schema-invalid");
  if (evidence.comparable !== true) reasons.push("cold-start-comparison-invalid");
  reasons.push(...freshnessReason(evidence, "cold-start"));
  for (const field of ["captureProcessesPassed", "startBudgetsPassed",
    "startupDecodeOrderPassed", "sequentialWarmupPassed",
    "audioGestureLifecyclePassed", "diagnosticsPassed"] ) {
    if (evidence.automatedChecks?.[field] !== true) reasons.push(`cold-start-${field}-invalid`);
  }
  reasons.push(...identityReasons(evidence, expectedProvenance, "cold-start"));
  if (evidence.releaseGate?.status === "fail") {
    reasons.push("cold-start-release-gate-failed");
    for (const reason of evidence.releaseGate?.reasons ?? []) reasons.push(`cold-start:${reason}`);
  } else if (evidence.releaseGate?.status === "incomplete") {
    reasons.push("cold-start-release-evidence-incomplete");
    for (const reason of evidence.releaseGate?.reasons ?? []) reasons.push(`cold-start-incomplete:${reason}`);
  } else if (evidence.releaseGate?.status !== "pass" ||
      (evidence.releaseGate?.reasons?.length ?? Infinity) !== 0) {
    reasons.push("cold-start-release-gate-invalid");
  }
  return reasons;
}

export function aggregateRuntimeReadiness({ expectedProvenance, sixtySecond, coldStart, fourCycle,
  captureProcesses }) {
  const captureReasons = !Array.isArray(captureProcesses)
    ? ["capture-process-evidence-missing"]
    : captureProcesses.flatMap(({ name, status, signal, freshOutput }) => [
        ...(!freshOutput ? [`capture-evidence-missing:${name}`] : []),
        ...(status !== 0 || signal !== null ? [`capture-process-failed:${name}`] : [])
      ]);
  const gates = {
    captureProcesses: captureReasons,
    sixtySecond: assessSixtySecondEvidence(sixtySecond, expectedProvenance),
    coldStart: assessColdStart(coldStart, expectedProvenance),
    fourCycle: !fourCycle ? ["four-cycle-evidence-missing"] : [
      ...identityReasons(fourCycle, expectedProvenance, "four-cycle"),
      ...(fourCycle.releaseGate?.reasons ?? [])
    ]
  };
  const incompleteReason = (reason) => reason.endsWith("evidence-missing") ||
    reason === "capture-process-evidence-missing" || reason.startsWith("capture-evidence-missing:") ||
    reason === "physical-process-memory-evidence-unavailable" ||
    reason === "cold-start-release-evidence-incomplete" ||
    reason.startsWith("cold-start-incomplete:");
  const failed = Object.values(gates).flat().filter((reason) => !incompleteReason(reason));
  const incomplete = Object.values(gates).flat().some(incompleteReason) ||
    fourCycle?.releaseGate?.status === "incomplete";
  return { schema: "amso-runtime-readiness-v1", provenance: expectedProvenance,
    status: failed.length > 0 ? "failed" : incomplete ? "incomplete" : "passed", gates };
}
