import { describe, expect, it } from "vitest";
import {
  assessChallengeSeamSample,
  assessStorySeamSample
} from "../scripts/world-seam-browser-policy.mjs";

const validSample = {
  overlap: "",
  standardMasks: ["none", "none"],
  prefixedMasks: ["none", "none"],
  panelOpacity: [0.6, 0.6],
  panelXPercent: [-50, 50],
  panelWorlds: ["first-mile", "order-process"],
  panelSides: [null, null],
  velocityRatio: 1,
  phaseResidualPx: 0.01,
  renderedPixelTolerancePx: 0.9,
  panelRects: [
    { left: -480, right: 480, width: 960 },
    { left: 480, right: 1440, width: 960 }
  ],
  paintedStageRect: { left: 0, right: 960, width: 960 },
  visibleStageRect: { left: 0, right: 960, width: 960 }
};

describe("world boundary browser qualification policy", () => {
  it("accepts adjacent panels with linear velocity and no transition effects", () => {
    expect(assessChallengeSeamSample(validSample)).toEqual([]);
  });

  it("rejects overlap, mask state, velocity distortion and exposed stage", () => {
    expect(assessChallengeSeamSample({
      ...validSample,
      overlap: "9%",
      standardMasks: ["linear-gradient(#000, transparent)", "none"],
      prefixedMasks: ["linear-gradient(#000, transparent)", "none"],
      panelXPercent: [-45.5, 45.5],
      panelSides: ["outgoing", "incoming"],
      velocityRatio: 0.1,
      phaseResidualPx: 12,
      panelRects: [
        { left: 200, right: 420, width: 220 },
        { left: 430, right: 1250, width: 820 }
      ],
      visibleStageRect: { left: -100, right: 1300, width: 1400 }
    })).toEqual(expect.arrayContaining([
      "world-overlap-present",
      "world-mask-state-present",
      "panel-spacing-not-adjacent",
      "visual-velocity-outside-0.95-1.05",
      "visual-phase-over-one-rendered-pixel",
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
        { left: -320, right: 480, width: 800 },
        { left: 480, right: 1280, width: 800 }
      ]
    })).toEqual([]);
  });

  it("requires story presentation to remain free of transition effects", () => {
    expect(assessStorySeamSample({
      phase: "story",
      overlap: "",
      panelSides: [null, null],
      standardMasks: ["none", "none"],
      prefixedMasks: ["none", "none"]
    })).toEqual([]);
    expect(assessStorySeamSample({
      phase: "story",
      overlap: "9%",
      panelSides: ["outgoing", "incoming"],
      standardMasks: ["linear-gradient(#000, transparent)", "none"],
      prefixedMasks: ["linear-gradient(#000, transparent)", "none"]
    })).toEqual([
      "story-has-world-overlap",
      "story-panels-have-mask-state"
    ]);
  });
});
