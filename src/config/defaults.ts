import type { RunnerConfig } from "../shared/types";

export const RUNNER_SCHEMA_VERSION = 3 as const;
export const RUNNER_CONFIG_TTL_MS = 60_000;

export const DEFAULT_RUNNER_MODULE_PATH = "/assets/milion-runner/runner.js";
export const DEFAULT_RUNNER_STYLE_PATH = "/assets/milion-runner/runner.css";
export const DEFAULT_RUNNER_TRIGGER_SELECTOR = "[data-amso-million-runner]";
export const RUNNER_CTA_PATH_ALLOWLIST = Object.freeze(["/milion"] as const);

const placeholderBeat = {
  id: "disabled.placeholder",
  text: "Droga do Miliona",
  maxExposureSeconds: 2,
  kind: "copy" as const
};

/** Fail-closed value used before a validated external campaign config is available. */
export const DEFAULT_DISABLED_RUNNER_CONFIG: Readonly<RunnerConfig> = Object.freeze({
  schemaVersion: RUNNER_SCHEMA_VERSION,
  enabled: false,
  gameVersion: "0.0.0",
  claim: "1 000 000+",
  modulePath: DEFAULT_RUNNER_MODULE_PATH,
  stylePath: DEFAULT_RUNNER_STYLE_PATH,
  triggerSelector: DEFAULT_RUNNER_TRIGGER_SELECTOR,
  cta: Object.freeze({
    id: "million_landing",
    label: "Poznaj pełną historię AMSO",
    campaignLabel: "Poznaj pełną historię AMSO",
    challengeLabel: "Gramy dalej — tryb wyzwania",
    path: RUNNER_CTA_PATH_ALLOWLIST[0]
  }),
  facts: [],
  story: Object.freeze({
    durationSeconds: 150,
    prologue: Object.freeze({ id: "prologue", durationSeconds: 10, beats: [placeholderBeat] }),
    epochs: [],
    finale: Object.freeze({
      id: "finale",
      durationSeconds: 10,
      beats: [{ ...placeholderBeat, id: "disabled.finale" }]
    })
  }),
  challenge: Object.freeze({
    mode: "challenge",
    speedStartMultiplier: 1.1,
    speedMaxMultiplier: 1.55,
    logisticWaveMinSeconds: 45,
    logisticWaveMaxSeconds: 60,
    warrantyOneUse: true
  }),
  audio: Object.freeze({ enabled: true }),
  narrativeMode: false
});
