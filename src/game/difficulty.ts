export interface Difficulty {
  level: number;
  speed: number;
  speedMultiplier: number;
  minimumGapSeconds: number;
}

const BASE_SPEED = 280;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * clamp01(progress);
}

/** Campaign curve: calm tutorial, then gradual growth capped at 1.55x. */
export function getDifficulty(elapsedSeconds: number): Difficulty {
  const seconds = Math.max(0, elapsedSeconds);
  let multiplier: number;

  if (seconds <= 15) {
    multiplier = 1;
  } else if (seconds <= 40) {
    multiplier = lerp(1, 1.2, (seconds - 15) / 25);
  } else if (seconds <= 75) {
    multiplier = lerp(1.2, 1.4, (seconds - 40) / 35);
  } else {
    multiplier = lerp(1.4, 1.55, (seconds - 75) / 55);
  }

  return {
    level: Math.min(6, 1 + Math.floor(seconds / 15)),
    speed: BASE_SPEED * multiplier,
    speedMultiplier: multiplier,
    minimumGapSeconds: lerp(2.25, 1.45, (multiplier - 1) / 0.55)
  };
}

export interface ChallengeDifficultySettings {
  speedStartMultiplier: number;
  speedMaxMultiplier: number;
}

export function getChallengeDifficulty(
  elapsedSeconds: number,
  settings: ChallengeDifficultySettings
): Difficulty {
  const seconds = Math.max(0, elapsedSeconds);
  const start = Math.max(0.8, Math.min(1.6, settings.speedStartMultiplier));
  const maximum = Math.max(start, Math.min(1.8, settings.speedMaxMultiplier));
  const multiplier = lerp(start, maximum, seconds / 120);
  return {
    level: Math.min(9, 1 + Math.floor(seconds / 15)),
    speed: BASE_SPEED * multiplier,
    speedMultiplier: multiplier,
    minimumGapSeconds: lerp(2.05, 1.45, (multiplier - start) / Math.max(0.01, maximum - start))
  };
}
