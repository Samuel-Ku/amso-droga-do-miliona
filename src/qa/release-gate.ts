export type ReleaseGateStatus = "pass" | "fail" | "incomplete";
export interface ReleaseEvidence { checkpointsPassed: boolean; digestPassed: boolean; inputQueueOverflows: number; requiredCoveragePassed: boolean; reportMetadataComplete: boolean; androidMemoryMb?: number; androidCycleGrowthMb?: number; minimumProfileDeviceAvailable: boolean; }
export function evaluatePerformanceReleaseGate(evidence: ReleaseEvidence): { status: ReleaseGateStatus; reasons: string[] } {
  const reasons: string[] = [];
  if (!evidence.minimumProfileDeviceAvailable) reasons.push("minimum-profile-device-unavailable");
  if (!evidence.reportMetadataComplete) reasons.push("report-metadata-incomplete");
  if (!evidence.checkpointsPassed) reasons.push("scenario-checkpoint-failed");
  if (!evidence.digestPassed) reasons.push("determinism-digest-failed");
  if (!evidence.requiredCoveragePassed) reasons.push("required-coverage-failed");
  if (evidence.inputQueueOverflows > 0) reasons.push("input-queue-overflow");
  if (evidence.androidMemoryMb !== undefined && evidence.androidMemoryMb > 220) reasons.push("android-memory-over-220mb");
  if (evidence.androidCycleGrowthMb !== undefined && evidence.androidCycleGrowthMb > 10) reasons.push("android-cycle-growth-over-10mb");
  const incomplete = reasons.some((reason) => reason.includes("unavailable") || reason.includes("incomplete"));
  return { status: reasons.length === 0 ? "pass" : incomplete ? "incomplete" : "fail", reasons };
}
