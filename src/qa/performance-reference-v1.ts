import type { ControlMethod } from "../game/contracts";
import type { GameplayInputAction } from "../game/input-queue";
import type { PerformanceScenarioId } from "./boot-config";

export interface ReplayInputEvent { readonly stepIndex: number; readonly sequence: number; readonly action: GameplayInputAction; readonly active: boolean; readonly controlMethod: ControlMethod; }
export type ScenarioCoverageRequirement =
  | { readonly type: "jump" | "crouch" | "pickup" | "celebration" | "milestone" | "guarantee" | "world-change"; readonly minCount: number }
  | { readonly type: "power-up"; readonly id: string; readonly minCount: number }
  | { readonly type: "max-approved-density"; readonly minDurationSteps: number };
export interface ScenarioCheckpoint { readonly completedThroughStep: number; readonly expected: Readonly<Record<string, unknown>>; }
export interface PerformanceScenarioManifest { readonly id: PerformanceScenarioId; readonly durationSteps: 7200; readonly seed: number; readonly mode: "challenge"; readonly configVersion: string; readonly challengeWorldDurationSeconds: number; readonly visualDistanceMultiplier: number; readonly inputs: readonly ReplayInputEvent[]; readonly expectedCheckpoints: readonly ScenarioCheckpoint[]; readonly requiredCoverage: readonly ScenarioCoverageRequirement[]; readonly expectedFinalDigest: string | null; }
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
  [644, "jump", true],
  [726, "jump", true],
  [1199, "crouch", true],
  [1251, "crouch", false],
  [1253, "crouch", true],
  [1275, "crouch", false],
  [1285, "crouch", true],
  [1729, "jump", true],
  [1811, "jump", true],
  [2432, "crouch", false],
  [2434, "crouch", true],
  [2456, "crouch", false],
  [2466, "crouch", true],
  [3002, "jump", true],
  [3084, "jump", true],
  [3732, "crouch", false],
  [3734, "crouch", true],
  [3756, "crouch", false],
  [3766, "crouch", true],
  [4178, "jump", true],
  [4260, "jump", true],
  [4803, "crouch", false],
  [4805, "crouch", true],
  [4827, "crouch", false],
  [4837, "crouch", true],
  [5363, "jump", true],
  [5445, "jump", true],
  [6007, "crouch", false],
  [6009, "crouch", true],
  [6031, "crouch", false],
  [6041, "crouch", true],
  [6431, "jump", true],
  [6513, "jump", true],
  [7097, "crouch", false],
  [7099, "crouch", true],
  [7121, "crouch", false],
  [7131, "crouch", true]
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
  visualDistanceMultiplier: 1,
  inputs: Object.freeze(inputs),
  expectedCheckpoints: Object.freeze([
    { completedThroughStep: -1, expected: Object.freeze({ score: 0, collisionCount: 0, pickupCount: 0, worldIndex: 0 }) },
    { completedThroughStep: 2399, expected: Object.freeze({ simulationStep: 2400, score: 5645, collisionCount: 0, pickupCount: 16, worldIndex: 0 }) },
    { completedThroughStep: 4799, expected: Object.freeze({ simulationStep: 4800, score: 10747, collisionCount: 0, pickupCount: 37, worldIndex: 1 }) }
  ]),
  requiredCoverage: Object.freeze(requiredCoverage),
  expectedFinalDigest: "fnv1a32:84331d55"
});

export const WORLD_SEAM_PERFORMANCE_V1: PerformanceScenarioManifest = Object.freeze({
  ...PERFORMANCE_REFERENCE_V1,
  id: "world-seam-performance-v1",
  configVersion: "world-seam-performance-v1",
  challengeWorldDurationSeconds: 7,
  visualDistanceMultiplier: 3,
  expectedCheckpoints: Object.freeze([
    { completedThroughStep: -1, expected: Object.freeze({ score: 0, collisionCount: 0, pickupCount: 0 }) },
    { completedThroughStep: 2399, expected: Object.freeze({ simulationStep: 2400, score: 5645, collisionCount: 0, pickupCount: 16 }) },
    { completedThroughStep: 4799, expected: Object.freeze({ simulationStep: 4800, score: 10747, collisionCount: 0, pickupCount: 37 }) }
  ]),
  requiredCoverage: Object.freeze(PERFORMANCE_REFERENCE_V1.requiredCoverage.map((requirement) =>
    requirement.type === "world-change"
      ? Object.freeze({ type: "world-change" as const, minCount: 8 })
      : requirement)),
  expectedFinalDigest: "fnv1a32:842f4bbe"
});

export const FOUR_CYCLE_MEMORY_V1: PerformanceScenarioManifest = Object.freeze({
  ...PERFORMANCE_REFERENCE_V1,
  id: "four-cycle-memory-v1",
  configVersion: "four-cycle-memory-v1",
  challengeWorldDurationSeconds: 7,
  visualDistanceMultiplier: 9,
  expectedCheckpoints: Object.freeze([
    { completedThroughStep: -1, expected: Object.freeze({ score: 0, collisionCount: 0, pickupCount: 0 }) },
    { completedThroughStep: 2399, expected: Object.freeze({ simulationStep: 2400, score: 5645, collisionCount: 0, pickupCount: 16 }) },
    { completedThroughStep: 4799, expected: Object.freeze({ simulationStep: 4800, score: 10747, collisionCount: 0, pickupCount: 37 }) }
  ]),
  requiredCoverage: Object.freeze(PERFORMANCE_REFERENCE_V1.requiredCoverage.map((requirement) =>
    requirement.type === "world-change"
      ? Object.freeze({ type: "world-change" as const, minCount: 8 })
      : requirement)),
  // One deterministic cycle is replayed four times in the same page/cache.
  expectedFinalDigest: "fnv1a32:842f4bbe"
});

export function performanceScenario(id: PerformanceScenarioId): PerformanceScenarioManifest {
  if (id === "world-seam-performance-v1") return WORLD_SEAM_PERFORMANCE_V1;
  if (id === "four-cycle-memory-v1") return FOUR_CYCLE_MEMORY_V1;
  return PERFORMANCE_REFERENCE_V1;
}

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
