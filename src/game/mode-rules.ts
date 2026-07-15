import type { GameMode } from "./contracts";

export const COLLISION_RECOVERY_SECONDS = 2;
export const MAX_STORY_GAP_ASSIST = 0.35;
const STORY_GAP_ASSIST_RECOVERY_SECONDS = 30;

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
  if (mode === "challenge" && hasWarranty) {
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

/** Invisible story-only spacing assist; it never changes world or physics speed. */
export function storyGapAssistAfterCollision(
  currentAssist: number,
  collisionsInEpoch: number
): number {
  const current = Math.max(0, Math.min(MAX_STORY_GAP_ASSIST, currentAssist));
  if (collisionsInEpoch < 2) return current;
  const requested = 0.25 + Math.min(0.1, Math.max(0, collisionsInEpoch - 2) * 0.05);
  return Math.max(current, requested);
}

export function recoverStoryGapAssist(currentAssist: number, cleanSeconds: number): number {
  const current = Math.max(0, Math.min(MAX_STORY_GAP_ASSIST, currentAssist));
  const recovery = Math.max(0, cleanSeconds) *
    (MAX_STORY_GAP_ASSIST / STORY_GAP_ASSIST_RECOVERY_SECONDS);
  return Math.max(0, current - recovery);
}
