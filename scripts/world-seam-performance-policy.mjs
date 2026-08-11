import { REQUIRED_WORLD_SEAM_DESTINATIONS } from "./performance-transition-policy.mjs";

export const WORLD_SEAM_DESTINATIONS = REQUIRED_WORLD_SEAM_DESTINATIONS;

const configurationKeys = [
  "scenarioId", "scenarioConfigVersion", "seed", "inputTraceDigest",
  "challengeWorldDurationSeconds", "dpr", "quality", "motion", "audioMode"
];

export function assessWorldSeamPerformanceEvidence(evidence, expected) {
  const reasons = [];
  if (evidence?.schema !== "amso-performance-run-v1") reasons.push("schema-mismatch");
  if (evidence?.capturePassed !== true) reasons.push("capture-failed");
  if (evidence?.target?.kind !== expected.targetKind ||
      evidence?.target?.value !== expected.targetValue) reasons.push("target-provenance-mismatch");
  if (expected.targetKind === "url") {
    let finalMatches = false;
    try {
      const expectedUrl = new URL(expected.targetValue);
      const finalUrl = new URL(evidence?.deployment?.finalUrl);
      const normalizePath = (value) => value.replace(/\/+$/u, "") || "/";
      finalMatches = expectedUrl.origin === finalUrl.origin &&
        normalizePath(expectedUrl.pathname) === normalizePath(finalUrl.pathname);
    } catch {
      finalMatches = false;
    }
    if (!finalMatches || evidence?.deployment?.provenancePassed !== true ||
        evidence?.deployment?.server?.toLowerCase() !== "vercel" ||
        typeof evidence?.deployment?.vercelId !== "string" ||
        evidence.deployment.vercelId.length === 0) {
      reasons.push("vercel-deployment-provenance-failed");
    }
  }
  if (evidence?.environment?.browser?.engine !== expected.engine) {
    reasons.push("browser-engine-mismatch");
  }
  if (!Number.isFinite(evidence?.artifact?.bytes) || evidence.artifact.bytes <= 0 ||
      typeof evidence?.artifact?.sha256 !== "string" || evidence.artifact.sha256.length === 0) {
    reasons.push("artifact-provenance-missing");
  }
  if (evidence?.configuration?.scenarioId !== "world-seam-performance-v1") {
    reasons.push("scenario-mismatch");
  }
  if (evidence?.frames?.sampleCount <= 0) reasons.push("active-frame-samples-missing");
  const windows = Array.isArray(evidence?.transitionWindows) ? evidence.transitionWindows : [];
  for (const [index, worldId] of WORLD_SEAM_DESTINATIONS.entries()) {
    const window = windows[index];
    if (window?.worldId !== worldId) {
      reasons.push(`${worldId}:transition-missing-or-out-of-order`);
      continue;
    }
    if (!(window.frameCount > 0)) reasons.push(`${worldId}:frame-samples-missing`);
    if (window.framesOver33Ms !== 0) reasons.push(`${worldId}:frame-over-33ms`);
    if (window.activeDecodeStarts !== 0) reasons.push(`${worldId}:active-decode-start`);
    const transition = evidence?.panelTransitions?.find((candidate) =>
      candidate.worldId === worldId && candidate.atMs === window.atMs);
    if (transition?.visual?.covered !== true) reasons.push(`${worldId}:blank-frame-risk`);
    if (!Number.isFinite(transition?.visual?.phaseJumpPx) ||
        transition.visual.phaseJumpPx > transition.visual.tolerancePx) {
      reasons.push(`${worldId}:phase-jump`);
    }
    if (!Number.isFinite(transition?.visual?.panelContinuityResidualPx) ||
        transition.visual.panelContinuityResidualPx >
          transition.visual.renderedPixelTolerancePx) {
      reasons.push(`${worldId}:panel-continuity-over-one-rendered-pixel`);
    }
  }
  if (windows.length !== WORLD_SEAM_DESTINATIONS.length) {
    reasons.push("transition-window-count-mismatch");
  }
  if (evidence?.dom?.activeImageNodesAdded !== 0) reasons.push("active-image-node-added");
  if (evidence?.dom?.activeImageNodesCreated !== 0) reasons.push("active-image-node-created");
  for (const key of ["consoleErrors", "externalRequests", "failedResponses"]) {
    if (!Array.isArray(evidence?.diagnostics?.[key]) || evidence.diagnostics[key].length !== 0) {
      reasons.push(`${key}-present`);
    }
  }
  for (const key of ["checkpointsPassed", "coveragePassed", "digestPassed", "replayValid"]) {
    if (evidence?.scenario?.[key] !== true) reasons.push(`scenario-${key}-failed`);
  }
  if (evidence?.scenario?.inputQueueOverflows !== 0) reasons.push("input-queue-overflow");
  return reasons;
}

export function sameWorldSeamScenarioConfiguration(left, right) {
  const leftConfiguration = left?.configuration;
  const rightConfiguration = right?.configuration;
  if (!leftConfiguration || !rightConfiguration) return false;
  if (configurationKeys.some((key) => leftConfiguration[key] !== rightConfiguration[key])) {
    return false;
  }
  return JSON.stringify(leftConfiguration.viewport) === JSON.stringify(rightConfiguration.viewport);
}
