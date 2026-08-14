export interface FullStoryDriverObservation {
  readonly controlsEnabled: boolean;
  readonly actionToken: string | null;
  readonly action: "jump" | "slide" | null;
  readonly runner: Readonly<{ grounded: boolean }>;
  readonly target: Readonly<{ kind: "obstacle" | "package"; x: number }> | null;
  readonly authoredWave: Readonly<{
    attemptsOnCurrentWave: number;
    ordersCollectedOnCurrentWave?: number;
  }> | null;
}

export interface FullStoryDriverState {
  readonly actedToken?: string | null;
  readonly slideToken?: string | null;
}

export type FullStoryDriverCommand =
  | { readonly type: "jump" | "slide-start" | "slide-end"; readonly token: string }
  | { readonly type: "fail"; readonly reason: string };

export function nextFullStoryDriverCommand(
  observation: FullStoryDriverObservation,
  state: FullStoryDriverState
): FullStoryDriverCommand | null;
