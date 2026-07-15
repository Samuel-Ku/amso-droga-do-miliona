import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import {
  DEFAULT_RUNNER_MODULE_PATH,
  DEFAULT_RUNNER_STYLE_PATH
} from "../src/config/defaults";
import {
  isAllowedAssetPath,
  isAllowedRelativePath,
  parseRunnerConfig,
  validateRunnerConfig
} from "../src/config/schema";
import type { RunnerConfigValidationOptions } from "../src/config/types";

function validConfig(): Record<string, unknown> {
  return structuredClone(productionConfig) as Record<string, unknown>;
}

describe("runner config v5 story validation", () => {
  it("accepts the player-paced story contracts", () => {
    const production = parseRunnerConfig(validConfig());
    expect(production?.schemaVersion).toBe(4);
    expect(production?.story.modeHandoff?.id).toBe("story.challenge_handoff");

    const expanded = validConfig();
    const story = expanded.story as Record<string, unknown>;
    const scenes = story.scenes as Array<Record<string, unknown>>;
    scenes[0]!.perspective = "amso";
    scenes[0]!.steps = [{
      id: "first-package.origin",
      body: ["Pierwszą paczkę przygotowaliśmy własnymi rękami."],
      continueLabel: "Dalej",
      safe: true,
      fact: "Pierwszą paczkę przygotowaliśmy własnymi rękami.",
      action: "Pracownik zamyka pierwszą paczkę.",
      finalFrame: "Pierwsza paczka czeka przy wyjściu z magazynu."
    }];
    story.modeHandoff = {
      id: "story.challenge_handoff",
      from: "story",
      to: "challenge",
      safe: true,
      confirmationRequired: true,
      resumeCountdownSeconds: 3
    };
    story.millionThreshold = {
      counterStart: 999_970,
      counterTarget: 1_000_000,
      packageTarget: 30,
      combinationTarget: 8
    };

    const parsed = parseRunnerConfig(expanded);
    expect(parsed?.schemaVersion).toBe(4);
    expect(parsed?.story.scenes[0]).toMatchObject({
      perspective: "amso",
      steps: [{ id: "first-package.origin", safe: true }]
    });
    expect(parsed?.story.sequence.find(({ type }) => type === "play")).toMatchObject({
      id: "epoch_1.training"
    });
    expect(parsed?.story.sequence.some((step) =>
      step.type === "play" && step.id === "epoch_1.order_backlog"
    )).toBe(true);
    expect(parsed?.story.modeHandoff).toEqual({
      id: "story.challenge_handoff",
      from: "story",
      to: "challenge",
      safe: true,
      confirmationRequired: true,
      resumeCountdownSeconds: 3
    });
    expect(parsed?.story.millionThreshold).toEqual({
      counterStart: 999_970,
      counterTarget: 1_000_000,
      packageTarget: 30,
      combinationTarget: 8
    });
  });

  it("requires the final handoff and physical million threshold contracts", () => {
    const withoutHandoff = validConfig();
    delete (withoutHandoff.story as Record<string, unknown>).modeHandoff;
    expect(parseRunnerConfig(withoutHandoff)).toBeNull();

    const withoutThreshold = validConfig();
    delete (withoutThreshold.story as Record<string, unknown>).millionThreshold;
    expect(parseRunnerConfig(withoutThreshold)).toBeNull();
  });

  it("rejects the removed compatibility semantic field", () => {
    const expanded = validConfig();
    const story = expanded.story as Record<string, unknown>;
    const sequence = story.sequence as Array<Record<string, unknown>>;
    const challenge = sequence.find(({ id }) => id === "epoch_1.order_backlog");
    if (!challenge) throw new Error("challenge should exist");
    challenge.semantic = { id: "epoch_1.order_backlog" };

    expect(parseRunnerConfig(expanded)).toBeNull();
  });

  it("parses the v6 story as 14 player-paced beats and 210 seconds of play", () => {
    const result = validateRunnerConfig(validConfig());

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.schemaVersion).toBe(4);
    expect(result.data.modulePath).toBe(DEFAULT_RUNNER_MODULE_PATH);
    expect(result.data.stylePath).toBe(DEFAULT_RUNNER_STYLE_PATH);
    expect(result.data.story.activeDurationSeconds).toBe(210);
    expect(result.data.story.readingSpeedMultiplier).toBe(0.3);
    expect(result.data.story.speedStartMultiplier).toBe(0.85);
    expect(result.data.story.speedMaxMultiplier).toBe(1.35);
    expect(result.data.story.resumeCountdownSeconds).toBe(3);
    expect(result.data.story.scenes).toHaveLength(10);
    expect(result.data.story.scenes[0]?.id).toBe("story.first_package");
    expect(result.data.story.scenes.at(-1)?.id).toBe("story.challenge_handoff");
    expect(result.data.story.scenes.at(-1)?.continueLabel)
      .toBe("Podejmuję wyzwanie");
    const activeSceneIds = new Set(result.data.story.sequence
      .filter((step) => step.type === "scene")
      .map((step) => step.sceneId));
    const activeScenes = result.data.story.scenes.filter(({ id }) => activeSceneIds.has(id));
    expect(activeScenes.reduce((sum, scene) => sum + (scene.steps?.length ?? 1), 0)).toBe(14);
    expect(result.data.story.epochs.map(({ index }) => index)).toEqual([0, 1, 2, 3, 4]);
    expect(result.data.story.epochs.map(({ durationSeconds }) => durationSeconds))
      .toEqual([40, 40, 25, 60, 45]);
    expect(result.data.story.sequence
      .filter((step) => step.type === "play")
      .reduce((total, step) => total + step.durationSeconds, 0)).toBe(210);

    for (const scene of activeScenes) {
      for (const page of scene.steps ?? []) {
        expect(page.title?.trim().split(/\s+/u).length ?? 0).toBeLessThanOrEqual(8);
        expect(page.body.join(" ").length).toBeLessThanOrEqual(220);
        expect(page.fact).toBeTruthy();
        expect(page.action).toBeTruthy();
        expect(page.finalFrame).toBeTruthy();
      }
    }
    expect(JSON.stringify(activeScenes)).not.toContain("Boeing");
    expect(JSON.stringify(activeScenes)).toContain("PKiN");
    expect(result.data.cta.challengeLabel).toBe("Gramy dalej — tryb wyzwania");
    expect(result.data.ui?.landingLead).toContain("1 000 000");
    expect(result.data.ui?.sharePublication).toContain("Drodze do Miliona");
    expect(result.data.story.epochs.map(({ themeIndex }) => themeIndex))
      .toEqual([0, 1, 2, 3, 4]);
    expect(result.data.assets.bundles.map(({ id }) => id)).toEqual([
      "common",
      "prologue",
      "epoch_1",
      "epoch_2",
      "epoch_3",
      "epoch_4",
      "epoch_5",
      "finale",
      "challenge"
    ]);
    expect(result.data.assets.bundles.flatMap(({ resources }) => resources))
      .toSatisfy((resources: Array<{ source: string }>) =>
        resources.every(({ source }) =>
          source.startsWith("procedural:") || source.startsWith("/assets/milion-runner/")
        )
      );
  });

  it("fails below the three-minute active-play floor but allows post-playtest tuning", () => {
    const duplicate = validConfig();
    const story = duplicate.story as Record<string, unknown>;
    const scenes = story.scenes as Array<Record<string, unknown>>;
    scenes.push({ ...scenes[0] });
    expect(parseRunnerConfig(duplicate)).toBeNull();

    const tooShort = validConfig();
    const tooShortStory = tooShort.story as Record<string, unknown>;
    tooShortStory.activeDurationSeconds = 179;
    const tooShortSequence = tooShortStory.sequence as Array<Record<string, unknown>>;
    const tooShortFinale = tooShortSequence.find(({ id }) => id === "epoch_5.million_threshold");
    if (!tooShortFinale) throw new Error("final play segment should exist");
    tooShortFinale.durationSeconds = 14;
    const tooShortEpochs = tooShortStory.epochs as Array<Record<string, unknown>>;
    tooShortEpochs[4]!.durationSeconds = 14;
    expect(parseRunnerConfig(tooShort)).toBeNull();

    const tuned = validConfig();
    const tunedStory = tuned.story as Record<string, unknown>;
    tunedStory.activeDurationSeconds = 220;
    const tunedSequence = tunedStory.sequence as Array<Record<string, unknown>>;
    const finalPlay = tunedSequence.find(({ id }) => id === "epoch_5.million_threshold");
    if (!finalPlay) throw new Error("final play segment should exist");
    finalPlay.durationSeconds = 55;
    const tunedEpochs = tunedStory.epochs as Array<Record<string, unknown>>;
    tunedEpochs[4]!.durationSeconds = 55;
    expect(parseRunnerConfig(tuned)).not.toBeNull();
  });

  it("requires the complete three-second return-to-game countdown", () => {
    for (const invalidCountdown of [2, 5]) {
      const config = validConfig();
      (config.story as Record<string, unknown>).resumeCountdownSeconds = invalidCountdown;

      expect(parseRunnerConfig(config)).toBeNull();
    }
  });

  it("rejects reordered or renamed canonical sequence steps", () => {
    const reordered = validConfig();
    const reorderedSequence = (reordered.story as Record<string, unknown>)
      .sequence as Array<Record<string, unknown>>;
    [reorderedSequence[0], reorderedSequence[1]] = [reorderedSequence[1]!, reorderedSequence[0]!];
    expect(parseRunnerConfig(reordered)).toBeNull();

    const renamed = validConfig();
    const renamedSequence = (renamed.story as Record<string, unknown>)
      .sequence as Array<Record<string, unknown>>;
    const training = renamedSequence.find(({ id }) => id === "epoch_1.training");
    if (!training) throw new Error("training step should exist");
    training.id = "epoch_1.renamed";
    expect(parseRunnerConfig(renamed)).toBeNull();

    const wrongEpoch = validConfig();
    const wrongEpochSequence = (wrongEpoch.story as Record<string, unknown>)
      .sequence as Array<Record<string, unknown>>;
    const peakFinal = wrongEpochSequence.find(({ id }) => id === "epoch_4.order_peak_final");
    if (!peakFinal) throw new Error("peak-final step should exist");
    peakFinal.epochIndex = 2;
    expect(parseRunnerConfig(wrongEpoch)).toBeNull();
  });

  it("rejects malformed modes, unsafe paths, unknown keys and the removed discount config", () => {
    const badMode = validConfig();
    (badMode.challenge as Record<string, unknown>).mode = "arcade";
    expect(parseRunnerConfig(badMode)).toBeNull();

    expect(parseRunnerConfig({
      ...validConfig(),
      modulePath: "https://example.com/runner.js"
    })).toBeNull();
    expect(parseRunnerConfig({ ...validConfig(), html: "<script>bad()</script>" })).toBeNull();
    expect(parseRunnerConfig({
      ...validConfig(),
      discountCode: { code: "OLD", label: "Legacy" }
    })).toBeNull();
  });

  it("keeps the campaign CTA and asset paths same-origin and allowlisted", () => {
    expect(isAllowedRelativePath("/milion")).toBe(true);
    expect(isAllowedRelativePath("https://example.com/milion")).toBe(false);
    expect(isAllowedRelativePath("//example.com/milion")).toBe(false);
    expect(isAllowedRelativePath("/milion?email=a@example.com")).toBe(false);

    expect(isAllowedAssetPath("/assets/milion-runner/runner.js", ".js")).toBe(true);
    expect(isAllowedAssetPath("/assets/milion-runner/runner.css", ".css")).toBe(true);
    expect(isAllowedAssetPath("/assets/milion-runner/../admin.js", ".js")).toBe(false);
    expect(isAllowedAssetPath("https://cdn.example.com/runner.js", ".js")).toBe(false);
  });

  it("rejects remote, mistyped and optional-only critical asset bundles", () => {
    const remoteAsset = validConfig();
    const remoteBundles = ((remoteAsset.assets as Record<string, unknown>)
      .bundles as Array<Record<string, unknown>>);
    const remoteResources = remoteBundles[0]!.resources as Array<Record<string, unknown>>;
    remoteResources[0]!.type = "image";
    remoteResources[0]!.source = "https://cdn.example.com/courier.webp";
    expect(parseRunnerConfig(remoteAsset)).toBeNull();

    const mistypedAsset = validConfig();
    const mistypedBundles = ((mistypedAsset.assets as Record<string, unknown>)
      .bundles as Array<Record<string, unknown>>);
    const mistypedResources = mistypedBundles[0]!.resources as Array<Record<string, unknown>>;
    mistypedResources[0]!.type = "audio";
    mistypedResources[0]!.source = "/assets/milion-runner/courier.webp";
    expect(parseRunnerConfig(mistypedAsset)).toBeNull();

    const optionalOnly = validConfig();
    const optionalBundles = ((optionalOnly.assets as Record<string, unknown>)
      .bundles as Array<Record<string, unknown>>);
    const optionalResources = optionalBundles[1]!.resources as Array<Record<string, unknown>>;
    optionalResources.forEach((asset) => {
      asset.critical = false;
    });
    expect(parseRunnerConfig(optionalOnly)).toBeNull();
  });

  it("accepts embedded AVIF resources only for the trusted single-file build", () => {
    const embedded = validConfig();
    const bundles = ((embedded.assets as Record<string, unknown>)
      .bundles as Array<Record<string, unknown>>);
    for (const bundle of bundles) {
      const resources = bundle.resources as Array<Record<string, unknown>>;
      for (const resource of resources) {
        if (resource.type === "image") {
          resource.source = "data:image/avif;base64,AAAA";
        }
      }
    }
    const trustedOptions: RunnerConfigValidationOptions & {
      allowEmbeddedImageSources: true;
    } = { allowEmbeddedImageSources: true };

    expect(parseRunnerConfig(embedded)).toBeNull();
    expect(parseRunnerConfig(embedded, trustedOptions)).not.toBeNull();
  });

  it("accepts the embedded SVG world used by the trusted single-file build", () => {
    const embedded = validConfig();
    const bundles = ((embedded.assets as Record<string, unknown>)
      .bundles as Array<Record<string, unknown>>);
    const svg = bundles
      .flatMap((bundle) => bundle.resources as Array<Record<string, unknown>>)
      .find((resource) => typeof resource.source === "string" &&
        resource.source.endsWith(".svg"));
    if (!svg) throw new Error("production config should contain an SVG resource");
    svg.source = "data:image/svg+xml;base64,PHN2Zy8+";

    expect(parseRunnerConfig(embedded)).toBeNull();
    expect(parseRunnerConfig(embedded, { allowEmbeddedImageSources: true }))
      .not.toBeNull();
  });

  it("rejects unsafe embedded resources even for the trusted single-file build", () => {
    const trustedOptions: RunnerConfigValidationOptions & {
      allowEmbeddedImageSources: true;
    } = { allowEmbeddedImageSources: true };
    const withFirstImage = (
      source: string,
      type = "image"
    ): Record<string, unknown> => {
      const config = validConfig();
      const bundles = ((config.assets as Record<string, unknown>)
        .bundles as Array<Record<string, unknown>>);
      const image = bundles
        .flatMap((bundle) => bundle.resources as Array<Record<string, unknown>>)
        .find((resource) => resource.type === "image");
      if (!image) throw new Error("production config should contain an image resource");
      image.type = type;
      image.source = source;
      return config;
    };

    expect(parseRunnerConfig(
      withFirstImage("data:image/avif;base64,***="),
      trustedOptions
    )).toBeNull();
    expect(parseRunnerConfig(
      withFirstImage("data:image/svg+xml;base64,***="),
      trustedOptions
    )).toBeNull();
    expect(parseRunnerConfig(
      withFirstImage("data:image/png;base64,AAAA"),
      trustedOptions
    )).toBeNull();
    expect(parseRunnerConfig(
      withFirstImage(`data:image/avif;base64,${"A".repeat(512_000)}`),
      trustedOptions
    )).toBeNull();
    expect(parseRunnerConfig(
      withFirstImage("data:audio/mpeg;base64,AAAA", "audio"),
      trustedOptions
    )).toBeNull();
  });
});
