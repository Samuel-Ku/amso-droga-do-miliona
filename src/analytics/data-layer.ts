import type { DataLayerEvent, RunnerSource } from "../shared/types";
import {
  RUNNER_ANALYTICS_EVENTS,
  RUNNER_GAME_NAME,
  type RunnerAnalyticsEventName
} from "./events";

export interface DataLayerTarget {
  dataLayer?: DataLayerEvent[];
}

export interface DataLayerTrackerOptions {
  gameVersion: string;
  dataLayer?: DataLayerEvent[];
  target?: DataLayerTarget;
  consentGranted?: boolean | (() => boolean);
  /** Kept for source compatibility; v3 does not transmit entry-point identifiers. */
  sourceLocation?: RunnerSource;
}

const ALLOWED_EVENTS = new Set<string>(RUNNER_ANALYTICS_EVENTS);
const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,63}$/;
const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z.+-]{0,31}$/;

function browserTarget(): DataLayerTarget | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function safeVersion(value: unknown): string {
  return typeof value === "string" && VERSION_PATTERN.test(value) ? value : "unknown";
}

function safeIdentifier(value: unknown): string | undefined {
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value) ? value : undefined;
}

function consentValue(consent: boolean | (() => boolean) | undefined): boolean {
  try {
    return typeof consent === "function" ? consent() === true : consent === true;
  } catch {
    return false;
  }
}

function safeMode(value: unknown): "story" | "challenge" | undefined {
  return value === "story" || value === "challenge" ? value : undefined;
}

/**
 * Minimal, consent-gated analytics adapter for the v3 campaign. Unknown events
 * are ignored instead of being converted into another event.
 */
export class DataLayerTracker {
  private readonly gameVersion: string;
  private readonly directDataLayer: DataLayerEvent[] | undefined;
  private readonly target: DataLayerTarget | undefined;
  private readonly consentGranted: boolean | (() => boolean) | undefined;

  public constructor(options: DataLayerTrackerOptions) {
    this.gameVersion = safeVersion(options.gameVersion);
    this.directDataLayer = options.dataLayer;
    this.target = options.target ?? browserTarget();
    this.consentGranted = options.consentGranted;
  }

  public setSourceLocation(_sourceLocation: RunnerSource): this {
    return this;
  }

  public track(
    eventName: string,
    payload: Readonly<Record<string, unknown>>,
    _options: Readonly<Record<string, unknown>> = {}
  ): DataLayerEvent | null {
    if (!consentValue(this.consentGranted) || !ALLOWED_EVENTS.has(eventName)) {
      return null;
    }

    const safeEventName = eventName as RunnerAnalyticsEventName;
    const event: DataLayerEvent = {
      event: safeEventName,
      game_name: RUNNER_GAME_NAME,
      game_version: this.gameVersion
    };

    if (safeEventName === "game_started") {
      const mode = safeMode(payload.mode);
      if (mode === undefined) return null;
      event.mode = mode;
    } else if (safeEventName === "game_load_failed") {
      const errorCode = safeIdentifier(payload.error_code);
      if (errorCode !== undefined) event.error_code = errorCode;
    }

    this.push(event);
    return event;
  }

  /** Legacy loader hooks intentionally do nothing in the v3 analytics contract. */
  public triggerViewed(_sourceLocation: RunnerSource): null {
    return null;
  }

  /** Legacy loader hooks intentionally do nothing in the v3 analytics contract. */
  public openRequested(_sourceLocation: RunnerSource): null {
    return null;
  }

  public loadFailed(errorCode: string, _sourceLocation?: RunnerSource): DataLayerEvent | null {
    return this.track("game_load_failed", { error_code: errorCode });
  }

  private push(event: DataLayerEvent): void {
    try {
      if (this.directDataLayer !== undefined) {
        this.directDataLayer.push(event);
        return;
      }
      if (this.target === undefined) return;
      const existing = this.target.dataLayer;
      const layer = Array.isArray(existing) ? existing : [];
      if (layer !== existing) this.target.dataLayer = layer;
      layer.push(event);
    } catch {
      // Telemetry must never interrupt the campaign.
    }
  }
}

export function createDataLayerTracker(
  gameVersion: string,
  _sourceLocation: RunnerSource = "unknown",
  target?: DataLayerTarget,
  consentGranted: boolean | (() => boolean) = false
): DataLayerTracker {
  return new DataLayerTracker({
    gameVersion,
    consentGranted,
    ...(target === undefined ? {} : { target })
  });
}
