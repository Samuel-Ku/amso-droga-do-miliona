import type { StoryObjectiveId, StoryObjectivesSnapshot } from "../game/story-objectives";
import type { PackageType, PowerUpKind } from "../shared/types";

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
  eyebrow?: string;
  title: string;
  body: string | readonly string[];
  vignette: string;
  continueLabel: string;
}

export interface CampaignStoryScene {
  readonly sceneId: string;
  readonly eyebrow?: string;
  readonly title: string;
  readonly body: readonly string[];
  readonly vignette: string;
  readonly continueLabel: string;
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
    ...(input.eyebrow === undefined ? {} : { eyebrow: input.eyebrow }),
    title: input.title,
    body,
    vignette: input.vignette,
    continueLabel: input.continueLabel
  });
}

/** One-shot guard for the scene CTA. Re-arming the same id never unlocks it. */
export class StoryContinuationGate {
  private sceneId: string | null = null;
  private consumed = false;

  public arm(sceneId: string): boolean {
    if (sceneId === this.sceneId) return false;
    this.sceneId = sceneId;
    this.consumed = false;
    return true;
  }

  public consume(sceneId: string): boolean {
    if (this.consumed || sceneId !== this.sceneId) return false;
    this.consumed = true;
    return true;
  }

  public clear(): void {
    this.sceneId = null;
    this.consumed = false;
  }
}

const POWER_UP_HUD_LABELS: Readonly<Record<PowerUpKind, string>> = {
  audyt_jakosci: "Audyt",
  drugie_zycie: "2× punkty",
  gwarancja_48: "Gwarancja"
};

/** Compact enough for the mobile HUD while keeping every carried power visible. */
export function formatPowerUpHud(powerUps: readonly PowerUpKind[]): string {
  return powerUps.map((kind) => POWER_UP_HUD_LABELS[kind]).join(" · ");
}

/** First-run controls stay visible in the top HUD without covering the route. */
export function formatStoryControlsHud(segmentId: string): string | null {
  return segmentId === "epoch_1.training"
    ? "Skok: tap/Spacja · Ślizg: ↓"
    : null;
}

const ORDER_TYPE_LABELS: Readonly<Record<PackageType, string>> = {
  pc: "PC",
  notebook: "notebook",
  lcd: "monitor",
  telefon: "telefon"
};

const HYDRA_PHASE_LABELS = {
  intake: "Przyjęcie",
  routing: "Sortowanie",
  dispatch: "Wysyłka",
  completed: "Gotowe"
} as const;

const MILLION_PHASE_LABELS = {
  order: "Porządek",
  quality: "Jakość",
  choice: "Rozsądny wybór",
  logistics: "Logistyka",
  final_wave: "Finał",
  completed: "Finał"
} as const;

const integerFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });

function formatInteger(value: number): string {
  return integerFormatter.format(value).replace(/[\u00a0\u202f]/gu, " ");
}

/** Turns the objective director's live state into compact, persistent HUD copy. */
export function formatStoryObjectiveHud(
  objectives: Readonly<StoryObjectivesSnapshot>,
  activeOrderTypes: readonly PackageType[] = [],
  boss?: Readonly<{ encounterPhase: number; progress: number; attackCount: number }>
): string | null {
  const completed = new Set(objectives.completedObjectiveIds);
  const prefix = (objectiveId: StoryObjectiveId): string => completed.has(objectiveId) ? "✓ " : "";
  switch (objectives.activeSegmentId) {
    case "epoch_1.training":
      return `${prefix("epoch_1.training")}Cel: skoki ${objectives.epoch1.training.jumps}/${objectives.epoch1.training.targetEach} · ` +
        `ślizgi ${objectives.epoch1.training.slides}/${objectives.epoch1.training.targetEach}`;
    case "epoch_1.cable_chaos":
      return `${prefix("epoch_1.cable_chaos")}Kablowy Chaos · seria ` +
        `${objectives.epoch1.cableChaos.bestAlternation}/${objectives.epoch1.cableChaos.target}`;
    case "epoch_2.quality_series":
      return `${prefix("epoch_2.quality_series")}SPRAWDZONY · serie ` +
        `${objectives.epoch2.completedSeries}/${objectives.epoch2.seriesTarget} · ` +
        `akcje ${objectives.epoch2.currentSeries}/${objectives.epoch2.comboTarget}`;
    case "epoch_2.doubt_cloud":
      return "Chmura Wątpliwości · utrzymaj trasę";
    case "epoch_3.creative_contract":
      return `${prefix("epoch_3.creative_contract")}Kreatywny start · ` +
        `${objectives.epoch3.creative.collected}/${objectives.epoch3.creative.target}`;
    case "epoch_3.growth_contract":
      return `${prefix("epoch_3.growth_contract")}Rozwój firmy · combo ×` +
        `${objectives.epoch3.growth.bestCombo}/${objectives.epoch3.growth.target}`;
    case "epoch_3.trust_contract":
      return `${prefix("epoch_3.trust_contract")}Zaufanie na lata · czysta seria ` +
        `${objectives.epoch3.trust.longestClean}/${objectives.epoch3.trust.target}`;
    case "epoch_3.budget_eater":
      return "Budżetożerca · przejdź finał kontraktów";
    case "epoch_4.orders": {
      const orders = objectives.epoch4.orders;
      if (orders.completed) {
        return `✓ Kolejka gotowa · ${orders.requiredCompleted}/${orders.requiredTarget} · ` +
          `bonus +${orders.bonusCompleted}`;
      }
      const activeType = activeOrderTypes[0];
      const type = activeType === undefined ? "" : ` · ${ORDER_TYPE_LABELS[activeType]}`;
      return `Kolejka zamówień${type} · ${orders.requiredCompleted}/${orders.requiredTarget}`;
    }
    case "epoch_4.logistic_hydra": {
      const hydra = objectives.epoch4.hydra;
      if (hydra.completed) return "✓ Logistyczna Hydra · 3/3";
      return `Logistyczna Hydra · ${HYDRA_PHASE_LABELS[hydra.phase]} · ` +
        `${hydra.phasesCompleted}/3`;
    }
    case "epoch_5.counter":
      return `${prefix("epoch_5.counter")}Licznik zamówień · ` +
        formatInteger(objectives.epoch5.counter.value);
    case "epoch_5.million_wave": {
      if (boss) {
        return `Fala Miliona · faza ${Math.max(1, Math.min(3, boss.encounterPhase))}/3 · ` +
          `kombinacje ${boss.progress}/${boss.attackCount}`;
      }
      const wave = objectives.epoch5.wave;
      const phaseNumber = wave.completed ? 5 : Math.min(5, wave.guidedPhasesCompleted + 1);
      return `${prefix("epoch_5.million_wave")}Fala Miliona · ${MILLION_PHASE_LABELS[wave.phase]} · ` +
        `faza ${phaseNumber}/5 · symbole ${objectives.epoch5.symbols.collectedIds.length}/` +
        `${objectives.epoch5.symbols.collectedIds.length + objectives.epoch5.symbols.pendingIds.length}`;
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
