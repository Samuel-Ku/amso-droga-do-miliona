import { GAMEPLAY } from "./constants";
import type { PackageKind } from "./types";
import type { CollectibleClass } from "../shared/types";
import { collectibleScore } from "./collectibles";

export const MAX_COMBO_MULTIPLIER = 8;

export interface WaveComboResolution {
  nextCombo: number;
  perfectBonus: number;
}

export function resolveWaveCombo(
  combo: number,
  passed: boolean,
  perfect: boolean
): WaveComboResolution {
  const current = normalizedCombo(combo);
  if (!passed) return { nextCombo: 1, perfectBonus: 0 };
  return {
    nextCombo: Math.min(MAX_COMBO_MULTIPLIER, current + 1),
    perfectBonus: perfect ? GAMEPLAY.packageScore * current : 0
  };
}

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
  collectibleClass: CollectibleClass,
  combo: number,
  doublePoints: boolean
): PackageCollectionResolution {
  const currentCombo = normalizedCombo(combo);
  if (kind !== "standard") {
    return {
      countsAsPackage: false,
      pointsAwarded: 0,
      bonusScoreAwarded: 0,
      nextCombo: currentCombo
    };
  }

  const basePoints = collectibleScore(collectibleClass);
  const pointsAwarded = basePoints * currentCombo * (doublePoints ? 2 : 1);
  return {
    countsAsPackage: collectibleClass === "parcel",
    pointsAwarded,
    // calculateScore supplies the ordinary 100 points through ordersCollected.
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
  ordersCollected: number,
  bonusScore = 0
): number {
  return (
    distanceInMeters(distancePixels) +
    Math.max(0, Math.floor(ordersCollected)) * GAMEPLAY.packageScore +
    Math.max(0, Math.floor(bonusScore))
  );
}
