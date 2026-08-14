function normalizeMask(value) {
  return String(value ?? "").replace(/\s+/gu, " ").trim();
}

function isNoMask(value) {
  const normalized = normalizeMask(value);
  return normalized === "" || normalized === "none";
}

function stageCovered(panelRects, stageRect) {
  const ordered = [...panelRects].sort((left, right) => left.left - right.left);
  if (ordered.length !== 2) return false;
  return ordered[0].left <= stageRect.left + 1 &&
    ordered[0].right >= ordered[1].left - 1 &&
    ordered[1].right >= stageRect.right - 1;
}

function visibleStageExposureWithinCanonicalInsets(panelRects, paintedStageRect, visibleStageRect) {
  const leftmost = Math.min(...panelRects.map(({ left }) => left));
  const rightmost = Math.max(...panelRects.map(({ right }) => right));
  const exposedLeft = Math.max(0, leftmost - visibleStageRect.left);
  const exposedRight = Math.max(0, visibleStageRect.right - rightmost);
  const canonicalLeftInset = Math.max(0, paintedStageRect.left - visibleStageRect.left);
  const canonicalRightInset = Math.max(0, visibleStageRect.right - paintedStageRect.right);
  return exposedLeft <= canonicalLeftInset + 1 && exposedRight <= canonicalRightInset + 1;
}

export function assessChallengeSeamSample(sample, { requireVelocity = true } = {}) {
  const reasons = [];
  if (String(sample.overlap ?? "").trim() !== "") reasons.push("world-overlap-present");
  const standard = Array.isArray(sample.standardMasks) ? sample.standardMasks : [];
  const prefixed = Array.isArray(sample.prefixedMasks) ? sample.prefixedMasks : [];
  if (standard.length !== 2 || prefixed.length !== 2 ||
      standard.some((mask) => !isNoMask(mask)) ||
      prefixed.some((mask) => !isNoMask(mask)) ||
      sample.panelSides.some((side) => side !== null)) {
    reasons.push("world-mask-state-present");
  }
  if (sample.panelWorlds.length !== 2 || sample.panelWorlds.some((world) => world === null) ||
      sample.panelWorlds[0] === sample.panelWorlds[1]) {
    reasons.push("world-pair-missing");
  }
  const narrowestPanelWidth = Math.min(...sample.panelRects.map(({ width }) => width));
  const oneRenderedPixelPercent = Number.isFinite(narrowestPanelWidth) && narrowestPanelWidth > 0
    ? 100 / narrowestPanelWidth
    : 0;
  if (sample.panelXPercent.length !== 2 ||
      Math.abs(sample.panelXPercent[1] - sample.panelXPercent[0] - 100) >
        oneRenderedPixelPercent) {
    reasons.push("panel-spacing-not-adjacent");
  }
  if (requireVelocity && (!Number.isFinite(sample.velocityRatio) ||
      sample.velocityRatio < 0.95 || sample.velocityRatio > 1.05)) {
    reasons.push("visual-velocity-outside-0.95-1.05");
  }
  if (!Number.isFinite(sample.phaseResidualPx) ||
      !Number.isFinite(sample.renderedPixelTolerancePx) ||
      sample.phaseResidualPx > sample.renderedPixelTolerancePx) {
    reasons.push("visual-phase-over-one-rendered-pixel");
  }
  if (sample.panelOpacity.length !== 2 ||
      Math.abs(sample.panelOpacity[0] - sample.panelOpacity[1]) > 0.001) {
    reasons.push("panel-opacity-diverged");
  }
  if (!stageCovered(sample.panelRects, sample.paintedStageRect)) {
    reasons.push("stage-not-fully-covered");
  }
  if (!visibleStageExposureWithinCanonicalInsets(
    sample.panelRects,
    sample.paintedStageRect,
    sample.visibleStageRect
  )) reasons.push("visible-stage-exposure-exceeds-canonical-insets");
  return reasons;
}

export function assessStorySeamSample(sample) {
  const reasons = [];
  if (sample.phase !== "story") reasons.push("story-phase-missing");
  if (String(sample.overlap ?? "").trim() !== "") reasons.push("story-has-world-overlap");
  if (sample.panelSides.some((side) => side !== null) ||
      sample.standardMasks.some((mask) => !isNoMask(mask)) ||
      sample.prefixedMasks.some((mask) => !isNoMask(mask))) {
    reasons.push("story-panels-have-mask-state");
  }
  return reasons;
}
