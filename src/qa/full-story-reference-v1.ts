import {
  STORY_MICROLEVELS,
  availablePackages,
  requiredPackages,
  type AuthoredWaveAction,
  type StoryMicrolevelId
} from "../game/authored-wave";
import { resolvePlaySegmentVisual, type CampaignWorldId } from "../visuals/scene-manifest";

export const FULL_STORY_REFERENCE_SCENARIO_ID = "full-story-reference-v1" as const;

export interface FullStoryReferenceWave {
  readonly id: string;
  readonly actions: readonly AuthoredWaveAction[];
}

export interface FullStoryReferenceChapter {
  readonly microlevelId: StoryMicrolevelId;
  readonly segmentId: string;
  readonly waves: readonly FullStoryReferenceWave[];
  readonly routeWaveIds: readonly string[];
}

export interface FullStoryReferenceManifest {
  readonly scenarioId: typeof FULL_STORY_REFERENCE_SCENARIO_ID;
  readonly configVersion: 1;
  readonly seed: number;
  readonly finalOrderTarget: number;
  readonly chapters: readonly FullStoryReferenceChapter[];
  readonly routeWaveIds: readonly string[];
  readonly checkpoints: readonly Readonly<{
    microlevelId: StoryMicrolevelId;
    segmentId: string;
    worldId: CampaignWorldId;
    minimumCumulativePackages: number;
  }>[];
  readonly expectedFinalDigest: string | null;
}

function routeWaves(chapter: (typeof STORY_MICROLEVELS)[number]) {
  // The story ends when the public counter reaches one million. With the
  // reference input route that occurs after seven authored finale waves and a
  // bounded recovery pickup when required. The story result is gated by the
  // public counter itself, never by an arbitrary authored-wave count.
  if (chapter.id === "million-threshold") return chapter.waves.slice(0, 7);
  const count = chapter.repeatWavesUntil ?? chapter.waves.length;
  return Array.from({ length: count }, (_, index) => chapter.waves[index % chapter.waves.length]!);
}

let cumulativePackages = 0;
const checkpoints = STORY_MICROLEVELS.map((chapter) => {
  cumulativePackages += routeWaves(chapter).reduce(
    (sum, wave) => sum + requiredPackages(availablePackages(wave)), 0
  );
  return Object.freeze({
    microlevelId: chapter.id,
    segmentId: chapter.segmentId,
    worldId: resolvePlaySegmentVisual(chapter.segmentId, 1).worldId,
    minimumCumulativePackages: cumulativePackages
  });
});

function canonicalChapters(): readonly FullStoryReferenceChapter[] {
  return STORY_MICROLEVELS.map((chapter) => Object.freeze({
    microlevelId: chapter.id,
    segmentId: chapter.segmentId,
    waves: Object.freeze(chapter.waves.map((wave) => Object.freeze({
      id: wave.id,
      actions: Object.freeze([...wave.actions])
    }))),
    routeWaveIds: Object.freeze(routeWaves(chapter).map((wave) => wave.id))
  }));
}

export const FULL_STORY_REFERENCE_V1: Readonly<FullStoryReferenceManifest> = Object.freeze({
  scenarioId: FULL_STORY_REFERENCE_SCENARIO_ID,
  configVersion: 1,
  seed: 0x4d5a1202,
  finalOrderTarget: 1_000_000,
  chapters: Object.freeze(canonicalChapters()),
  routeWaveIds: Object.freeze(STORY_MICROLEVELS.flatMap((chapter) =>
    routeWaves(chapter).map((wave) => wave.id))),
  checkpoints: Object.freeze(checkpoints),
  expectedFinalDigest: "82afa27e9cf5071449966009bd54e5018cbfa6b8a397608fd3ae32f6f2c46bb9"
});

export function validateFullStoryReferenceManifest(
  manifest: Readonly<FullStoryReferenceManifest>
): readonly string[] {
  const issues: string[] = [];
  if (manifest.scenarioId !== FULL_STORY_REFERENCE_SCENARIO_ID) issues.push("scenario-id-mismatch");
  if (manifest.finalOrderTarget !== 1_000_000) issues.push("final-order-target-mismatch");
  const canonicalRoute = STORY_MICROLEVELS.flatMap((chapter) =>
    routeWaves(chapter).map((wave) => wave.id));
  if (manifest.routeWaveIds.join("|") !== canonicalRoute.join("|")) issues.push("route-wave-order-mismatch");
  if (manifest.checkpoints.length !== STORY_MICROLEVELS.length) issues.push("checkpoint-count-mismatch");
  if (manifest.chapters.length !== STORY_MICROLEVELS.length) issues.push("chapter-count-mismatch");
  STORY_MICROLEVELS.forEach((canonical, chapterIndex) => {
    const chapter = manifest.chapters[chapterIndex];
    if (!chapter || chapter.microlevelId !== canonical.id) {
      issues.push(`${canonical.id}:chapter-order-mismatch`);
      return;
    }
    if (chapter.segmentId !== canonical.segmentId) issues.push(`${canonical.id}:segment-mismatch`);
    if (chapter.routeWaveIds.join("|") !== routeWaves(canonical).map((wave) => wave.id).join("|")) {
      issues.push(`${canonical.id}:route-wave-order-mismatch`);
    }
    if (chapter.waves.length !== canonical.waves.length) {
      issues.push(`${canonical.id}:wave-count-mismatch`);
    }
    canonical.waves.forEach((canonicalWave, waveIndex) => {
      const wave = chapter.waves[waveIndex];
      if (!wave || wave.id !== canonicalWave.id) {
        issues.push(`${canonical.id}:${canonicalWave.id}:wave-order-mismatch`);
        return;
      }
      if (wave.actions.join(",") !== canonicalWave.actions.join(",")) {
        issues.push(`${canonical.id}:${canonicalWave.id}:action-order-mismatch`);
      }
    });
  });
  return Object.freeze(issues);
}
