import type { AssetBundleId, StoryChapterId } from "../shared/types";
import {
  WORLD_ARTWORK_CONTRACT,
  assertWorldArtworkContract,
  type WorldArtworkMeta
} from "./world-plate-transform";

export const CAMPAIGN_WORLD_IDS = [
  "first-mile",
  "order-process",
  "quality-service",
  "client-paths",
  "scale-logistics",
  "million-approach",
  "million-finale"
] as const;

export type CampaignWorldId = (typeof CAMPAIGN_WORLD_IDS)[number];
export type StoryCopyPlacement = "left" | "right";
export type StoryRunnerPresence = "absent" | "quiet";
export type StoryRevealMotion =
  | "seal"
  | "expand"
  | "route"
  | "tangle"
  | "align"
  | "diagnose"
  | "check"
  | "branch"
  | "open"
  | "build"
  | "sequence"
  | "rise"
  | "balance"
  | "travel"
  | "converge"
  | "count"
  | "return"
  | "continue"
  | "depart"
  | "match"
  | "dispatch"
  | "handoff"
  | "backlog";
export type StorySceneSoundCue =
  | "tape"
  | "laptop-start"
  | "test-signal"
  | "scanner"
  | "conveyor"
  | "counter";

export interface WorldCamera {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export interface WorldCropSet {
  readonly portrait: string;
  readonly landscape: string;
  readonly desktop: string;
}

export interface CampaignWorldDefinition {
  readonly worldId: CampaignWorldId;
  readonly bundleId: AssetBundleId;
  readonly assetPath: string;
  readonly fallbackId: string;
  readonly palette: "campaign-light";
  readonly artwork: Readonly<WorldArtworkMeta>;
}

export interface CampaignSceneVisualState {
  readonly stateId: string;
  /** Semantic SVG group reused by a renamed editorial scene. */
  readonly overlayStateId?: string;
  readonly chapter: StoryChapterId;
  readonly worldId: CampaignWorldId;
  readonly worldProgress: number;
  readonly copyPlacement: StoryCopyPlacement;
  readonly focalPoint: Readonly<{ x: number; y: number }>;
  readonly readingCamera: Readonly<WorldCamera>;
  readonly gameCamera: Readonly<WorldCamera>;
  readonly crops: Readonly<WorldCropSet>;
  readonly motifs: readonly string[];
  readonly visualEvent: string;
  readonly reveal: string;
  readonly revealMotion: StoryRevealMotion;
  readonly soundCue: StorySceneSoundCue;
  readonly fallbackId: string;
  readonly runnerPresence: StoryRunnerPresence;
}

const camera = (x: number, y: number, zoom = 1): WorldCamera => ({ x, y, zoom });
const crops = (portrait: string, landscape: string, desktop: string): WorldCropSet => ({
  portrait,
  landscape,
  desktop
});

export const CAMPAIGN_WORLDS: readonly CampaignWorldDefinition[] = Object.freeze([
  {
    worldId: "first-mile",
    bundleId: "prologue",
    assetPath: "/assets/milion-runner/worlds/world-01-first-mile-v2.webp",
    fallbackId: "fallback-first-mile",
    palette: "campaign-light",
    artwork: WORLD_ARTWORK_CONTRACT
  },
  {
    worldId: "order-process",
    bundleId: "epoch_1",
    assetPath: "/assets/milion-runner/worlds/world-02-order-process-v2.webp",
    fallbackId: "fallback-order-process",
    palette: "campaign-light",
    artwork: WORLD_ARTWORK_CONTRACT
  },
  {
    worldId: "quality-service",
    bundleId: "epoch_2",
    assetPath: "/assets/milion-runner/worlds/world-03-quality-service-v2.webp",
    fallbackId: "fallback-quality-service",
    palette: "campaign-light",
    artwork: WORLD_ARTWORK_CONTRACT
  },
  {
    worldId: "client-paths",
    bundleId: "epoch_3",
    assetPath: "/assets/milion-runner/worlds/world-04-client-paths-v2.webp",
    fallbackId: "fallback-client-paths",
    palette: "campaign-light",
    artwork: WORLD_ARTWORK_CONTRACT
  },
  {
    worldId: "scale-logistics",
    bundleId: "epoch_4",
    assetPath: "/assets/milion-runner/worlds/world-05-scale-logistics-v2.webp",
    fallbackId: "fallback-scale-logistics",
    palette: "campaign-light",
    artwork: WORLD_ARTWORK_CONTRACT
  },
  {
    worldId: "million-approach",
    bundleId: "epoch_5",
    assetPath: "/assets/milion-runner/worlds/world-06-million-approach-v2.webp",
    fallbackId: "fallback-million-approach",
    palette: "campaign-light",
    artwork: WORLD_ARTWORK_CONTRACT
  },
  {
    worldId: "million-finale",
    bundleId: "finale",
    assetPath: "/assets/milion-runner/worlds/world-07-million-finale-v2.webp",
    fallbackId: "fallback-million-finale",
    palette: "campaign-light",
    artwork: WORLD_ARTWORK_CONTRACT
  }
]);

assertWorldArtworkContract(CAMPAIGN_WORLDS);

const WORLD_STATE_MANIFEST: readonly CampaignSceneVisualState[] = Object.freeze([
  {
    stateId: "intro.ready",
    chapter: "prologue",
    worldId: "first-mile",
    worldProgress: 0.18,
    copyPlacement: "right",
    focalPoint: { x: 0.25, y: 0.53 },
    readingCamera: camera(0.34, 0.5, 1.04),
    gameCamera: camera(0.48, 0.58, 1.08),
    crops: crops("30% 50%", "42% 54%", "44% 50%"),
    motifs: ["first-package", "first-label", "hands"],
    visualEvent: "hands-seal-first-package",
    reveal: "tape-crosses-the-first-blank-label",
    revealMotion: "seal",
    soundCue: "tape",
    fallbackId: "fallback-intro-ready",
    runnerPresence: "absent"
  },
  {
    stateId: "intro.beginning",
    chapter: "prologue",
    worldId: "first-mile",
    worldProgress: 0.55,
    copyPlacement: "right",
    focalPoint: { x: 0.29, y: 0.43 },
    readingCamera: camera(0.37, 0.48, 1.02),
    gameCamera: camera(0.48, 0.58, 1.08),
    crops: crops("33% 48%", "43% 52%", "45% 50%"),
    motifs: ["small-warehouse", "few-shelves", "first-package"],
    visualEvent: "camera-reveals-the-small-warehouse",
    reveal: "shelves-draw-out-from-the-packing-table",
    revealMotion: "expand",
    soundCue: "conveyor",
    fallbackId: "fallback-intro-beginning",
    runnerPresence: "absent"
  },
  {
    stateId: "intro.promise",
    chapter: "prologue",
    worldId: "first-mile",
    worldProgress: 1,
    copyPlacement: "right",
    focalPoint: { x: 0.43, y: 0.55 },
    readingCamera: camera(0.42, 0.5, 1),
    gameCamera: camera(0.5, 0.6, 1.08),
    crops: crops("43% 52%", "48% 55%", "48% 52%"),
    motifs: ["tested-device", "route-line", "first-label"],
    visualEvent: "tested-laptop-powers-the-first-route",
    reveal: "laptop-light-sends-the-route-offscreen",
    revealMotion: "route",
    soundCue: "laptop-start",
    fallbackId: "fallback-intro-promise",
    runnerPresence: "absent"
  },
  {
    stateId: "epoch_1.challenge",
    chapter: "epoch_1",
    worldId: "order-process",
    worldProgress: 0.28,
    copyPlacement: "left",
    focalPoint: { x: 0.67, y: 0.56 },
    readingCamera: camera(0.6, 0.52, 1.02),
    gameCamera: camera(0.5, 0.6, 1.06),
    crops: crops("66% 53%", "57% 54%", "55% 50%"),
    motifs: ["package-backlog", "manual-labels", "small-warehouse"],
    visualEvent: "packages-and-manual-labels-fill-the-small-warehouse",
    reveal: "the-order-backlog-grows-across-one-ground-line",
    revealMotion: "backlog",
    soundCue: "test-signal",
    fallbackId: "fallback-epoch1-challenge",
    runnerPresence: "quiet"
  },
  {
    stateId: "epoch_1.resolve",
    chapter: "epoch_1",
    worldId: "order-process",
    worldProgress: 1,
    copyPlacement: "left",
    focalPoint: { x: 0.7, y: 0.44 },
    readingCamera: camera(0.62, 0.5, 1.02),
    gameCamera: camera(0.5, 0.6, 1.06),
    crops: crops("70% 48%", "59% 52%", "57% 50%"),
    motifs: ["process-zones", "labelled-stations", "clear-flow"],
    visualEvent: "orders-enter-four-labelled-process-zones",
    reveal: "packages-align-from-intake-to-dispatch",
    revealMotion: "align",
    soundCue: "scanner",
    fallbackId: "fallback-epoch1-resolve",
    runnerPresence: "quiet"
  },
  {
    stateId: "epoch_2.setup",
    chapter: "epoch_2",
    worldId: "quality-service",
    worldProgress: 0.2,
    copyPlacement: "right",
    focalPoint: { x: 0.3, y: 0.58 },
    readingCamera: camera(0.38, 0.54, 1.03),
    gameCamera: camera(0.5, 0.6, 1.06),
    crops: crops("32% 55%", "44% 54%", "44% 50%"),
    motifs: ["quality-lab", "open-checks", "tested-device"],
    visualEvent: "diagnostic-lead-connects-to-the-device",
    reveal: "warning-shapes-open-on-the-physical-checklist",
    revealMotion: "diagnose",
    soundCue: "test-signal",
    fallbackId: "fallback-epoch2-setup",
    runnerPresence: "quiet"
  },
  {
    stateId: "epoch_2.resolve",
    chapter: "epoch_2",
    worldId: "quality-service",
    worldProgress: 1,
    copyPlacement: "right",
    focalPoint: { x: 0.45, y: 0.52 },
    readingCamera: camera(0.43, 0.52, 1.02),
    gameCamera: camera(0.5, 0.6, 1.06),
    crops: crops("43% 52%", "47% 52%", "47% 50%"),
    motifs: ["quality-stamp", "completed-checklist", "tested-device"],
    visualEvent: "black-check-seal-closes-the-quality-process",
    reveal: "checklist-rows-fill-from-top-to-bottom",
    revealMotion: "check",
    soundCue: "scanner",
    fallbackId: "fallback-epoch2-resolve",
    runnerPresence: "quiet"
  },
  {
    stateId: "epoch_3.start",
    chapter: "epoch_3",
    worldId: "client-paths",
    worldProgress: 0.12,
    copyPlacement: "left",
    focalPoint: { x: 0.34, y: 0.55 },
    readingCamera: camera(0.4, 0.52, 1.02),
    gameCamera: camera(0.5, 0.6, 1.05),
    crops: crops("35% 54%", "45% 52%", "46% 50%"),
    motifs: ["same-client", "empty-desk", "starting-budget"],
    visualEvent: "the-client-arrives-at-an-empty-first-desk",
    reveal: "the-empty-workplace-opens-beside-the-client",
    revealMotion: "open",
    soundCue: "laptop-start",
    fallbackId: "fallback-epoch3-start",
    runnerPresence: "quiet"
  },
  {
    stateId: "epoch_3.laptop",
    chapter: "epoch_3",
    worldId: "client-paths",
    worldProgress: 0.34,
    copyPlacement: "left",
    focalPoint: { x: 0.42, y: 0.54 },
    readingCamera: camera(0.44, 0.52, 1.02),
    gameCamera: camera(0.5, 0.6, 1.05),
    crops: crops("42% 54%", "47% 52%", "48% 50%"),
    motifs: ["same-client", "first-laptop", "first-workplace"],
    visualEvent: "the-first-laptop-opens-on-the-empty-desk",
    reveal: "the-laptop-settles-into-the-first-workplace",
    revealMotion: "open",
    soundCue: "laptop-start",
    fallbackId: "fallback-epoch3-laptop",
    runnerPresence: "quiet"
  },
  {
    stateId: "epoch_3.business",
    chapter: "epoch_3",
    worldId: "client-paths",
    worldProgress: 0.64,
    copyPlacement: "left",
    focalPoint: { x: 0.54, y: 0.51 },
    readingCamera: camera(0.54, 0.5, 1.02),
    gameCamera: camera(0.5, 0.6, 1.05),
    crops: crops("53% 51%", "52% 52%", "52% 50%"),
    motifs: ["growing-business", "budget-scale", "old-laptop"],
    visualEvent: "one-desk-expands-into-a-full-office-order",
    reveal: "workstations-and-parcels-build-outward",
    revealMotion: "build",
    soundCue: "conveyor",
    fallbackId: "fallback-epoch3-business",
    runnerPresence: "quiet"
  },
  {
    stateId: "epoch_3.b2b",
    chapter: "epoch_3",
    worldId: "client-paths",
    worldProgress: 1,
    copyPlacement: "left",
    focalPoint: { x: 0.82, y: 0.55 },
    readingCamera: camera(0.7, 0.52, 1.03),
    gameCamera: camera(0.5, 0.6, 1.05),
    crops: crops("77% 54%", "62% 53%", "58% 50%"),
    motifs: ["separate-clients", "equipment-sets", "dispatch-bench"],
    visualEvent: "three-separate-orders-reach-one-dispatch-bench",
    reveal: "three-equipment-sets-arrive-one-after-another",
    revealMotion: "sequence",
    soundCue: "scanner",
    fallbackId: "fallback-epoch3-b2b",
    runnerPresence: "quiet"
  },
  {
    stateId: "epoch_4.scale",
    chapter: "epoch_4",
    worldId: "scale-logistics",
    worldProgress: 0.24,
    copyPlacement: "left",
    focalPoint: { x: 0.69, y: 0.45 },
    readingCamera: camera(0.61, 0.48, 1.02),
    gameCamera: camera(0.5, 0.6, 1.05),
    crops: crops("68% 48%", "58% 50%", "56% 50%"),
    motifs: ["phone-tower", "pkin-silhouette", "warehouse-team"],
    visualEvent: "phones-build-a-tower-beside-the-pkin-silhouette",
    reveal: "phones-and-the-warehouse-team-appear-in-depth",
    revealMotion: "rise",
    soundCue: "conveyor",
    fallbackId: "fallback-epoch4-scale",
    runnerPresence: "quiet"
  },
  {
    stateId: "epoch_4.numbers",
    chapter: "epoch_4",
    worldId: "scale-logistics",
    worldProgress: 0.62,
    copyPlacement: "right",
    focalPoint: { x: 0.3, y: 0.52 },
    readingCamera: camera(0.39, 0.5, 1.02),
    gameCamera: camera(0.5, 0.6, 1.05),
    crops: crops("34% 52%", "46% 52%", "46% 50%"),
    motifs: ["packing-zones", "package-stream", "warehouse-team"],
    visualEvent: "packages-fill-separate-packing-and-dispatch-zones",
    reveal: "packages-align-and-stack-inside-each-working-zone",
    revealMotion: "balance",
    soundCue: "scanner",
    fallbackId: "fallback-epoch4-numbers",
    runnerPresence: "quiet"
  },
  {
    stateId: "epoch_4.resolve",
    chapter: "epoch_4",
    worldId: "scale-logistics",
    worldProgress: 1,
    copyPlacement: "left",
    focalPoint: { x: 0.79, y: 0.62 },
    readingCamera: camera(0.68, 0.55, 1.03),
    gameCamera: camera(0.5, 0.6, 1.05),
    crops: crops("76% 58%", "62% 55%", "59% 52%"),
    motifs: ["delivery-map", "scanned-package", "ordered-branches"],
    visualEvent: "three-sorting-branches-deliver-one-correctly-scanned-parcel",
    reveal: "the-scanned-label-reaches-the-dispatch-station",
    revealMotion: "travel",
    soundCue: "scanner",
    fallbackId: "fallback-epoch4-resolve",
    runnerPresence: "quiet"
  },
  {
    stateId: "epoch_5.approach",
    chapter: "epoch_5",
    worldId: "million-approach",
    worldProgress: 0.28,
    copyPlacement: "left",
    focalPoint: { x: 0.72, y: 0.48 },
    readingCamera: camera(0.63, 0.5, 1.02),
    gameCamera: camera(0.5, 0.6, 1.04),
    crops: crops("70% 51%", "59% 52%", "57% 50%"),
    motifs: ["converging-routes", "million-counter", "first-label"],
    visualEvent: "all-prior-routes-converge-at-the-counter",
    reveal: "routes-plug-into-the-blank-counter-housing",
    revealMotion: "converge",
    soundCue: "counter",
    fallbackId: "fallback-epoch5-approach",
    runnerPresence: "quiet"
  },
  {
    stateId: "epoch_5.wave",
    chapter: "epoch_5",
    worldId: "million-approach",
    worldProgress: 1,
    copyPlacement: "left",
    focalPoint: { x: 0.72, y: 0.5 },
    readingCamera: camera(0.64, 0.5, 1.02),
    gameCamera: camera(0.5, 0.6, 1.04),
    crops: crops("72% 52%", "60% 52%", "58% 50%"),
    motifs: ["million-threshold", "counter-999950", "returning-packages"],
    visualEvent: "counter-closes-at-nine-nine-nine-nine-five-zero",
    reveal: "six-code-rendered-digits-prepare-for-the-final-wave",
    revealMotion: "count",
    soundCue: "counter",
    fallbackId: "fallback-epoch5-wave",
    runnerPresence: "quiet"
  },
  {
    stateId: "final.moments",
    chapter: "finale",
    worldId: "million-finale",
    worldProgress: 0.55,
    copyPlacement: "right",
    focalPoint: { x: 0.28, y: 0.55 },
    readingCamera: camera(0.36, 0.52, 1.03),
    gameCamera: camera(0.5, 0.6, 1.04),
    crops: crops("31% 54%", "43% 53%", "45% 50%"),
    motifs: ["million-package", "first-label", "same-desk"],
    visualEvent: "millionth-package-returns-to-the-first-desk-angle",
    reveal: "prior-route-lines-converge-under-the-package",
    revealMotion: "return",
    soundCue: "tape",
    fallbackId: "fallback-final-moments",
    runnerPresence: "quiet"
  },
  {
    stateId: "final.thanks",
    chapter: "finale",
    worldId: "million-finale",
    worldProgress: 1,
    copyPlacement: "right",
    focalPoint: { x: 0.35, y: 0.52 },
    readingCamera: camera(0.4, 0.5, 1),
    gameCamera: camera(0.5, 0.6, 1.04),
    crops: crops("36% 52%", "46% 52%", "47% 50%"),
    motifs: ["million-package", "route-continues", "warm-light"],
    visualEvent: "the-route-leaves-the-millionth-package-and-continues-offscreen",
    reveal: "the-continuation-line-brightens-beyond-the-frame",
    revealMotion: "continue",
    soundCue: "laptop-start",
    fallbackId: "fallback-final-thanks",
    runnerPresence: "quiet"
  }
]);

const worldStateById = new Map(WORLD_STATE_MANIFEST.map((state) => [state.stateId, state]));

function editorialScene(
  sourceStateId: string,
  stateId: string,
  chapter: StoryChapterId,
  overrides: Partial<CampaignSceneVisualState> = {}
): CampaignSceneVisualState {
  const source = worldStateById.get(sourceStateId);
  if (!source) throw new Error(`Unknown editorial scene source: ${sourceStateId}`);
  return {
    ...source,
    stateId,
    chapter,
    overlayStateId: sourceStateId,
    fallbackId: `fallback-${stateId.replaceAll(".", "-")}`,
    ...overrides
  };
}

/** The eleven production story scenes approved for the clearly attributed story. */
export const CAMPAIGN_SCENE_MANIFEST: readonly CampaignSceneVisualState[] = Object.freeze([
  editorialScene("intro.ready", "story.first_package", "prologue"),
  editorialScene("epoch_1.challenge", "story.order_backlog", "epoch_1"),
  editorialScene("epoch_2.setup", "story.quality_promise", "epoch_2"),
  editorialScene("epoch_3.start", "client.business_start", "epoch_3"),
  editorialScene("epoch_3.business", "client.business_growth", "epoch_3"),
  editorialScene("epoch_3.b2b", "story.matching_result", "epoch_3", {
    motifs: ["separate-clients", "equipment-sets", "dispatch-bench"],
    visualEvent: "three-client-orders-align-on-one-dispatch-bench",
    reveal: "each-order-keeps-its-own-equipment-set",
    revealMotion: "match"
  }),
  editorialScene("epoch_4.scale", "story.scale", "epoch_4", {
    motifs: ["phone-tower", "pkin-silhouette", "warehouse-team"],
    visualEvent: "phones-build-a-tower-beside-the-pkin-silhouette",
    reveal: "phones-rise-on-the-same-baseline-as-pkin",
    revealMotion: "balance"
  }),
  editorialScene("epoch_5.approach", "story.million_approach", "epoch_5"),
  editorialScene("epoch_5.wave", "challenge.million_wave", "epoch_5"),
  editorialScene("final.thanks", "story.million_finale", "finale"),
  editorialScene("final.thanks", "story.challenge_handoff", "finale", {
    visualEvent: "challenge-gate-opens-after-millionth-package",
    reveal: "score-and-protection-lock-into-the-challenge-lane",
    revealMotion: "dispatch"
  })
]);

const worldById = new Map(CAMPAIGN_WORLDS.map((world) => [world.worldId, world]));
const stateById = new Map(
  [...WORLD_STATE_MANIFEST, ...CAMPAIGN_SCENE_MANIFEST]
    .map((state) => [state.stateId, state] as const)
);

export function campaignWorld(worldId: CampaignWorldId): CampaignWorldDefinition {
  const world = worldById.get(worldId);
  if (world === undefined) throw new Error(`Unknown campaign world: ${worldId}`);
  return world;
}

export function sceneVisualState(stateId: string): CampaignSceneVisualState {
  const state = stateById.get(stateId);
  if (state === undefined) throw new Error(`Unknown campaign scene visual: ${stateId}`);
  return state;
}

export function trySceneVisualState(stateId: string): CampaignSceneVisualState | null {
  return stateById.get(stateId) ?? null;
}

const STORY_PAGE_VISUAL_STATES: Readonly<Record<string, string>> = Object.freeze({
  "story.first_package:game-purpose": "intro.ready",
  "story.first_package:first-hand-packed": "intro.promise",
  "story.order_backlog:backlog-challenge": "epoch_1.challenge",
  "story.quality_promise:quality-process": "epoch_2.resolve",
  "client.business_start:new-business": "epoch_3.start",
  "client.business_growth:three-hundred": "epoch_3.laptop",
  "client.business_growth:one-year": "epoch_3.business",
  "client.business_growth:hundred-thousand": "client.business_growth",
  "story.matching_result:many-plans": "story.matching_result",
  "story.scale:phone-tower": "epoch_4.numbers",
  "story.million_approach:counter-source": "epoch_5.approach",
  "challenge.million_wave:two-goals": "epoch_5.wave",
  "story.million_finale:million-celebration": "final.moments",
  "story.challenge_handoff:rules-change": "final.thanks"
});

/** Chooses the next concrete world beat while keeping every page player-paced. */
export function storyPageVisualStateId(sceneId: string, pageId: string | null): string {
  if (pageId === null) return sceneId;
  return STORY_PAGE_VISUAL_STATES[`${sceneId}:${pageId}`] ?? sceneId;
}

interface PlayVisualRange {
  readonly fromStateId: string;
  readonly toStateId: string;
  readonly progressStart: number;
  readonly progressEnd: number;
}

const PLAY_VISUAL_RANGES: Readonly<Record<string, PlayVisualRange>> = {
  "epoch_1.first_package": {
    fromStateId: "intro.promise",
    toStateId: "intro.promise",
    progressStart: 0,
    progressEnd: 1
  },
  "epoch_1.training": {
    fromStateId: "intro.promise",
    toStateId: "intro.promise",
    progressStart: 0,
    progressEnd: 1
  },
  "epoch_1.order_backlog": {
    fromStateId: "epoch_1.challenge",
    toStateId: "epoch_1.resolve",
    progressStart: 0,
    progressEnd: 1
  },
  "epoch_2.quality_series": {
    fromStateId: "epoch_2.setup",
    toStateId: "epoch_2.resolve",
    progressStart: 0,
    progressEnd: 0.72
  },
  "epoch_2.quality_process": {
    fromStateId: "epoch_2.setup",
    toStateId: "epoch_2.resolve",
    progressStart: 0,
    progressEnd: 1
  },
  "epoch_2.quality_trial": {
    fromStateId: "epoch_2.setup",
    toStateId: "epoch_2.resolve",
    progressStart: 0.72,
    progressEnd: 1
  },
  "epoch_3.matching_growth": {
    fromStateId: "epoch_3.business",
    toStateId: "epoch_3.b2b",
    progressStart: 0.5,
    progressEnd: 0.72
  },
  "epoch_3.client_growth": {
    fromStateId: "epoch_3.start",
    toStateId: "epoch_3.b2b",
    progressStart: 0,
    progressEnd: 1
  },
  "epoch_4.order_peak": {
    fromStateId: "epoch_4.numbers",
    toStateId: "epoch_4.resolve",
    progressStart: 0.62,
    progressEnd: 0.82
  },
  "epoch_4.order_scale": {
    fromStateId: "epoch_4.numbers",
    toStateId: "epoch_4.resolve",
    progressStart: 0.62,
    progressEnd: 1
  },
  "epoch_4.order_peak_final": {
    fromStateId: "epoch_4.numbers",
    toStateId: "epoch_4.resolve",
    progressStart: 0.82,
    progressEnd: 1
  },
  "epoch_5.million_threshold": {
    fromStateId: "epoch_5.wave",
    toStateId: "epoch_5.wave",
    progressStart: 0.62,
    progressEnd: 1
  }
};

export interface ResolvedPlayVisual {
  readonly worldId: CampaignWorldId;
  readonly fromStateId: string;
  readonly toStateId: string;
  readonly progress: number;
}

function clampUnit(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

export function resolvePlaySegmentVisual(
  segmentId: string,
  segmentProgress: number
): ResolvedPlayVisual {
  const range = PLAY_VISUAL_RANGES[segmentId] ?? PLAY_VISUAL_RANGES["epoch_1.training"]!;
  const from = sceneVisualState(range.fromStateId);
  const to = sceneVisualState(range.toStateId);
  if (from.worldId !== to.worldId) {
    throw new Error(`Play segment crosses campaign worlds: ${segmentId}`);
  }
  const progress = range.progressStart +
    (range.progressEnd - range.progressStart) * clampUnit(segmentProgress);
  return {
    worldId: from.worldId,
    fromStateId: from.stateId,
    toStateId: to.stateId,
    progress
  };
}

export const CHALLENGE_WORLD_SECONDS = 45;
export const CHALLENGE_WORLD_STATES = Object.freeze([
  "story.first_package",
  "epoch_1.resolve",
  "epoch_2.resolve",
  "client.business_growth",
  "story.scale",
  "challenge.million_wave",
  "story.million_finale"
] as const);

export type ChallengeWorldStart = "direct" | "story-continuation";

export interface ChallengeWorldSnapshot {
  readonly stateId: (typeof CHALLENGE_WORLD_STATES)[number];
  readonly worldId: CampaignWorldId;
  readonly worldIndex: number;
  readonly worldElapsedSeconds: number;
  readonly transitionPending: boolean;
}

export class ChallengeWorldDirector {
  private worldIndex = 0;
  private worldElapsedSeconds = 0;
  private transitionPending = false;

  public constructor(start: ChallengeWorldStart = "direct") {
    this.reset(start);
  }

  public reset(start: ChallengeWorldStart = "direct"): void {
    this.worldIndex = start === "story-continuation" ? CHALLENGE_WORLD_STATES.length - 1 : 0;
    this.worldElapsedSeconds = 0;
    this.transitionPending = false;
  }

  public advance(deltaSeconds: number, routeClear: boolean): ChallengeWorldSnapshot {
    const safeDelta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    this.worldElapsedSeconds += safeDelta;
    if (this.worldElapsedSeconds + Number.EPSILON >= CHALLENGE_WORLD_SECONDS) {
      this.transitionPending = true;
    }
    if (this.transitionPending && routeClear) {
      this.worldIndex = (this.worldIndex + 1) % CHALLENGE_WORLD_STATES.length;
      this.worldElapsedSeconds = 0;
      this.transitionPending = false;
    }
    return this.snapshot;
  }

  public get snapshot(): ChallengeWorldSnapshot {
    const stateId = CHALLENGE_WORLD_STATES[this.worldIndex] ?? CHALLENGE_WORLD_STATES[0];
    return {
      stateId,
      worldId: sceneVisualState(stateId).worldId,
      worldIndex: this.worldIndex,
      worldElapsedSeconds: this.worldElapsedSeconds,
      transitionPending: this.transitionPending
    };
  }
}

const APPROVED_OBJECT_ROLES = new Set(
  CAMPAIGN_SCENE_MANIFEST.flatMap(({ motifs }) => motifs)
);

export function validateSceneManifest(
  sceneIds: readonly string[],
  states: readonly CampaignSceneVisualState[] = CAMPAIGN_SCENE_MANIFEST,
  worlds: readonly CampaignWorldDefinition[] = CAMPAIGN_WORLDS
): string[] {
  const errors: string[] = [];
  const stateIds = states.map(({ stateId }) => stateId);
  const suppliedWorldIds = new Set(worlds.map(({ worldId }) => worldId));
  if (worlds.length !== 7) errors.push("world_count");
  if (states.length !== 11) errors.push("state_count");
  if (new Set(stateIds).size !== stateIds.length) errors.push("duplicate_state_id");
  if (sceneIds.length !== stateIds.length ||
      sceneIds.some((sceneId, index) => sceneId !== stateIds[index])) {
    errors.push("scene_state_mismatch");
  }
  if (new Set(states.map(({ visualEvent }) => visualEvent)).size !== states.length) {
    errors.push("duplicate_visual_event");
  }
  if (new Set(states.map(({ revealMotion }) => revealMotion)).size !== states.length) {
    errors.push("duplicate_reveal_motion");
  }
  for (const state of states) {
    if (!suppliedWorldIds.has(state.worldId)) errors.push(`unknown_world:${state.stateId}`);
    if (state.motifs.length === 0) errors.push(`missing_motif:${state.stateId}`);
    for (const motif of state.motifs) {
      if (!APPROVED_OBJECT_ROLES.has(motif)) errors.push(`unknown_critical_layer:${motif}`);
    }
    if (!state.readingCamera || !Number.isFinite(state.readingCamera.zoom) ||
        !state.crops?.portrait) {
      errors.push(`missing_mobile_camera:${state.stateId}`);
    }
    if (!state.fallbackId.startsWith("fallback-")) {
      errors.push(`missing_fallback:${state.stateId}`);
    }
  }
  for (const world of worlds) {
    if (!states.some(({ worldId }) => worldId === world.worldId)) {
      errors.push(`orphan_world:${world.worldId}`);
    }
  }
  return errors;
}
