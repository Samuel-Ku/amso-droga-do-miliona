import { CROUCH } from "./constants";
import type { ObstacleModel, PackageModel, RunnerModel } from "./types";
import type { CollectibleClass } from "../shared/types";

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function rectanglesOverlap(a: Rectangle, b: Rectangle): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Smaller than the courier artwork to make near misses feel fair. */
export function runnerHitbox(runner: Readonly<RunnerModel>): Rectangle {
  if (runner.crouching) {
    return {
      x: runner.x + 12,
      y: runner.y + 9 + CROUCH.hitboxDrop,
      width: runner.width - 23,
      height: runner.height - 12 - CROUCH.hitboxDrop
    };
  }
  return {
    x: runner.x + 12,
    y: runner.y + 9,
    width: runner.width - 23,
    height: runner.height - 12
  };
}

export function obstacleHitbox(obstacle: Readonly<ObstacleModel>): Rectangle {
  if (obstacle.kind === "overhead") {
    return {
      x: obstacle.x + 4,
      y: obstacle.y + 6,
      width: obstacle.width - 8,
      height: obstacle.height - 6
    };
  }
  const horizontalInset = obstacle.kind === "pallet" ? 8 : 5;
  const topInset = obstacle.kind === "trolley" ? 6 : 3;
  return {
    x: obstacle.x + horizontalInset,
    y: obstacle.y + topInset,
    width: obstacle.width - horizontalInset * 2,
    height: obstacle.height - topInset
  };
}

export function collidesWithObstacle(
  runner: Readonly<RunnerModel>,
  obstacle: Readonly<ObstacleModel>
): boolean {
  if (!obstacle.active) return false;
  const runnerLeft = runner.x + 12;
  const runnerTop = runner.y + 9 + (runner.crouching ? CROUCH.hitboxDrop : 0);
  const runnerRight = runnerLeft + runner.width - 23;
  const runnerBottom = runnerTop + runner.height - 12 - (runner.crouching ? CROUCH.hitboxDrop : 0);
  const horizontalInset = obstacle.kind === "overhead" ? 4 : obstacle.kind === "pallet" ? 8 : 5;
  const topInset = obstacle.kind === "overhead" ? 6 : obstacle.kind === "trolley" ? 6 : 3;
  const obstacleLeft = obstacle.x + horizontalInset;
  const obstacleRight = obstacle.x + obstacle.width - horizontalInset;
  if (obstacleRight <= runnerLeft || obstacleLeft >= runnerRight) return false;
  const obstacleTop = obstacle.y + topInset;
  const obstacleBottom = obstacle.kind === "overhead"
    ? obstacle.y + obstacle.height
    : obstacle.y + obstacle.height;
  return runnerBottom > obstacleTop && runnerTop < obstacleBottom;
}

/**
 * Pickup zone matches the body hitbox but extends up to the head, so parcels
 * lined up at head height are still collected. Lateral and lower bounds stay
 * identical to the collision hitbox so fair near-misses are preserved.
 */
export function runnerPickupBox(runner: Readonly<RunnerModel>): Rectangle {
  return {
    x: runner.x + 12,
    y: runner.y,
    width: runner.width - 23,
    height: runner.height - 3
  };
}

/** Shared semantic inset used by runtime pickup and route reachability checks. */
export function collectiblePickupInset(size: number, collectibleClass: CollectibleClass): number {
  return size * (collectibleClass === "equipment" ? 0.132 : 0.18);
}

export function collectsPackage(
  runner: Readonly<RunnerModel>,
  parcel: Readonly<PackageModel>
): boolean {
  if (!parcel.active) return false;
  // Equipment uses a semantic pickup zone 115% of the parcel zone. This is
  // independent of transparent artwork margins and makes premium routes fair.
  const inset = collectiblePickupInset(parcel.size, parcel.collectibleClass);
  const runnerLeft = runner.x + 12;
  const runnerRight = runnerLeft + runner.width - 23;
  const parcelLeft = parcel.x + inset;
  const parcelRight = parcel.x + parcel.size - inset;
  if (parcelRight <= runnerLeft || parcelLeft >= runnerRight) return false;
  const runnerTop = runner.y;
  const runnerBottom = runner.y + runner.height - 3;
  const parcelTop = parcel.y + inset;
  const parcelBottom = parcel.y + parcel.size - inset;
  return runnerBottom > parcelTop && runnerTop < parcelBottom;
}
