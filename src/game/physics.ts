import { GROUND_Y, PHYSICS, RUNNER_HEIGHT, RUNNER_WIDTH, RUNNER_X } from "./constants";
import type { RunnerModel } from "./types";

export interface PhysicsConfig {
  gravity: number;
  jumpVelocity: number;
  maxFallVelocity: number;
  coyoteSeconds: number;
  jumpBufferSeconds: number;
  groundY: number;
}

export const DEFAULT_PHYSICS: PhysicsConfig = {
  ...PHYSICS,
  groundY: GROUND_Y
};

export function createRunnerModel(): RunnerModel {
  return {
    x: RUNNER_X,
    y: GROUND_Y - RUNNER_HEIGHT,
    width: RUNNER_WIDTH,
    height: RUNNER_HEIGHT,
    velocityY: 0,
    grounded: true,
    crouching: false,
    crouchElapsedSeconds: 0,
    coyoteRemaining: PHYSICS.coyoteSeconds,
    jumpBufferRemaining: 0
  };
}

export function queueJump(
  runner: RunnerModel,
  bufferSeconds = DEFAULT_PHYSICS.jumpBufferSeconds
): void {
  runner.jumpBufferRemaining = Math.max(runner.jumpBufferRemaining, bufferSeconds);
}

/** Mutates a plain model so the same rules can be exercised without a canvas. */
export function stepRunnerPhysics(
  runner: RunnerModel,
  deltaSeconds: number,
  config: PhysicsConfig = DEFAULT_PHYSICS
): void {
  const delta = Math.max(0, deltaSeconds);
  runner.jumpBufferRemaining = Math.max(0, runner.jumpBufferRemaining - delta);

  if (runner.grounded) {
    runner.coyoteRemaining = config.coyoteSeconds;
  } else {
    runner.coyoteRemaining = Math.max(0, runner.coyoteRemaining - delta);
  }

  if (runner.jumpBufferRemaining > 0 && (runner.grounded || runner.coyoteRemaining > 0)) {
    runner.velocityY = config.jumpVelocity;
    runner.grounded = false;
    runner.coyoteRemaining = 0;
    runner.jumpBufferRemaining = 0;
  }

  if (!runner.grounded) {
    runner.velocityY = Math.min(
      config.maxFallVelocity,
      runner.velocityY + config.gravity * delta
    );
    runner.y += runner.velocityY * delta;
    runner.crouching = false;
  }

  const floorY = config.groundY - runner.height;
  if (runner.y >= floorY) {
    runner.y = floorY;
    runner.velocityY = 0;
    runner.grounded = true;
  }
}
