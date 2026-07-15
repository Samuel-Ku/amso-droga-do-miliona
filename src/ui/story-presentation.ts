import type { StoryObjectiveId, StoryObjectivesSnapshot } from "../game/story-objectives";
import type { PackageType, PowerUpKind, StoryPerspective } from "../shared/types";

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
  audyt_jakosci: "AUDYT",
  drugie_zycie: "2× PUNKTY",
  gwarancja_48: "OCHRONA ×1"
};

/** Compact enough for the mobile HUD while keeping every carried power visible. */
export function formatPowerUpHud(powerUps: readonly PowerUpKind[]): string {
  return powerUps.map((kind) => POWER_UP_HUD_LABELS[kind]).join(" · ");
}

/** First-run controls stay visible in the top HUD without covering the route. */
export function formatStoryControlsHud(segmentId: string): string | null {
  return segmentId === "epoch_1.training"
    ? "Skok: tap/Spacja · Ślizg: ↓/S"
    : null;
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
  activeOrderTypes: readonly PackageType[] = []
): string | null {
  const completed = new Set(objectives.completedObjectiveIds);
  const prefix = (objectiveId: StoryObjectiveId): string => completed.has(objectiveId) ? "✓ " : "";
  switch (objectives.activeSegmentId) {
    case "epoch_1.training":
      return `${prefix("epoch_1.training")}Cel: skoki ${objectives.epoch1.training.jumps}/${objectives.epoch1.training.targetEach} · ` +
        `ślizgi ${objectives.epoch1.training.slides}/${objectives.epoch1.training.targetEach}`;
    case "epoch_1.order_backlog":
      return `${prefix("epoch_1.order_backlog")}Zator Zamówień · sekwencja ` +
        `${objectives.epoch1.orderBacklog.bestAlternation}/${objectives.epoch1.orderBacklog.target}`;
    case "epoch_2.quality_series":
      return `${prefix("epoch_2.quality_series")}SPRAWDZONY · serie ` +
        `${objectives.epoch2.completedSeries}/${objectives.epoch2.seriesTarget} · ` +
        `akcje ${objectives.epoch2.currentSeries}/${objectives.epoch2.comboTarget}`;
    case "epoch_2.quality_trial":
      return "Próba Jakości · urządzenie rusza do kolejnego użytkownika";
    case "epoch_3.matching_creative":
      return `${prefix("epoch_3.matching_creative")}Wyzwanie Dopasowania · klientka kreatywna · ` +
        `${objectives.epoch3.creative.collected}/${objectives.epoch3.creative.target}`;
    case "epoch_3.matching_growth":
      return `${prefix("epoch_3.matching_growth")}Rozwój Firmy · wyposażenie zespołu · SERIA ×` +
        `${objectives.epoch3.growth.bestCombo}/${objectives.epoch3.growth.target}`;
    case "epoch_3.matching_trust":
      return `${prefix("epoch_3.matching_trust")}Wyzwanie Dopasowania · zespół B2B · czysta seria ` +
        `${objectives.epoch3.trust.longestClean}/${objectives.epoch3.trust.target}`;
    case "epoch_4.order_peak": {
      const orders = objectives.epoch4.orders;
      if (orders.completed) {
        return `✓ Kolejka gotowa · ${orders.requiredCompleted}/${orders.requiredTarget} · ` +
          `bonus +${orders.bonusCompleted}`;
      }
      const activeType = activeOrderTypes[0];
      const type = activeType === undefined ? "" : ` · ${ORDER_TYPE_LABELS[activeType]}`;
      return `Kolejka zamówień${type} · ${orders.requiredCompleted}/${orders.requiredTarget}`;
    }
    case "epoch_4.order_peak_final": {
      const flow = objectives.epoch4.flow;
      if (flow.completed) return "✓ Szczyt Zamówień · 3/3";
      return `Szczyt Zamówień · ${ORDER_PEAK_PHASE_LABELS[flow.phase]} · ` +
        `${flow.phasesCompleted}/3`;
    }
    case "epoch_5.million_threshold": {
      const finale = objectives.epoch5.millionThreshold;
      return `${prefix("epoch_5.million_threshold")}Próg Miliona · PACZKI ` +
        `${finale.packagesCollected}/${finale.packageTarget} · KOMBINACJE ` +
        `${finale.combinationsCompleted}/${finale.combinationTarget}`;
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
