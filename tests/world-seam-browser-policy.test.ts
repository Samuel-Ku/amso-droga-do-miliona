import { describe, expect, it } from "vitest";
import {
  assessChallengeSeamSample,
  assessStorySeamSample
} from "../scripts/world-seam-browser-policy.mjs";

const validSample = {
  between: "first-mile:order-process",
  direction: "right-to-left",
  overlapPercent: 9,
  standardMasks: [
    "linear-gradient(90deg, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 91%, transparent 100%)",
    "linear-gradient(90deg, transparent 0%, rgb(0, 0, 0) 9%, rgb(0, 0, 0) 100%)"
  ],
  prefixedMasks: [
    "linear-gradient(90deg, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 91%, transparent 100%)",
    "linear-gradient(90deg, transparent 0%, rgb(0, 0, 0) 9%, rgb(0, 0, 0) 100%)"
  ],
  panelOpacity: [0.6, 0.6],
  panelRects: [
    { left: -400, right: 560, width: 960 },
    { left: 474, right: 1434, width: 960 }
  ],
  paintedStageRect: { left: 0, right: 960, width: 960 },
  visibleStageRect: { left: 0, right: 960, width: 960 }
};

describe("world seam browser qualification policy", () => {
  it("accepts a narrow complementary covered seam with equivalent mask geometry", () => {
    expect(assessChallengeSeamSample(validSample)).toEqual([]);
  });

  it("rejects gaps, broad ghosting, darkening and divergent prefixed geometry", () => {
    expect(assessChallengeSeamSample({
      ...validSample,
      overlapPercent: 24,
      prefixedMasks: ["none", "none"],
      panelOpacity: [0.6, 0.3],
      panelRects: [
        { left: 200, right: 420, width: 220 },
        { left: 430, right: 1250, width: 820 }
      ],
      visibleStageRect: { left: -100, right: 1300, width: 1400 }
    })).toEqual(expect.arrayContaining([
      "seam-overlap-outside-8-10-percent",
      "standard-prefixed-mask-geometry-mismatch",
      "panel-opacity-diverged",
      "stage-not-fully-covered",
      "visible-stage-exposure-exceeds-canonical-insets"
    ]));
  });

  it("allows only the stable outer inset of the canonical painted plate", () => {
    expect(assessChallengeSeamSample({
      ...validSample,
      paintedStageRect: { left: 80, right: 880, width: 800 },
      visibleStageRect: { left: 0, right: 960, width: 960 },
      panelRects: [
        { left: 20, right: 820, width: 800 },
        { left: 748, right: 1548, width: 800 }
      ]
    })).toEqual([]);
  });

  it("requires story presentation to remain free of challenge mask state", () => {
    expect(assessStorySeamSample({
      phase: "story",
      between: null,
      overlap: "0px",
      panelSides: [null, null]
    })).toEqual([]);
    expect(assessStorySeamSample({
      phase: "story",
      between: "first-mile:order-process",
      overlap: "9%",
      panelSides: ["outgoing", "incoming"]
    })).toEqual([
      "story-has-challenge-seam",
      "story-has-world-overlap",
      "story-panels-have-mask-state"
    ]);
  });
});
