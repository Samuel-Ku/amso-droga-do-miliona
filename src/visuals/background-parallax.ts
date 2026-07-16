export const BACKGROUND_PARALLAX_SPEED_RATIO = 0.1;

export function backgroundTravelPixels(gameplayTravelPixels: number): number {
  if (!Number.isFinite(gameplayTravelPixels)) return 0;
  return Math.max(0, gameplayTravelPixels) * BACKGROUND_PARALLAX_SPEED_RATIO;
}
