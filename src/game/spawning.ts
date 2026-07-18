import {
  GAMEPLAY,
  GROUND_Y,
  OVERHEAD,
  OVERHEAD_BEAM_HEIGHT,
  PHYSICS,
  RUNNER_HEIGHT,
  RUNNER_WIDTH,
  RUNNER_X,
  WORLD_WIDTH
} from "./constants";
import { PACKAGE_TYPE_VALUES } from "./narrative";
import type { Difficulty } from "./difficulty";
import { SeededRandom } from "./random";
import type {
  ObstacleKind,
  ObstacleModel,
  ObstacleSource,
  PackageKind,
  PackageModel
} from "./types";
import type { CollectibleClass, OrderVisualType, PackageType } from "../shared/types";
import type { SemanticObstacleVariant } from "./semantic-obstacle";
import { collectibleClassForVisual } from "./collectibles";
import {
  collectiblePickupInset,
  obstacleHitbox,
  rectanglesOverlap,
  runnerHitbox
} from "./collision";
import { createRunnerModel } from "./physics";

export interface ObstacleSpec {
  width: number;
  height: number;
}

export interface PackageSpawn {
  x: number;
  y: number;
  phase: number;
  kind: PackageKind;
  collectibleClass: CollectibleClass;
  packageType: PackageType;
  orderVisualType: OrderVisualType;
  weightKg: number;
  storyRewardPattern?: boolean;
  storyOrder?: boolean;
  authoredWaveId?: string;
}

export type PackagePattern =
  | "single-low" | "pair-low" | "pair-high" | "triple-arc" | "triple-step"
  | "quad-arc" | "quad-rise" | "five-arc" | "five-wave" | "five-step"
  | "six-arc" | "six-wave" | "seven-arc" | "seven-wave";

export interface ObstaclePatternDefinition {
  readonly id: string;
  readonly kind: ObstacleKind;
  readonly action: AuthoredRewardAction;
  readonly packagePattern: PackagePattern;
}

export interface SpawnWave {
  kind: ObstacleKind;
  source: ObstacleSource;
  pattern: PackagePattern;
  obstaclePattern: string;
  x: number;
  y: number;
  width: number;
  height: number;
  packages: readonly PackageSpawn[];
  gapPixels: number;
  authoredWaveId?: string;
  authoredActionIndex?: number;
  semanticVariant?: SemanticObstacleVariant;
  rewardRouteFamily?: RewardRouteFamily;
}

export type AuthoredRewardAction = "jump" | "slide";

export interface AuthoredRewardSpec {
  kind: PackageKind;
  packageType?: PackageType;
  storyOrder?: boolean;
}

export interface AuthoredRewardWaveOptions {
  action: AuthoredRewardAction;
  spawnX: number;
  speed: number;
  rewards: readonly AuthoredRewardSpec[];
  patternIndex?: number;
  source?: ObstacleSource;
  packageCount?: number;
  obstacleKind?: ObstacleKind;
  authoredWaveId?: string;
  authoredActionIndex?: number;
  semanticVariant?: SemanticObstacleVariant;
  minimumReactionSeconds?: number;
}

export type RewardRouteFamily = typeof REWARD_ROUTE_FAMILIES[number];

export const MIN_AUTHORED_REACTION_SECONDS = 1.6;
const PACKAGE_MODEL_SIZE = 30;

/** Deterministic challenge reward bag: dense parcel routes with optional premium equipment. */
export class ChallengeRewardDirector {
  private readonly equipmentBag: ShuffleBag<PackageType>;
  private waveIndex = 0;

  public constructor(random: SeededRandom) {
    this.equipmentBag = new ShuffleBag(PACKAGE_TYPE_VALUES, random);
  }

  public createWave(
    options: Omit<AuthoredRewardWaveOptions, "rewards"> & { packageCount: number }
  ): SpawnWave | null {
    const routeFamily = REWARD_ROUTE_FAMILIES[this.waveIndex % REWARD_ROUTE_FAMILIES.length] ?? "arc";
    const equipmentCount = this.waveIndex % 2 === 0 ? 2 : 1;
    const rewards = Array.from({ length: equipmentCount }, (): AuthoredRewardSpec => ({
      kind: "standard",
      packageType: this.equipmentBag.next()
    }));
    this.waveIndex += 1;
    const wave = createAuthoredRewardWave({
      ...options,
      packageCount: Math.max(5, Math.min(8, Math.floor(options.packageCount))),
      rewards
    });
    if (!wave) return null;
    const ordered = [...wave.packages].sort((left, right) => left.x - right.x);
    const routed = routeFamily === "premium-finale"
      ? (() => {
          const finale = [...ordered].reverse().find(({ collectibleClass }) =>
            collectibleClass === "equipment"
          );
          return finale
            ? [...ordered.filter((collectible) => collectible !== finale), finale]
            : ordered;
        })()
      : ordered;
    const firstX = routed[0]?.x ?? wave.x;
    const routeY = routed.map(({ y }) => y);
    if (routeFamily === "low-line") {
      routeY.fill(options.action === "slide" ? GROUND_Y - 28 : GROUND_Y - 45);
    }
    if (routeFamily === "rising-steps") routeY.sort((left, right) => right - left);
    if (routeFamily === "falling-steps") routeY.sort((left, right) => left - right);
    const routeSpacing = Math.max(150, options.speed * 0.36);
    const spaced = routed.map((collectible, index) => {
      const splitGap = routeFamily === "split-groups" && index >= Math.ceil(routed.length / 2)
        ? 120
        : 0;
      // Equipment is always the optional premium line in challenge: higher on
      // jumps and slightly higher within the crouch corridor on slide routes.
      const premiumLift = collectible.collectibleClass === "equipment"
        ? routeFamily === "alternate-route"
          ? options.action === "jump" ? 38 : 18
          : routeFamily === "premium-finale"
            ? options.action === "jump" ? 26 : 14
            : options.action === "jump" ? 18 : 10
        : 0;
      const x = firstX + index * routeSpacing + splitGap;
      const jumpApexSeconds = -PHYSICS.jumpVelocity / PHYSICS.gravity;
      const obstacleCenterSeconds = (
        wave.x + wave.width / 2 - (RUNNER_X + RUNNER_WIDTH / 2)
      ) / Math.max(1, options.speed);
      const collectibleSeconds = (
        x + PACKAGE_MODEL_SIZE / 2 - (RUNNER_X + RUNNER_WIDTH / 2)
      ) / Math.max(1, options.speed);
      const elapsedSinceJump = collectibleSeconds - (obstacleCenterSeconds - jumpApexSeconds);
      const runnerY = elapsedSinceJump >= 0 && elapsedSinceJump <= JUMP_DURATION_SECONDS
        ? GROUND_Y - RUNNER_HEIGHT + PHYSICS.jumpVelocity * elapsedSinceJump +
          PHYSICS.gravity * elapsedSinceJump * elapsedSinceJump / 2
        : GROUND_Y - RUNNER_HEIGHT;
      const positioned = {
        ...collectible,
        x,
        y: options.action === "jump"
          ? collectible.collectibleClass === "equipment"
            ? Math.max(0, routeFamily === "alternate-route"
              ? Math.min(runnerY + 28 - premiumLift, (routeY[index] ?? collectible.y) - premiumLift)
              : runnerY + 28 - premiumLift)
            : Math.max(
              GROUND_Y - PACKAGE_MODEL_SIZE -
                (PHYSICS.jumpVelocity * PHYSICS.jumpVelocity) / (2 * PHYSICS.gravity) - 24,
              (routeY[index] ?? collectible.y) - premiumLift
            )
          : (routeY[index] ?? collectible.y) - premiumLift
      };
      if (options.action !== "jump") return positioned;
      const obstacle = obstacleHitbox({
        active: true,
        kind: wave.kind,
        source: wave.source,
        x: wave.x,
        y: wave.y,
        width: wave.width,
        height: wave.height
      });
      const box = {
        x: positioned.x,
        y: positioned.y,
        width: PACKAGE_MODEL_SIZE,
        height: PACKAGE_MODEL_SIZE
      };
      return rectanglesOverlap(box, obstacle)
        ? { ...positioned, y: Math.max(0, obstacle.y - PACKAGE_MODEL_SIZE - 6) }
        : positioned;
    });
    const candidate = { ...wave, packages: spaced, rewardRouteFamily: routeFamily };
    const geometryIssue = validateSpawnWaveGeometry(
      candidate,
      options.speed,
      options.minimumReactionSeconds ?? 1.2
    );
    return geometryIssue ? null : candidate;
  }
}

export const REWARD_ROUTE_FAMILIES = Object.freeze([
  "arc",
  "low-line",
  "rising-steps",
  "falling-steps",
  "split-groups",
  "premium-finale",
  "alternate-route"
] as const);

const JUMP_DURATION_SECONDS = (-PHYSICS.jumpVelocity * 2) / PHYSICS.gravity;

function setRunnerJumpPose(
  runner: ReturnType<typeof createRunnerModel>,
  elapsedSinceJump: number
): void {
  runner.y = GROUND_Y - runner.height;
  runner.grounded = true;
  runner.crouching = false;
  if (elapsedSinceJump < 0 || elapsedSinceJump > JUMP_DURATION_SECONDS) return;
  runner.y += PHYSICS.jumpVelocity * elapsedSinceJump +
    PHYSICS.gravity * elapsedSinceJump * elapsedSinceJump / 2;
  runner.grounded = false;
}

function collectibleOverlapsRunnerAtX(
  collectible: Readonly<PackageSpawn>,
  runner: ReturnType<typeof createRunnerModel>,
  x: number
): boolean {
  const inset = collectiblePickupInset(PACKAGE_MODEL_SIZE, collectible.collectibleClass);
  return rectanglesOverlap(runnerHitbox(runner), {
    x: x + inset,
    y: collectible.y + inset,
    width: PACKAGE_MODEL_SIZE - inset * 2,
    height: PACKAGE_MODEL_SIZE - inset * 2
  });
}

function addDominantRouteState(
  states: Map<number, number[]>,
  jumpPhase: number,
  collectedMask: number
): void {
  const existing = states.get(jumpPhase) ?? [];
  if (existing.some((mask) => (mask | collectedMask) === mask)) return;
  states.set(
    jumpPhase,
    [...existing.filter((mask) => (mask | collectedMask) !== collectedMask), collectedMask]
  );
}

function bitCount(value: number): number {
  let remaining = value >>> 0;
  let count = 0;
  while (remaining !== 0) {
    remaining &= remaining - 1;
    count += 1;
  }
  return count;
}

function validateTemporalReachability(wave: Readonly<SpawnWave>, speed: number): string | null {
  const safeSpeed = Math.max(1, speed);
  const obstacle = obstacleHitbox({
    active: true,
    kind: wave.kind,
    source: wave.source,
    x: wave.x,
    y: wave.y,
    width: wave.width,
    height: wave.height
  });
  const runner = createRunnerModel();
  const obstacleEnter = Math.max(0, (obstacle.x - (runner.x + runner.width)) / safeSpeed);
  const obstacleExit = Math.max(obstacleEnter, (obstacle.x + obstacle.width - runner.x) / safeSpeed);
  const parcels = wave.packages.filter(({ collectibleClass }) => collectibleClass === "parcel");
  const equipment = wave.packages.filter(({ collectibleClass }) => collectibleClass === "equipment");
  const requiredParcels = Math.ceil(parcels.length * 0.6);
  const simulationEnd = Math.max(
    obstacleExit,
    ...wave.packages.map((collectible) =>
      (collectible.x + PACKAGE_MODEL_SIZE - runner.x) / safeSpeed
    )
  );
  // A 60 Hz route simulation matches the visual performance target while
  // keeping property tests fast enough to cover many seeds and speeds.
  const fixedStep = 1 / 60;

  if (wave.kind === "overhead") {
    runner.crouching = true;
    const collected = new Set<PackageSpawn>();
    for (let time = 0; time <= simulationEnd + fixedStep; time += fixedStep) {
      if (rectanglesOverlap(runnerHitbox(runner), {
        ...obstacle,
        x: obstacle.x - safeSpeed * time
      })) return "crouch timing still collides with obstacle";
      for (const collectible of wave.packages) {
        if (collectibleOverlapsRunnerAtX(
          collectible,
          runner,
          collectible.x - safeSpeed * time
        )) collected.add(collectible);
      }
    }
    const parcelReach = parcels.filter((collectible) => collected.has(collectible)).length;
    if (parcelReach < requiredParcels) return "base crouch route cannot collect its parcel target";
    if (equipment.some((collectible) => !collected.has(collectible))) {
      return "premium crouch route is unreachable";
    }
    return null;
  }

  const jumpFrames = Math.ceil(JUMP_DURATION_SECONDS / fixedStep);
  const parcelMask = wave.packages.reduce((mask, collectible, index) =>
    collectible.collectibleClass === "parcel" ? mask | (1 << index) : mask, 0
  );
  const equipmentMask = wave.packages.reduce((mask, collectible, index) =>
    collectible.collectibleClass === "equipment" ? mask | (1 << index) : mask, 0
  );
  let states = new Map<number, number[]>([[0, [0]]]);
  const totalFrames = Math.ceil(simulationEnd / fixedStep) + 1;
  for (let frame = 0; frame <= totalFrames; frame += 1) {
    const time = frame * fixedStep;
    const nextStates = new Map<number, number[]>();
    for (const [jumpPhase, masks] of states) {
      const nextPhases = jumpPhase === 0
        ? [0, 1]
        : [jumpPhase >= jumpFrames ? 0 : jumpPhase + 1];
      for (const nextPhase of nextPhases) {
        setRunnerJumpPose(runner, nextPhase === 0 ? -1 : (nextPhase - 1) * fixedStep);
        if (rectanglesOverlap(runnerHitbox(runner), {
          ...obstacle,
          x: obstacle.x - safeSpeed * time
        })) continue;
        for (const mask of masks) {
          let collectedMask = mask;
          wave.packages.forEach((collectible, index) => {
            if ((collectedMask & (1 << index)) !== 0) return;
            if (collectibleOverlapsRunnerAtX(
              collectible,
              runner,
              collectible.x - safeSpeed * time
            )) collectedMask |= 1 << index;
          });
          addDominantRouteState(nextStates, nextPhase, collectedMask);
        }
      }
    }
    states = nextStates;
    if (states.size === 0) return "no collision-free jump sequence exists";
  }
  const completedMasks = [...states.values()].flat();
  if (!completedMasks.some((mask) => bitCount(mask & parcelMask) >= requiredParcels)) {
    return "base jump route cannot collect its parcel target";
  }
  if (!completedMasks.some((mask) =>
    bitCount(mask & parcelMask) >= requiredParcels && (mask & equipmentMask) === equipmentMask
  )) return "premium jump route is unreachable";
  return null;
}

/** Public geometry gate shared by authored story and seeded challenge routes. */
export function validateSpawnWaveGeometry(
  wave: Readonly<SpawnWave>,
  speed: number,
  minimumReactionSeconds: number
): string | null {
  const safeSpeed = Math.max(1, speed);
  const reactionSeconds = (wave.x - (RUNNER_X + RUNNER_WIDTH)) / safeSpeed;
  if (reactionSeconds < minimumReactionSeconds) return "obstacle telegraph is too short";

  const obstacle = obstacleHitbox({
    active: true,
    kind: wave.kind,
    source: wave.source,
    x: wave.x,
    y: wave.y,
    width: wave.width,
    height: wave.height
  });
  const runner = createRunnerModel();
  const obstacleAtRunner = { ...obstacle, x: runner.x };
  if (wave.kind === "overhead") {
    const standingBlocked = rectanglesOverlap(runnerHitbox(runner), obstacleAtRunner);
    runner.crouching = true;
    const crouchingBlocked = rectanglesOverlap(runnerHitbox(runner), obstacleAtRunner);
    if (!standingBlocked || crouchingBlocked) return "overhead route is not crouch-readable";
  }

  const jumpRise = (PHYSICS.jumpVelocity * PHYSICS.jumpVelocity) / (2 * PHYSICS.gravity);
  for (let index = 0; index < wave.packages.length; index += 1) {
    const collectible = wave.packages[index]!;
    const box = { x: collectible.x, y: collectible.y, width: PACKAGE_MODEL_SIZE, height: PACKAGE_MODEL_SIZE };
    // The low slide line intentionally lets the 30 px artwork sit two pixels
    // into the painted ground. Its inset pickup hitbox remains fully above it.
    if (box.y < 0 || box.y + box.height > GROUND_Y + 2) {
      return "collectible is outside player bounds";
    }
    if (wave.kind !== "overhead" && GROUND_Y - (box.y + box.height) > jumpRise + 24) {
      return "collectible exceeds jump reach";
    }
    if (rectanglesOverlap(box, obstacle)) return "collectible intersects obstacle";
    for (let otherIndex = index + 1; otherIndex < wave.packages.length; otherIndex += 1) {
      const other = wave.packages[otherIndex]!;
      if (rectanglesOverlap(box, {
        x: other.x, y: other.y, width: PACKAGE_MODEL_SIZE, height: PACKAGE_MODEL_SIZE
      })) return "collectibles overlap";
    }
  }

  const firstX = Math.floor(Math.min(...wave.packages.map(({ x }) => x), wave.x)) - WORLD_WIDTH;
  const lastX = Math.ceil(Math.max(...wave.packages.map(({ x }) => x), wave.x + wave.width));
  for (let viewportLeft = firstX; viewportLeft <= lastX; viewportLeft += 24) {
    const visible = wave.packages.filter(({ x }) =>
      x + PACKAGE_MODEL_SIZE > viewportLeft && x < viewportLeft + WORLD_WIDTH
    ).length;
    if (visible > 7) return "more than seven collectibles are visible";
  }
  return validateTemporalReachability(wave, safeSpeed);
}

/** Keeps authored reward patterns reachable as challenge speed increases. */
export function authoredRewardSpawnX(
  speed: number,
  preferredSpawnX: number,
  minimumReactionSeconds = MIN_AUTHORED_REACTION_SECONDS
): number {
  const safeSpeed = Math.max(1, speed);
  const minimumSpawnX = RUNNER_X + RUNNER_WIDTH +
    safeSpeed * Math.max(0, minimumReactionSeconds);
  return Math.max(preferredSpawnX, Math.ceil(minimumSpawnX));
}

export function validateAuthoredRouteGeometry(options: {
  action: AuthoredRewardAction;
  obstacleKind: ObstacleKind;
  packageCount: number;
  speed: number;
  minimumReactionSeconds: number;
}): string | null {
  const spawnX = authoredRewardSpawnX(
    options.speed,
    WORLD_WIDTH + GAMEPLAY.spawnPadding,
    options.minimumReactionSeconds
  );
  const wave = createAuthoredRewardWave({
    ...options,
    spawnX,
    rewards: [{ kind: "standard" }]
  });
  if (!wave) return "wave cannot be spawned with the requested reaction time";
  return validateSpawnWaveGeometry(wave, options.speed, options.minimumReactionSeconds);
}

export interface SafeCollectiblePlacement {
  preferredX: number;
  y: number;
  size: number;
  minX: number;
  maxX: number;
  obstacles: readonly Readonly<ObstacleModel>[];
  packages: readonly Readonly<PackageModel>[];
  padding?: number;
}

function overlaps(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number }
): boolean {
  return left.x < right.x + right.width && left.x + left.width > right.x &&
    left.y < right.y + right.height && left.y + left.height > right.y;
}

/** Finds a readable collectible lane without placing a reward inside a hazard. */
export function findSafeCollectibleX(options: SafeCollectiblePlacement): number | null {
  const size = Math.max(1, options.size);
  const minimum = Math.min(options.minX, options.maxX);
  const maximum = Math.max(options.minX, options.maxX);
  const padding = Math.max(0, options.padding ?? 18);
  const step = size + padding + 4;
  const candidates: number[] = [];
  for (let offset = 0; offset <= maximum - minimum + step; offset += step) {
    for (const direction of offset === 0 ? [1] : [-1, 1]) {
      const candidate = Math.max(minimum, Math.min(maximum, options.preferredX + offset * direction));
      if (!candidates.includes(candidate)) candidates.push(candidate);
    }
  }

  for (const x of candidates) {
    const padded = {
      x: x - padding,
      y: options.y - padding,
      width: size + padding * 2,
      height: size + padding * 2
    };
    const blockedByObstacle = options.obstacles.some((obstacle) => obstacle.active &&
      overlaps(padded, obstacle));
    const blockedByPackage = options.packages.some((parcel) => parcel.active &&
      overlaps(padded, { x: parcel.x, y: parcel.y, width: parcel.size, height: parcel.size }));
    if (!blockedByObstacle && !blockedByPackage) return x;
  }
  return null;
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
    collectibleClass: "equipment" as const,
    x: 0,
    y: 0,
    size: PACKAGE_MODEL_SIZE,
    phase: 0,
    packageType: "notebook" as PackageType,
    orderVisualType: "notebook" as OrderVisualType,
    weightKg: 0
  }));
}

/**
 * Package trajectory per pattern. Heights are tuned to the runner's real jump
 * parabola: the middle pack sits at the jump apex and the edges at takeoff/landing,
 * so a single well-timed jump both clears the obstacle and collects every pack.
 * Horizontal spacing is derived from the current speed (see `buildPackagePattern`)
 * so the arc always spans one jump regardless of game speed.
 */
export const PACKAGE_PATTERN_HEIGHTS: Readonly<Record<PackagePattern, readonly number[]>> = {
  "single-low": [82],
  "pair-low": [78, 78],
  "pair-high": [142, 142],
  "triple-arc": [70, 166, 70],
  "triple-step": [62, 112, 162],
  "quad-arc": [62, 142, 142, 62],
  "quad-rise": [55, 92, 130, 166],
  "five-arc": [55, 145, 168, 145, 55],
  "five-wave": [72, 132, 92, 158, 72],
  "five-step": [50, 95, 130, 165, 80],
  "six-arc": [52, 105, 158, 158, 105, 52],
  "six-wave": [58, 132, 86, 156, 108, 58],
  "seven-arc": [48, 88, 132, 168, 132, 88, 48],
  "seven-wave": [55, 115, 155, 92, 165, 112, 55]
};

export const PACKAGE_PATTERN_IDS = Object.freeze(
  Object.keys(PACKAGE_PATTERN_HEIGHTS) as PackagePattern[]
);

export const OBSTACLE_PATTERN_CATALOG: readonly ObstaclePatternDefinition[] = Object.freeze([
  { id: "boxes-single", kind: "box-stack", action: "jump", packagePattern: "single-low" },
  { id: "boxes-pair", kind: "box-stack", action: "jump", packagePattern: "pair-high" },
  { id: "boxes-triple", kind: "box-stack", action: "jump", packagePattern: "triple-arc" },
  { id: "boxes-quad", kind: "box-stack", action: "jump", packagePattern: "quad-arc" },
  { id: "boxes-seven", kind: "box-stack", action: "jump", packagePattern: "seven-arc" },
  { id: "pallet-pair", kind: "pallet", action: "jump", packagePattern: "pair-low" },
  { id: "pallet-step", kind: "pallet", action: "jump", packagePattern: "triple-step" },
  { id: "pallet-rise", kind: "pallet", action: "jump", packagePattern: "quad-rise" },
  { id: "pallet-wave", kind: "pallet", action: "jump", packagePattern: "six-wave" },
  { id: "trolley-arc", kind: "trolley", action: "jump", packagePattern: "five-arc" },
  { id: "trolley-step", kind: "trolley", action: "jump", packagePattern: "five-step" },
  { id: "trolley-six", kind: "trolley", action: "jump", packagePattern: "six-arc" },
  { id: "trolley-seven", kind: "trolley", action: "jump", packagePattern: "seven-wave" },
  { id: "beam-single", kind: "overhead", action: "slide", packagePattern: "single-low" },
  { id: "beam-pair", kind: "overhead", action: "slide", packagePattern: "pair-low" },
  { id: "beam-triple", kind: "overhead", action: "slide", packagePattern: "triple-arc" },
  { id: "beam-five", kind: "overhead", action: "slide", packagePattern: "five-wave" },
  { id: "beam-seven", kind: "overhead", action: "slide", packagePattern: "seven-wave" }
]);

class ShuffleBag<T> {
  private remaining: T[] = [];
  private last: T | null = null;

  public constructor(private readonly values: readonly T[], private readonly random: SeededRandom) {}

  public next(): T {
    if (this.remaining.length === 0) {
      this.remaining = [...this.values];
      for (let index = this.remaining.length - 1; index > 0; index -= 1) {
        const swap = this.random.integer(0, index);
        [this.remaining[index], this.remaining[swap]] = [this.remaining[swap]!, this.remaining[index]!];
      }
      if (this.remaining.length > 1 && this.remaining.at(-1) === this.last) {
        [this.remaining[0], this.remaining[this.remaining.length - 1]] =
          [this.remaining.at(-1)!, this.remaining[0]!];
      }
    }
    const value = this.remaining.pop();
    if (value === undefined) throw new Error("Shuffle bag requires at least one value");
    this.last = value;
    return value;
  }
}

/** Full airtime of one jump (takeoff to landing), used to size the pack arc. */
const JUMP_FLIGHT_SECONDS = (-PHYSICS.jumpVelocity * 2) / PHYSICS.gravity;
/** Fraction of the jump the packs should span; <1 leaves a small margin. */
const PACKAGE_ARC_SPAN_FRACTION = 0.96;

function buildPackagePattern(
  heights: readonly number[],
  obstacleX: number,
  random: SeededRandom,
  speed: number
): PackageSpawn[] {
  const packCount = heights.length;
  const span = speed * JUMP_FLIGHT_SECONDS * PACKAGE_ARC_SPAN_FRACTION;
  const parcelFactType = PACKAGE_TYPE_VALUES[
    random.integer(0, PACKAGE_TYPE_VALUES.length - 1)
  ] ?? "notebook";
  return heights.map((height, index) => {
    const centering = packCount > 1 ? index / (packCount - 1) - 0.5 : 0;
    const offset = span * centering;
    const orderVisualType: OrderVisualType = "parcel";
    const collectibleClass: CollectibleClass = "parcel";
    return {
      x: obstacleX + offset,
      y: GROUND_Y - height - 15,
      phase: random.range(0, Math.PI * 2),
      kind: "standard",
      collectibleClass,
      packageType: parcelFactType,
      orderVisualType,
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
  private readonly obstaclePatterns: readonly ObstaclePatternDefinition[];
  private readonly patternBag: ShuffleBag<ObstaclePatternDefinition>;

  constructor(
    private readonly random: SeededRandom,
    initialSpeed: number,
    private readonly allowedKinds: readonly ObstacleKind[] = OBSTACLE_KINDS
  ) {
    this.distanceUntilNext = Math.max(1, initialSpeed) * 3.7;
    const allowedPatterns = OBSTACLE_PATTERN_CATALOG.filter(({ kind }) =>
      this.allowedKinds.includes(kind)
    );
    this.obstaclePatterns = allowedPatterns.length > 0
      ? allowedPatterns
      : OBSTACLE_PATTERN_CATALOG;
    this.patternBag = new ShuffleBag(this.obstaclePatterns, this.random);
  }

  advance(
    travelledPixels: number,
    speed: number,
    difficulty: Difficulty,
    spawnX: number
  ): SpawnWave | null {
    this.distanceUntilNext -= Math.max(0, travelledPixels);
    if (this.distanceUntilNext > 0) return null;

    const obstaclePattern = this.patternBag.next();
    const kind = obstaclePattern.kind;
    const spec = OBSTACLE_SPECS[kind];
    const isOverhead = kind === "overhead";
    const pattern = obstaclePattern.packagePattern;
    const gapPixels = calculateSpawnGap(speed, difficulty, this.random.next());
    this.distanceUntilNext += gapPixels;

    const baseHeights = PACKAGE_PATTERN_HEIGHTS[pattern];
    const rawPackageHeights = isOverhead
      ? baseHeights.map((_, index) => OVERHEAD_PACKAGE_HEIGHTS[index % OVERHEAD_PACKAGE_HEIGHTS.length]!)
      : baseHeights;
    const packageCount = Math.max(3, Math.min(6, rawPackageHeights.length));
    const packageHeights = Array.from({ length: packageCount }, (_, index) => {
      const sourceIndex = Math.round(
        index * (rawPackageHeights.length - 1) / Math.max(1, packageCount - 1)
      );
      return rawPackageHeights[sourceIndex] ?? rawPackageHeights[0]!;
    });
    const obstacleY = isOverhead ? OVERHEAD.topY : GROUND_Y - spec.height;

    const packages = buildPackagePattern(
      packageHeights,
      spawnX,
      this.random,
      speed
    );
    const leftmost = Math.min(spawnX, ...packages.map(({ x }) => x));
    const shift = Math.max(0, spawnX - leftmost);
    return {
      kind,
      source: "normal",
      pattern,
      obstaclePattern: obstaclePattern.id,
      x: spawnX + shift,
      y: obstacleY,
      width: spec.width,
      height: spec.height,
      packages: packages.map((parcel) => ({ ...parcel, x: parcel.x + shift })),
      gapPixels
    };
  }
}

/**
 * Builds one indivisible obstacle + reward pattern. The authored collectible
 * positions use the same proven jump/crouch trajectories as ordinary waves,
 * while a hard reaction-time floor lets the caller defer unsafe placement.
 */
export function createAuthoredRewardWave(
  options: AuthoredRewardWaveOptions
): SpawnWave | null {
  const speed = Math.max(1, options.speed);
  const minimumReactionSeconds = options.minimumReactionSeconds ?? MIN_AUTHORED_REACTION_SECONDS;
  const reactionSeconds = (options.spawnX - (RUNNER_X + RUNNER_WIDTH)) / speed;
  const packageCount = Math.max(3, Math.min(8, Math.floor(options.packageCount ?? 5)));
  if (reactionSeconds < minimumReactionSeconds ||
      options.rewards.length > 2) return null;
  if (options.rewards.some(({ kind, packageType, storyOrder }) =>
    (storyOrder === true &&
      (packageType === undefined || kind !== "standard"))
  )) return null;

  const patternIndex = Math.max(0, Math.floor(options.patternIndex ?? 0));
  const jumpKinds: readonly ObstacleKind[] = ["pallet", "box-stack", "trolley"];
  const requestedKind = options.obstacleKind;
  if (requestedKind &&
      (options.action === "slide" ? requestedKind !== "overhead" : requestedKind === "overhead")) {
    return null;
  }
  const kind = requestedKind ?? (options.action === "slide"
    ? "overhead"
    : jumpKinds[patternIndex % jumpKinds.length] ?? "pallet");
  const spec = OBSTACLE_SPECS[kind];
  const totalCount = packageCount + options.rewards.length;
  const fullHeights = kind === "overhead"
    ? OVERHEAD_PACKAGE_HEIGHTS
    : PACKAGE_PATTERN_HEIGHTS["seven-arc"];
  const heights = Array.from({ length: totalCount }, (_, index) => {
    const sourceIndex = Math.round(index * (fullHeights.length - 1) / Math.max(1, totalCount - 1));
    return fullHeights[sourceIndex] ?? fullHeights[0]!;
  });
  const span = Math.max(
    speed * JUMP_FLIGHT_SECONDS * PACKAGE_ARC_SPAN_FRACTION,
    Math.max(0, totalCount - 1) * 38
  );
  const rewardSlots = options.rewards.length === 1
    ? [Math.min(totalCount - 2, Math.ceil(totalCount * 0.62))]
    : [Math.max(1, Math.floor(totalCount / 3)), Math.min(totalCount - 2, Math.ceil(totalCount * 0.7))];
  const packageTypes = PACKAGE_TYPE_VALUES;
  let parcelIndex = 0;
  const packages = heights.map((height, index): PackageSpawn => {
    const centering = totalCount > 1 ? index / (totalCount - 1) - 0.5 : 0;
    const rewardIndex = rewardSlots.indexOf(index);
    const reward = rewardIndex >= 0 ? options.rewards[rewardIndex] : undefined;
    const packageKind = reward?.kind ?? "standard";
    const orderVisualType: OrderVisualType = reward?.kind === "standard" && reward.packageType
      ? reward.packageType
      : "parcel";
    const collectibleClass: CollectibleClass = orderVisualType === "parcel"
      ? "parcel"
      : "equipment";
    const factType = reward?.packageType ??
      packageTypes[(patternIndex + parcelIndex) % packageTypes.length] ?? "notebook";
    if (reward === undefined) parcelIndex += 1;
    return {
      x: options.spawnX + span * centering,
      // Slide-route parcels sit completely below the hanging beam; jump-route
      // parcels keep a small visual gap above the floor/obstacle arc.
      y: kind === "overhead" ? GROUND_Y - height : GROUND_Y - height - 15,
      phase: (patternIndex + index) * 0.73,
      kind: packageKind,
      collectibleClass,
      packageType: orderVisualType === "parcel" ? factType : orderVisualType,
      orderVisualType,
      weightKg: 0,
      storyRewardPattern: true,
      ...(options.authoredWaveId ? { authoredWaveId: options.authoredWaveId } : {}),
      ...(reward?.storyOrder === true ? { storyOrder: true } : {})
    };
  });

  const leftmostX = Math.min(options.spawnX, ...packages.map(({ x }) => x));
  const offscreenShift = Math.max(0, WORLD_WIDTH + GAMEPLAY.spawnPadding - leftmostX);
  return {
    kind,
    source: options.source ?? "story-reward",
    pattern: options.action === "slide" ? "five-wave" : "five-arc",
    obstaclePattern: `authored-${options.action}-${patternIndex % 6}`,
    x: options.spawnX + offscreenShift,
    y: kind === "overhead" ? OVERHEAD.topY : GROUND_Y - spec.height,
    width: spec.width,
    height: spec.height,
    packages: packages.map((parcel) => ({ ...parcel, x: parcel.x + offscreenShift })),
    gapPixels: speed * minimumReactionSeconds,
    ...(options.authoredWaveId ? { authoredWaveId: options.authoredWaveId } : {}),
    ...(options.authoredActionIndex === undefined
      ? {}
      : { authoredActionIndex: options.authoredActionIndex }),
    ...(options.semanticVariant ? { semanticVariant: options.semanticVariant } : {})
  };
}

export function activateTutorialPackages(packages: PackageModel[]): void {
  const firstX = WORLD_WIDTH + GAMEPLAY.spawnPadding;
  const positions = [firstX, firstX + 64, firstX + 128, firstX + 192, firstX + 256, firstX + 320];
  for (let index = 0; index < positions.length; index += 1) {
    const parcel = packages[index];
    const x = positions[index];
    if (!parcel || x === undefined) continue;
    parcel.active = true;
    parcel.kind = "standard";
    parcel.orderVisualType = index === 3 ? "notebook" : "parcel";
    parcel.collectibleClass = collectibleClassForVisual(parcel.orderVisualType);
    parcel.x = x;
    parcel.y = GROUND_Y - parcel.size - 17;
    parcel.phase = index * 0.9;
    parcel.packageType = parcel.orderVisualType === "parcel"
      ? "notebook"
      : parcel.orderVisualType;
    parcel.weightKg = 0;
    parcel.storyRewardPattern = false;
    parcel.authoredWaveId = "challenge-onboarding";
    delete parcel.storyOrder;
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
  if (wave.kind === "overhead") {
    let hash = 0;
    const key = `${wave.obstaclePattern}:${Math.round(wave.x)}:${wave.authoredActionIndex ?? 0}`;
    for (let index = 0; index < key.length; index += 1) {
      hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
    }
    obstacle.visualVariant = hash % 3;
  } else {
    delete obstacle.visualVariant;
  }
  obstacle.objectiveCredited = false;
  if (wave.authoredWaveId) obstacle.authoredWaveId = wave.authoredWaveId;
  else delete obstacle.authoredWaveId;
  if (wave.authoredActionIndex !== undefined) obstacle.authoredActionIndex = wave.authoredActionIndex;
  else delete obstacle.authoredActionIndex;
  if (wave.semanticVariant) obstacle.semanticVariant = wave.semanticVariant;
  else delete obstacle.semanticVariant;

  for (let index = 0; index < wave.packages.length; index += 1) {
    const spawn = wave.packages[index];
    const parcel = freePackages[index];
    if (!spawn || !parcel) return false;
    parcel.active = true;
    parcel.kind = spawn.kind;
    parcel.collectibleClass = spawn.collectibleClass;
    parcel.x = spawn.x;
    parcel.y = spawn.y;
    parcel.phase = spawn.phase;
    parcel.packageType = spawn.packageType;
    parcel.orderVisualType = spawn.orderVisualType;
    parcel.weightKg = spawn.weightKg;
    parcel.storyRewardPattern = spawn.storyRewardPattern === true;
    if (wave.authoredWaveId) parcel.authoredWaveId = wave.authoredWaveId;
    else delete parcel.authoredWaveId;
    if (spawn.storyOrder === true) parcel.storyOrder = true;
    else delete parcel.storyOrder;
  }
  return true;
}

export function createBossAttackWave(kind: ObstacleKind, spawnX: number): SpawnWave {
  const spec = OBSTACLE_SPECS[kind];
  return {
    kind,
    source: "boss",
    pattern: "single-low",
    obstaclePattern: `boss-${kind}`,
    x: spawnX,
    y: kind === "overhead" ? OVERHEAD.topY : GROUND_Y - spec.height,
    width: spec.width,
    height: spec.height,
    packages: [],
    gapPixels: 0
  };
}
