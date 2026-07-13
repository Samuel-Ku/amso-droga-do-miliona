import {
  DEFAULT_RUNNER_MODULE_PATH,
  DEFAULT_RUNNER_STYLE_PATH,
  DEFAULT_RUNNER_TRIGGER_SELECTOR,
  RUNNER_CTA_PATH_ALLOWLIST,
  RUNNER_SCHEMA_VERSION
} from "./defaults";
import type {
  AssetBundleConfig,
  AssetBundleId,
  AssetResourceConfig,
  AssetResourceType,
  AssetsConfig,
  ChallengeConfig,
  PowerUpKind,
  RunnerConfig,
  RunnerFact,
  StoryChapterId,
  StoryConfig,
  StoryEpochConfig,
  StorySceneConfig,
  StorySequenceStepConfig,
  StoryVignette
} from "../shared/types";
import type {
  RunnerConfigIssue,
  RunnerConfigValidationOptions,
  RunnerConfigValidationResult
} from "./types";

const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,63}$/;
const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z.+-]{0,31}$/;
const ASSET_PATH_PATTERN = /^\/[A-Za-z0-9._/-]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const POWER_UPS: readonly PowerUpKind[] = ["gwarancja_48", "audyt_jakosci", "drugie_zycie"];
const OBSTACLE_KINDS = ["box-stack", "pallet", "trolley", "overhead"] as const;
const STORY_CHAPTERS: readonly StoryChapterId[] = [
  "prologue", "epoch_1", "epoch_2", "epoch_3", "epoch_4", "epoch_5", "finale"
];
const STORY_VIGNETTES: readonly StoryVignette[] = [
  "first-package", "small-warehouse", "tested-device", "cable-route", "quality-stamp",
  "creative-desk", "growing-business", "long-trust", "warehouse-scale", "product-stream",
  "delivery-map", "million-counter", "million-wave", "million-package", "thank-you"
];
const CANONICAL_SCENE_ORDER = [
  "intro.ready", "intro.beginning", "intro.promise", "epoch_1.challenge",
  "epoch_1.resolve", "epoch_2.setup", "epoch_2.resolve", "epoch_3.people",
  "epoch_3.designer", "epoch_3.business", "epoch_3.b2b", "epoch_4.scale",
  "epoch_4.numbers", "epoch_4.resolve", "epoch_5.approach", "epoch_5.wave",
  "final.moments", "final.thanks"
] as const;
const CANONICAL_SEQUENCE = [
  "scene:intro.ready", "scene:intro.beginning", "scene:intro.promise",
  "play:epoch_1.training:0", "scene:epoch_1.challenge", "play:epoch_1.cable_chaos:0",
  "scene:epoch_1.resolve", "scene:epoch_2.setup", "play:epoch_2.quality_series:1",
  "play:epoch_2.doubt_cloud:1", "scene:epoch_2.resolve", "scene:epoch_3.people",
  "scene:epoch_3.designer", "play:epoch_3.creative_contract:2",
  "scene:epoch_3.business", "play:epoch_3.growth_contract:2", "scene:epoch_3.b2b",
  "play:epoch_3.trust_contract:2", "play:epoch_3.budget_eater:2",
  "scene:epoch_4.scale", "scene:epoch_4.numbers", "play:epoch_4.orders:3",
  "play:epoch_4.logistic_hydra:3", "scene:epoch_4.resolve",
  "scene:epoch_5.approach", "play:epoch_5.counter:4", "scene:epoch_5.wave",
  "play:epoch_5.million_wave:4", "scene:final.moments", "scene:final.thanks"
] as const;
const UI_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const CRITICAL_UI_KEYS = [
  "landingLead", "startStory", "choosePath", "replayStory", "challengeMode",
  "startChallenge", "fullStory", "loading", "errorTitle", "errorBody",
  "pauseTitle", "pauseBody", "narrowTitle", "narrowBody", "sharePublication"
] as const;
const ASSET_BUNDLE_IDS: readonly AssetBundleId[] = [
  "common", "prologue", "epoch_1", "epoch_2", "epoch_3", "epoch_4", "epoch_5",
  "finale", "challenge"
];
const ASSET_RESOURCE_TYPES: readonly AssetResourceType[] = ["procedural", "image", "audio"];
const PROCEDURAL_SOURCE_PATTERN = /^procedural:[a-z0-9][a-z0-9_.-]{0,63}$/;
const IMAGE_SOURCE_PATTERN = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
const AUDIO_SOURCE_PATTERN = /\.(?:aac|m4a|mp3|ogg|wav)$/i;

function issue(code: RunnerConfigIssue["code"], path: string): RunnerConfigValidationResult {
  return { success: false, issues: [{ code, path }] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  required: readonly string[]
): boolean {
  return Object.keys(value).every((key) => allowed.includes(key)) &&
    required.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isSafeText(value: unknown, max = 280): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= max &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f<>]/u.test(value);
}

function isIdentifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value);
}

function isVersion(value: unknown): value is string {
  return typeof value === "string" && VERSION_PATTERN.test(value);
}

function finiteInRange(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function validIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function currentIsoDate(now: Date): string {
  return Number.isNaN(now.getTime())
    ? new Date().toISOString().slice(0, 10)
    : now.toISOString().slice(0, 10);
}

export function isAllowedRelativePath(
  path: unknown,
  allowlist: readonly string[] = RUNNER_CTA_PATH_ALLOWLIST
): path is string {
  return typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("?") &&
    !path.includes("#") &&
    allowlist.includes(path);
}

export function isAllowedAssetPath(path: unknown, extension: ".js" | ".css"): path is string {
  return typeof path === "string" &&
    path.startsWith("/assets/milion-runner/") &&
    path.endsWith(extension) &&
    ASSET_PATH_PATTERN.test(path) &&
    !path.includes("//") &&
    !path.includes("/../") &&
    !path.includes("/./") &&
    !path.includes("%") &&
    !path.includes("\\");
}

export function isAllowedCampaignResourceSource(
  source: unknown,
  type: AssetResourceType
): source is string {
  if (typeof source !== "string") return false;
  if (type === "procedural") return PROCEDURAL_SOURCE_PATTERN.test(source);
  const extensionMatches = type === "image"
    ? IMAGE_SOURCE_PATTERN.test(source)
    : AUDIO_SOURCE_PATTERN.test(source);
  return source.startsWith("/assets/milion-runner/") &&
    extensionMatches &&
    ASSET_PATH_PATTERN.test(source) &&
    !source.includes("//") &&
    !source.includes("/../") &&
    !source.includes("/./") &&
    !source.includes("%") &&
    !source.includes("\\");
}

function parseAssetResource(value: unknown): AssetResourceConfig | null {
  if (!isRecord(value) || !hasExactKeys(
    value,
    ["id", "type", "source", "critical"],
    ["id", "type", "source", "critical"]
  )) return null;
  if (!isIdentifier(value.id) || typeof value.type !== "string" ||
      !(ASSET_RESOURCE_TYPES as readonly string[]).includes(value.type) ||
      typeof value.critical !== "boolean") return null;
  const type = value.type as AssetResourceType;
  if (!isAllowedCampaignResourceSource(value.source, type)) return null;
  return { id: value.id, type, source: value.source, critical: value.critical };
}

function parseAssets(value: unknown): AssetsConfig | null {
  if (!isRecord(value) || !hasExactKeys(value, ["bundles"], ["bundles"]) ||
      !Array.isArray(value.bundles) || value.bundles.length !== ASSET_BUNDLE_IDS.length) {
    return null;
  }
  const bundles: AssetBundleConfig[] = [];
  for (const [index, rawBundle] of value.bundles.entries()) {
    if (!isRecord(rawBundle) || !hasExactKeys(
      rawBundle,
      ["id", "resources"],
      ["id", "resources"]
    ) || rawBundle.id !== ASSET_BUNDLE_IDS[index] || !Array.isArray(rawBundle.resources) ||
        rawBundle.resources.length === 0) return null;
    const resources = rawBundle.resources.map(parseAssetResource);
    if (resources.some((resource) => resource === null)) return null;
    const typedResources = resources as AssetResourceConfig[];
    if (!typedResources.some(({ critical }) => critical) ||
        new Set(typedResources.map(({ id }) => id)).size !== typedResources.length) return null;
    bundles.push({
      id: rawBundle.id as AssetBundleId,
      resources: typedResources
    });
  }
  return { bundles };
}

function parseScene(value: unknown): StorySceneConfig | null {
  if (!isRecord(value) || !hasExactKeys(
    value,
    ["id", "chapter", "eyebrow", "title", "body", "vignette", "continueLabel"],
    ["id", "chapter", "eyebrow", "title", "body", "vignette", "continueLabel"]
  )) return null;
  if (!isIdentifier(value.id) || typeof value.chapter !== "string" ||
      !(STORY_CHAPTERS as readonly string[]).includes(value.chapter) ||
      !isSafeText(value.eyebrow, 80) || !isSafeText(value.title, 160) ||
      !Array.isArray(value.body) || value.body.length < 1 || value.body.length > 2 ||
      value.body.some((paragraph) => !isSafeText(paragraph, 420)) ||
      typeof value.vignette !== "string" ||
      !(STORY_VIGNETTES as readonly string[]).includes(value.vignette) ||
      !isSafeText(value.continueLabel, 80)) return null;
  return {
    id: value.id,
    chapter: value.chapter as StoryChapterId,
    eyebrow: value.eyebrow,
    title: value.title,
    body: value.body as string[],
    vignette: value.vignette as StoryVignette,
    continueLabel: value.continueLabel
  };
}

function parseSequenceStep(value: unknown): StorySequenceStepConfig | null {
  if (!isRecord(value) || typeof value.type !== "string") return null;
  if (value.type === "scene") {
    if (!hasExactKeys(value, ["type", "sceneId"], ["type", "sceneId"]) ||
        !isIdentifier(value.sceneId)) return null;
    return { type: "scene", sceneId: value.sceneId };
  }
  if (value.type === "play") {
    if (!hasExactKeys(
      value,
      ["type", "id", "epochIndex", "durationSeconds"],
      ["type", "id", "epochIndex", "durationSeconds"]
    ) || !isIdentifier(value.id) || !Number.isInteger(value.epochIndex) ||
        !finiteInRange(value.durationSeconds, 1, 90)) return null;
    return {
      type: "play",
      id: value.id,
      epochIndex: value.epochIndex as number,
      durationSeconds: value.durationSeconds
    };
  }
  return null;
}

function parseEpoch(value: unknown): StoryEpochConfig | null {
  if (!isRecord(value) || !hasExactKeys(
    value,
    [
      "index", "id", "name", "year", "themeIndex", "durationSeconds", "obstaclePool",
      "difficultyStart", "difficultyEnd", "challengeName", "powerUpDebut"
    ],
    [
      "index", "id", "name", "year", "themeIndex", "durationSeconds", "obstaclePool",
      "difficultyStart", "difficultyEnd", "challengeName"
    ]
  )) return null;
  if (!Number.isInteger(value.index) || !isIdentifier(value.id) || !isSafeText(value.name, 80) ||
      !isSafeText(value.year, 24) || !Number.isInteger(value.themeIndex) ||
      !finiteInRange(value.durationSeconds, 5, 90) || !Array.isArray(value.obstaclePool) ||
      value.obstaclePool.length === 0 || value.obstaclePool.some((kind) =>
        typeof kind !== "string" || !(OBSTACLE_KINDS as readonly string[]).includes(kind)) ||
      !finiteInRange(value.difficultyStart, 0.5, 2) ||
      !finiteInRange(value.difficultyEnd, value.difficultyStart, 2) ||
      !isSafeText(value.challengeName, 80)) return null;
  if (value.powerUpDebut !== undefined &&
      (typeof value.powerUpDebut !== "string" || !(POWER_UPS as readonly string[]).includes(value.powerUpDebut))) {
    return null;
  }
  return {
    index: value.index as number,
    id: value.id,
    name: value.name,
    year: value.year,
    themeIndex: value.themeIndex as number,
    durationSeconds: value.durationSeconds,
    obstaclePool: value.obstaclePool as string[],
    difficultyStart: value.difficultyStart,
    difficultyEnd: value.difficultyEnd,
    challengeName: value.challengeName,
    ...(typeof value.powerUpDebut === "string" ? { powerUpDebut: value.powerUpDebut as PowerUpKind } : {}),
    ...(value.index === 4 ? { bossClimax: true } : {})
  };
}

function parseStory(value: unknown): StoryConfig | null {
  if (!isRecord(value) || !hasExactKeys(
    value,
    [
      "activeDurationSeconds", "readingSpeedMultiplier", "speedStartMultiplier",
      "speedMaxMultiplier", "resumeCountdownSeconds", "firstCompletionBonusScore",
      "scenes", "sequence", "epochs"
    ],
    [
      "activeDurationSeconds", "readingSpeedMultiplier", "speedStartMultiplier",
      "speedMaxMultiplier", "resumeCountdownSeconds", "firstCompletionBonusScore",
      "scenes", "sequence", "epochs"
    ]
  )) return null;
  if (!finiteInRange(value.activeDurationSeconds, 300, 600) ||
      !finiteInRange(value.readingSpeedMultiplier, 0.1, 0.5) ||
      !finiteInRange(value.speedStartMultiplier, 0.5, 1.5) ||
      !finiteInRange(value.speedMaxMultiplier, value.speedStartMultiplier, 1.5) ||
      value.resumeCountdownSeconds !== 3 ||
      !finiteInRange(value.firstCompletionBonusScore, 0, 1_000_000) ||
      !Number.isInteger(value.firstCompletionBonusScore) ||
      !Array.isArray(value.scenes) || !Array.isArray(value.sequence) ||
      !Array.isArray(value.epochs)) return null;
  const scenes = value.scenes.map(parseScene);
  const sequence = value.sequence.map(parseSequenceStep);
  const epochs = value.epochs.map(parseEpoch);
  if (scenes.length !== 18 || scenes.some((scene) => scene === null) ||
      sequence.length === 0 || sequence.some((step) => step === null) ||
      epochs.length !== 5 || epochs.some((epoch) => epoch === null)) return null;
  const typedScenes = scenes as StorySceneConfig[];
  const typedSequence = sequence as StorySequenceStepConfig[];
  const typedEpochs = epochs as StoryEpochConfig[];
  if (typedEpochs.some((epoch, index) => epoch.index !== index)) return null;
  const sceneIds = new Set(typedScenes.map((scene) => scene.id));
  if (sceneIds.size !== typedScenes.length || !sceneIds.has("final.thanks")) return null;
  if (typedScenes.some((scene, index) => scene.id !== CANONICAL_SCENE_ORDER[index])) return null;
  const sequenceKeys = typedSequence.map((step) => step.type === "scene"
    ? `scene:${step.sceneId}`
    : `play:${step.id}:${step.epochIndex}`);
  if (sequenceKeys.length !== CANONICAL_SEQUENCE.length ||
      sequenceKeys.some((key, index) => key !== CANONICAL_SEQUENCE[index])) return null;
  const sceneSteps = typedSequence.filter((step) => step.type === "scene");
  if (sceneSteps.length !== typedScenes.length ||
      new Set(sceneSteps.map((step) => step.sceneId)).size !== sceneSteps.length ||
      sceneSteps.some((step) => !sceneIds.has(step.sceneId)) ||
      sceneSteps.at(-1)?.sceneId !== "final.thanks") return null;
  const playSteps = typedSequence.filter((step) => step.type === "play");
  if (playSteps.some((step) => step.epochIndex < 0 || step.epochIndex >= typedEpochs.length) ||
      playSteps.reduce((total, step) => total + step.durationSeconds, 0) !==
        value.activeDurationSeconds) return null;
  for (const epoch of typedEpochs) {
    const epochDuration = playSteps
      .filter((step) => step.epochIndex === epoch.index)
      .reduce((total, step) => total + step.durationSeconds, 0);
    if (epochDuration !== epoch.durationSeconds) return null;
  }
  return {
    activeDurationSeconds: value.activeDurationSeconds,
    readingSpeedMultiplier: value.readingSpeedMultiplier,
    speedStartMultiplier: value.speedStartMultiplier,
    speedMaxMultiplier: value.speedMaxMultiplier,
    resumeCountdownSeconds: value.resumeCountdownSeconds,
    firstCompletionBonusScore: value.firstCompletionBonusScore,
    scenes: typedScenes,
    sequence: typedSequence,
    epochs: typedEpochs
  };
}

function parseChallenge(value: unknown): ChallengeConfig | null {
  if (!isRecord(value) || !hasExactKeys(
    value,
    [
      "mode", "speedStartMultiplier", "speedMaxMultiplier", "logisticWaveMinSeconds",
      "logisticWaveMaxSeconds", "warrantyOneUse"
    ],
    [
      "mode", "speedStartMultiplier", "speedMaxMultiplier", "logisticWaveMinSeconds",
      "logisticWaveMaxSeconds", "warrantyOneUse"
    ]
  )) return null;
  if (value.mode !== "challenge" || !finiteInRange(value.speedStartMultiplier, 0.8, 1.6) ||
      !finiteInRange(value.speedMaxMultiplier, value.speedStartMultiplier, 1.8) ||
      !finiteInRange(value.logisticWaveMinSeconds, 30, 90) ||
      !finiteInRange(value.logisticWaveMaxSeconds, value.logisticWaveMinSeconds, 120) ||
      value.warrantyOneUse !== true) return null;
  return {
    mode: "challenge",
    speedStartMultiplier: value.speedStartMultiplier,
    speedMaxMultiplier: value.speedMaxMultiplier,
    logisticWaveMinSeconds: value.logisticWaveMinSeconds,
    logisticWaveMaxSeconds: value.logisticWaveMaxSeconds,
    warrantyOneUse: true
  };
}

function parseUiCopy(value: unknown): Readonly<Record<string, string>> | null {
  if (!isRecord(value) || !CRITICAL_UI_KEYS.every((key) => typeof value[key] === "string")) {
    return null;
  }
  const copy: Record<string, string> = {};
  for (const [key, text] of Object.entries(value)) {
    if (!UI_KEY_PATTERN.test(key) || !isSafeText(text, 420)) return null;
    copy[key] = text;
  }
  return copy;
}

function parseLegacyFact(value: unknown): RunnerFact | null {
  if (!isRecord(value) || !isIdentifier(value.id) || !isSafeText(value.text) ||
      typeof value.enabled !== "boolean") return null;
  if (typeof value.validFrom === "string" && !validIsoDate(value.validFrom)) return null;
  if (typeof value.validTo === "string" && !validIsoDate(value.validTo)) return null;
  return {
    id: value.id,
    text: value.text,
    enabled: value.enabled,
    ...(typeof value.validFrom === "string" ? { validFrom: value.validFrom } : {}),
    ...(typeof value.validTo === "string" ? { validTo: value.validTo } : {})
  };
}

/** Retained only for safe migration of old cached config tests and profiles. */
export function filterValidFacts(facts: readonly RunnerFact[], now: Date = new Date()): RunnerFact[] {
  const today = currentIsoDate(now);
  const ids = new Set<string>();
  const result: RunnerFact[] = [];
  for (const raw of facts) {
    const fact = parseLegacyFact(raw);
    if (!fact || !fact.enabled || ids.has(fact.id)) continue;
    if (fact.validFrom && fact.validFrom > today) continue;
    if (fact.validTo && fact.validTo < today) continue;
    ids.add(fact.id);
    result.push(fact);
  }
  return result;
}

export function validateRunnerConfig(
  value: unknown,
  _options: RunnerConfigValidationOptions = {}
): RunnerConfigValidationResult {
  if (!isRecord(value)) return issue("invalid_type", "$" );
  const rootKeys = [
    "schemaVersion", "enabled", "gameVersion", "claim", "modulePath", "stylePath",
    "triggerSelector", "cta", "story", "challenge", "audio", "assets", "ui"
  ];
  if (!hasExactKeys(
    value,
    rootKeys,
    [
      "schemaVersion", "enabled", "gameVersion", "claim", "cta", "story", "challenge",
      "audio", "assets", "ui"
    ]
  )) return issue("unknown_key", "$" );
  if (value.schemaVersion !== RUNNER_SCHEMA_VERSION) return issue("unsupported_schema", "$.schemaVersion");
  if (typeof value.enabled !== "boolean" || !isVersion(value.gameVersion) || !isSafeText(value.claim, 80)) {
    return issue("invalid_value", "$" );
  }
  const modulePath = value.modulePath ?? DEFAULT_RUNNER_MODULE_PATH;
  const stylePath = value.stylePath ?? DEFAULT_RUNNER_STYLE_PATH;
  const triggerSelector = value.triggerSelector ?? DEFAULT_RUNNER_TRIGGER_SELECTOR;
  if (!isAllowedAssetPath(modulePath, ".js")) return issue("disallowed_path", "$.modulePath");
  if (!isAllowedAssetPath(stylePath, ".css")) return issue("disallowed_path", "$.stylePath");
  if (triggerSelector !== DEFAULT_RUNNER_TRIGGER_SELECTOR) return issue("invalid_value", "$.triggerSelector");
  if (!isRecord(value.cta) || !hasExactKeys(
    value.cta,
    ["campaignLabel", "challengeLabel", "path"],
    ["campaignLabel", "challengeLabel", "path"]
  ) || !isSafeText(value.cta.campaignLabel, 80) || !isSafeText(value.cta.challengeLabel, 80) ||
      !isAllowedRelativePath(value.cta.path)) return issue("invalid_value", "$.cta");
  const story = parseStory(value.story);
  if (!story) return issue("invalid_value", "$.story");
  const challenge = parseChallenge(value.challenge);
  if (!challenge) return issue("invalid_value", "$.challenge");
  if (!isRecord(value.audio) || !hasExactKeys(value.audio, ["enabled"], ["enabled"]) ||
      typeof value.audio.enabled !== "boolean") return issue("invalid_value", "$.audio");
  const assets = parseAssets(value.assets);
  if (assets === null) return issue("invalid_value", "$.assets");
  const ui = parseUiCopy(value.ui);
  if (ui === null) return issue("invalid_value", "$.ui");

  return {
    success: true,
    data: {
      schemaVersion: RUNNER_SCHEMA_VERSION,
      enabled: value.enabled,
      gameVersion: value.gameVersion,
      claim: value.claim,
      modulePath,
      stylePath,
      triggerSelector,
      cta: {
        id: "million_landing",
        label: value.cta.campaignLabel,
        campaignLabel: value.cta.campaignLabel,
        challengeLabel: value.cta.challengeLabel,
        path: value.cta.path
      },
      facts: [],
      story,
      challenge,
      audio: { enabled: value.audio.enabled },
      assets,
      ui,
      narrativeMode: true,
      narrative: { epochs: story.epochs, facts: [] }
    }
  };
}

export function parseRunnerConfig(
  value: unknown,
  options: RunnerConfigValidationOptions = {}
): RunnerConfig | null {
  const result = validateRunnerConfig(value, options);
  return result.success ? result.data : null;
}
