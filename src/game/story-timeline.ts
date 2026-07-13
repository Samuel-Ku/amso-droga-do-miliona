import type {
  StoryBeatConfig,
  StoryConfig,
  StoryPlayStepConfig,
  StorySceneConfig,
  StorySequenceStepConfig
} from "../shared/types";
import { STORY_SYMBOL_COUNT } from "./story-effects";

export type StoryState = "scene" | "countdown" | "play" | "completed";
export type StoryPhase = "prologue" | "epoch" | "finale" | "completed";

export interface StoryTimelineSnapshot {
  state: StoryState;
  phase: StoryPhase;
  sectionId: string;
  epochIndex: number;
  sectionElapsedSeconds: number;
  sectionDurationSeconds: number;
  totalElapsedSeconds: number;
  totalActiveElapsedSeconds: number;
  totalActiveDurationSeconds: number;
  countdownSecondsRemaining: number;
  countdownValue: number | null;
  progress: number;
  sceneIndex: number;
  sceneCount: number;
  scene: Readonly<StorySceneConfig> | null;
  playSegment: Readonly<StoryPlayStepConfig> | null;
  activeBeats: readonly StoryBeatConfig[];
  trustCorridor: boolean;
  controlsEnabled: boolean;
  worldSpeedScale: number;
  symbolsCollected: number;
  completed: boolean;
}

function chapterPhase(scene: Readonly<StorySceneConfig> | null): StoryPhase {
  if (scene?.chapter === "prologue" || scene?.id.startsWith("intro.")) return "prologue";
  if (scene?.chapter === "finale" || scene?.id.startsWith("final.")) return "finale";
  return "epoch";
}

function sceneEpochIndex(scene: Readonly<StorySceneConfig> | null): number {
  const chapter = scene?.chapter;
  if (chapter?.startsWith("epoch_")) {
    const parsed = Number(chapter.slice("epoch_".length));
    if (Number.isInteger(parsed)) return Math.max(0, Math.min(4, parsed - 1));
  }
  return chapter === "finale" || scene?.id.startsWith("final.") ? 4 : 0;
}

/**
 * Player-paced narrative sequencer. Scene time is intentionally not measured:
 * only explicit continuation can replace copy, and only play steps advance the
 * five-minute active story clock.
 */
export class StoryTimeline {
  private readonly scenes: ReadonlyMap<string, Readonly<StorySceneConfig>>;
  private readonly sequence: readonly Readonly<StorySequenceStepConfig>[];
  private readonly totalActiveDurationSeconds: number;
  private stepIndex = 0;
  private state: StoryState;
  private segmentElapsedSeconds = 0;
  private totalActiveElapsedSeconds = 0;
  private countdownSecondsRemaining = 0;
  private pendingStepIndex: number | null = null;
  private readonly collectedStorySymbols = new Set<number>();

  public constructor(private readonly story: StoryConfig) {
    this.scenes = new Map(story.scenes.map((scene) => [scene.id, scene]));
    this.sequence = story.sequence;
    this.totalActiveDurationSeconds = story.sequence.reduce(
      (total, step) => total + (step.type === "play" ? step.durationSeconds : 0),
      0
    );
    this.state = this.stateForStep(this.currentStep);
  }

  public continueScene(expectedSceneId: string): boolean {
    if (this.state !== "scene" || this.currentStep?.type !== "scene") return false;
    if (this.currentStep.sceneId !== expectedSceneId) return false;
    const nextIndex = this.stepIndex + 1;
    const next = this.sequence[nextIndex];
    if (next?.type === "scene") {
      this.enterStep(nextIndex);
      return true;
    }
    this.state = "countdown";
    this.pendingStepIndex = nextIndex;
    this.countdownSecondsRemaining = this.story.resumeCountdownSeconds;
    return true;
  }

  public collectStorySymbol(index: number): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= STORY_SYMBOL_COUNT ||
        this.collectedStorySymbols.has(index)) return false;
    this.collectedStorySymbols.add(index);
    return true;
  }

  public get collectedStorySymbolIndices(): readonly number[] {
    return [...this.collectedStorySymbols].sort((left, right) => left - right);
  }

  public get missingStorySymbolIndices(): readonly number[] {
    return Array.from({ length: STORY_SYMBOL_COUNT }, (_, index) => index)
      .filter((index) => !this.collectedStorySymbols.has(index));
  }

  public advance(deltaSeconds: number): StoryTimelineSnapshot {
    let remaining = Math.max(0, deltaSeconds);
    while (remaining > 0) {
      if (this.state === "scene" || this.state === "completed") break;
      if (this.state === "countdown") {
        const step = Math.min(remaining, this.countdownSecondsRemaining);
        this.countdownSecondsRemaining = Math.max(0, this.countdownSecondsRemaining - step);
        remaining -= step;
        if (this.countdownSecondsRemaining <= Number.EPSILON) {
          this.enterStep(this.pendingStepIndex ?? this.sequence.length);
          this.pendingStepIndex = null;
        }
        continue;
      }

      const play = this.currentStep;
      if (play?.type !== "play") {
        this.state = "completed";
        break;
      }
      const available = Math.max(0, play.durationSeconds - this.segmentElapsedSeconds);
      const step = Math.min(remaining, available);
      this.segmentElapsedSeconds += step;
      this.totalActiveElapsedSeconds += step;
      remaining -= step;
      if (this.segmentElapsedSeconds + Number.EPSILON >= play.durationSeconds) {
        this.enterStep(this.stepIndex + 1);
      }
    }
    return this.snapshot;
  }

  public get snapshot(): StoryTimelineSnapshot {
    const step = this.currentStep;
    const scene = step?.type === "scene" ? this.scenes.get(step.sceneId) ?? null : null;
    const playSegment = step?.type === "play" ? step : null;
    const completed = this.state === "completed";
    const phase = completed ? "completed" : playSegment ? "epoch" : chapterPhase(scene);
    const epochIndex = playSegment?.epochIndex ?? sceneEpochIndex(scene);
    const sceneIndex = scene === null
      ? -1
      : this.story.scenes.findIndex(({ id }) => id === scene.id);
    const trustCorridor = this.state === "scene" || this.state === "countdown";
    return {
      state: this.state,
      phase,
      sectionId: scene?.chapter ?? playSegment?.id ?? (completed ? "completed" : "prologue"),
      epochIndex,
      sectionElapsedSeconds: playSegment ? this.segmentElapsedSeconds : 0,
      sectionDurationSeconds: playSegment?.durationSeconds ?? 0,
      totalElapsedSeconds: this.totalActiveElapsedSeconds,
      totalActiveElapsedSeconds: this.totalActiveElapsedSeconds,
      totalActiveDurationSeconds: this.totalActiveDurationSeconds,
      countdownSecondsRemaining: this.countdownSecondsRemaining,
      countdownValue: this.state === "countdown"
        ? Math.max(1, Math.ceil(this.countdownSecondsRemaining))
        : null,
      progress: this.totalActiveDurationSeconds <= 0
        ? Number(completed)
        : Math.min(1, this.totalActiveElapsedSeconds / this.totalActiveDurationSeconds),
      sceneIndex,
      sceneCount: this.story.scenes.length,
      scene,
      playSegment,
      activeBeats: [],
      trustCorridor,
      controlsEnabled: this.state === "play",
      worldSpeedScale: trustCorridor ? this.story.readingSpeedMultiplier : 1,
      symbolsCollected: this.collectedStorySymbols.size,
      completed
    };
  }

  private get currentStep(): Readonly<StorySequenceStepConfig> | undefined {
    return this.sequence[this.stepIndex];
  }

  private enterStep(index: number): void {
    this.stepIndex = Math.max(0, index);
    this.segmentElapsedSeconds = 0;
    this.countdownSecondsRemaining = 0;
    this.state = this.stateForStep(this.currentStep);
  }

  private stateForStep(step: Readonly<StorySequenceStepConfig> | undefined): StoryState {
    if (step === undefined) return "completed";
    return step.type === "scene" ? "scene" : "play";
  }
}
