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

function validConfig(): Record<string, unknown> {
  return structuredClone(productionConfig) as Record<string, unknown>;
}

describe("runner config v3 validation", () => {
  it("parses the production story as prologue, five epochs and finale", () => {
    const result = validateRunnerConfig(validConfig());

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.schemaVersion).toBe(3);
    expect(result.data.modulePath).toBe(DEFAULT_RUNNER_MODULE_PATH);
    expect(result.data.stylePath).toBe(DEFAULT_RUNNER_STYLE_PATH);
    expect(result.data.story.durationSeconds).toBeGreaterThanOrEqual(150);
    expect(result.data.story.durationSeconds).toBeLessThanOrEqual(180);
    expect(result.data.story.prologue.id).toBe("prologue");
    expect(result.data.story.epochs.map(({ index }) => index)).toEqual([0, 1, 2, 3, 4]);
    expect(result.data.story.finale.id).toBe("finale");

    const beats = [
      ...result.data.story.prologue.beats,
      ...result.data.story.epochs.flatMap(({ beats: epochBeats }) => epochBeats),
      ...result.data.story.finale.beats
    ];
    expect(new Set(beats.map(({ id }) => id)).size).toBe(beats.length);
    expect(beats.find(({ id }) => id === "final.thanks")?.text).toContain("1 000 000");
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

  it("fails closed for duplicate copy ids and a story outside the 150–180 second budget", () => {
    const duplicate = validConfig();
    const story = duplicate.story as Record<string, unknown>;
    const prologue = story.prologue as Record<string, unknown>;
    const beats = prologue.beats as Array<Record<string, unknown>>;
    beats.push({ ...beats[0] });
    expect(parseRunnerConfig(duplicate)).toBeNull();

    const tooLong = validConfig();
    (tooLong.story as Record<string, unknown>).durationSeconds = 181;
    expect(parseRunnerConfig(tooLong)).toBeNull();
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
});
