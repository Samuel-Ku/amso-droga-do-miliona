import type { ObstacleKind } from "./types";

export type ChallengePressureAxis =
  | "speed"
  | "density"
  | "complexity"
  | "precision"
  | "pressure";

export interface ChallengePressureSnapshot {
  axis: ChallengePressureAxis;
  cycleIndex: number;
  cycleDurationSeconds: number;
  cycleProgress: number;
}

export interface ValidatedChallengeAtom {
  id: string;
  action: "jump" | "slide";
  obstacleKind: ObstacleKind;
  packageCount: number;
}

export interface ChallengePatternTuning {
  axis: ChallengePressureAxis;
  packageCount: number;
  reactionSeconds: number;
  breathSeconds: number;
  sequenceLength: number;
}

const AXES: readonly ChallengePressureAxis[] = [
  "speed",
  "density",
  "complexity",
  "precision",
  "pressure"
];
const CYCLE_SECONDS = [20, 24, 27, 22, 30] as const;

export const VALIDATED_CHALLENGE_ATOMS: readonly ValidatedChallengeAtom[] = Object.freeze([
  { id: "pallet-arc", action: "jump", obstacleKind: "pallet", packageCount: 3 },
  { id: "scanner-line", action: "slide", obstacleKind: "overhead", packageCount: 4 },
  { id: "box-rise", action: "jump", obstacleKind: "box-stack", packageCount: 4 },
  { id: "beam-wave", action: "slide", obstacleKind: "overhead", packageCount: 5 },
  { id: "trolley-arc", action: "jump", obstacleKind: "trolley", packageCount: 5 },
  { id: "low-conveyor", action: "slide", obstacleKind: "overhead", packageCount: 3 }
]);

/** Deterministic 20–30 second cycles: only one pressure axis is foregrounded at a time. */
export function challengePressureAt(elapsedSeconds: number): ChallengePressureSnapshot {
  let remaining = Math.max(0, elapsedSeconds);
  let cycleIndex = 0;
  for (;;) {
    const duration = CYCLE_SECONDS[cycleIndex % CYCLE_SECONDS.length]!;
    if (remaining < duration) {
      return {
        axis: AXES[cycleIndex % AXES.length]!,
        cycleIndex,
        cycleDurationSeconds: duration,
        cycleProgress: remaining / duration
      };
    }
    remaining -= duration;
    cycleIndex += 1;
  }
}

export function challengeAtomAt(patternIndex: number): Readonly<ValidatedChallengeAtom> {
  const index = Math.max(0, Math.floor(patternIndex));
  return VALIDATED_CHALLENGE_ATOMS[index % VALIDATED_CHALLENGE_ATOMS.length]!;
}

/** Every fourth pattern ends a burst with a readable breath. */
export function challengeBreathSeconds(patternIndex: number, elapsedSeconds: number): number {
  if ((Math.max(0, Math.floor(patternIndex)) + 1) % 4 === 0) return 1.1;
  const pressure = Math.min(1, Math.max(0, elapsedSeconds) / 180);
  return 0.72 - pressure * 0.32;
}

/** Turns each named pressure axis into one dominant, testable gameplay change. */
export function challengePatternTuning(
  elapsedSeconds: number,
  patternIndex: number,
  basePackageCount: number
): ChallengePatternTuning {
  const pressure = challengePressureAt(elapsedSeconds);
  const baseBreath = challengeBreathSeconds(patternIndex, elapsedSeconds);
  const burstBreak = baseBreath >= 1;
  switch (pressure.axis) {
    case "density":
      return {
        axis: pressure.axis,
        packageCount: Math.min(5, basePackageCount + 1),
        reactionSeconds: 1.2,
        breathSeconds: burstBreak ? baseBreath : baseBreath * 0.72,
        sequenceLength: 1
      };
    case "complexity":
      return {
        axis: pressure.axis,
        packageCount: basePackageCount,
        reactionSeconds: 1.2,
        breathSeconds: burstBreak ? baseBreath : 0.38,
        sequenceLength: 2
      };
    case "precision":
      return {
        axis: pressure.axis,
        packageCount: 2,
        reactionSeconds: 1.2,
        breathSeconds: baseBreath,
        sequenceLength: 1
      };
    case "pressure":
      return {
        axis: pressure.axis,
        packageCount: Math.max(3, basePackageCount),
        reactionSeconds: 1.2,
        breathSeconds: burstBreak ? baseBreath : 0.24,
        sequenceLength: 3
      };
    case "speed":
      return {
        axis: pressure.axis,
        packageCount: basePackageCount,
        reactionSeconds: 1.2,
        breathSeconds: baseBreath,
        sequenceLength: 1
      };
  }
}
