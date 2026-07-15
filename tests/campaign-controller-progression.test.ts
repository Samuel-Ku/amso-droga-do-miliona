import { describe, expect, it, vi } from "vitest";
import { CampaignController } from "../src/CampaignController";
import { CAMPAIGN_AUDIO_CUES } from "../src/audio/CampaignAudio";
import type { StoryTimelineSnapshot } from "../src/game/story-timeline";
import type { AssetBundleId, StorySceneConfig } from "../src/shared/types";
import {
  CAMPAIGN_SCENE_MANIFEST,
  type CampaignWorldId
} from "../src/visuals/scene-manifest";

interface ControllerHarness {
  assetLoader: {
    isBundleReady: (bundleId: AssetBundleId) => boolean;
    warmBundles: (bundleIds: readonly AssetBundleId[]) => Promise<unknown>;
  };
  audio: { playCue: (cue: string) => void };
  shell: {
    showStoryObjective: (copy: string | null) => void;
    showStoryScene: (scene: unknown) => void;
    announce: (copy: string) => void;
  };
  destroyed: boolean;
  lastTrustCorridor: boolean;
  lastStorySceneId: string;
  lastVisualWorldId: CampaignWorldId | null;
  warmWorldAssetWindow: (worldId: CampaignWorldId) => void;
  handleStoryUpdate: (update: StoryTimelineSnapshot) => void;
}

function controllerHarness(options: {
  readyBundles?: readonly AssetBundleId[];
  warmBundles?: (bundleIds: readonly AssetBundleId[]) => Promise<unknown>;
} = {}): {
  controller: ControllerHarness;
  playCue: ReturnType<typeof vi.fn>;
  warmBundles: ReturnType<typeof vi.fn>;
} {
  const ready = new Set(options.readyBundles ?? []);
  const playCue = vi.fn();
  const warmBundles = vi.fn(options.warmBundles ?? (async () => undefined));
  const controller = Object.create(CampaignController.prototype) as ControllerHarness;
  Object.assign(controller, {
    assetLoader: {
      isBundleReady: (bundleId: AssetBundleId) => ready.has(bundleId),
      warmBundles
    },
    audio: { playCue },
    shell: {
      showStoryObjective: vi.fn(),
      showStoryScene: vi.fn(),
      announce: vi.fn()
    },
    destroyed: false,
    lastTrustCorridor: true,
    lastStorySceneId: "",
    lastVisualWorldId: null
  });
  return { controller, playCue, warmBundles };
}

function sceneUpdate(scene: StorySceneConfig): StoryTimelineSnapshot {
  return {
    state: "scene",
    phase: scene.chapter === "prologue" ? "prologue" : "epoch",
    sectionId: scene.chapter ?? "prologue",
    epochIndex: 0,
    sectionElapsedSeconds: 0,
    sectionDurationSeconds: 0,
    totalElapsedSeconds: 0,
    totalActiveElapsedSeconds: 0,
    totalActiveDurationSeconds: 250,
    countdownSecondsRemaining: 0,
    countdownValue: null,
    progress: 0,
    sceneIndex: 0,
    sceneCount: 10,
    scene,
    playSegment: null,
    activeBeats: [],
    trustCorridor: true,
    controlsEnabled: false,
    worldSpeedScale: 0.3,
    safety: {
      kind: "narrative_safe",
      hazardsEnabled: false,
      pickupsEnabled: false,
      controlsEnabled: false
    },
    completed: false
  };
}

function configuredScene(id: string): StorySceneConfig {
  return {
    id,
    chapter: id === "story.first_package" ? "prologue" : "epoch_1",
    eyebrow: "Test",
    title: "Test",
    body: ["Test"],
    vignette: "first-package",
    continueLabel: "Dalej"
  };
}

describe("CampaignController world progression", () => {
  it("warms only the unresolved current + next bundle when the visual world changes", () => {
    const { controller, warmBundles } = controllerHarness({
      readyBundles: ["prologue", "epoch_1"]
    });

    controller.warmWorldAssetWindow("first-mile");
    controller.warmWorldAssetWindow("first-mile");
    controller.warmWorldAssetWindow("order-process");

    expect(warmBundles).toHaveBeenCalledTimes(1);
    expect(warmBundles).toHaveBeenCalledWith(["epoch_2"]);
  });

  it("keeps background warm failures non-blocking", async () => {
    const { controller, warmBundles } = controllerHarness({
      readyBundles: ["prologue"],
      warmBundles: async () => {
        throw new Error("offline");
      }
    });

    expect(() => controller.warmWorldAssetWindow("first-mile")).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(warmBundles).toHaveBeenCalledWith(["epoch_1"]);
  });
});

describe("CampaignController semantic story sound", () => {
  it("plays one manifest cue per newly presented scene and warms its world", () => {
    const { controller, playCue, warmBundles } = controllerHarness({
      readyBundles: ["prologue"]
    });
    const update = sceneUpdate(configuredScene("story.first_package"));

    controller.handleStoryUpdate(update);
    controller.handleStoryUpdate(update);

    expect(playCue).toHaveBeenCalledTimes(1);
    expect(playCue).toHaveBeenCalledWith("tape");
    expect(warmBundles).toHaveBeenCalledTimes(1);
    expect(warmBundles).toHaveBeenCalledWith(["epoch_1"]);
  });

  it("keeps every scene-manifest cue supported by the audio engine", () => {
    const supported = new Set<string>(CAMPAIGN_AUDIO_CUES);
    expect(CAMPAIGN_SCENE_MANIFEST.every(({ soundCue }) => supported.has(soundCue))).toBe(true);
  });
});
