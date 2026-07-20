import type { RunnerModel } from "./types";
import { RUNNER_HEIGHT, RUNNER_WIDTH } from "./constants";

const MIN_STRIDE_CYCLES_PER_SECOND = 12;
const MAX_STRIDE_CYCLES_PER_SECOND = 22;
const MIN_STRIDE_SPEED = 280;
const MAX_STRIDE_SPEED = 980;

export interface CourierProtectionPresentation {
  readonly centerX: number;
  readonly centerY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly breaking: boolean;
}

export type CourierProtectionState = "start" | "warranty" | "breaking";

export const SHIELD_APPEAR_SECONDS = 0.22;
export const SHIELD_BREAK_SECONDS = 0.12;
const SHIELD_BREATH_SECONDS = 1.8;
const SHIELD_ROTATION_RADIANS_PER_SECOND = Math.PI / 15;

export interface CourierShieldAnimationInput {
  readonly elapsedSeconds: number;
  readonly activationSecondsRemaining: number;
  readonly breakSecondsRemaining: number;
  readonly reducedMotion: boolean;
}

export interface CourierShieldAnimation {
  readonly scale: number;
  readonly alpha: number;
  readonly meshRotationRadians: number;
  readonly breakingProgress: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function courierShieldAnimation(
  input: Readonly<CourierShieldAnimationInput>
): CourierShieldAnimation {
  const elapsedSeconds = Math.max(0, Number.isFinite(input.elapsedSeconds)
    ? input.elapsedSeconds
    : 0);
  const activationSecondsRemaining = Math.max(0, input.activationSecondsRemaining);
  const breakSecondsRemaining = Math.max(0, input.breakSecondsRemaining);
  const breakingProgress = breakSecondsRemaining > 0
    ? clamp01(1 - breakSecondsRemaining / SHIELD_BREAK_SECONDS)
    : 0;

  if (input.reducedMotion) {
    const appearanceProgress = activationSecondsRemaining > 0
      ? clamp01(1 - activationSecondsRemaining / SHIELD_APPEAR_SECONDS)
      : 1;
    return {
      scale: 1,
      alpha: breakingProgress > 0 ? 1 - breakingProgress : appearanceProgress,
      meshRotationRadians: 0,
      breakingProgress
    };
  }

  if (breakingProgress > 0) {
    return {
      scale: 1 + breakingProgress * 0.08,
      alpha: 1 - breakingProgress,
      meshRotationRadians: elapsedSeconds * SHIELD_ROTATION_RADIANS_PER_SECOND,
      breakingProgress
    };
  }

  if (activationSecondsRemaining > 0) {
    const progress = clamp01(1 - activationSecondsRemaining / SHIELD_APPEAR_SECONDS);
    const scale = progress <= 0.7
      ? 0.72 + (1.08 - 0.72) * progress / 0.7
      : 1.08 + (1 - 1.08) * (progress - 0.7) / 0.3;
    const alpha = progress * progress * (3 - 2 * progress);
    return {
      scale,
      alpha,
      meshRotationRadians: elapsedSeconds * SHIELD_ROTATION_RADIANS_PER_SECOND,
      breakingProgress: 0
    };
  }

  const wave = Math.sin(elapsedSeconds * Math.PI * 2 / SHIELD_BREATH_SECONDS);
  return {
    scale: 1.025 + wave * 0.025,
    alpha: 0.9 + wave * 0.1,
    meshRotationRadians: elapsedSeconds * SHIELD_ROTATION_RADIANS_PER_SECOND,
    breakingProgress: 0
  };
}

export function runnerStrideCyclesPerSecond(speed: number): number {
  const safeSpeed = Number.isFinite(speed) ? speed : MIN_STRIDE_SPEED;
  const progress = Math.max(0, Math.min(
    1,
    (safeSpeed - MIN_STRIDE_SPEED) / (MAX_STRIDE_SPEED - MIN_STRIDE_SPEED)
  ));
  return MIN_STRIDE_CYCLES_PER_SECOND +
    progress * (MAX_STRIDE_CYCLES_PER_SECOND - MIN_STRIDE_CYCLES_PER_SECOND);
}

export function courierProtectionPresentation(
  runner: Readonly<RunnerModel>,
  state: CourierProtectionState | null
): CourierProtectionPresentation | null {
  if (state === null) return null;
  const radiusX = Math.max(RUNNER_WIDTH / 2 + 50, RUNNER_HEIGHT / 2 + 38);
  return {
    centerX: runner.x + RUNNER_WIDTH / 2,
    centerY: runner.y + runner.height / 2,
    radiusX,
    radiusY: radiusX + 8,
    breaking: state === "breaking"
  };
}
