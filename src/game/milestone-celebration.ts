export const MILESTONE_CELEBRATION_KINDS = [
  "confetti-pop",
  "confetti-sides",
  "confetti-streamers",
  "confetti-burst",
  "confetti-finale"
] as const;

export type MilestoneCelebrationKind = (typeof MILESTONE_CELEBRATION_KINDS)[number];

export interface MilestoneCelebrationPresentation {
  readonly durationSeconds: number;
  readonly audioNotes: readonly number[];
}

/** Shared non-visual presentation tokens for every celebration variant. */
export const MILESTONE_CELEBRATION_PRESENTATION = {
  "confetti-pop": { durationSeconds: 1.2, audioNotes: [523.25, 659.25, 783.99] },
  "confetti-sides": { durationSeconds: 1.3, audioNotes: [523.25, 659.25, 783.99, 1046.5] },
  "confetti-streamers": { durationSeconds: 1.35, audioNotes: [440, 554.37, 659.25, 880] },
  "confetti-burst": { durationSeconds: 1.45, audioNotes: [392, 523.25, 659.25, 987.77] },
  "confetti-finale": { durationSeconds: 1.5, audioNotes: [261.63, 392, 523.25, 659.25, 783.99] }
} as const satisfies Record<MilestoneCelebrationKind, MilestoneCelebrationPresentation>;

export interface MilestoneCelebrationEvent {
  readonly threshold: number;
  readonly kind: MilestoneCelebrationKind;
  readonly intensity: number;
  readonly durationSeconds: number;
  readonly text: string;
  readonly achievement?: "record";
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

  public recordPackages(
    total: number,
    safeToPresent = true,
    achievementText?: string
  ): MilestoneCelebrationEvent[] {
    const emitted: MilestoneCelebrationEvent[] = [];
    while (total >= this.threshold) {
      const base = createCelebration(this.threshold, this.sequenceIndex);
      const celebration = achievementText === undefined
        ? base
        : this.finaleEvent(
            base.threshold,
            `${achievementText} · ${base.text}`,
            base.intensity,
            "record"
          );
      emitted.push(celebration);
      this.enqueue(celebration, safeToPresent);
      this.threshold = nextPackageMilestone(this.threshold, this.sequenceIndex);
      this.sequenceIndex += 1;
    }
    return emitted;
  }

  public recordAchievement(
    total: number,
    text: string,
    safeToPresent = true
  ): MilestoneCelebrationEvent {
    const event = this.finaleEvent(Math.max(0, Math.floor(total)), text, 2, "record");
    this.enqueue(event, safeToPresent);
    return event;
  }

  private finaleEvent(
    threshold: number,
    text: string,
    intensity: number,
    achievement?: "record"
  ): MilestoneCelebrationEvent {
    return {
      threshold,
      kind: "confetti-finale",
      intensity: Math.max(2, intensity),
      durationSeconds: MILESTONE_CELEBRATION_PRESENTATION["confetti-finale"].durationSeconds,
      text,
      ...(achievement === undefined ? {} : { achievement })
    };
  }

  private enqueue(event: MilestoneCelebrationEvent, safeToPresent: boolean): void {
    if (this.active === null && safeToPresent) this.activate(event);
    else this.queue.push(event);
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
