export type QaQualityRequest = "auto" | "force-full" | "force-reduced";
export type QaMotionRequest = "system" | "full" | "reduced";
export type AudioRunMode = "enabled" | "muted" | "disabled";
export type PerformanceScenarioId =
  | "performance-reference-v1"
  | "world-seam-performance-v1"
  | "four-cycle-memory-v1"
  | "full-story-reference-v1";

export interface QaBootConfig {
  readonly mode: "performance";
  readonly scenarioId: PerformanceScenarioId;
  readonly quality: QaQualityRequest;
  readonly motion: QaMotionRequest;
  readonly audio: AudioRunMode;
  readonly dpr: 1 | 2;
}
export type QaBootResult =
  | { readonly kind: "production" }
  | { readonly kind: "performance"; readonly config: QaBootConfig };

export class QaBootConfigError extends Error {
  public constructor(readonly field: string) {
    super(`qa_configuration_invalid:${field}`);
    this.name = "QaBootConfigError";
  }
}

function oneOf<T extends string>(value: string | null, values: readonly T[], field: string): T {
  if (value !== null && values.includes(value as T)) return value as T;
  throw new QaBootConfigError(field);
}

/** Read once during boot. The result is never persisted or observed again. */
export function parseQaBootConfig(url: URL): QaBootResult {
  const qaMode = url.searchParams.get("qa");
  if (qaMode === null) return { kind: "production" };
  if (qaMode !== "performance") throw new QaBootConfigError("qa");
  const scenarioId = oneOf(url.searchParams.get("scenario"), [
    "performance-reference-v1",
    "world-seam-performance-v1",
    "four-cycle-memory-v1",
    "full-story-reference-v1"
  ] as const, "scenario");
  const quality = oneOf(url.searchParams.get("quality"), ["auto", "force-full", "force-reduced"] as const, "quality");
  const motion = oneOf(url.searchParams.get("motion"), ["system", "full", "reduced"] as const, "motion");
  const audio = oneOf(url.searchParams.get("audio"), ["enabled", "muted", "disabled"] as const, "audio");
  const dprText = oneOf(url.searchParams.get("dpr"), ["1", "2"] as const, "dpr");
  return {
    kind: "performance",
    config: { mode: "performance", scenarioId, quality, motion, audio, dpr: dprText === "1" ? 1 : 2 }
  };
}
