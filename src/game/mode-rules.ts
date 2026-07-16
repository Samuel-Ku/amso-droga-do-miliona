import type { GameMode } from "./contracts";

export const COLLISION_RECOVERY_SECONDS = 2;

export interface CollisionResolution {
  finishRun: boolean;
  consumeWarranty: boolean;
  resetCombo: boolean;
  recoverySeconds: number;
}

/**
 * Resolves only the mode-dependent consequence of a collision. Keeping this
 * decision pure makes the forgiving story contract independent from canvas,
 * physics and spawning details.
 */
export function resolveCollision(mode: GameMode, hasWarranty: boolean): CollisionResolution {
  if (hasWarranty) {
    return {
      finishRun: false,
      consumeWarranty: true,
      resetCombo: false,
      recoverySeconds: COLLISION_RECOVERY_SECONDS
    };
  }

  return {
    finishRun: mode === "challenge",
    consumeWarranty: false,
    resetCombo: true,
    recoverySeconds: mode === "story" ? COLLISION_RECOVERY_SECONDS : 0
  };
}
