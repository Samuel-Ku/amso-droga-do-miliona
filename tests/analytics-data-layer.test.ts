import { describe, expect, it } from "vitest";
import { DataLayerTracker } from "../src/analytics/data-layer";
import type { DataLayerEvent } from "../src/shared/types";

describe("DataLayerTracker v3 contract", () => {
  it("adds the mount locale without changing event names", () => {
    const dataLayer: DataLayerEvent[] = [];
    new DataLayerTracker({
      gameVersion: "3.0.0",
      locale: "uk",
      dataLayer,
      consentGranted: true
    }).track("game_started", { mode: "story" });
    expect(dataLayer[0]).toMatchObject({ event: "game_started", locale: "uk" });
  });

  it("emits only the three approved events when analytics consent exists", () => {
    const dataLayer: DataLayerEvent[] = [];
    const tracker = new DataLayerTracker({
      gameVersion: "3.0.0",
      dataLayer,
      consentGranted: true
    });

    tracker.track("game_started", { mode: "story" });
    tracker.track("game_started", { mode: "challenge" });
    tracker.track("story_completed", {});
    tracker.track("game_load_failed", { error_code: "config_timeout" });

    expect(dataLayer).toEqual([
      {
        event: "game_started",
        game_name: "droga_do_miliona",
        game_version: "3.0.0",
        mode: "story"
      },
      {
        event: "game_started",
        game_name: "droga_do_miliona",
        game_version: "3.0.0",
        mode: "challenge"
      },
      {
        event: "story_completed",
        game_name: "droga_do_miliona",
        game_version: "3.0.0"
      },
      {
        event: "game_load_failed",
        game_name: "droga_do_miliona",
        game_version: "3.0.0",
        error_code: "config_timeout"
      }
    ]);
  });

  it("does not push any event without analytics consent", () => {
    const dataLayer: DataLayerEvent[] = [];
    const tracker = new DataLayerTracker({
      gameVersion: "3.0.0",
      dataLayer,
      consentGranted: false
    });

    tracker.track("game_started", { mode: "story" });
    tracker.track("story_completed", {});
    tracker.track("game_load_failed", { error_code: "runtime_timeout" });

    expect(dataLayer).toEqual([]);
  });

  it("rejects legacy events and strips arbitrary or PII-shaped fields", () => {
    const dataLayer: DataLayerEvent[] = [];
    const tracker = new DataLayerTracker({
      gameVersion: "3.0.0",
      dataLayer,
      consentGranted: true
    });

    tracker.track("post_score" as never, { score: 99 } as never);
    tracker.track("story_completed", {
      score: 99,
      email: "person@example.com",
      order_number: "ABC"
    } as never);
    tracker.track("game_load_failed", {
      error_code: "https://example.com/?email=a@b.com"
    });

    expect(dataLayer).toEqual([
      {
        event: "story_completed",
        game_name: "droga_do_miliona",
        game_version: "3.0.0"
      },
      {
        event: "game_load_failed",
        game_name: "droga_do_miliona",
        game_version: "3.0.0"
      }
    ]);
  });

  it("fails open for frozen or malformed host data layers", () => {
    const malformedTarget = Object.freeze({ dataLayer: { not: "an array" } });
    const malformedTracker = new DataLayerTracker({
      gameVersion: "3.0.0",
      target: malformedTarget as never,
      consentGranted: true
    });
    const frozenLayer = Object.freeze([]) as unknown as DataLayerEvent[];
    const frozenTracker = new DataLayerTracker({
      gameVersion: "3.0.0",
      dataLayer: frozenLayer,
      consentGranted: true
    });

    expect(() => malformedTracker.track("story_completed", {})).not.toThrow();
    expect(() => frozenTracker.track("story_completed", {})).not.toThrow();
  });
});
