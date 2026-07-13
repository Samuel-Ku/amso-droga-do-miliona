export const RUNNER_GAME_NAME = "droga_do_miliona" as const;

export const RUNNER_ANALYTICS_EVENTS = [
  "game_started",
  "story_completed",
  "game_load_failed"
] as const;

export type RunnerAnalyticsEventName = (typeof RUNNER_ANALYTICS_EVENTS)[number];

export interface RunnerAnalyticsPayloadMap {
  game_started: { mode: "story" | "challenge" };
  story_completed: Record<never, never>;
  game_load_failed: { error_code: string };
}

export type RunnerAnalyticsPayload<EventName extends RunnerAnalyticsEventName> =
  RunnerAnalyticsPayloadMap[EventName];
