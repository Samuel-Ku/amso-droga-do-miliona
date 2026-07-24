import type { ControlMethod } from "../game/contracts";
import type { GameplayInputAction } from "../game/input-queue";

export interface ReplayInputEvent { readonly stepIndex: number; readonly sequence: number; readonly action: GameplayInputAction; readonly active: boolean; readonly controlMethod: ControlMethod; }
export type ScenarioCoverageRequirement =
  | { readonly type: "jump" | "crouch" | "pickup" | "celebration" | "milestone" | "guarantee" | "world-change"; readonly minCount: number }
  | { readonly type: "power-up"; readonly id: string; readonly minCount: number }
  | { readonly type: "max-approved-density"; readonly minDurationSteps: number };
export interface ScenarioCheckpoint { readonly completedThroughStep: number; readonly expected: Readonly<Record<string, unknown>>; }
export interface PerformanceScenarioManifest { readonly id: "performance-reference-v1"; readonly durationSteps: 7200; readonly seed: number; readonly mode: "challenge"; readonly configVersion: string; readonly challengeWorldDurationSeconds: number; readonly inputs: readonly ReplayInputEvent[]; readonly expectedCheckpoints: readonly ScenarioCheckpoint[]; readonly requiredCoverage: readonly ScenarioCoverageRequirement[]; readonly expectedFinalDigest: string | null; }
export interface ScenarioRunEvidence {
  readonly completedThroughStep: number;
  readonly checkpointResults: readonly { completedThroughStep: number; passed: boolean }[];
  readonly coverage: Readonly<Record<string, number>>;
  readonly finalDigest: string | null;
  readonly expectedFinalDigest: string | null;
  readonly inputQueueOverflows: number;
}
export interface ScenarioValidationResult {
  readonly passed: boolean;
  readonly checkpointsPassed: boolean;
  readonly coveragePassed: boolean;
  readonly digestPassed: boolean;
  readonly reasons: readonly string[];
}

const authoredInputs = [
  [60, "jump", true],
  [100, "crouch", true],
  [120, "crouch", false],
  [180, "jump", true],
  [220, "crouch", true],
  [240, "crouch", false],
  [300, "jump", true],
  [340, "crouch", true],
  [360, "crouch", false],
  [420, "jump", true],
  [652, "jump", true],
  [1162, "crouch", true],
  [1262, "crouch", false],
  [1709, "jump", true],
  [2306, "crouch", true],
  [2406, "crouch", false],
  [2935, "jump", true],
  [3555, "crouch", true],
  [3655, "crouch", false],
  [4059, "jump", true],
  [4569, "crouch", true],
  [4669, "crouch", false],
  [5185, "jump", true],
  [5724, "crouch", true],
  [5824, "crouch", false],
  [6202, "jump", true]
] as const satisfies readonly (
  readonly [stepIndex: number, action: GameplayInputAction, active: boolean]
)[];

const inputs: readonly ReplayInputEvent[] = authoredInputs.map(
  ([stepIndex, action, active], sequence) => ({
    stepIndex,
    sequence,
    action,
    active,
    controlMethod: "keyboard"
  })
);

const requiredCoverage: readonly ScenarioCoverageRequirement[] = [
  { type: "jump", minCount: 10 }, { type: "crouch", minCount: 8 }, { type: "pickup", minCount: 1 },
  { type: "power-up", id: "gwarancja_48", minCount: 1 }, { type: "celebration", minCount: 1 },
  { type: "milestone", minCount: 1 }, { type: "guarantee", minCount: 1 },
  { type: "world-change", minCount: 2 },
  { type: "max-approved-density", minDurationSteps: 120 }
];

export const PERFORMANCE_REFERENCE_V1: PerformanceScenarioManifest = Object.freeze({
  id: "performance-reference-v1",
  durationSteps: 7200,
  seed: 0x4d5a1201,
  mode: "challenge",
  configVersion: "runner-config-v4",
  challengeWorldDurationSeconds: 24,
  inputs: Object.freeze(inputs),
  expectedCheckpoints: Object.freeze([
    { completedThroughStep: -1, expected: Object.freeze({ score: 0, collisionCount: 0, pickupCount: 0, worldIndex: 0 }) },
    { completedThroughStep: 2399, expected: Object.freeze({ simulationStep: 2400, score: 3759, collisionCount: 0, pickupCount: 14, worldIndex: 0 }) },
    { completedThroughStep: 4799, expected: Object.freeze({ simulationStep: 4800, score: 9099, collisionCount: 0, pickupCount: 36, worldIndex: 1 }) }
  ]),
  requiredCoverage: Object.freeze(requiredCoverage),
  expectedFinalDigest: "fnv1a32:232d8be0"
});

export function checkpointMatches(
  checkpoint: ScenarioCheckpoint,
  canonicalState: Readonly<Record<string, unknown>>
): boolean {
  for (const [key, expected] of Object.entries(checkpoint.expected)) {
    if (!Object.is(canonicalState[key], expected)) return false;
  }
  return true;
}

function coverageKey(requirement: ScenarioCoverageRequirement): string {
  return requirement.type === "power-up" ? `power-up:${requirement.id}` : requirement.type;
}

/** Validates recorded production-path evidence; missing approved digest is incomplete/failing, never auto-blessed. */
export function validateScenarioRun(
  manifest: PerformanceScenarioManifest,
  evidence: ScenarioRunEvidence
): ScenarioValidationResult {
  const reasons: string[] = [];
  const checkpointsPassed = manifest.expectedCheckpoints.every((checkpoint) =>
    evidence.checkpointResults.some((result) =>
      result.completedThroughStep === checkpoint.completedThroughStep && result.passed));
  if (!checkpointsPassed) reasons.push("scenario-checkpoint-failed");
  let coveragePassed = true;
  for (const requirement of manifest.requiredCoverage) {
    const expected = "minCount" in requirement ? requirement.minCount : requirement.minDurationSteps;
    if ((evidence.coverage[coverageKey(requirement)] ?? 0) < expected) {
      coveragePassed = false;
      reasons.push(`scenario-coverage-failed:${coverageKey(requirement)}`);
    }
  }
  const digestPassed = evidence.finalDigest !== null && evidence.expectedFinalDigest !== null &&
    evidence.finalDigest === evidence.expectedFinalDigest;
  if (!digestPassed) reasons.push(evidence.expectedFinalDigest === null
    ? "expected-digest-unapproved"
    : "determinism-digest-failed");
  if (evidence.completedThroughStep !== manifest.durationSteps - 1) reasons.push("scenario-duration-incomplete");
  if (evidence.inputQueueOverflows > 0) reasons.push("input-queue-overflow");
  return {
    passed: reasons.length === 0,
    checkpointsPassed,
    coveragePassed,
    digestPassed,
    reasons
  };
}
