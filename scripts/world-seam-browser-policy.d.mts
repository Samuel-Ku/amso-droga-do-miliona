export interface BrowserRectSample {
  readonly left: number;
  readonly right: number;
  readonly width: number;
}

export interface ChallengeSeamBrowserSample {
  readonly overlap: string;
  readonly standardMasks: readonly string[];
  readonly prefixedMasks: readonly string[];
  readonly panelOpacity: readonly number[];
  readonly panelXPercent: readonly number[];
  readonly panelWorlds: readonly (string | null)[];
  readonly panelSides: readonly (string | null)[];
  readonly velocityRatio: number;
  readonly phaseResidualPx: number;
  readonly renderedPixelTolerancePx: number;
  readonly panelRects: readonly BrowserRectSample[];
  readonly paintedStageRect: BrowserRectSample;
  readonly visibleStageRect: BrowserRectSample;
}

export interface StorySeamBrowserSample {
  readonly phase: string | null;
  readonly overlap: string;
  readonly panelSides: readonly (string | null)[];
  readonly standardMasks: readonly string[];
  readonly prefixedMasks: readonly string[];
}

export function assessChallengeSeamSample(
  sample: ChallengeSeamBrowserSample,
  options?: { readonly requireVelocity?: boolean }
): string[];
export function assessStorySeamSample(sample: StorySeamBrowserSample): string[];
