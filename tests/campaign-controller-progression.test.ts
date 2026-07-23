import { describe, expect, it, vi } from "vitest";
import { authoredAudioFeedback, CampaignController } from "../src/CampaignController";
import { CAMPAIGN_AUDIO_CUES } from "../src/audio/CampaignAudio";
import type { GameSnapshot } from "../src/game/contracts";
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
  audio: {
    playCue: (cue: string) => void;
    playCountdownCue: (value: 3 | 2 | 1) => void;
  };
  shell: {
    showStoryObjective: (copy: string | null) => void;
    showStoryScene: (scene: unknown) => void;
    showStoryCountdown: (value: 3 | 2 | 1) => void;
    returnToGame: () => void;
    announce: (copy: string) => void;
  };
  destroyed: boolean;
  lastTrustCorridor: boolean;
  lastStorySceneId: string;
  lastStoryCountdownValue: 3 | 2 | 1 | null;
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
  playCountdownCue: ReturnType<typeof vi.fn>;
  warmBundles: ReturnType<typeof vi.fn>;
} {
  const ready = new Set(options.readyBundles ?? []);
  const playCue = vi.fn();
  const playCountdownCue = vi.fn();
  const warmBundles = vi.fn(options.warmBundles ?? (async () => undefined));
  const controller = Object.create(CampaignController.prototype) as ControllerHarness;
  Object.assign(controller, {
    assetLoader: {
      isBundleReady: (bundleId: AssetBundleId) => ready.has(bundleId),
      warmBundles
    },
    audio: { playCue, playCountdownCue },
    shell: {
      showStoryObjective: vi.fn(),
      showStoryScene: vi.fn(),
      showStoryCountdown: vi.fn(),
      returnToGame: vi.fn(),
      announce: vi.fn()
    },
    destroyed: false,
    lastTrustCorridor: true,
    lastStorySceneId: "",
    lastStoryCountdownValue: null,
    lastVisualWorldId: null
  });
  return { controller, playCue, playCountdownCue, warmBundles };
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
  it("plays each published countdown digit once and resets for the next countdown", () => {
    const { controller, playCountdownCue } = controllerHarness();
    const update = sceneUpdate(configuredScene("story.first_package"));
    const countdown = (value: 3 | 2 | 1): StoryTimelineSnapshot => ({
      ...update,
      state: "countdown",
      scene: null,
      countdownSecondsRemaining: value,
      countdownValue: value
    });

    controller.handleStoryUpdate(countdown(3));
    controller.handleStoryUpdate(countdown(3));
    controller.handleStoryUpdate(countdown(2));
    controller.handleStoryUpdate(countdown(1));
    controller.handleStoryUpdate({ ...update, state: "play", scene: null });
    controller.handleStoryUpdate(countdown(3));

    expect(playCountdownCue.mock.calls).toEqual([[3], [2], [1], [3]]);
  });

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

  it("maps authored cadence, wave result and finale progress to distinct audio layers", () => {
    const base = {
      authoredWavePhase: "burst",
      authoredWave: {
        microlevelId: "client-growth",
        waveIndex: 2,
        wavesCompleted: 2,
        waveTarget: 6,
        currentWaveId: "growth-team-a",
        attemptsOnCurrentWave: 1,
        ordersCollectedOnCurrentWave: 0,
        packagesAvailableOnCurrentWave: 3,
        totalOrdersCollected: 6,
        totalOrderTarget: null,
        elapsedSeconds: 30,
        minimumDurationSeconds: 30,
        completed: false,
        lastResult: {
          waveId: "first-laptop-b",
          attempts: 1,
          ordersCollected: 3,
          orderTarget: 2,
          collectionRatio: 1,
          actionSucceeded: true,
          passed: true,
          perfect: true
        }
      }
    } as GameSnapshot;

    const growth = authoredAudioFeedback(base);
    expect(growth.music).toEqual({ chapter: 4, phase: "burst", finaleLayer: 0 });
    expect(growth.resultCue).toBe("wave-perfect");
    expect(growth.completionCue).toBeNull();

    const finale = authoredAudioFeedback({
      ...base,
      authoredWave: {
        ...base.authoredWave!,
        microlevelId: "million-threshold",
        wavesCompleted: 12,
        waveTarget: 12,
        completed: true
      }
    });
    expect(finale.music.finaleLayer).toBe(4);
    expect(finale.completionCue).toBe("million");
  });

  it("keeps every scene-manifest cue supported by the audio engine", () => {
    const supported = new Set<string>(CAMPAIGN_AUDIO_CUES);
    expect(CAMPAIGN_SCENE_MANIFEST.every(({ soundCue }) => supported.has(soundCue))).toBe(true);
  });
});
