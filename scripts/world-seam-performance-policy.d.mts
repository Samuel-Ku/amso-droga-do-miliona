export interface ExpectedWorldSeamPerformanceEvidence {
  readonly engine: "chromium" | "webkit";
  readonly targetKind: "vercel-build" | "url";
  readonly targetValue: string;
}

export const WORLD_SEAM_DESTINATIONS: readonly string[];
export function assessWorldSeamPerformanceEvidence(
  evidence: unknown,
  expected: ExpectedWorldSeamPerformanceEvidence
): string[];
export function sameWorldSeamScenarioConfiguration(left: unknown, right: unknown): boolean;
