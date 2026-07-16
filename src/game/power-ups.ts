import type { PowerUpKind } from "../shared/types";
import { POWER_UP_DURATION } from "./narrative";

export const AUDIT_SPAWN_RATE = 0.72;
export const MAX_ACTIVE_POWER_UPS = 2;

export interface ActivePowerUpStatus {
  kind: PowerUpKind;
  /** Warranty is a charge, represented by null instead of a countdown. */
  remainingSeconds: number | null;
}

const STORY_POWER_UP_ORDER: readonly PowerUpKind[] = [
  "audyt_jakosci",
  "drugie_zycie",
  "gwarancja_48"
];

export function storyPowerUpsForEpoch(epochIndex: number): readonly PowerUpKind[] {
  const unlockedCount = Math.max(0, Math.min(3, Math.floor(epochIndex)));
  return STORY_POWER_UP_ORDER.slice(0, unlockedCount);
}

/**
 * Audyt jakości affects only how quickly the spawner consumes its distance
 * budget. World travel and runner physics continue to use the unmodified value.
 */
export function spawnTravelDistance(travelledPixels: number, auditActive: boolean): number {
  const travelled = Math.max(0, travelledPixels);
  return auditActive ? travelled * AUDIT_SPAWN_RATE : travelled;
}

/** Active effects with warranty represented as one persistent charge. */
export class ActivePowerUps {
  private readonly remainingSeconds = new Map<PowerUpKind, number>();

  public has(kind: PowerUpKind): boolean {
    return this.remainingSeconds.has(kind);
  }

  public activate(kind: PowerUpKind): boolean {
    if (kind === "gwarancja_48") {
      if (!this.remainingSeconds.has(kind)) {
        if (this.remainingSeconds.size >= MAX_ACTIVE_POWER_UPS) return false;
        this.remainingSeconds.set(kind, Number.POSITIVE_INFINITY);
      }
      return true;
    }
    if (!this.remainingSeconds.has(kind) && this.remainingSeconds.size >= MAX_ACTIVE_POWER_UPS) {
      return false;
    }
    this.remainingSeconds.set(kind, POWER_UP_DURATION[kind]);
    return true;
  }

  public consumeWarranty(): boolean {
    if (!this.remainingSeconds.has("gwarancja_48")) return false;
    this.remainingSeconds.delete("gwarancja_48");
    return true;
  }

  public tick(deltaSeconds: number): void {
    const delta = Math.max(0, deltaSeconds);
    for (const [kind, remaining] of this.remainingSeconds) {
      if (kind === "gwarancja_48") continue;
      const next = remaining - delta;
      if (next <= 0) this.remainingSeconds.delete(kind);
      else this.remainingSeconds.set(kind, next);
    }
  }

  public keys(): PowerUpKind[] {
    return [...this.remainingSeconds.keys()];
  }

  public statuses(): ActivePowerUpStatus[] {
    return [...this.remainingSeconds].map(([kind, remainingSeconds]) => ({
      kind,
      remainingSeconds: Number.isFinite(remainingSeconds)
        ? Math.max(0, remainingSeconds)
        : null
    }));
  }

  public clear(): void {
    this.remainingSeconds.clear();
  }
}
