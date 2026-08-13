export const APPROVED_FULL_STORY_SCENARIO_ID: "full-story-reference-v1";
export const APPROVED_FULL_STORY_CONFIG_VERSION: 1;
export const APPROVED_FULL_STORY_SEED: number;
export const APPROVED_FULL_STORY_DIGEST: string;
export const APPROVED_FULL_STORY_ROUTE: readonly string[];
export function assessFullStoryEvidence(evidence: unknown, options?: { production?: boolean }): string[];
export function assessFullStoryComparison(before: unknown, after: unknown): {
  comparable: boolean;
  reasons: string[];
  deltas: { p95Ms: number | null; p99Ms: number | null; maxMs: number | null; over33Ms: number | null };
};
export function assessSixtySecondPrerequisite(evidence: unknown, expectedIdentity?: string | null): string[];
export function assessQualificationPrerequisite(evidence: unknown, expectedSchema?: string, expectedIdentity?: string | null): string[];
export function assessFourCyclePrerequisite(evidence: unknown, expectedIdentity?: string | null): string[];
export function aggregateFullStoryReleaseGate(evidence: Record<string, unknown>): {
  status: "passed" | "failed" | "incomplete";
  gates: Record<string, string[]>;
};
