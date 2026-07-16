export const MILESTONE_CELEBRATION_KINDS = [
  "confetti",
  "pulse",
  "ribbons",
  "package-rain",
  "route-wave"
] as const;

export type MilestoneCelebrationKind = (typeof MILESTONE_CELEBRATION_KINDS)[number];

export interface MilestoneCelebrationPresentation {
  readonly durationSeconds: number;
  readonly audioNotes: readonly number[];
}

/** Shared non-visual presentation tokens for every celebration variant. */
export const MILESTONE_CELEBRATION_PRESENTATION = {
  confetti: { durationSeconds: 1.25, audioNotes: [523.25, 659.25, 783.99] },
  pulse: { durationSeconds: 1.3, audioNotes: [392, 587.33, 783.99] },
  ribbons: { durationSeconds: 1.35, audioNotes: [440, 554.37, 659.25, 880] },
  "package-rain": { durationSeconds: 1.45, audioNotes: [329.63, 493.88, 659.25, 987.77] },
  "route-wave": { durationSeconds: 1.5, audioNotes: [261.63, 392, 523.25, 783.99] }
} as const satisfies Record<MilestoneCelebrationKind, MilestoneCelebrationPresentation>;

export interface MilestoneCelebrationEvent {
  readonly threshold: number;
  readonly kind: MilestoneCelebrationKind;
  readonly intensity: number;
  readonly durationSeconds: number;
  readonly text: string;
}

export interface MilestoneCelebrationSnapshot extends MilestoneCelebrationEvent {
  readonly remainingSeconds: number;
  readonly progress: number;
}

function formatThreshold(value: number): string {
  return Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/gu, " ");
}

export function nextPackageMilestone(current: number, sequenceIndex: number): number {
  return current * (sequenceIndex % 2 === 0 ? 5 : 2);
}

function createCelebration(threshold: number, sequenceIndex: number): MilestoneCelebrationEvent {
  const variantIndex = sequenceIndex % MILESTONE_CELEBRATION_KINDS.length;
  const kind = MILESTONE_CELEBRATION_KINDS[variantIndex]!;
  return {
    threshold,
    kind,
    intensity: Math.floor(sequenceIndex / MILESTONE_CELEBRATION_KINDS.length) + 1,
    durationSeconds: MILESTONE_CELEBRATION_PRESENTATION[kind].durationSeconds,
    text: `${formatThreshold(threshold)} PACZEK!`
  };
}

/** Run-scoped threshold state. Story-to-challenge deliberately does not reset it. */
export class MilestoneCelebrationDirector {
  private threshold = 10;
  private sequenceIndex = 0;
  private active: MilestoneCelebrationSnapshot | null = null;
  private readonly queue: MilestoneCelebrationEvent[] = [];

  public get nextThreshold(): number {
    return this.threshold;
  }

  public get snapshot(): MilestoneCelebrationSnapshot | null {
    return this.active === null ? null : { ...this.active };
  }

  public recordPackages(total: number, safeToPresent = true): MilestoneCelebrationEvent[] {
    const emitted: MilestoneCelebrationEvent[] = [];
    while (total >= this.threshold) {
      const celebration = createCelebration(this.threshold, this.sequenceIndex);
      emitted.push(celebration);
      if (this.active === null && safeToPresent) this.activate(celebration);
      else this.queue.push(celebration);
      this.threshold = nextPackageMilestone(this.threshold, this.sequenceIndex);
      this.sequenceIndex += 1;
    }
    return emitted;
  }

  public advance(deltaSeconds: number, safeToPresent = true): void {
    if (this.active === null) {
      if (safeToPresent) {
        const next = this.queue.shift();
        if (next !== undefined) this.activate(next);
      }
      return;
    }
    if (deltaSeconds <= 0) return;
    const remainingSeconds = Math.max(0, this.active.remainingSeconds - deltaSeconds);
    if (remainingSeconds > 0) {
      this.active = {
        ...this.active,
        remainingSeconds,
        progress: 1 - remainingSeconds / this.active.durationSeconds
      };
      return;
    }
    this.active = null;
    if (safeToPresent) {
      const next = this.queue.shift();
      if (next !== undefined) this.activate(next);
    }
  }

  public reset(): void {
    this.threshold = 10;
    this.sequenceIndex = 0;
    this.active = null;
    this.queue.length = 0;
  }

  private activate(event: MilestoneCelebrationEvent): void {
    this.active = {
      ...event,
      remainingSeconds: event.durationSeconds,
      progress: 0
    };
  }
}
