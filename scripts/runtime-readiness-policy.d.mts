export interface ArtifactProvenance {
  sourceIdentity: string;
  htmlSha256: string;
  assetIdentities: Array<{ url: string; status: number; bytes: number; sha256: string }>;
  [key: string]: unknown;
}
export function artifactFingerprint(provenance: unknown): string | null;
export function assessSixtySecondEvidence(evidence: any, expectedProvenance: ArtifactProvenance): string[];
export function buildFourCycleQualification(evidence: any, expectedProvenance: ArtifactProvenance): any;
export function aggregateRuntimeReadiness(evidence: {
  expectedProvenance: ArtifactProvenance;
  sixtySecond: any;
  coldStart: any;
  fourCycle: any;
  captureProcesses: Array<{ name: string; status: number | null; signal: string | null;
    freshOutput: boolean; error: string | null }>;
}): { schema: "amso-runtime-readiness-v1"; status: "passed" | "failed" | "incomplete"; gates: Record<string, string[]> };
