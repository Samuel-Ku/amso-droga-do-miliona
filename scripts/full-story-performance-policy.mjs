const REQUIRED_CHAPTERS = [
  "first-package", "order-backlog", "quality-process", "client-growth",
  "order-scale", "million-threshold"
];
export const APPROVED_FULL_STORY_SCENARIO_ID = "full-story-reference-v1";
export const APPROVED_FULL_STORY_DIGEST = "82afa27e9cf5071449966009bd54e5018cbfa6b8a397608fd3ae32f6f2c46bb9";
export const APPROVED_FULL_STORY_ROUTE = Object.freeze([
  "guided-parcel-arc", "guided-low-stack", "guided-scanner-gate", "guided-jump-slide",
  "backlog-stack", "backlog-beam", "backlog-pallet", "backlog-curtain", "backlog-trolley",
  "backlog-scanner", "backlog-crate", "backlog-conveyor",
  "quality-start", "quality-scan", "quality-seal", "quality-start", "quality-scan", "quality-seal",
  "quality-start", "quality-scan", "quality-seal", "quality-start", "quality-scan", "quality-seal",
  "client-first-laptop", "client-first-workspace", "client-growing-team", "client-growing-routine",
  "client-established-office", "client-established-continuity",
  "scale-intake", "scale-intake-scan", "scale-intake-stack", "scale-routing-sort",
  "scale-routing-lift", "scale-routing-check", "scale-dispatch-load", "scale-dispatch-gate",
  "scale-dispatch-flow", "million-single-jump", "million-single-slide", "million-double-jump",
  "million-jump-slide", "million-slide-jump", "million-three-a", "million-three-b"
]);
const APPROVED_CHECKPOINTS = Object.freeze([
  ["first-package", "epoch_1.first_package", "first-mile", 11, 4],
  ["order-backlog", "epoch_1.order_backlog", "order-process", 31, 8],
  ["quality-process", "epoch_2.quality_process", "quality-service", 87, 12],
  ["client-growth", "epoch_3.client_growth", "client-paths", 106, 6],
  ["order-scale", "epoch_4.order_scale", "scale-logistics", 132, 9],
  ["million-threshold", "epoch_5.million_threshold", "million-approach", 160, 7]
]);
const CROSS_BROWSER_SIMULATION_STEP_TOLERANCE = 1;
const REQUIRED_STORY_SCENES = [
  "story.first_package", "story.order_backlog", "story.quality_promise",
  "client.business_start", "client.business_growth", "story.matching_result",
  "story.scale", "story.million_approach", "challenge.million_wave",
  "story.million_finale", "story.challenge_handoff"
];
const REQUIRED_COUNTDOWN_TRACE = [
  "prologue:3", "prologue:2", "prologue:1", "epoch_1:3", "epoch_1:2", "epoch_1:1",
  "epoch_2:3", "epoch_2:2", "epoch_2:1", "epoch_3:3", "epoch_3:2", "epoch_3:1",
  "epoch_3:3", "epoch_3:2", "epoch_3:1", "epoch_5:3", "epoch_5:2", "epoch_5:1",
  "finale:3", "finale:2", "finale:1"
];

export function assessFullStoryEvidence(evidence, { production = false } = {}) {
  const reasons = [];
  const p95BudgetMs = 18;
  if (evidence?.schemaVersion !== "full-story-reference-evidence-v1") reasons.push("evidence-schema-invalid");
  if (evidence?.configuration?.scenarioId !== APPROVED_FULL_STORY_SCENARIO_ID) reasons.push("scenario-id-invalid");
  if (!evidence?.correctness?.completed) reasons.push("story-incomplete");
  if (!evidence?.correctness?.resultVisible) reasons.push("story-result-not-visible");
  if (evidence?.configuration?.audioMode !== "enabled" ||
      evidence?.configuration?.quality !== "force-full" || evidence?.configuration?.motion !== "full" ||
      evidence?.configuration?.requestedDpr !== 1) reasons.push("release-configuration-invalid");
  if (evidence?.correctness?.failure) reasons.push(`correctness:${evidence.correctness.failure}`);
  for (const chapter of REQUIRED_CHAPTERS) {
    if (!evidence?.correctness?.seenMicrolevels?.includes(chapter)) reasons.push(`chapter-missing:${chapter}`);
  }
  if (evidence?.correctness?.waveResults?.some((result) => result.attempts !== 1 || !result.passed)) {
    reasons.push("strict-wave-route-failed");
  }
  const expectedRoute = APPROVED_FULL_STORY_ROUTE;
  const actualRoute = evidence?.correctness?.waveResults?.map((result) => result.waveId) ?? [];
  if (expectedRoute.join("|") !== evidence?.correctness?.manifest?.routeWaveIds?.join("|") ||
      expectedRoute.join("|") !== actualRoute.join("|")) {
    reasons.push("authored-wave-route-mismatch");
  }
  const expectedCheckpoints = APPROVED_CHECKPOINTS.map(([microlevelId, segmentId, worldId, minimumCumulativePackages]) =>
    ({ microlevelId, segmentId, worldId, minimumCumulativePackages }));
  const actualCheckpoints = evidence?.correctness?.checkpoints ?? [];
  if (expectedCheckpoints.length === 0 || actualCheckpoints.length !== expectedCheckpoints.length) {
    reasons.push("chapter-checkpoint-count-mismatch");
  } else {
    let previousPackages = -1;
    expectedCheckpoints.forEach((expected, index) => {
      const actual = actualCheckpoints[index];
      if (actual?.microlevelId !== expected.microlevelId || actual?.worldId !== expected.worldId ||
          actual?.segmentId !== expected.segmentId) {
        reasons.push(`chapter-checkpoint-mismatch:${expected.microlevelId}`);
      }
      const expectedWaveCount = APPROVED_CHECKPOINTS[index]?.[4];
      if ((actual?.completedWaves ?? -1) !== expectedWaveCount) {
        reasons.push(`chapter-wave-count-invalid:${expected.microlevelId}`);
      }
      if ((actual?.packagesCollected ?? -1) < expected.minimumCumulativePackages ||
          (actual?.packagesCollected ?? -1) <= previousPackages) {
        reasons.push(`chapter-packages-invalid:${expected.microlevelId}`);
      }
      previousPackages = actual?.packagesCollected ?? previousPackages;
    });
  }
  if (!evidence?.correctness?.finalDigest) reasons.push("final-digest-missing");
  if (evidence?.correctness?.manifest?.expectedFinalDigest !== APPROVED_FULL_STORY_DIGEST ||
      evidence?.correctness?.finalDigest !== APPROVED_FULL_STORY_DIGEST) {
    reasons.push("final-digest-mismatch");
  }
  if ((evidence?.correctness?.checkpoints?.at(-1)?.millionCounterValue ?? 0) !== 1_000_000) {
    reasons.push("million-target-not-reached");
  }
  if (evidence?.correctness?.finalPresentation?.worldId !== "million-finale" ||
      evidence?.correctness?.finalPresentation?.ready !== true ||
      evidence?.correctness?.finalPresentation?.hidden === true ||
      (evidence?.correctness?.finalPresentation?.naturalWidth ?? 0) <= 0) {
    reasons.push("finale-world-presentation-invalid");
  }
  if ((evidence?.correctness?.finalPresentation?.readyDelayMs ?? Infinity) > 34) {
    reasons.push("finale-first-frame-not-ready");
  }
  if ((evidence?.correctness?.storyScenes ?? []).join("|") !== REQUIRED_STORY_SCENES.join("|")) {
    reasons.push("story-scene-trace-incomplete");
  }
  const countdownTrace = evidence?.correctness?.countdownTrace ?? [];
  if (countdownTrace.map((entry) => `${entry.sectionId}:${entry.value}`).join("|") !==
      REQUIRED_COUNTDOWN_TRACE.join("|")) {
    reasons.push("countdown-trace-incomplete");
  }
  const performance = evidence?.performance ?? {};
  if ((performance.activeFrameCount ?? 0) === 0) reasons.push("active-frames-missing");
  if ((performance.p95Ms ?? Infinity) > p95BudgetMs) reasons.push(`active-p95-over-${p95BudgetMs}ms`);
  if ((performance.p99Ms ?? Infinity) > 33) reasons.push("active-p99-over-33ms");
  if ((performance.maxMs ?? Infinity) > 100) reasons.push("active-max-over-100ms");
  if ((performance.activeDecodeStarts ?? Infinity) !== 0) reasons.push("active-decode-started");
  if ((performance.hotPathImageNodesCreated ?? Infinity) !== 0) reasons.push("hot-path-image-node-created");
  if ((performance.blankFrameCount ?? Infinity) !== 0) reasons.push("blank-frame-detected");
  if ((performance.repeatedWorldDecodeSources?.length ?? Infinity) !== 0) reasons.push("repeated-world-decode");
  if ((performance.collectorComparison?.deltaP95Ms ?? Infinity) > 0.5) {
    reasons.push("collector-ab-overhead-too-high");
  }
  if (!performance.phaseAggregates?.["active-gameplay"] || !performance.phaseAggregates?.["story-scene"] ||
      !performance.phaseAggregates?.countdown || !performance.phaseAggregates?.result) {
    reasons.push("phase-aggregates-incomplete");
  }
  for (const checkpoint of expectedCheckpoints) {
    const segment = performance.activeSegments?.[checkpoint.segmentId];
    if (!segment || segment.frameCount <= 0 || segment.p95Ms > p95BudgetMs || segment.p99Ms > 33 || segment.maxMs > 100) {
      reasons.push(`segment-performance-invalid:${checkpoint.segmentId}`);
    }
  }
  if (!Array.isArray(performance.longTasks) || !Array.isArray(performance.longAnimationFrames) ||
      !Array.isArray(performance.transitions)) reasons.push("performance-timeline-incomplete");
  const minimumTransitions = Math.max(0, expectedCheckpoints.length - 1);
  if (!Array.isArray(performance.transitionWindows) || performance.transitionWindows.length < minimumTransitions ||
      performance.transitionWindows.some((transition) =>
      transition.presentationReady !== true || transition.hidden === true || transition.blankFrames !== 0 ||
        (transition.phase === "active-gameplay" &&
          (!Number.isFinite(transition.phaseResidualPx) || transition.phaseResidualPx > 1)))) {
    reasons.push("world-transition-invalid");
  }
  if ((evidence?.browserFailures?.length ?? 0) > 0) reasons.push("browser-failures-present");
  if (typeof evidence?.provenance?.sourceIdentity !== "string" ||
      evidence.provenance.sourceIdentity.length !== 64 ||
      !Array.isArray(evidence?.provenance?.assetIdentities) ||
      evidence.provenance.assetIdentities.length === 0) reasons.push("artifact-provenance-incomplete");
  if (production) {
    if (new URL(evidence?.provenance?.finalUrl ?? "https://invalid.invalid").origin !== "https://game.amso.pl") {
      reasons.push("production-origin-invalid");
    }
    if (!evidence?.provenance?.vercelId) reasons.push("vercel-provenance-missing");
  }
  return reasons;
}

function artifactIdentity(provenance) {
  if (!provenance?.sourceIdentity || !provenance?.htmlSha256 || !Array.isArray(provenance.assetIdentities)) return null;
  return JSON.stringify({
    sourceIdentity: provenance.sourceIdentity,
    htmlSha256: provenance.htmlSha256,
    assets: provenance.assetIdentities.map(({ bytes, sha256 }) => ({ bytes, sha256 }))
      .sort((a, b) => a.sha256.localeCompare(b.sha256))
  });
}

function requireMatchingArtifact(evidence, expectedIdentity, prefix) {
  const actual = artifactIdentity(evidence?.provenance ?? evidence?.artifactIdentity);
  if (expectedIdentity === null || actual === null || actual !== expectedIdentity) return [`${prefix}-artifact-mismatch`];
  return [];
}

export function assessSixtySecondPrerequisite(evidence, expectedIdentity = null) {
  const reasons = [];
  if (!evidence || typeof evidence !== "object") return ["evidence-missing"];
  for (const field of ["configurationPassed", "checkpointsPassed", "digestPassed", "requiredCoveragePassed",
    "visualRegressionPassed", "worldTransitionsPassed", "vercelDeploymentPassed"]) {
    if (evidence[field] !== true) reasons.push(`sixty-second-${field}-invalid`);
  }
  if (evidence.consoleErrorCount !== 0) reasons.push("sixty-second-browser-errors");
  reasons.push(...requireMatchingArtifact(evidence, expectedIdentity, "sixty-second"));
  return reasons;
}

export function assessQualificationPrerequisite(evidence, expectedSchema, expectedIdentity = null) {
  if (!evidence || typeof evidence !== "object") return ["evidence-missing"];
  const reasons = [];
  if (expectedSchema && evidence.schema !== expectedSchema) reasons.push("qualification-schema-invalid");
  if (!["pass", "passed"].includes(evidence.releaseGate?.status)) reasons.push("qualification-release-gate-not-passed");
  if (!Array.isArray(evidence.releaseGate?.reasons) || evidence.releaseGate.reasons.length !== 0) {
    reasons.push("qualification-release-reasons-present");
  }
  reasons.push(...requireMatchingArtifact(evidence, expectedIdentity, "qualification"));
  return reasons;
}

export function assessFourCyclePrerequisite(evidence, expectedIdentity = null) {
  if (!evidence || typeof evidence !== "object") return ["evidence-missing"];
  const reasons = assessQualificationPrerequisite(evidence, "amso-four-cycle-memory-v1", expectedIdentity);
  if ((evidence?.cycles?.length ?? 0) < 4) reasons.push("four-cycle-count-invalid");
  if ((evidence?.memory?.maximumMb ?? Infinity) > 220) reasons.push("four-cycle-memory-over-220mb");
  if ((evidence?.memory?.growthCycleOneToFourMb ?? Infinity) > 10) reasons.push("four-cycle-growth-over-10mb");
  if ((evidence?.repeatedDecodeCount ?? Infinity) !== 0) reasons.push("four-cycle-repeated-decode");
  return reasons;
}

export function aggregateFullStoryReleaseGate({ localChromium, localWebKit, productionChromium, productionWebKit, physical, prerequisites = {} }) {
  const expectedIdentity = artifactIdentity(localChromium?.provenance);
  const gates = {
    localChromium: localChromium ? assessFullStoryEvidence(localChromium) : ["evidence-missing"],
    localWebKit: localWebKit ? assessFullStoryEvidence(localWebKit) : ["evidence-missing"],
    productionChromium: productionChromium ? assessFullStoryEvidence(productionChromium, { production: true }) : ["evidence-missing"],
    productionWebKit: productionWebKit ? assessFullStoryEvidence(productionWebKit, { production: true }) : ["evidence-missing"],
    physical: physical?.passed === true && physical?.macBookM1ProChrome?.passed === true &&
      physical?.baselineAndroid?.passed === true && physical?.physicalIphoneSafari?.passed === true &&
      requireMatchingArtifact(physical, expectedIdentity, "physical").length === 0 ? [] : ["physical-device-gates-incomplete"],
    vercelBuildAndBrowser: prerequisites.vercelBuildAndBrowser === true ? [] : ["vercel-build-browser-gate-incomplete"],
    sixtySecondReference: assessSixtySecondPrerequisite(prerequisites.sixtySecondEvidence, expectedIdentity),
    coldStart: assessQualificationPrerequisite(prerequisites.coldStartEvidence, "amso-cold-start-qualification-v1", expectedIdentity),
    fourCycleMemory: assessFourCyclePrerequisite(prerequisites.fourCycleEvidence, expectedIdentity),
    beforeAfterComparison: prerequisites.beforeAfterComparison === true ? [] : ["before-after-comparison-incomplete"],
    currentArtifact: prerequisites.currentArtifact === true ? [] :
      [prerequisites.currentArtifact === false ? "current-artifact-evidence-stale" : "current-artifact-evidence-incomplete"]
  };
  const digests = [localChromium, localWebKit, productionChromium, productionWebKit]
    .filter(Boolean).map((item) => item.correctness?.finalDigest).filter(Boolean);
  if (new Set(digests).size > 1) gates.canonicalDigest = ["cross-browser-digest-mismatch"];
  else gates.canonicalDigest = digests.length >= 2 ? [] : ["cross-browser-digest-incomplete"];
  const artifactFingerprints = [localChromium, localWebKit, productionChromium, productionWebKit]
    .filter(Boolean)
    .map((item) => (item.provenance?.assetIdentities ?? []).map((asset) => `${asset.bytes}:${asset.sha256}`).sort().join("|"));
  if (new Set(artifactFingerprints).size > 1) gates.artifactIdentity = ["cross-target-artifact-mismatch"];
  else gates.artifactIdentity = artifactFingerprints.length === 4 ? [] : ["artifact-identity-incomplete"];
  const sourceIdentities = [localChromium, localWebKit, productionChromium, productionWebKit]
    .filter(Boolean).map((item) => item.provenance?.sourceIdentity).filter(Boolean);
  if (new Set(sourceIdentities).size > 1) gates.sourceIdentity = ["cross-target-source-mismatch"];
  else gates.sourceIdentity = sourceIdentities.length === 4 ? [] : ["source-identity-incomplete"];
  const htmlIdentities = [localChromium, localWebKit, productionChromium, productionWebKit]
    .filter(Boolean).map((item) => item.provenance?.htmlSha256).filter(Boolean);
  if (new Set(htmlIdentities).size > 1) gates.htmlIdentity = ["cross-target-html-mismatch"];
  else gates.htmlIdentity = htmlIdentities.length === 4 ? [] : ["html-identity-incomplete"];
  const comparableEvidence = [localChromium, localWebKit, productionChromium, productionWebKit].filter(Boolean);
  if (comparableEvidence.length >= 2) {
    const baseline = comparableEvidence[0].correctness?.checkpoints ?? [];
    gates.canonicalGameplay = comparableEvidence.slice(1).flatMap((candidate) => {
      const checkpoints = candidate.correctness?.checkpoints ?? [];
      if (checkpoints.length !== baseline.length) return ["cross-browser-checkpoint-count-mismatch"];
      return baseline.flatMap((expected, index) => {
        const actual = checkpoints[index];
        const expectedState = expected?.canonicalState;
        const actualState = actual?.canonicalState;
        if (expected?.microlevelId !== actual?.microlevelId || !expectedState || !actualState) {
          return [`cross-browser-checkpoint-missing:${expected?.microlevelId ?? index}`];
        }
        if (expectedState.worldIndex !== actualState.worldIndex ||
            expectedState.collisionCount !== actualState.collisionCount ||
            expectedState.pickupCount !== actualState.pickupCount ||
            expectedState.score !== actualState.score || expectedState.distance !== actualState.distance ||
            JSON.stringify(expectedState.rngState) !== JSON.stringify(actualState.rngState)) {
          return [`cross-browser-gameplay-state-mismatch:${expected.microlevelId}`];
        }
        if (Math.abs(expectedState.simulationStep - actualState.simulationStep) >
            CROSS_BROWSER_SIMULATION_STEP_TOLERANCE) {
          return [`cross-browser-simulation-step-mismatch:${expected.microlevelId}`];
        }
        return [];
      });
    });
  } else gates.canonicalGameplay = ["cross-browser-gameplay-incomplete"];
  const automaticMissing = Object.entries(gates).some(([key, reasons]) => key !== "physical" &&
    reasons.some((reason) => reason.includes("incomplete") || reason === "evidence-missing"));
  const failed = Object.entries(gates).some(([key, reasons]) =>
    key !== "physical" && reasons.length > 0 &&
    !reasons.every((reason) => reason.includes("incomplete") || reason === "evidence-missing"));
  return { status: failed ? "failed" : automaticMissing || gates.physical.length > 0 ? "incomplete" : "passed", gates };
}
