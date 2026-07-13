import { GAMEPLAY } from "./constants";
import type { PackageKind } from "./types";

export const MAX_COMBO_MULTIPLIER = 5;

export interface PackageCollectionResolution {
  countsAsPackage: boolean;
  pointsAwarded: number;
  bonusScoreAwarded: number;
  nextCombo: number;
}

function normalizedCombo(combo: number): number {
  return Math.max(1, Math.min(MAX_COMBO_MULTIPLIER, Math.floor(combo)));
}

/** Resolves one pickup without mutating run state. */
export function resolvePackageCollection(
  kind: PackageKind,
  scoreValue: number,
  combo: number,
  doublePoints: boolean
): PackageCollectionResolution {
  const currentCombo = normalizedCombo(combo);
  if (kind !== "standard" && kind !== "golden") {
    return {
      countsAsPackage: false,
      pointsAwarded: 0,
      bonusScoreAwarded: 0,
      nextCombo: currentCombo
    };
  }

  const basePoints = Math.max(0, Math.floor(scoreValue));
  const pointsAwarded = basePoints * currentCombo * (doublePoints ? 2 : 1);
  return {
    countsAsPackage: true,
    pointsAwarded,
    // calculateScore supplies the ordinary 100 points through packagesCollected.
    bonusScoreAwarded: Math.max(0, pointsAwarded - GAMEPLAY.packageScore),
    nextCombo: Math.min(MAX_COMBO_MULTIPLIER, currentCombo + 1)
  };
}

export function distanceInMeters(distancePixels: number): number {
  return Math.max(0, Math.floor(distancePixels / GAMEPLAY.pixelsPerMeter));
}

export function packageBonusScore(scoreValue: number): number {
  return Math.max(0, Math.floor(scoreValue) - GAMEPLAY.packageScore);
}

export function calculateScore(
  distancePixels: number,
  packagesCollected: number,
  bonusScore = 0
): number {
  return (
    distanceInMeters(distancePixels) +
    Math.max(0, Math.floor(packagesCollected)) * GAMEPLAY.packageScore +
    Math.max(0, Math.floor(bonusScore))
  );
}
