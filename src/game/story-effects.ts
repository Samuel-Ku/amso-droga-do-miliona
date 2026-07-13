import type { ObstacleKind, ObstacleModel } from "./types";
import type { StoryPositiveMotif } from "./story-climax";

export const STORY_SYMBOL_COUNT = 8;
const TRANSFORMATION_DURATION_SECONDS = 0.85;

export interface StoryObstacleTransformation {
  active: boolean;
  motif: StoryPositiveMotif;
  obstacleKind: ObstacleKind;
  x: number;
  y: number;
  width: number;
  height: number;
  progress: number;
}

/** Keeps removed hazards on-screen just long enough to read their positive change. */
export class StoryObstacleTransformer {
  private activeModels: StoryObstacleTransformation[] = [];
  private elapsedSeconds = 0;

  public get models(): readonly Readonly<StoryObstacleTransformation>[] {
    return this.activeModels;
  }

  public reset(): void {
    this.activeModels = [];
    this.elapsedSeconds = 0;
  }

  public begin(
    obstacles: readonly Readonly<ObstacleModel>[],
    motif: StoryPositiveMotif
  ): void {
    this.elapsedSeconds = 0;
    this.activeModels = obstacles
      .filter(({ active }) => active)
      .map((obstacle) => ({
        active: true,
        motif,
        obstacleKind: obstacle.kind,
        x: obstacle.x,
        y: obstacle.y,
        width: obstacle.width,
        height: obstacle.height,
        progress: 0
      }));
  }

  public advance(deltaSeconds: number): void {
    if (this.activeModels.length === 0) return;
    this.elapsedSeconds += Math.max(0, deltaSeconds);
    const progress = Math.min(1, this.elapsedSeconds / TRANSFORMATION_DURATION_SECONDS);
    if (progress >= 1) {
      this.activeModels = [];
      return;
    }
    for (const model of this.activeModels) model.progress = progress;
  }
}

/** Deterministic queue for eight unique finale symbols, including missed retries. */
export class FinaleSymbolDirector {
  private readonly collected = new Set<number>();
  private readonly missed = new Set<number>();
  private readonly attempts = Array.from({ length: STORY_SYMBOL_COUNT }, () => 0);
  private _respawnCount = 0;

  public get respawnCount(): number {
    return this._respawnCount;
  }

  public reset(initiallyCollected: readonly number[] = []): void {
    this.collected.clear();
    this.missed.clear();
    this.attempts.fill(0);
    this._respawnCount = 0;
    for (const index of initiallyCollected) this.recordCollected(index);
  }

  public planSpawns(
    collected: readonly number[],
    active: readonly number[],
    limit: number
  ): number[] {
    const unavailable = new Set([...collected, ...active, ...this.collected]);
    const candidates = [
      ...[...this.missed].sort((left, right) => left - right),
      ...Array.from({ length: STORY_SYMBOL_COUNT }, (_, index) => index)
    ];
    const unique: number[] = [];
    for (const index of candidates) {
      if (unavailable.has(index) || unique.includes(index)) continue;
      unique.push(index);
      if (unique.length >= Math.max(0, Math.floor(limit))) break;
    }
    return unique;
  }

  /** Introduces every unique symbol once before scheduling missed retries. */
  public planAuthoredSpawns(
    collected: readonly number[],
    active: readonly number[],
    limit: number
  ): number[] {
    const unavailable = new Set([...collected, ...active, ...this.collected]);
    const unintroduced = Array.from({ length: STORY_SYMBOL_COUNT }, (_, index) => index)
      .filter((index) => (this.attempts[index] ?? 0) === 0);
    const candidates = [
      ...unintroduced,
      ...[...this.missed].sort((left, right) => left - right),
      ...Array.from({ length: STORY_SYMBOL_COUNT }, (_, index) => index)
    ];
    const unique: number[] = [];
    for (const index of candidates) {
      if (unavailable.has(index) || unique.includes(index)) continue;
      unique.push(index);
      if (unique.length >= Math.max(0, Math.floor(limit))) break;
    }
    return unique;
  }

  public planGuaranteedSpawns(
    collected: readonly number[],
    active: readonly number[] = []
  ): number[] {
    const unavailable = new Set([...collected, ...active, ...this.collected]);
    return Array.from({ length: STORY_SYMBOL_COUNT }, (_, index) => index)
      .filter((index) => !unavailable.has(index));
  }

  public recordSpawn(index: number): void {
    if (!this.isValid(index) || this.collected.has(index)) return;
    if ((this.attempts[index] ?? 0) > 0) this._respawnCount += 1;
    this.attempts[index] = (this.attempts[index] ?? 0) + 1;
    this.missed.delete(index);
  }

  public recordMiss(index: number): void {
    if (this.isValid(index) && !this.collected.has(index)) this.missed.add(index);
  }

  public recordCollected(index: number): void {
    if (!this.isValid(index)) return;
    this.collected.add(index);
    this.missed.delete(index);
  }

  private isValid(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < STORY_SYMBOL_COUNT;
  }
}
