export interface FullStoryRuntimeProfileCandidate {
  readonly id: "canvas-effects" | "compositor-paint" | "gc-pressure";
  readonly score: number;
  readonly evidence: string;
  readonly expectedMetric: string;
  readonly reversibleExperiment: string;
  readonly attribution: {
    readonly target: "local" | "production";
    readonly segmentId: string | null;
    readonly worldId: string | null;
    readonly redSegments: readonly string[];
  };
}

export interface FullStoryRuntimeProfileAssessment {
  readonly eligible: boolean;
  readonly reasons: readonly string[];
  readonly diagnosis: "invalid-evidence" | "cadence-limited" | "runtime-hot-path" | "inconclusive";
  readonly rankedCandidates: readonly FullStoryRuntimeProfileCandidate[];
  readonly primaryCandidate: FullStoryRuntimeProfileCandidate | null;
  readonly cadence?: {
    readonly runs: Readonly<Record<"local" | "production", {
      readonly activeP95Ms: number;
      readonly emptyRafP95Ms: number;
      readonly residualMs: number;
    }>>;
    readonly diagnosticOnly: true;
  };
}

export function assessFullStoryRuntimeProfile(
  localEvidence: unknown,
  productionEvidence: unknown
): FullStoryRuntimeProfileAssessment;

export function contextForTimelineEntry<T>(
  frames: readonly ({ readonly at: number; readonly duration: number; readonly phase: string;
    readonly segmentId: string | null; readonly worldId: string | null })[],
  entryStartTime: number,
  fallback: T
): { readonly phase: string; readonly segmentId: string | null; readonly worldId: string | null } | T;

export const RUNTIME_PROFILE_SCHEMA: "full-story-runtime-profile-v1";
