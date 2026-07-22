import type { ControlMethod } from "../game/contracts";
import type { GameplayInputAction } from "../game/input-queue";

export interface ReplayInputEvent { readonly stepIndex: number; readonly sequence: number; readonly action: GameplayInputAction; readonly active: boolean; readonly controlMethod: ControlMethod; }
export type ScenarioCoverageRequirement =
  | { readonly type: "jump" | "crouch" | "pickup" | "celebration" | "guarantee" | "world-change"; readonly minCount: number }
  | { readonly type: "power-up"; readonly id: string; readonly minCount: number }
  | { readonly type: "max-approved-density"; readonly minDurationSteps: number };
export interface ScenarioCheckpoint { readonly completedThroughStep: number; readonly expected: Readonly<Record<string, unknown>>; }
export interface PerformanceScenarioManifest { readonly id: "performance-reference-v1"; readonly durationSteps: 7200; readonly seed: number; readonly mode: "challenge"; readonly configVersion: string; readonly inputs: readonly ReplayInputEvent[]; readonly expectedCheckpoints: readonly ScenarioCheckpoint[]; readonly requiredCoverage: readonly ScenarioCoverageRequirement[]; }

const inputs: ReplayInputEvent[] = [];
let sequence = 0;
for (let step = 90; step < 7200; step += 180) inputs.push({ stepIndex: step, sequence: sequence++, action: "jump", active: true, controlMethod: "keyboard" });
for (let step = 210; step < 7200; step += 360) {
  inputs.push({ stepIndex: step, sequence: sequence++, action: "crouch", active: true, controlMethod: "keyboard" });
  inputs.push({ stepIndex: step + 48, sequence: sequence++, action: "crouch", active: false, controlMethod: "keyboard" });
}

const requiredCoverage: readonly ScenarioCoverageRequirement[] = [
  { type: "jump", minCount: 10 }, { type: "crouch", minCount: 8 }, { type: "pickup", minCount: 1 },
  { type: "power-up", id: "gwarancja_48", minCount: 1 }, { type: "celebration", minCount: 1 },
  { type: "guarantee", minCount: 1 }, { type: "world-change", minCount: 2 },
  { type: "max-approved-density", minDurationSteps: 120 }
];

export const PERFORMANCE_REFERENCE_V1: PerformanceScenarioManifest = Object.freeze({
  id: "performance-reference-v1",
  durationSteps: 7200,
  seed: 0x4d5a1201,
  mode: "challenge",
  configVersion: "runner-config-v4",
  inputs: Object.freeze(inputs),
  expectedCheckpoints: Object.freeze([{ completedThroughStep: -1, expected: Object.freeze({ score: 0, collisionCount: 0, pickupCount: 0, worldIndex: 0 }) }]),
  requiredCoverage: Object.freeze(requiredCoverage)
});
