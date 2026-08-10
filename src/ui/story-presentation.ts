import type { StoryObjectiveId, StoryObjectivesSnapshot } from "../game/story-objectives";
import type { AuthoredWaveProgressSnapshot } from "../game/authored-wave";
import type { ActivePowerUpStatus } from "../game/power-ups";
import type { PackageType, PowerUpKind, StoryPerspective } from "../shared/types";
import { GAME_INSTRUCTION_COPY } from "../config/game-instructions-copy";

const STORY_PERSPECTIVE_LABELS: Readonly<Record<StoryPerspective, string>> = {
  amso: "Nasza historia",
  client: "Historia klienta",
  challenge: "Wyzwanie"
};

export function formatStoryPerspective(perspective: StoryPerspective): string {
  return STORY_PERSPECTIVE_LABELS[perspective];
}

export type FullscreenPreference = "fullscreen" | "portrait";

/** Fullscreen only counts as the campaign preference when this shell owns it. */
export function fullscreenPreferenceFromElement(
  fullscreenElement: Element | null,
  campaignRoot: Element
): FullscreenPreference {
  return fullscreenElement === campaignRoot ? "fullscreen" : "portrait";
}

export interface CampaignStorySceneInput {
  sceneId: string;
  presentationId?: string;
  visualStateId?: string;
  eyebrow?: string;
  title: string;
  body: string | readonly string[];
  vignette: string;
  continueLabel: string;
  action?: string;
  finalFrame?: string;
}

export interface CampaignStoryScene {
  readonly sceneId: string;
  readonly presentationId: string;
  readonly visualStateId: string;
  readonly eyebrow?: string;
  readonly title: string;
  readonly body: readonly string[];
  readonly vignette: string;
  readonly continueLabel: string;
  readonly action?: string;
  readonly finalFrame?: string;
}

/**
 * Takes an immutable snapshot at the presentation boundary. The DOM can then
 * keep rendering the same card even if an upstream timeline emits again.
 */
export function snapshotStoryScene(input: CampaignStorySceneInput): CampaignStoryScene {
  const body = Object.freeze(
    (typeof input.body === "string" ? [input.body] : [...input.body])
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0)
  );
  return Object.freeze({
    sceneId: input.sceneId,
    presentationId: input.presentationId ?? input.sceneId,
    visualStateId: input.visualStateId ?? input.sceneId,
    ...(input.eyebrow === undefined ? {} : { eyebrow: input.eyebrow }),
    title: input.title,
    body,
    vignette: input.vignette,
    continueLabel: input.continueLabel,
    ...(input.action === undefined ? {} : { action: input.action }),
    ...(input.finalFrame === undefined ? {} : { finalFrame: input.finalFrame })
  });
}

/** One-shot guard for the scene CTA. Re-arming the same id never unlocks it. */
export class StoryContinuationGate {
  private sceneId: string | null = null;
  private consumed = false;
  private unlockAt = 0;

  public constructor(private readonly now: () => number = () => Date.now()) {}

  public arm(sceneId: string, lockDurationMs = 0): boolean {
    if (sceneId === this.sceneId) return false;
    this.sceneId = sceneId;
    this.consumed = false;
    this.unlockAt = this.now() + Math.max(0, lockDurationMs);
    return true;
  }

  public isLocked(sceneId: string): boolean {
    return sceneId !== this.sceneId || this.now() < this.unlockAt;
  }

  public consume(sceneId: string): boolean {
    if (this.consumed || this.isLocked(sceneId)) return false;
    this.consumed = true;
    return true;
  }

  public clear(): void {
    this.sceneId = null;
    this.consumed = false;
    this.unlockAt = 0;
  }
}

const POWER_UP_HUD_LABELS: Readonly<Record<PowerUpKind, string>> = {
  podwojny_wynik: "×2 WYNIK",
  gwarancja_48: "GWARANCJA AMSO CARE ×1"
};

/** Compact enough for the mobile HUD while keeping every carried power visible. */
export function formatPowerUpHud(
  powerUps: readonly PowerUpKind[],
  statuses: readonly ActivePowerUpStatus[] = [],
  labels: Partial<Readonly<Record<PowerUpKind, string>>> = {},
  translate: (source: string) => string = (source) => source
): string {
  const remainingByKind = new Map(statuses.map(({ kind, remainingSeconds }) => [kind, remainingSeconds]));
  return powerUps.map((kind) => {
    const seconds = remainingByKind.get(kind);
    const timer = seconds === undefined || seconds === null ? "" : ` ${Math.ceil(seconds)} s`;
    return `${translate(labels[kind] ?? POWER_UP_HUD_LABELS[kind])}${timer}`;
  }).join(" · ");
}

/** First-run controls stay visible in the top HUD without covering the route. */
export function formatStoryControlsHud(
  segmentId: string,
  authoredProgress?: Readonly<AuthoredWaveProgressSnapshot> | null,
  copy: string = GAME_INSTRUCTION_COPY.compactControls
): string | null {
  return segmentId === "epoch_1.training" ||
    (authoredProgress?.microlevelId === "first-package" &&
      authoredProgress.wavesCompleted === 0)
    ? copy
    : null;
}

const SCALE_ZONE_LABELS = ["PRZYJĘCIE", "REALIZACJA", "WYSYŁKA"] as const;
const SCALE_ZONE_SYMBOLS = ["📥", "⚙️", "🚚"] as const;
const GROWTH_PHASE_SYMBOLS = ["💻", "👥", "🏢"] as const;

/** One semantic objective slot for every authored v7 microlevel. */
export function formatAuthoredWaveHud(
  progress: Readonly<AuthoredWaveProgressSnapshot> | null,
  translate: (source: string) => string = (source) => source
): string | null {
  if (progress === null) return null;
  const completed = Math.min(progress.wavesCompleted, progress.waveTarget);
  const actionCue = progress.currentObstacleVariant === "parcel-arc"
    ? translate("ZBIERZ ZAMÓWIENIA")
    : (progress.currentActions ?? [])
      .map((action) => action === "jump" ? `W ${translate("SKOK")}` : `S ${translate("ŚLIZG")}`)
      .join(" + ");
  const actionSuffix = actionCue ? ` · ${actionCue}` : "";
  switch (progress.microlevelId) {
    case "first-package":
      return `📦 ${translate("RUCHY")} ${completed}/${progress.waveTarget}${actionSuffix}`;
    case "order-backlog":
      return `📦 ${translate("FALE ZATORU")} ${completed}/${progress.waveTarget}${actionSuffix}`;
    case "quality-process": {
      const devices = Math.min(4, Math.floor(completed / 3));
      const step = progress.completed ? 3 : completed % 3 + 1;
      return `💻 ${translate("SPRAWDZONE")} ${devices}/4 · ${translate("KROK")} ${step}/3`;
    }
    case "client-growth": {
      const phase = Math.min(2, Math.floor(completed / 2));
      return `${GROWTH_PHASE_SYMBOLS[phase]} ${translate("ROZWÓJ")} ${progress.completed ? 3 : phase + 1}/3`;
    }
    case "order-scale": {
      const zoneIndex = Math.min(2, Math.floor(completed / 3));
      const step = progress.completed ? 3 : completed % 3 + 1;
      return `${SCALE_ZONE_SYMBOLS[zoneIndex]} ${translate(SCALE_ZONE_LABELS[zoneIndex]!)} ${step}/3`;
    }
    case "million-threshold":
      // The objective HUD owns the one canonical 999 950 → 1 000 000 counter.
      return null;
  }
}

const ORDER_TYPE_LABELS: Readonly<Record<PackageType, string>> = {
  pc: "PC",
  notebook: "notebook",
  lcd: "monitor",
  telefon: "telefon"
};

const ORDER_PEAK_PHASE_LABELS = {
  intake: "Przyjęcie",
  routing: "Sortowanie",
  dispatch: "Wysyłka",
  completed: "Gotowe"
} as const;

/** Turns the objective director's live state into compact, persistent HUD copy. */
export function formatStoryObjectiveHud(
  objectives: Readonly<StoryObjectivesSnapshot>,
  activeOrderTypes: readonly PackageType[] = [],
  translate: (source: string) => string = (source) => source
): string | null {
  const completed = new Set(objectives.completedObjectiveIds);
  const prefix = (objectiveId: StoryObjectiveId): string => completed.has(objectiveId) ? "✓ " : "";
  switch (objectives.activeSegmentId) {
    case "epoch_1.training":
      return `${prefix("epoch_1.training")}${translate("Cel: skoki")} ${objectives.epoch1.training.jumps}/${objectives.epoch1.training.targetEach} · ` +
        `${translate("ślizgi")} ${objectives.epoch1.training.slides}/${objectives.epoch1.training.targetEach}`;
    case "epoch_1.order_backlog":
      return `${prefix("epoch_1.order_backlog")}${translate("Zator Zamówień")} · ${translate("sekwencja")} ` +
        `${objectives.epoch1.orderBacklog.bestAlternation}/${objectives.epoch1.orderBacklog.target}`;
    case "epoch_2.quality_series":
      return `${prefix("epoch_2.quality_series")}${translate("SPRAWDZONY")} · ${translate("serie")} ` +
        `${objectives.epoch2.completedSeries}/${objectives.epoch2.seriesTarget} · ` +
        `${translate("akcje")} ${objectives.epoch2.currentSeries}/${objectives.epoch2.comboTarget}`;
    case "epoch_2.quality_trial":
      return translate("Próba Jakości · urządzenie rusza do kolejnego użytkownika");
    case "epoch_3.matching_creative":
      return `${prefix("epoch_3.matching_creative")}${translate("Wyzwanie Dopasowania")} · ${translate("klientka kreatywna")} · ` +
        `${objectives.epoch3.creative.collected}/${objectives.epoch3.creative.target}`;
    case "epoch_3.matching_growth":
      return `${prefix("epoch_3.matching_growth")}${translate("Rozwój Firmy")} · ${translate("wyposażenie zespołu")} · ${translate("SERIA")} ×` +
        `${objectives.epoch3.growth.bestCombo}/${objectives.epoch3.growth.target}`;
    case "epoch_3.matching_trust":
      return `${prefix("epoch_3.matching_trust")}${translate("Wyzwanie Dopasowania")} · ${translate("zespół B2B")} · ${translate("czysta seria")} ` +
        `${objectives.epoch3.trust.longestClean}/${objectives.epoch3.trust.target}`;
    case "epoch_4.order_peak": {
      const orders = objectives.epoch4.orders;
      if (orders.completed) {
        return `✓ ${translate("Kolejka gotowa")} · ${orders.requiredCompleted}/${orders.requiredTarget} · ` +
          `${translate("bonus")} +${orders.bonusCompleted}`;
      }
      const activeType = activeOrderTypes[0];
      const type = activeType === undefined ? "" : ` · ${ORDER_TYPE_LABELS[activeType]}`;
      return `${translate("Kolejka zamówień")}${type} · ${orders.requiredCompleted}/${orders.requiredTarget}`;
    }
    case "epoch_4.order_peak_final": {
      const flow = objectives.epoch4.flow;
      if (flow.completed) return `✓ ${translate("Szczyt Zamówień")} · 3/3`;
      return `${translate("Szczyt Zamówień")} · ${translate(ORDER_PEAK_PHASE_LABELS[flow.phase])} · ` +
        `${flow.phasesCompleted}/3`;
    }
    case "epoch_5.million_threshold": {
      const finale = objectives.epoch5.millionThreshold;
      return `${prefix("epoch_5.million_threshold")}${translate("Próg Miliona")} · ${translate("ZAMÓWIENIA")} ` +
        `${finale.ordersCollected}/${finale.orderTarget}`;
    }
    default:
      return null;
  }
}

/** Returns the next focus index, wrapping at both edges of a modal dialog. */
export function getTrappedFocusIndex(
  currentIndex: number,
  focusableCount: number,
  backwards: boolean
): number {
  if (focusableCount <= 0) return -1;
  if (currentIndex < 0 || currentIndex >= focusableCount) {
    return backwards ? focusableCount - 1 : 0;
  }
  return (currentIndex + (backwards ? -1 : 1) + focusableCount) % focusableCount;
}
