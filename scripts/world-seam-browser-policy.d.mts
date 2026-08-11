export interface BrowserRectSample {
  readonly left: number;
  readonly right: number;
  readonly width: number;
}

export interface ChallengeSeamBrowserSample {
  readonly between: string | null;
  readonly direction: string | null;
  readonly overlapPercent: number;
  readonly standardMasks: readonly string[];
  readonly prefixedMasks: readonly string[];
  readonly panelOpacity: readonly number[];
  readonly panelRects: readonly BrowserRectSample[];
  readonly paintedStageRect: BrowserRectSample;
  readonly visibleStageRect: BrowserRectSample;
}

export interface StorySeamBrowserSample {
  readonly phase: string | null;
  readonly between: string | null;
  readonly overlap: string;
  readonly panelSides: readonly (string | null)[];
}

export function assessChallengeSeamSample(sample: ChallengeSeamBrowserSample): string[];
export function assessStorySeamSample(sample: StorySeamBrowserSample): string[];
