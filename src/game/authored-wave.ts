import type { ObstacleKind } from "./types";
import { validateAuthoredRouteGeometry } from "./spawning";
import {
  isSemanticObstacleVariant,
  type SemanticObstacleVariant
} from "./semantic-obstacle";

export type AuthoredWaveAction = "jump" | "slide";
export type StoryMicrolevelId =
  | "first-package"
  | "order-backlog"
  | "quality-process"
  | "client-growth"
  | "order-scale"
  | "million-threshold";

export interface AuthoredWaveDefinition {
  id: string;
  actions: readonly AuthoredWaveAction[];
  obstacleKinds: readonly ObstacleKind[];
  obstacleVariant: SemanticObstacleVariant;
  packageCount: number;
  telegraphSeconds: number;
  breathSeconds: number;
  speedMultiplier: number;
  reward?: "double-score" | "warranty" | "million";
}

export interface StoryMicrolevelDefinition {
  id: StoryMicrolevelId;
  segmentId: string;
  label: string;
  minimumDurationSeconds: number;
  speedStartMultiplier: number;
  speedEndMultiplier: number;
  waves: readonly AuthoredWaveDefinition[];
  repeatWavesUntil?: number;
  finaleOrderTarget?: number;
}

export type AuthoredWaveValidationCode =
  | "empty_program"
  | "duplicate_wave_id"
  | "invalid_action_count"
  | "action_obstacle_mismatch"
  | "invalid_package_count"
  | "telegraph_too_short"
  | "breath_too_short"
  | "speed_out_of_range"
  | "finale_target_out_of_range"
  | "unknown_obstacle_variant"
  | "unsafe_reward_geometry";

export interface AuthoredWaveValidationIssue {
  code: AuthoredWaveValidationCode;
  microlevelId: StoryMicrolevelId;
  waveId?: string;
  message: string;
}

export interface AuthoredWaveResult {
  waveId: string;
  attempts: number;
  ordersCollected: number;
  orderTarget: number;
  collectionRatio: number;
  actionSucceeded: boolean;
  passed: boolean;
  perfect: boolean;
}

export interface AuthoredWaveProgressSnapshot {
  microlevelId: StoryMicrolevelId;
  waveIndex: number;
  wavesCompleted: number;
  waveTarget: number;
  currentWaveId: string;
  currentActions?: readonly AuthoredWaveAction[];
  currentObstacleVariant?: SemanticObstacleVariant;
  attemptsOnCurrentWave: number;
  ordersCollectedOnCurrentWave: number;
  packagesAvailableOnCurrentWave: number;
  totalOrdersCollected: number;
  totalOrderTarget: number | null;
  elapsedSeconds: number;
  minimumDurationSeconds: number;
  completed: boolean;
  lastResult: AuthoredWaveResult | null;
}

export const STORY_WAVE_COLLECTION_RATIO = 0.6;
export const STORY_MIN_TELEGRAPH_SECONDS = 1.6;
export const CHALLENGE_MIN_TELEGRAPH_SECONDS = 1.2;
export const STORY_MIN_BREATH_SECONDS = 0.8;
export const STORY_MAX_BREATH_SECONDS = 1.2;

const jumpKinds: ReadonlySet<ObstacleKind> = new Set(["box-stack", "pallet", "trolley"]);
const FINALE_RECOVERY_WAVE: Readonly<AuthoredWaveDefinition> = Object.freeze({
  id: "million-safe-recovery",
  actions: ["jump"] as const,
  obstacleKinds: ["pallet"] as const,
  obstacleVariant: "recovery-route",
  packageCount: 3,
  telegraphSeconds: STORY_MIN_TELEGRAPH_SECONDS,
  breathSeconds: 1,
  speedMultiplier: 1.55
});

function actionMatchesObstacle(action: AuthoredWaveAction, kind: ObstacleKind): boolean {
  return action === "slide" ? kind === "overhead" : jumpKinds.has(kind);
}

export function requiredPackages(packageCount: number): number {
  return Math.ceil(Math.max(0, packageCount) * STORY_WAVE_COLLECTION_RATIO);
}

export function availablePackages(wave: Readonly<AuthoredWaveDefinition>): number {
  return wave.packageCount * wave.actions.length;
}

export function validateStoryMicrolevel(
  definition: Readonly<StoryMicrolevelDefinition>
): readonly AuthoredWaveValidationIssue[] {
  const issues: AuthoredWaveValidationIssue[] = [];
  const ids = new Set<string>();
  if (definition.waves.length === 0) {
    issues.push({
      code: "empty_program",
      microlevelId: definition.id,
      message: `${definition.id}: program must contain at least one authored wave.`
    });
  }
  if (definition.finaleOrderTarget !== undefined &&
      (definition.finaleOrderTarget < 30 || definition.finaleOrderTarget > 60)) {
    issues.push({
      code: "finale_target_out_of_range",
      microlevelId: definition.id,
      message: `${definition.id}: finale order target must stay between 30 and 60.`
    });
  }
  for (const wave of definition.waves) {
    if (ids.has(wave.id)) {
      issues.push({
        code: "duplicate_wave_id",
        microlevelId: definition.id,
        waveId: wave.id,
        message: `${definition.id}/${wave.id}: wave id must be unique.`
      });
    }
    ids.add(wave.id);
    if (!isSemanticObstacleVariant(wave.obstacleVariant)) {
      issues.push({
        code: "unknown_obstacle_variant",
        microlevelId: definition.id,
        waveId: wave.id,
        message: `${definition.id}/${wave.id}: unknown obstacle variant '${wave.obstacleVariant}'.`
      });
    }
    if (wave.actions.length < 1 || wave.actions.length > 3 ||
        wave.actions.length !== wave.obstacleKinds.length) {
      issues.push({
        code: "invalid_action_count",
        microlevelId: definition.id,
        waveId: wave.id,
        message: `${definition.id}/${wave.id}: actions and obstacles must contain 1–3 matching entries.`
      });
    }
    for (let index = 0; index < Math.min(wave.actions.length, wave.obstacleKinds.length); index += 1) {
      const action = wave.actions[index];
      const obstacle = wave.obstacleKinds[index];
      if (action && obstacle && !actionMatchesObstacle(action, obstacle)) {
        issues.push({
          code: "action_obstacle_mismatch",
          microlevelId: definition.id,
          waveId: wave.id,
          message: `${definition.id}/${wave.id}: ${obstacle} cannot teach ${action}.`
        });
      }
      if (action && obstacle && actionMatchesObstacle(action, obstacle)) {
        const geometryIssue = validateAuthoredRouteGeometry({
          action,
          obstacleKind: obstacle,
          packageCount: wave.packageCount,
          speed: 280 * wave.speedMultiplier,
          minimumReactionSeconds: wave.telegraphSeconds
        });
        if (geometryIssue) {
          issues.push({
            code: "unsafe_reward_geometry",
            microlevelId: definition.id,
            waveId: wave.id,
            message: `${definition.id}/${wave.id}: action ${index + 1} ${geometryIssue}.`
          });
        }
      }
    }
    if (wave.packageCount < 3 || wave.packageCount > 6) {
      issues.push({
        code: "invalid_package_count",
        microlevelId: definition.id,
        waveId: wave.id,
        message: `${definition.id}/${wave.id}: story waves require 3–6 packages.`
      });
    }
    if (wave.telegraphSeconds < STORY_MIN_TELEGRAPH_SECONDS) {
      issues.push({
        code: "telegraph_too_short",
        microlevelId: definition.id,
        waveId: wave.id,
        message: `${definition.id}/${wave.id}: telegraph must be at least ${STORY_MIN_TELEGRAPH_SECONDS}s.`
      });
    }
    if (wave.breathSeconds < STORY_MIN_BREATH_SECONDS ||
        wave.breathSeconds > STORY_MAX_BREATH_SECONDS) {
      issues.push({
        code: "breath_too_short",
        microlevelId: definition.id,
        waveId: wave.id,
        message: `${definition.id}/${wave.id}: breath must stay between ${STORY_MIN_BREATH_SECONDS}s and ${STORY_MAX_BREATH_SECONDS}s.`
      });
    }
    if (wave.speedMultiplier < 0.9 || wave.speedMultiplier > 1.9) {
      issues.push({
        code: "speed_out_of_range",
        microlevelId: definition.id,
        waveId: wave.id,
        message: `${definition.id}/${wave.id}: story speed must stay between 0.9× and 1.9×.`
      });
    }
  }
  return issues;
}

export class AuthoredWaveDirector {
  private waveIndex = 0;
  private wavesCompleted = 0;
  private attempts = 1;
  private ordersCollected = 0;
  private totalOrdersCollected = 0;
  private elapsedSeconds = 0;
  private lastResult: AuthoredWaveResult | null = null;

  public constructor(public readonly definition: Readonly<StoryMicrolevelDefinition>) {
    const issues = validateStoryMicrolevel(definition);
    if (issues.length > 0) throw new Error(issues.map(({ message }) => message).join("\n"));
  }

  public advance(deltaSeconds: number): void {
    this.elapsedSeconds += Math.max(0, deltaSeconds);
  }

  public recordPackage(): void {
    const wave = this.currentWave;
    if (!wave) return;
    const available = availablePackages(wave);
    if (this.ordersCollected >= available) return;
    this.ordersCollected += 1;
    this.totalOrdersCollected += 1;
  }

  public resolve(actionSucceeded: boolean): AuthoredWaveResult {
    const wave = this.currentWave;
    if (!wave) {
      throw new Error(`${this.definition.id}: no active authored wave to resolve.`);
    }
    const available = availablePackages(wave);
    const ratio = available <= 0 ? 0 : this.ordersCollected / available;
    const passed = actionSucceeded && this.ordersCollected >= requiredPackages(available);
    const result: AuthoredWaveResult = {
      waveId: wave.id,
      attempts: this.attempts,
      ordersCollected: this.ordersCollected,
      orderTarget: available,
      collectionRatio: ratio,
      actionSucceeded,
      passed,
      perfect: passed && this.ordersCollected === available
    };
    this.lastResult = result;
    if (passed) {
      this.wavesCompleted += 1;
      this.waveIndex = (this.waveIndex + 1) % this.definition.waves.length;
      this.attempts = 1;
    } else {
      if (this.definition.id === "quality-process") {
        this.wavesCompleted = Math.floor(this.wavesCompleted / 3) * 3;
        this.waveIndex = this.wavesCompleted % this.definition.waves.length;
      }
      this.attempts += 1;
    }
    this.ordersCollected = 0;
    return result;
  }

  public get currentWave(): Readonly<AuthoredWaveDefinition> | null {
    if (this.targetsCompleted) return null;
    const waveTarget = this.definition.repeatWavesUntil ?? this.definition.waves.length;
    if (this.definition.id === "million-threshold" && this.wavesCompleted >= waveTarget) {
      return FINALE_RECOVERY_WAVE;
    }
    return this.definition.waves[this.waveIndex] ?? null;
  }

  public get targetsCompleted(): boolean {
    const waveTarget = this.definition.repeatWavesUntil ?? this.definition.waves.length;
    const orderTarget = this.definition.finaleOrderTarget ?? 0;
    return this.wavesCompleted >= waveTarget && this.totalOrdersCollected >= orderTarget &&
      this.ordersCollected === 0;
  }

  public get completed(): boolean {
    return this.targetsCompleted && this.elapsedSeconds >= this.definition.minimumDurationSeconds;
  }

  public get snapshot(): AuthoredWaveProgressSnapshot {
    const wave = this.currentWave;
    return {
      microlevelId: this.definition.id,
      waveIndex: this.waveIndex,
      wavesCompleted: this.wavesCompleted,
      waveTarget: this.definition.repeatWavesUntil ?? this.definition.waves.length,
      currentWaveId: wave?.id ?? "",
      currentActions: wave?.actions ?? [],
      ...(wave ? { currentObstacleVariant: wave.obstacleVariant } : {}),
      attemptsOnCurrentWave: this.attempts,
      ordersCollectedOnCurrentWave: this.ordersCollected,
      packagesAvailableOnCurrentWave: wave ? availablePackages(wave) : 0,
      totalOrdersCollected: this.totalOrdersCollected,
      totalOrderTarget: this.definition.finaleOrderTarget ?? null,
      elapsedSeconds: this.elapsedSeconds,
      minimumDurationSeconds: this.definition.minimumDurationSeconds,
      completed: this.completed,
      lastResult: this.lastResult
    };
  }
}

function wave(
  id: string,
  action: AuthoredWaveAction,
  kind: ObstacleKind,
  packageCount: number,
  speedMultiplier: number,
  obstacleVariant: SemanticObstacleVariant,
  reward?: AuthoredWaveDefinition["reward"]
): AuthoredWaveDefinition {
  return {
    id,
    actions: [action],
    obstacleKinds: [kind],
    packageCount,
    speedMultiplier,
    obstacleVariant,
    telegraphSeconds: STORY_MIN_TELEGRAPH_SECONDS,
    breathSeconds: 1,
    ...(reward ? { reward } : {})
  };
}

function sequence(
  id: string,
  actions: readonly AuthoredWaveAction[],
  kinds: readonly ObstacleKind[],
  packageCount: number,
  speedMultiplier: number,
  obstacleVariant: SemanticObstacleVariant,
  reward?: AuthoredWaveDefinition["reward"]
): AuthoredWaveDefinition {
  return {
    id,
    actions,
    obstacleKinds: kinds,
    packageCount,
    speedMultiplier,
    obstacleVariant,
    telegraphSeconds: STORY_MIN_TELEGRAPH_SECONDS,
    breathSeconds: 1.1,
    ...(reward ? { reward } : {})
  };
}

export const STORY_MICROLEVELS: readonly StoryMicrolevelDefinition[] = Object.freeze([
  {
    id: "first-package",
    segmentId: "epoch_1.first_package",
    label: "Pierwsza paczka",
    minimumDurationSeconds: 25,
    speedStartMultiplier: 0.95,
    speedEndMultiplier: 1.15,
    waves: [
      wave("guided-parcel-arc", "jump", "pallet", 3, 0.95, "parcel-arc"),
      wave("guided-low-stack", "jump", "box-stack", 3, 1.02, "box-stack"),
      wave("guided-scanner-gate", "slide", "overhead", 3, 1.08, "scanner-gate"),
      sequence("guided-jump-slide", ["jump", "slide"], ["pallet", "overhead"], 4, 1.15, "dispatch-pair")
    ]
  },
  {
    id: "order-backlog",
    segmentId: "epoch_1.order_backlog",
    label: "Zator Zamówień",
    minimumDurationSeconds: 45,
    speedStartMultiplier: 1.1,
    speedEndMultiplier: 1.35,
    repeatWavesUntil: 8,
    waves: [
      wave("backlog-stack", "jump", "box-stack", 3, 1.1, "box-stack"),
      wave("backlog-beam", "slide", "overhead", 4, 1.14, "shelf-beam"),
      wave("backlog-pallet", "jump", "pallet", 3, 1.18, "loaded-pallet"),
      wave("backlog-curtain", "slide", "overhead", 4, 1.22, "warehouse-curtain"),
      wave("backlog-trolley", "jump", "trolley", 3, 1.25, "parcel-trolley"),
      wave("backlog-scanner", "slide", "overhead", 4, 1.28, "scanner-gate"),
      wave("backlog-crate", "jump", "box-stack", 3, 1.32, "equipment-crate"),
      wave("backlog-conveyor", "slide", "overhead", 4, 1.35, "low-conveyor")
    ]
  },
  {
    id: "quality-process",
    segmentId: "epoch_2.quality_process",
    label: "Proces i Jakość",
    minimumDurationSeconds: 40,
    speedStartMultiplier: 1.22,
    speedEndMultiplier: 1.48,
    repeatWavesUntil: 12,
    waves: [
      wave("quality-start", "jump", "pallet", 3, 1.22, "device-pallet"),
      wave("quality-scan", "slide", "overhead", 4, 1.3, "scanner-gate"),
      sequence("quality-seal", ["jump", "slide", "jump"], ["box-stack", "overhead", "trolley"], 5, 1.48, "checked-device", "double-score")
    ]
  },
  {
    id: "client-growth",
    segmentId: "epoch_3.client_growth",
    label: "Rozwój Firmy Klienta",
    minimumDurationSeconds: 35,
    speedStartMultiplier: 1.34,
    speedEndMultiplier: 1.58,
    repeatWavesUntil: 6,
    waves: [
      wave("client-first-laptop", "jump", "pallet", 3, 1.34, "first-laptop"),
      wave("client-first-workspace", "slide", "overhead", 3, 1.38, "first-laptop"),
      wave("client-growing-team", "jump", "pallet", 4, 1.43, "growing-team", "double-score"),
      wave("client-growing-routine", "slide", "overhead", 4, 1.48, "growing-team"),
      wave("client-established-office", "jump", "trolley", 5, 1.53, "established-office"),
      sequence(
        "client-established-continuity",
        ["jump", "slide"],
        ["box-stack", "overhead"],
        5,
        1.58,
        "established-office"
      )
    ]
  },
  {
    id: "order-scale",
    segmentId: "epoch_4.order_scale",
    label: "Skala Zamówień",
    minimumDurationSeconds: 45,
    speedStartMultiplier: 1.45,
    speedEndMultiplier: 1.7,
    repeatWavesUntil: 9,
    waves: [
      wave("scale-intake", "jump", "trolley", 3, 1.45, "intake", "warranty"),
      wave("scale-intake-scan", "slide", "overhead", 4, 1.48, "intake"),
      wave("scale-intake-stack", "jump", "pallet", 3, 1.5, "intake"),
      wave("scale-routing-sort", "slide", "overhead", 4, 1.55, "routing"),
      wave("scale-routing-lift", "jump", "box-stack", 3, 1.58, "routing"),
      wave("scale-routing-check", "slide", "overhead", 4, 1.61, "routing"),
      wave("scale-dispatch-load", "jump", "trolley", 3, 1.64, "dispatch"),
      wave("scale-dispatch-gate", "slide", "overhead", 4, 1.67, "dispatch"),
      sequence(
        "scale-dispatch-flow",
        ["jump", "slide"],
        ["box-stack", "overhead"],
        5,
        1.7,
        "dispatch"
      )
    ]
  },
  {
    id: "million-threshold",
    segmentId: "epoch_5.million_threshold",
    label: "Próg Miliona",
    minimumDurationSeconds: 65,
    speedStartMultiplier: 1.55,
    speedEndMultiplier: 1.85,
    repeatWavesUntil: 12,
    finaleOrderTarget: 30,
    waves: [
      wave("million-single-jump", "jump", "pallet", 3, 1.55, "single"),
      wave("million-single-slide", "slide", "overhead", 3, 1.58, "single"),
      sequence("million-double-jump", ["jump", "jump"], ["box-stack", "trolley"], 3, 1.61, "doublet"),
      sequence("million-jump-slide", ["jump", "slide"], ["pallet", "overhead"], 3, 1.64, "doublet"),
      sequence("million-slide-jump", ["slide", "jump"], ["overhead", "box-stack"], 3, 1.67, "doublet"),
      sequence("million-three-a", ["jump", "slide", "jump"], ["trolley", "overhead", "pallet"], 3, 1.7, "three-action"),
      sequence("million-three-b", ["slide", "jump", "slide"], ["overhead", "box-stack", "overhead"], 3, 1.72, "three-action"),
      wave("million-long-arc", "jump", "trolley", 3, 1.74, "long-arc"),
      wave("million-low-line", "slide", "overhead", 3, 1.76, "low-line"),
      sequence("million-tempo-a", ["jump", "jump", "slide"], ["pallet", "box-stack", "overhead"], 3, 1.79, "tempo-change"),
      sequence("million-tempo-b", ["slide", "jump", "jump"], ["overhead", "trolley", "pallet"], 3, 1.82, "tempo-change"),
      sequence("million-mastery", ["jump", "slide", "jump"], ["box-stack", "overhead", "trolley"], 3, 1.85, "mastery", "million")
    ]
  }
]);

export function storyMicrolevelForSegment(segmentId: string): Readonly<StoryMicrolevelDefinition> | null {
  return STORY_MICROLEVELS.find((definition) => definition.segmentId === segmentId) ?? null;
}

export function validateAllStoryMicrolevels(): readonly AuthoredWaveValidationIssue[] {
  return STORY_MICROLEVELS.flatMap((definition) => validateStoryMicrolevel(definition));
}
