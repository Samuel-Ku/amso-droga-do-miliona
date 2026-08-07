import type { RunnerConfig } from "../shared/types";

export const RUNNER_SCHEMA_VERSION = 4 as const;
export const RUNNER_CONFIG_TTL_MS = 60_000;

export const DEFAULT_RUNNER_MODULE_PATH = "/assets/milion-runner/runner.js";
export const DEFAULT_RUNNER_STYLE_PATH = "/assets/milion-runner/runner.css";
export const DEFAULT_RUNNER_TRIGGER_SELECTOR = "[data-amso-million-runner]";
export const RUNNER_CTA_PATH_ALLOWLIST = Object.freeze(["/milion"] as const);

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
    activeDurationSeconds: 300,
    readingSpeedMultiplier: 0.3,
    speedStartMultiplier: 0.95,
    speedMaxMultiplier: 1.85,
    resumeCountdownSeconds: 3,
    firstCompletionBonusScore: 0,
    scenes: [],
    sequence: [],
    epochs: [],
    modeHandoff: Object.freeze({
      id: "story.challenge_handoff",
      from: "story",
      to: "challenge",
      safe: true,
      confirmationRequired: true,
      resumeCountdownSeconds: 3
    }),
    millionThreshold: Object.freeze({
      counterStart: 999_950,
      counterTarget: 1_000_000,
      orderTarget: 50
    })
  }),
  challenge: Object.freeze({
    mode: "challenge",
    challengeRuleVersion: 13,
    speedStartMultiplier: 1.85,
    speedMaxMultiplier: 4,
    logisticWaveMinSeconds: 20,
    logisticWaveMaxSeconds: 30,
    warrantyOneUse: true
  }),
  audio: Object.freeze({ enabled: true }),
  assets: Object.freeze({
    bundles: [
      Object.freeze({
        id: "common" as const,
        resources: [Object.freeze({
          id: "disabled-placeholder",
          type: "procedural" as const,
          source: "procedural:disabled-placeholder",
          critical: true
        })]
      })
    ]
  }),
  narrativeMode: false
});
