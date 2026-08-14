export type EffectType =
  | "confetti-burst"
  | "side-cannon"
  | "sparkles"
  | "energy-wave"
  | "package-particles"
  | "coin-particles"
  | "screen-flash";

export interface EffectConfig {
  type: EffectType;
  particleCount: [number, number];
  colors: readonly string[];
  origin: "player" | "center" | "left" | "right" | "sides";
  spread: number;
}

export interface CelebrationPhase {
  durationMs: number;
  effects: EffectConfig[];
}

export type TierStage = "spark" | "boost" | "impact" | "milestone" | "legendary";

export interface TierConfig {
  stage: TierStage;
  variants: CelebrationPhase[][];
}

export interface CelebrationTrigger {
  threshold: number;
  isRecord: boolean;
  playerX: number;
  playerY: number;
}

export interface CelebrationState {
  stage: TierStage;
  phaseIndex: number;
  phaseProgress: number;
  phaseDurationMs: number;
  effects: EffectConfig[];
  playerX: number;
  playerY: number;
  elapsedMs: number;
  totalDurationMs: number;
  isSmallScreen: boolean;
}

const COLORS = {
  orange: "#f15a24",
  orangeLight: "#f47b20",
  red: "#e30613",
  redDark: "#a50000",
  white: "#ffffff",
} as const;

function confetti(count: [number, number], origin: EffectConfig["origin"], spread = 55): EffectConfig {
  return {
    type: "confetti-burst",
    particleCount: count,
    colors: [COLORS.orange, COLORS.red, COLORS.redDark, COLORS.orangeLight],
    origin,
    spread,
  };
}

function sideCannon(count: [number, number]): EffectConfig {
  return {
    type: "side-cannon",
    particleCount: count,
    colors: [COLORS.orange, COLORS.red, COLORS.white],
    origin: "sides",
    spread: 70,
  };
}

function sparkles(count: [number, number]): EffectConfig {
  return {
    type: "sparkles",
    particleCount: count,
    colors: [COLORS.orangeLight, COLORS.white],
    origin: "player",
    spread: 30,
  };
}

function energyWave(): EffectConfig {
  return {
    type: "energy-wave",
    particleCount: [1, 1],
    colors: [COLORS.orange],
    origin: "center",
    spread: 0,
  };
}

function packageParticles(count: [number, number]): EffectConfig {
  return {
    type: "package-particles",
    particleCount: count,
    colors: [COLORS.orange, COLORS.redDark],
    origin: "player",
    spread: 60,
  };
}

function coinParticles(count: [number, number]): EffectConfig {
  return {
    type: "coin-particles",
    particleCount: count,
    colors: [COLORS.orangeLight, COLORS.white],
    origin: "center",
    spread: 40,
  };
}

function screenFlash(): EffectConfig {
  return {
    type: "screen-flash",
    particleCount: [1, 1],
    colors: [COLORS.white, COLORS.orange],
    origin: "center",
    spread: 0,
  };
}

const SPARK_VARIANTS: CelebrationPhase[][] = [
  [
    { durationMs: 600, effects: [confetti([20, 30], "player", 45)] },
    { durationMs: 400, effects: [sparkles([5, 10])] },
  ],
  [
    { durationMs: 700, effects: [confetti([25, 35], "center", 50)] },
  ],
  [
    { durationMs: 400, effects: [sparkles([8, 14])] },
    { durationMs: 500, effects: [confetti([30, 40], "player", 55)] },
  ],
];

const BOOST_VARIANTS: CelebrationPhase[][] = [
  [
    { durationMs: 800, effects: [confetti([40, 55], "player", 60), sparkles([10, 16])] },
  ],
  [
    { durationMs: 700, effects: [confetti([35, 50], "center", 55), sparkles([8, 12])] },
  ],
  [
    { durationMs: 400, effects: [sparkles([12, 18])] },
    { durationMs: 600, effects: [confetti([50, 65], "player", 65)] },
  ],
];

const IMPACT_VARIANTS: CelebrationPhase[][] = [
  [
    { durationMs: 500, effects: [confetti([50, 70], "player", 65)] },
    { durationMs: 500, effects: [sparkles([15, 22]), energyWave()] },
  ],
  [
    { durationMs: 400, effects: [confetti([40, 60], "center", 60), energyWave()] },
    { durationMs: 500, effects: [sparkles([10, 18])] },
  ],
  [
    { durationMs: 700, effects: [confetti([60, 80], "player", 70), sparkles([12, 20])] },
    { durationMs: 400, effects: [energyWave()] },
  ],
];

const MILESTONE_VARIANTS: CelebrationPhase[][] = [
  [
    { durationMs: 300, effects: [screenFlash()] },
    { durationMs: 600, effects: [confetti([70, 90], "sides", 70), sideCannon([15, 25])] },
    { durationMs: 500, effects: [packageParticles([8, 14])] },
  ],
  [
    { durationMs: 500, effects: [energyWave(), sparkles([15, 25])] },
    { durationMs: 600, effects: [confetti([80, 100], "player", 75), coinParticles([6, 12])] },
  ],
  [
    { durationMs: 400, effects: [sideCannon([20, 30]), screenFlash()] },
    { durationMs: 500, effects: [confetti([90, 110], "center", 80), coinParticles([8, 14])] },
  ],
];

const LEGENDARY_VARIANTS: CelebrationPhase[][] = [
  [
    { durationMs: 300, effects: [screenFlash()] },
    { durationMs: 500, effects: [sideCannon([25, 35]), confetti([80, 100], "sides", 75)] },
    { durationMs: 500, effects: [packageParticles([10, 18]), coinParticles([8, 14])] },
    { durationMs: 400, effects: [screenFlash(), confetti([60, 80], "center", 70)] },
  ],
  [
    { durationMs: 500, effects: [confetti([90, 110], "sides", 80), energyWave()] },
    { durationMs: 500, effects: [coinParticles([10, 18]), packageParticles([12, 20])] },
    { durationMs: 400, effects: [confetti([100, 130], "player", 85), sparkles([20, 30])] },
  ],
  [
    { durationMs: 300, effects: [screenFlash(), sideCannon([20, 30])] },
    { durationMs: 600, effects: [confetti([110, 140], "sides", 85), sparkles([18, 28]), coinParticles([10, 16])] },
    { durationMs: 400, effects: [screenFlash(), confetti([70, 90], "center", 75)] },
  ],
];

export const CELEBRATION_TIERS: TierConfig[] = [
  { stage: "spark", variants: SPARK_VARIANTS },
  { stage: "boost", variants: BOOST_VARIANTS },
  { stage: "impact", variants: IMPACT_VARIANTS },
  { stage: "milestone", variants: MILESTONE_VARIANTS },
  { stage: "legendary", variants: LEGENDARY_VARIANTS },
];

const STAGE_ORDER: TierStage[] = ["spark", "boost", "impact", "milestone", "legendary"];

const MAX_REDUCED_MOTION_DURATION_MS = 1000;

export class CelebrationManager {
  private variantCounters = new Map<number, number>();
  private screenWidthPx: number;
  private reducedMotion: boolean;

  private active: {
    config: TierConfig;
    variantIndex: number;
    phaseIndex: number;
    elapsedMs: number;
    playerX: number;
    playerY: number;
    adaptedDurationsMs: number[];
  } | null = null;

  constructor(options?: { screenWidthPx?: number; reducedMotion?: boolean }) {
    this.screenWidthPx = options?.screenWidthPx ?? 1024;
    this.reducedMotion = options?.reducedMotion ?? false;
  }

  setScreenWidth(width: number): void {
    this.screenWidthPx = width;
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  trigger(trigger: CelebrationTrigger): void {
    const { threshold, isRecord, playerX, playerY } = trigger;
    const stage = this.resolveStage(threshold, isRecord);
    const config = CELEBRATION_TIERS.find((t) => t.stage === stage);
    if (config === undefined) return;

    const counter = this.variantCounters.get(threshold) ?? 0;
    this.variantCounters.set(threshold, counter + 1);

    const variantIndex = counter % config.variants.length;

    const rawPhases = config.variants[variantIndex];
    if (rawPhases === undefined) return;

    const adaptedDurationsMs = this.adaptPhaseDurations(rawPhases);

    this.active = {
      config,
      variantIndex,
      phaseIndex: 0,
      elapsedMs: 0,
      playerX,
      playerY,
      adaptedDurationsMs,
    };
  }

  update(deltaSeconds: number): void {
    if (this.active === null) return;

    this.active.elapsedMs += deltaSeconds * 1000;

    const { adaptedDurationsMs } = this.active;

    let accumulated = 0;
    for (let i = 0; i < adaptedDurationsMs.length; i++) {
      const duration = adaptedDurationsMs[i]!;
      accumulated += duration;
      if (this.active.elapsedMs < accumulated) {
        this.active.phaseIndex = i;
        return;
      }
    }

    this.active = null;
  }

  getState(): CelebrationState | null {
    if (this.active === null) return null;

    const phases = this.active.config.variants[this.active.variantIndex];
    if (phases === undefined) return null;

    const phase = phases[this.active.phaseIndex];
    if (phase === undefined) return null;

    const { adaptedDurationsMs } = this.active;

    let phaseStartMs = 0;
    for (let i = 0; i < this.active.phaseIndex; i++) {
      phaseStartMs += adaptedDurationsMs[i]!;
    }

    const phaseElapsed = this.active.elapsedMs - phaseStartMs;
    const phaseDurationMs = adaptedDurationsMs[this.active.phaseIndex]!;
    const phaseProgress = Math.min(1, phaseElapsed / phaseDurationMs);

    const totalDurationMs = adaptedDurationsMs.reduce((sum, d) => sum + d, 0);

    return {
      stage: this.active.config.stage,
      phaseIndex: this.active.phaseIndex,
      phaseProgress,
      phaseDurationMs,
      effects: phase.effects,
      playerX: this.active.playerX,
      playerY: this.active.playerY,
      elapsedMs: this.active.elapsedMs,
      totalDurationMs,
      isSmallScreen: this.screenWidthPx < 768,
    };
  }

  cancel(): void {
    this.active = null;
  }

  reset(): void {
    this.active = null;
    this.variantCounters.clear();
  }

  private adaptPhaseDurations(phases: CelebrationPhase[]): number[] {
    const raw = phases.map((p) => p.durationMs);

    if (this.reducedMotion) {
      const cap = Math.min(MAX_REDUCED_MOTION_DURATION_MS, raw[0] ?? 600);
      return [cap];
    }

    const scale = this.screenWidthPx < 768 ? 0.7 : 1;
    return raw.map((d) => Math.round(d * scale));
  }

  private resolveStage(threshold: number, isRecord: boolean): TierStage {
    let stage: TierStage;
    if (threshold <= 50) stage = "spark";
    else if (threshold <= 100) stage = "boost";
    else if (threshold <= 500) stage = "impact";
    else if (threshold <= 1000) stage = "milestone";
    else stage = "legendary";

    if (isRecord && stage !== "legendary") {
      const idx = STAGE_ORDER.indexOf(stage);
      stage = STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)]!;
    }

    return stage;
  }
}
