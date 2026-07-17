import type { RunnerModel } from "./types";
import { RUNNER_HEIGHT, RUNNER_WIDTH } from "./constants";

const MIN_STRIDE_CYCLES_PER_SECOND = 2;
const MAX_STRIDE_CYCLES_PER_SECOND = 4;
const MIN_STRIDE_SPEED = 280;
const MAX_STRIDE_SPEED = 980;

export interface CourierProtectionPresentation {
  readonly centerX: number;
  readonly centerY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly color: "#f47100";
  readonly breaking: boolean;
}

export type CourierProtectionState = "start" | "warranty" | "breaking";

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
  const radius = Math.max(RUNNER_WIDTH / 2 + 50, RUNNER_HEIGHT / 2 + 38);
  return {
    centerX: runner.x + RUNNER_WIDTH / 2,
    centerY: runner.y + runner.height / 2,
    radiusX: radius,
    radiusY: radius,
    color: "#f47100",
    breaking: state === "breaking"
  };
}
