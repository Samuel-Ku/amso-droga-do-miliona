import { describe, expect, it } from "vitest";
import { STORY_MICROLEVELS } from "../src/game/authored-wave";
import {
  FULL_STORY_REFERENCE_V1,
  validateFullStoryReferenceManifest
} from "../src/qa/full-story-reference-v1";
import { parseQaBootConfig } from "../src/qa/boot-config";

describe("full-story-reference-v1 contract", () => {
  it("accepts the bounded full-story QA configuration", () => {
    const boot = parseQaBootConfig(new URL(
      "https://game.amso.pl/?qa=performance&scenario=full-story-reference-v1&quality=force-full&motion=system&audio=enabled&dpr=1"
    ));
    expect(boot).toMatchObject({
      kind: "performance",
      config: { scenarioId: "full-story-reference-v1", audio: "enabled" }
    });
  });

  it("derives the first browser tracer from the canonical authored chapter", () => {
    expect(FULL_STORY_REFERENCE_V1.chapters[0]).toEqual({
      microlevelId: "first-package",
      segmentId: "epoch_1.first_package",
      routeWaveIds: [
        "guided-parcel-arc", "guided-low-stack", "guided-scanner-gate", "guided-jump-slide"
      ],
      waves: [
        { id: "guided-parcel-arc", actions: ["jump"] },
        { id: "guided-low-stack", actions: ["jump"] },
        { id: "guided-scanner-gate", actions: ["slide"] },
        { id: "guided-jump-slide", actions: ["jump", "slide"] }
      ]
    });
  });

  it("covers every canonical chapter and rejects manifest drift", () => {
    expect(FULL_STORY_REFERENCE_V1.chapters.map(({ microlevelId }) => microlevelId))
      .toEqual(STORY_MICROLEVELS.map(({ id }) => id));
    expect(validateFullStoryReferenceManifest(FULL_STORY_REFERENCE_V1)).toEqual([]);

    const drifted = {
      ...FULL_STORY_REFERENCE_V1,
      chapters: FULL_STORY_REFERENCE_V1.chapters.map((chapter, index) => index === 0
        ? { ...chapter, waves: chapter.waves.slice(1) }
        : chapter)
    };
    expect(validateFullStoryReferenceManifest(drifted)).toContain(
      "first-package:wave-count-mismatch"
    );
  });
});
