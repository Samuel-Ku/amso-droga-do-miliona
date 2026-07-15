import type { ObstacleKind, ObstacleModel } from "./types";
import type { StoryPositiveMotif } from "./story-climax";

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
