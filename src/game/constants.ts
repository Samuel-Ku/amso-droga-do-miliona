export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;
export const GROUND_Y = 432;

export const RUNNER_X = 142;
export const RUNNER_WIDTH = 58;
export const RUNNER_HEIGHT = 82;

export const PHYSICS = {
  gravity: 2_200,
  jumpVelocity: -760,
  maxFallVelocity: 1_250,
  coyoteSeconds: 0.1,
  jumpBufferSeconds: 0.12
} as const;

export const CROUCH = {
  /** Pixels the runner hitbox top drops and its height shrinks while crouching. */
  hitboxDrop: 36
} as const;

export const OVERHEAD = {
  /** Y of the top of the hanging beam (hangs from the ceiling). */
  topY: 200,
  /** Gap between the ground and the bottom edge of the beam. */
  clearance: 54
} as const;

/** Beam height so its bottom edge sits `clearance` pixels above the ground. */
export const OVERHEAD_BEAM_HEIGHT = GROUND_Y - OVERHEAD.clearance - OVERHEAD.topY;

export const BACKGROUND = {
  /** Distance (px) each themed zone lasts before the next one begins. */
  zonePixels: 8_000
} as const;

export const GAMEPLAY = {
  pixelsPerMeter: 35,
  packageScore: 100,
  goldenPackageScore: 350,
  fixedStepSeconds: 1 / 120,
  maxFrameSeconds: 0.1,
  maxFixedStepsPerFrame: 12,
  snapshotIntervalSeconds: 0.1,
  obstaclePoolSize: 12,
  packagePoolSize: 32,
  spawnPadding: 72
} as const;

export const BOSS = {
  firstAtSeconds: 42,
  intervalSeconds: 85,
  warningSeconds: 1.2,
  firstAttackDelaySeconds: 0.3,
  betweenAttacksSeconds: 0.42,
  rewardSeconds: 2.2,
  attackCount: 3,
  scoreBonus: 800
} as const;

export const CANVAS_LIMITS = {
  maxDpr: 2,
  maxPixels: 2_100_000,
  maxDimension: 2_048
} as const;
