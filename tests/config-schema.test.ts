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

describe("runner config v4 story validation", () => {
  it("parses the production story as 18 player-paced scenes and five minutes of play", () => {
    const result = validateRunnerConfig(validConfig());

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.schemaVersion).toBe(4);
    expect(result.data.modulePath).toBe(DEFAULT_RUNNER_MODULE_PATH);
    expect(result.data.stylePath).toBe(DEFAULT_RUNNER_STYLE_PATH);
    expect(result.data.story.activeDurationSeconds).toBe(300);
    expect(result.data.story.readingSpeedMultiplier).toBe(0.3);
    expect(result.data.story.speedStartMultiplier).toBe(0.8);
    expect(result.data.story.speedMaxMultiplier).toBe(1.15);
    expect(result.data.story.resumeCountdownSeconds).toBe(3);
    expect(result.data.story.scenes).toHaveLength(18);
    expect(result.data.story.scenes[0]?.id).toBe("intro.ready");
    expect(result.data.story.scenes.at(-1)?.id).toBe("final.thanks");
    expect(result.data.story.scenes.at(-1)?.continueLabel)
      .toBe("Jedziemy dalej — Próba Miliona");
    expect(result.data.story.epochs.map(({ index }) => index)).toEqual([0, 1, 2, 3, 4]);
    expect(result.data.story.epochs.map(({ durationSeconds }) => durationSeconds))
      .toEqual([45, 55, 60, 65, 75]);
    expect(result.data.story.sequence
      .filter((step) => step.type === "play")
      .reduce((total, step) => total + step.durationSeconds, 0)).toBe(300);
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

  it("fails below the five-minute floor but allows a consistent post-playtest extension", () => {
    const duplicate = validConfig();
    const story = duplicate.story as Record<string, unknown>;
    const scenes = story.scenes as Array<Record<string, unknown>>;
    scenes.push({ ...scenes[0] });
    expect(parseRunnerConfig(duplicate)).toBeNull();

    const tooShort = validConfig();
    (tooShort.story as Record<string, unknown>).activeDurationSeconds = 299;
    expect(parseRunnerConfig(tooShort)).toBeNull();

    const tuned = validConfig();
    const tunedStory = tuned.story as Record<string, unknown>;
    tunedStory.activeDurationSeconds = 310;
    const tunedSequence = tunedStory.sequence as Array<Record<string, unknown>>;
    const finalPlay = tunedSequence.find(({ id }) => id === "epoch_5.million_wave");
    if (!finalPlay) throw new Error("final play segment should exist");
    finalPlay.durationSeconds = 70;
    const tunedEpochs = tunedStory.epochs as Array<Record<string, unknown>>;
    tunedEpochs[4]!.durationSeconds = 85;
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
    const hydra = wrongEpochSequence.find(({ id }) => id === "epoch_4.logistic_hydra");
    if (!hydra) throw new Error("hydra step should exist");
    hydra.epochIndex = 2;
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
