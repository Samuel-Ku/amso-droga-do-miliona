export type ReleaseGateStatus = "pass" | "fail" | "incomplete";

export interface ReleaseEvidence {
  checkpointsPassed?: boolean;
  digestPassed?: boolean;
  inputQueueOverflows: number;
  requiredCoveragePassed?: boolean;
  reportMetadataComplete: boolean;
  minimumProfileDeviceAvailable: boolean;
  configurationPassed?: boolean;
  consoleErrorCount?: number;
  autonomicHtmlSizeMb?: number;
  visualRegressionPassed?: boolean;
  coldStartPassed?: boolean;
  worldTransitionsPassed?: boolean;
  onePlusReportPassed?: boolean;
  nokiaReportPassed?: boolean;
  iphoneSafariReportPassed?: boolean;
  minimumProfileReportPassed?: boolean;
  androidMemoryMb?: number;
  androidCycleGrowthMb?: number;
}

const AUTONOMIC_HTML_BUDGET_MB = 24;

export function evaluatePerformanceReleaseGate(evidence: ReleaseEvidence): { status: ReleaseGateStatus; reasons: string[] } {
  const failures: string[] = [];
  const missing: string[] = [];
  if (!evidence.minimumProfileDeviceAvailable) missing.push("minimum-profile-device-unavailable");
  if (!evidence.reportMetadataComplete) missing.push("report-metadata-incomplete");
  if (evidence.configurationPassed === undefined) missing.push("configuration-evidence-unavailable");
  else if (!evidence.configurationPassed) failures.push("configuration-failed");
  if (evidence.consoleErrorCount === undefined) missing.push("console-error-evidence-unavailable");
  else if (evidence.consoleErrorCount > 0) failures.push("console-errors-present");
  if (evidence.autonomicHtmlSizeMb === undefined) missing.push("autonomic-html-size-unavailable");
  else if (evidence.autonomicHtmlSizeMb > AUTONOMIC_HTML_BUDGET_MB) failures.push("autonomic-html-over-24mb");
  if (evidence.visualRegressionPassed === undefined) missing.push("visual-regression-evidence-unavailable");
  else if (!evidence.visualRegressionPassed) failures.push("visual-regression-failed");
  const requirePassed = (value: boolean | undefined, unavailable: string, failed: string): void => {
    if (value === undefined) missing.push(unavailable);
    else if (!value) failures.push(failed);
  };
  requirePassed(evidence.coldStartPassed, "cold-start-evidence-unavailable", "cold-start-failed");
  requirePassed(evidence.worldTransitionsPassed, "world-transition-evidence-unavailable", "world-transition-failed");
  requirePassed(evidence.onePlusReportPassed, "oneplus-report-unavailable", "oneplus-report-failed");
  requirePassed(evidence.nokiaReportPassed, "nokia-report-unavailable", "nokia-report-failed");
  requirePassed(evidence.iphoneSafariReportPassed, "iphone-safari-report-unavailable", "iphone-safari-report-failed");
  requirePassed(evidence.minimumProfileReportPassed, "minimum-profile-report-unavailable", "minimum-profile-report-failed");
  if (evidence.checkpointsPassed === undefined) missing.push("scenario-checkpoint-evidence-unavailable");
  else if (!evidence.checkpointsPassed) failures.push("scenario-checkpoint-failed");
  if (evidence.digestPassed === undefined) missing.push("determinism-digest-evidence-unavailable");
  else if (!evidence.digestPassed) failures.push("determinism-digest-failed");
  if (evidence.requiredCoveragePassed === undefined) missing.push("required-coverage-evidence-unavailable");
  else if (!evidence.requiredCoveragePassed) failures.push("required-coverage-failed");
  if (evidence.inputQueueOverflows > 0) failures.push("input-queue-overflow");
  if (evidence.androidMemoryMb === undefined) missing.push("android-memory-evidence-unavailable");
  else if (evidence.androidMemoryMb > 220) failures.push("android-memory-over-220mb");
  if (evidence.androidCycleGrowthMb === undefined) missing.push("android-cycle-growth-evidence-unavailable");
  else if (evidence.androidCycleGrowthMb > 10) failures.push("android-cycle-growth-over-10mb");
  const reasons = [...failures, ...missing];
  return { status: failures.length > 0 ? "fail" : missing.length > 0 ? "incomplete" : "pass", reasons };
}
