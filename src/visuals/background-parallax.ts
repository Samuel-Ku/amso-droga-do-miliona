export const BACKGROUND_PARALLAX_SPEED_RATIO = 0.1;
export const REDUCED_MOTION_PARALLAX_RATIO = 0.35;

export function backgroundTravelPixels(gameplayTravelPixels: number): number {
  if (!Number.isFinite(gameplayTravelPixels)) return 0;
  return Math.max(0, gameplayTravelPixels) * BACKGROUND_PARALLAX_SPEED_RATIO;
}

export function reducedMotionBackgroundTravelPixels(backgroundDistance: number): number {
  if (!Number.isFinite(backgroundDistance)) return 0;
  return Math.max(0, backgroundDistance) * REDUCED_MOTION_PARALLAX_RATIO;
}
