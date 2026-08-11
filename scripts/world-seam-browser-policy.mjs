function normalizeMask(value) {
  return String(value ?? "").replace(/\s+/gu, " ").trim();
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

export function assessChallengeSeamSample(sample) {
  const reasons = [];
  if (!sample.between || sample.direction !== "right-to-left") {
    reasons.push("challenge-seam-state-missing");
  }
  if (sample.overlapPercent < 8 || sample.overlapPercent > 10) {
    reasons.push("seam-overlap-outside-8-10-percent");
  }
  const standard = sample.standardMasks.map(normalizeMask);
  const prefixed = sample.prefixedMasks.map(normalizeMask);
  if (standard.length !== 2 || prefixed.length !== 2 ||
      standard.some((mask) => mask === "" || mask === "none") ||
      prefixed.some((mask) => mask === "" || mask === "none") ||
      standard.some((mask, index) => mask !== prefixed[index])) {
    reasons.push("standard-prefixed-mask-geometry-mismatch");
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
  if (sample.between !== null) reasons.push("story-has-challenge-seam");
  if (sample.overlap !== "0px") reasons.push("story-has-world-overlap");
  if (sample.panelSides.some((side) => side !== null)) {
    reasons.push("story-panels-have-mask-state");
  }
  return reasons;
}
