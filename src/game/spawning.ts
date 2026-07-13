import { GAMEPLAY, GROUND_Y, OVERHEAD, OVERHEAD_BEAM_HEIGHT, PHYSICS } from "./constants";
import { PACKAGE_TYPE_VALUES, POWER_UP_VALUES } from "./narrative";
import type { Difficulty } from "./difficulty";
import { SeededRandom } from "./random";
import type {
  ObstacleKind,
  ObstacleModel,
  ObstacleSource,
  PackageKind,
  PackageModel
} from "./types";
import type { PackageType, PowerUpKind } from "../shared/types";

export interface ObstacleSpec {
  width: number;
  height: number;
}

export interface PackageSpawn {
  x: number;
  y: number;
  phase: number;
  kind: PackageKind;
  scoreValue: number;
  packageType: PackageType;
  weightKg: number;
}

export type PackagePattern = "arc" | "low-line" | "high-arc" | "staircase";

export interface SpawnWave {
  kind: ObstacleKind;
  source: ObstacleSource;
  pattern: PackagePattern;
  x: number;
  y: number;
  width: number;
  height: number;
  packages: readonly PackageSpawn[];
  gapPixels: number;
}

export const OBSTACLE_SPECS: Readonly<Record<ObstacleKind, ObstacleSpec>> = {
  "box-stack": { width: 52, height: 62 },
  pallet: { width: 78, height: 36 },
  trolley: { width: 68, height: 50 },
  overhead: { width: 72, height: OVERHEAD_BEAM_HEIGHT }
};

const OBSTACLE_KINDS: readonly ObstacleKind[] = [
  "box-stack",
  "pallet",
  "trolley",
  "overhead"
];

/** Low packs placed under a beam; collectible while crouching, no jump needed. */
const OVERHEAD_PACKAGE_HEIGHTS: readonly number[] = [28, 37, 44, 37, 28];

export function calculateSpawnGap(
  speed: number,
  difficulty: Pick<Difficulty, "minimumGapSeconds">,
  randomUnit: number
): number {
  const safeSpeed = Math.max(1, speed);
  const randomExtraSeconds = Math.max(0, Math.min(1, randomUnit)) * 0.42;
  return safeSpeed * (difficulty.minimumGapSeconds + randomExtraSeconds);
}

export function createObstaclePool(size: number = GAMEPLAY.obstaclePoolSize): ObstacleModel[] {
  return Array.from({ length: Math.max(1, Math.floor(size)) }, () => ({
    active: false,
    kind: "box-stack" as const,
    source: "normal" as const,
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }));
}

export function createPackagePool(size: number = GAMEPLAY.packagePoolSize): PackageModel[] {
  return Array.from({ length: Math.max(1, Math.floor(size)) }, () => ({
    active: false,
    kind: "standard" as const,
    scoreValue: GAMEPLAY.packageScore,
    x: 0,
    y: 0,
    size: 30,
    phase: 0,
    packageType: "notebook" as PackageType,
    weightKg: 0
  }));
}

function chooseKind(
  random: SeededRandom,
  lastKind: ObstacleKind | null,
  repeatCount: number,
  allowedKinds: readonly ObstacleKind[]
): ObstacleKind {
  const pool = allowedKinds.length > 0 ? allowedKinds : OBSTACLE_KINDS;
  let index = random.integer(0, pool.length - 1);
  let kind = pool[index] ?? "box-stack";

  if (kind === lastKind && repeatCount >= 2) {
    index = (index + 1 + random.integer(0, 1)) % pool.length;
    kind = pool[index] ?? "pallet";
  }
  return kind;
}

/**
 * Package trajectory per pattern. Heights are tuned to the runner's real jump
 * parabola: the middle pack sits at the jump apex and the edges at takeoff/landing,
 * so a single well-timed jump both clears the obstacle and collects every pack.
 * Horizontal spacing is derived from the current speed (see `buildPackagePattern`)
 * so the arc always spans one jump regardless of game speed.
 */
const PACKAGE_PATTERN_HEIGHTS: Readonly<Record<PackagePattern, readonly number[]>> = {
  arc: [55, 145, 168, 145, 55],
  "low-line": [45, 120, 160, 120, 45],
  "high-arc": [70, 150, 172, 150, 70],
  staircase: [50, 95, 130, 165, 80]
};

const PATTERN_IDS = Object.keys(PACKAGE_PATTERN_HEIGHTS) as PackagePattern[];

/** Full airtime of one jump (takeoff to landing), used to size the pack arc. */
const JUMP_FLIGHT_SECONDS = (-PHYSICS.jumpVelocity * 2) / PHYSICS.gravity;
/** Fraction of the jump the packs should span; <1 leaves a small margin. */
const PACKAGE_ARC_SPAN_FRACTION = 0.96;

function buildPackagePattern(
  heights: readonly number[],
  obstacleX: number,
  random: SeededRandom,
  speed: number,
  narrative: boolean,
  narrativePowerUps: readonly PowerUpKind[]
): PackageSpawn[] {
  const packCount = heights.length;
  const span = speed * JUMP_FLIGHT_SECONDS * PACKAGE_ARC_SPAN_FRACTION;
  const packageType = PACKAGE_TYPE_VALUES[random.integer(0, PACKAGE_TYPE_VALUES.length - 1)] ?? "notebook";
  if (narrative) {
    const powerUpIndex = narrativePowerUps.length > 0 && random.next() < 0.18
      ? random.integer(1, packCount - 2)
      : -1;
    return heights.map((height, index) => {
      const centering = packCount > 1 ? index / (packCount - 1) - 0.5 : 0;
      const offset = span * centering;
      const isPowerUp = index === powerUpIndex;
      const kind: PackageKind = isPowerUp
        ? (narrativePowerUps[random.integer(0, narrativePowerUps.length - 1)] ?? "gwarancja_48")
        : "standard";
      return {
        x: obstacleX + offset,
        y: GROUND_Y - height - 15,
        phase: random.range(0, Math.PI * 2),
        kind,
        scoreValue: isPowerUp ? 0 : GAMEPLAY.packageScore,
        packageType,
        weightKg: 0
      };
    });
  }
  const specialRoll = random.next();
  const powerUpIndex = specialRoll < 0.18 ? random.integer(1, packCount - 2) : -1;
  const goldenIndex = powerUpIndex < 0 && specialRoll < 0.34
    ? random.integer(1, packCount - 2)
    : -1;
  const powerUpKind = powerUpIndex >= 0
    ? (POWER_UP_VALUES[random.integer(0, POWER_UP_VALUES.length - 1)] ?? "gwarancja_48")
    : null;
  return heights.map((height, index) => {
    const centering = packCount > 1 ? index / (packCount - 1) - 0.5 : 0;
    const offset = span * centering;
    const isPowerUp = index === powerUpIndex && powerUpKind !== null;
    return {
      x: obstacleX + offset,
      y: GROUND_Y - height - 15,
      phase: random.range(0, Math.PI * 2),
      kind: isPowerUp ? powerUpKind : index === goldenIndex ? "golden" : "standard",
      scoreValue: isPowerUp
        ? 0
        : index === goldenIndex
          ? GAMEPLAY.goldenPackageScore
          : GAMEPLAY.packageScore,
      packageType,
      weightKg: 0
    };
  });
}

/**
 * Distance-driven spawner. Spacing therefore remains stable across frame rates and
 * every gap respects a time-based lower bound as the world accelerates.
 */
export class FairSpawner {
  private distanceUntilNext: number;
  private lastKind: ObstacleKind | null = null;
  private repeatCount = 0;
  private lastPattern: PackagePattern | null = null;

  constructor(
    private readonly random: SeededRandom,
    initialSpeed: number,
    private readonly allowedKinds: readonly ObstacleKind[] = OBSTACLE_KINDS,
    private readonly narrative = false,
    private readonly narrativePowerUps: readonly PowerUpKind[] = POWER_UP_VALUES
  ) {
    this.distanceUntilNext = Math.max(1, initialSpeed) * 3.7;
  }

  advance(
    travelledPixels: number,
    speed: number,
    difficulty: Difficulty,
    spawnX: number
  ): SpawnWave | null {
    this.distanceUntilNext -= Math.max(0, travelledPixels);
    if (this.distanceUntilNext > 0) return null;

    const kind = chooseKind(this.random, this.lastKind, this.repeatCount, this.allowedKinds);
    this.repeatCount = kind === this.lastKind ? this.repeatCount + 1 : 1;
    this.lastKind = kind;

    const spec = OBSTACLE_SPECS[kind];
    const isOverhead = kind === "overhead";
    let pattern: PackagePattern = PATTERN_IDS[this.random.integer(0, PATTERN_IDS.length - 1)] ?? "arc";
    if (pattern === this.lastPattern) {
      const index = (PATTERN_IDS.indexOf(pattern) + 1 + this.random.integer(0, 1)) % PATTERN_IDS.length;
      pattern = PATTERN_IDS[index] ?? "staircase";
    }
    this.lastPattern = pattern;
    const gapPixels = calculateSpawnGap(speed, difficulty, this.random.next());
    this.distanceUntilNext += gapPixels;

    const packageHeights = isOverhead ? OVERHEAD_PACKAGE_HEIGHTS : PACKAGE_PATTERN_HEIGHTS[pattern];
    const obstacleY = isOverhead ? OVERHEAD.topY : GROUND_Y - spec.height;

    return {
      kind,
      source: "normal",
      pattern,
      x: spawnX,
      y: obstacleY,
      width: spec.width,
      height: spec.height,
      packages: buildPackagePattern(
        packageHeights,
        spawnX,
        this.random,
        speed,
        this.narrative,
        this.narrativePowerUps
      ),
      gapPixels
    };
  }
}

export function activateTutorialPackages(packages: PackageModel[]): void {
  const positions = [520, 600, 680, 760];
  for (let index = 0; index < positions.length; index += 1) {
    const parcel = packages[index];
    const x = positions[index];
    if (!parcel || x === undefined) continue;
    parcel.active = true;
    parcel.kind = "standard";
    parcel.scoreValue = GAMEPLAY.packageScore;
    parcel.x = x;
    parcel.y = GROUND_Y - parcel.size - 17;
    parcel.phase = index * 0.9;
    parcel.packageType = "notebook";
    parcel.weightKg = 0;
  }
}

export function activateWave(
  wave: Readonly<SpawnWave>,
  obstacles: ObstacleModel[],
  packages: PackageModel[]
): boolean {
  const obstacle = obstacles.find((candidate) => !candidate.active);
  const freePackages = packages.filter((candidate) => !candidate.active);
  if (!obstacle || freePackages.length < wave.packages.length) return false;

  obstacle.active = true;
  obstacle.kind = wave.kind;
  obstacle.source = wave.source;
  obstacle.x = wave.x;
  obstacle.y = wave.y;
  obstacle.width = wave.width;
  obstacle.height = wave.height;

  for (let index = 0; index < wave.packages.length; index += 1) {
    const spawn = wave.packages[index];
    const parcel = freePackages[index];
    if (!spawn || !parcel) return false;
    parcel.active = true;
    parcel.kind = spawn.kind;
    parcel.scoreValue = spawn.scoreValue;
    parcel.x = spawn.x;
    parcel.y = spawn.y;
    parcel.phase = spawn.phase;
    parcel.packageType = spawn.packageType;
    parcel.weightKg = spawn.weightKg;
  }
  return true;
}

export function createBossAttackWave(kind: ObstacleKind, spawnX: number): SpawnWave {
  const spec = OBSTACLE_SPECS[kind];
  return {
    kind,
    source: "boss",
    pattern: "low-line",
    x: spawnX,
    y: kind === "overhead" ? OVERHEAD.topY : GROUND_Y - spec.height,
    width: spec.width,
    height: spec.height,
    packages: [],
    gapPixels: 0
  };
}

export function activateBossReward(packages: PackageModel[], usePowerUps = false): number {
  const positions = [440, 515, 590, 665, 740];
  const freePackages = packages.filter((candidate) => !candidate.active);
  if (freePackages.length < positions.length) return 0;
  let activated = 0;
  for (let index = 0; index < positions.length; index += 1) {
    const parcel = freePackages[index];
    const x = positions[index];
    if (!parcel || x === undefined) break;
    parcel.active = true;
    parcel.kind = usePowerUps
      ? (POWER_UP_VALUES[index % POWER_UP_VALUES.length] ?? "gwarancja_48")
      : "golden";
    parcel.scoreValue = usePowerUps ? 0 : GAMEPLAY.goldenPackageScore;
    parcel.x = x;
    parcel.y = GROUND_Y - parcel.size - 17;
    parcel.phase = index * 0.75;
    parcel.packageType = "notebook";
    parcel.weightKg = 0;
    activated += 1;
  }
  return activated;
}
