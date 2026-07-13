import type {
  StoryBeatConfig,
  StoryConfig,
  StoryEpochConfig,
  StorySectionConfig
} from "../shared/types";
import { STORY_SYMBOL_COUNT } from "./story-effects";

export type StoryPhase = "prologue" | "epoch" | "finale" | "completed";
export type StoryStartCheckpoint =
  | "prologue"
  | "epoch_1"
  | "epoch_2"
  | "epoch_3"
  | "epoch_4"
  | "epoch_5"
  | "finale"
  | "completed";

interface TimelineSection {
  phase: Exclude<StoryPhase, "completed">;
  id: string;
  durationSeconds: number;
  beats: readonly StoryBeatConfig[];
  epochIndex: number;
  startsAtSeconds: number;
}

interface BeatWindow {
  beat: StoryBeatConfig;
  startsAt: number;
  endsAt: number;
}

export interface StoryTimelineSnapshot {
  phase: StoryPhase;
  sectionId: string;
  epochIndex: number;
  sectionElapsedSeconds: number;
  sectionDurationSeconds: number;
  totalElapsedSeconds: number;
  progress: number;
  activeBeats: readonly StoryBeatConfig[];
  trustCorridor: boolean;
  symbolsCollected: number;
  completed: boolean;
}

const HAND_BACK_SECONDS = 2;

function asSection(
  phase: "prologue" | "finale",
  section: StorySectionConfig,
  startsAtSeconds: number
): TimelineSection {
  return {
    phase,
    id: section.id,
    durationSeconds: section.durationSeconds,
    beats: section.beats,
    epochIndex: phase === "prologue" ? 0 : 4,
    startsAtSeconds
  };
}

function asEpoch(epoch: StoryEpochConfig, startsAtSeconds: number): TimelineSection {
  return {
    phase: "epoch",
    id: epoch.id,
    durationSeconds: epoch.durationSeconds,
    beats: epoch.beats,
    epochIndex: epoch.index,
    startsAtSeconds
  };
}

function buildSections(story: StoryConfig): TimelineSection[] {
  const sections: TimelineSection[] = [];
  let offset = 0;
  sections.push(asSection("prologue", story.prologue, offset));
  offset += story.prologue.durationSeconds;
  for (const epoch of story.epochs) {
    sections.push(asEpoch(epoch, offset));
    offset += epoch.durationSeconds;
  }
  sections.push(asSection("finale", story.finale, offset));
  return sections;
}

/**
 * Places every copy beat inside its configured chapter. Long chapters get quiet
 * gaps; dense chapters overlap adjacent cards instead of dropping copy or
 * running beyond the approved 175-second story budget.
 */
function createBeatWindows(section: TimelineSection): BeatWindow[] {
  const beats = section.beats;
  if (beats.length === 0) return [];

  if (section.phase === "epoch") {
    const groupCount = beats.length <= 6 ? 2 : 3;
    const groupSize = Math.ceil(beats.length / groupCount);
    const groups = Array.from({ length: groupCount }, (_, index) =>
      beats.slice(index * groupSize, (index + 1) * groupSize)
    ).filter((group) => group.length > 0);
    const margin = 0.5;

    return groups.flatMap((group, groupIndex) => {
      const longestExposure = Math.max(...group.map(({ maxExposureSeconds }) => maxExposureSeconds));
      const lastStart = section.epochIndex === 4
        ? section.durationSeconds - 2
        : Math.max(margin, section.durationSeconds - longestExposure - margin);
      const startsAt = groups.length === 1
        ? margin
        : groupIndex === 0
          ? margin
          : groupIndex === groups.length - 1
            ? lastStart
            : (section.durationSeconds - longestExposure) / 2;
      return group.map((beat) => ({
        beat,
        startsAt,
        endsAt: Math.min(section.durationSeconds, startsAt + beat.maxExposureSeconds)
      }));
    });
  }

  const totalExposure = beats.reduce(
    (total, beat) => total + beat.maxExposureSeconds,
    0
  );
  if (totalExposure <= section.durationSeconds) {
    const gap = (section.durationSeconds - totalExposure) / (beats.length + 1);
    let cursor = gap;
    return beats.map((beat) => {
      const startsAt = cursor;
      const endsAt = startsAt + beat.maxExposureSeconds;
      cursor = endsAt + gap;
      return { beat, startsAt, endsAt };
    });
  }

  const lastBeat = beats[beats.length - 1]!;
  const startSpan = Math.max(0, section.durationSeconds - lastBeat.maxExposureSeconds);
  return beats.map((beat, index) => {
    const startsAt = beats.length === 1
      ? startSpan
      : (startSpan * index) / (beats.length - 1);
    return {
      beat,
      startsAt,
      endsAt: Math.min(section.durationSeconds, startsAt + beat.maxExposureSeconds)
    };
  });
}

function checkpointIndex(checkpoint: StoryStartCheckpoint): number {
  if (checkpoint === "prologue") return 0;
  if (checkpoint === "finale") return 6;
  if (checkpoint === "completed") return 7;
  const epochNumber = Number(checkpoint.slice("epoch_".length));
  return Number.isInteger(epochNumber) && epochNumber >= 1 && epochNumber <= 5
    ? epochNumber
    : 0;
}

export class StoryTimeline {
  private readonly sections: readonly TimelineSection[];
  private readonly windows: readonly (readonly BeatWindow[])[];
  private readonly totalDurationSeconds: number;
  private sectionIndex: number;
  private elapsedInSection = 0;
  private readonly collectedStorySymbols = new Set<number>();

  public constructor(
    story: StoryConfig,
    checkpoint: StoryStartCheckpoint = "prologue"
  ) {
    this.sections = buildSections(story);
    this.windows = this.sections.map(createBeatWindows);
    this.totalDurationSeconds = this.sections.reduce(
      (total, section) => total + section.durationSeconds,
      0
    );
    this.sectionIndex = Math.min(checkpointIndex(checkpoint), this.sections.length);
    if (this.sectionIndex >= this.sections.length - 1) {
      for (let index = 0; index < STORY_SYMBOL_COUNT; index += 1) {
        this.collectedStorySymbols.add(index);
      }
    }
  }

  public collectStorySymbol(index: number): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= STORY_SYMBOL_COUNT ||
        this.collectedStorySymbols.has(index)) {
      return false;
    }
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
    while (remaining > 0 && this.sectionIndex < this.sections.length) {
      const section = this.sections[this.sectionIndex]!;
      const available = section.durationSeconds - this.elapsedInSection;
      const step = Math.min(remaining, available);
      this.elapsedInSection += step;
      remaining -= step;

      if (this.elapsedInSection + Number.EPSILON >= section.durationSeconds) {
        this.sectionIndex += 1;
        this.elapsedInSection = 0;
      }
    }
    return this.snapshot;
  }

  public get snapshot(): StoryTimelineSnapshot {
    const section = this.sections[this.sectionIndex];
    if (!section) {
      return {
        phase: "completed",
        sectionId: "completed",
        epochIndex: 4,
        sectionElapsedSeconds: 0,
        sectionDurationSeconds: 0,
        totalElapsedSeconds: this.totalDurationSeconds,
        progress: 1,
        activeBeats: [],
        trustCorridor: false,
        symbolsCollected: this.collectedStorySymbols.size,
        completed: true
      };
    }

    const elapsed = this.elapsedInSection;
    const windows = this.windows[this.sectionIndex] ?? [];
    const activeBeats = windows
      .filter(({ startsAt, endsAt }) => elapsed >= startsAt && elapsed < endsAt)
      .map(({ beat }) => beat);
    const latestFinishedAt = windows.reduce(
      (latest, window) => window.endsAt <= elapsed ? Math.max(latest, window.endsAt) : latest,
      Number.NEGATIVE_INFINITY
    );
    const trustCorridor = section.phase === "prologue" || section.phase === "finale" ||
      activeBeats.length > 0 || elapsed - latestFinishedAt < HAND_BACK_SECONDS;
    const totalElapsedSeconds = section.startsAtSeconds + elapsed;
    return {
      phase: section.phase,
      sectionId: section.id,
      epochIndex: section.epochIndex,
      sectionElapsedSeconds: elapsed,
      sectionDurationSeconds: section.durationSeconds,
      totalElapsedSeconds,
      progress: Math.min(1, totalElapsedSeconds / this.totalDurationSeconds),
      activeBeats,
      trustCorridor,
      symbolsCollected: this.collectedStorySymbols.size,
      completed: false
    };
  }
}
