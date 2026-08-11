export interface PanelTransition {
  readonly worldId: string;
  readonly atMs: number;
  readonly [key: string]: unknown;
}

export const REQUIRED_WORLD_SEAM_DESTINATIONS: readonly string[];
export const REQUIRED_WORLD_SEAM_TRANSITIONS: readonly Readonly<{
  worldId: string;
  assetFragment: string;
}>[];
export function qualifiedPanelTransitions<T extends PanelTransition>(
  transitions: T[],
  scenarioId?: "performance-reference-v1" | "world-seam-performance-v1"
): T[];
export function requiredWorldTransitionsPassed(
  transitions: PanelTransition[],
  scenarioId: "performance-reference-v1" | "world-seam-performance-v1"
): boolean;
export function selectRequiredWorldTransitions<T extends PanelTransition>(
  transitions: T[],
  scenarioId: "performance-reference-v1" | "world-seam-performance-v1"
): T[];
