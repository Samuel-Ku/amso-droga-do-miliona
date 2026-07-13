import {
  DEFAULT_RUNNER_MODULE_PATH,
  DEFAULT_RUNNER_STYLE_PATH,
  DEFAULT_RUNNER_TRIGGER_SELECTOR,
  RUNNER_CTA_PATH_ALLOWLIST,
  RUNNER_SCHEMA_VERSION
} from "./defaults";
import type {
  ChallengeConfig,
  PowerUpKind,
  RunnerConfig,
  RunnerFact,
  StoryBeatConfig,
  StoryBeatKind,
  StoryConfig,
  StoryEpochConfig,
  StorySectionConfig
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
const BEAT_KINDS: readonly StoryBeatKind[] = ["title", "dialogue", "copy", "stat", "challenge"];
const POWER_UPS: readonly PowerUpKind[] = ["gwarancja_48", "audyt_jakosci", "drugie_zycie"];
const OBSTACLE_KINDS = ["box-stack", "pallet", "trolley", "overhead"] as const;
const UI_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const CRITICAL_UI_KEYS = [
  "landingLead", "startStory", "choosePath", "replayStory", "challengeMode",
  "startChallenge", "fullStory", "loading", "errorTitle", "errorBody",
  "pauseTitle", "pauseBody", "narrowTitle", "narrowBody", "sharePublication"
] as const;

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

function parseBeat(value: unknown): StoryBeatConfig | null {
  if (!isRecord(value) || !hasExactKeys(
    value,
    ["id", "text", "maxExposureSeconds", "kind"],
    ["id", "text", "maxExposureSeconds", "kind"]
  )) return null;
  if (!isIdentifier(value.id) || !isSafeText(value.text, 420)) return null;
  if (!finiteInRange(value.maxExposureSeconds, 0.5, 10)) return null;
  if (typeof value.kind !== "string" || !(BEAT_KINDS as readonly string[]).includes(value.kind)) {
    return null;
  }
  return {
    id: value.id,
    text: value.text,
    maxExposureSeconds: value.maxExposureSeconds,
    kind: value.kind as StoryBeatKind
  };
}

function parseSection(value: unknown, expectedId: "prologue" | "finale"): StorySectionConfig | null {
  if (!isRecord(value) || !hasExactKeys(
    value,
    ["id", "durationSeconds", "beats"],
    ["id", "durationSeconds", "beats"]
  )) return null;
  if (value.id !== expectedId || !finiteInRange(value.durationSeconds, 1, 90) || !Array.isArray(value.beats)) {
    return null;
  }
  const beats = value.beats.map(parseBeat);
  if (beats.length === 0 || beats.some((beat) => beat === null)) return null;
  return { id: expectedId, durationSeconds: value.durationSeconds, beats: beats as StoryBeatConfig[] };
}

function parseEpoch(value: unknown): StoryEpochConfig | null {
  if (!isRecord(value) || !hasExactKeys(
    value,
    [
      "index", "id", "name", "year", "themeIndex", "durationSeconds", "obstaclePool",
      "difficultyStart", "difficultyEnd", "challengeName", "powerUpDebut", "beats"
    ],
    [
      "index", "id", "name", "year", "themeIndex", "durationSeconds", "obstaclePool",
      "difficultyStart", "difficultyEnd", "challengeName", "beats"
    ]
  )) return null;
  if (!Number.isInteger(value.index) || !isIdentifier(value.id) || !isSafeText(value.name, 80) ||
      !isSafeText(value.year, 24) || !Number.isInteger(value.themeIndex) ||
      !finiteInRange(value.durationSeconds, 5, 90) || !Array.isArray(value.obstaclePool) ||
      value.obstaclePool.length === 0 || value.obstaclePool.some((kind) =>
        typeof kind !== "string" || !(OBSTACLE_KINDS as readonly string[]).includes(kind)) ||
      !finiteInRange(value.difficultyStart, 0.5, 2) ||
      !finiteInRange(value.difficultyEnd, value.difficultyStart, 2) ||
      !isSafeText(value.challengeName, 80) || !Array.isArray(value.beats)) return null;
  if (value.powerUpDebut !== undefined &&
      (typeof value.powerUpDebut !== "string" || !(POWER_UPS as readonly string[]).includes(value.powerUpDebut))) {
    return null;
  }
  const beats = value.beats.map(parseBeat);
  if (beats.length === 0 || beats.some((beat) => beat === null)) return null;
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
    beats: beats as StoryBeatConfig[],
    ...(value.index === 4 ? { bossClimax: true } : {})
  };
}

function parseStory(value: unknown): StoryConfig | null {
  if (!isRecord(value) || !hasExactKeys(
    value,
    ["durationSeconds", "prologue", "epochs", "finale"],
    ["durationSeconds", "prologue", "epochs", "finale"]
  )) return null;
  if (!finiteInRange(value.durationSeconds, 150, 180) || !Array.isArray(value.epochs)) return null;
  const prologue = parseSection(value.prologue, "prologue");
  const finale = parseSection(value.finale, "finale");
  const epochs = value.epochs.map(parseEpoch);
  if (!prologue || !finale || epochs.length !== 5 || epochs.some((epoch) => epoch === null)) return null;
  const typedEpochs = epochs as StoryEpochConfig[];
  if (typedEpochs.some((epoch, index) => epoch.index !== index)) return null;
  const computedDuration = prologue.durationSeconds + finale.durationSeconds +
    typedEpochs.reduce((total, epoch) => total + epoch.durationSeconds, 0);
  if (Math.abs(computedDuration - value.durationSeconds) > 0.001) return null;
  const beats = [
    ...prologue.beats,
    ...typedEpochs.flatMap((epoch) => epoch.beats ?? []),
    ...finale.beats
  ];
  const ids = new Set(beats.map((beat) => beat.id));
  if (ids.size !== beats.length || !ids.has("final.thanks")) return null;
  return { durationSeconds: value.durationSeconds, prologue, epochs: typedEpochs, finale };
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
    "triggerSelector", "cta", "story", "challenge", "audio", "ui"
  ];
  if (!hasExactKeys(
    value,
    rootKeys,
    ["schemaVersion", "enabled", "gameVersion", "claim", "cta", "story", "challenge", "audio", "ui"]
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
  const ui = parseUiCopy(value.ui);
  if (ui === null) return issue("invalid_value", "$.ui");

  return {
    success: true,
    data: {
      schemaVersion: 3,
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
