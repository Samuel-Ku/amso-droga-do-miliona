import { existsSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import {
  CAMPAIGN_SCENE_MANIFEST,
  CAMPAIGN_WORLDS,
  CHALLENGE_WORLD_STATES,
  sceneVisualState,
  storyPageVisualStateId,
  validateSceneManifest
} from "../src/visuals/scene-manifest";

describe("campaign visual scene manifest", () => {
  it("is the one-to-one visual source for all ten production scenes", () => {
    const sceneIds = productionConfig.story.scenes.map(({ id }) => id);
    const stateIds = CAMPAIGN_SCENE_MANIFEST.map(({ stateId }) => stateId);

    expect(CAMPAIGN_WORLDS).toHaveLength(7);
    expect(CAMPAIGN_SCENE_MANIFEST).toHaveLength(10);
    expect(new Set(stateIds).size).toBe(10);
    expect(stateIds).toEqual(sceneIds);
    expect(validateSceneManifest(sceneIds)).toEqual([]);
  });

  it("gives every card unique art direction and a semantic fallback", () => {
    expect(new Set(CAMPAIGN_SCENE_MANIFEST.map(({ visualEvent }) => visualEvent)).size)
      .toBe(10);
    expect(new Set(CAMPAIGN_SCENE_MANIFEST.map(({ revealMotion }) => revealMotion)).size)
      .toBe(10);
    for (const state of CAMPAIGN_SCENE_MANIFEST) {
      expect(state.motifs.length).toBeGreaterThan(0);
      expect(state.fallbackId).toMatch(/^fallback-/u);
      expect(state.readingCamera.zoom).toBeGreaterThanOrEqual(1);
      expect(state.gameCamera.zoom).toBeGreaterThanOrEqual(1);
      expect(["left", "right"]).toContain(state.copyPlacement);
      expect(sceneVisualState(state.stateId)).toBe(state);
    }
  });

  it("places the quality promise at the testing station", () => {
    expect(sceneVisualState("story.quality_promise")).toMatchObject({
      worldId: "quality-service",
      overlayStateId: "epoch_2.setup"
    });
  });

  it("resolves every active page to a deployable world state", () => {
    const activeIds = new Set(productionConfig.story.sequence
      .filter((step) => step.type === "scene")
      .map((step) => step.sceneId));
    for (const scene of productionConfig.story.scenes.filter(({ id }) => activeIds.has(id))) {
      for (const page of scene.steps) {
        expect(() => sceneVisualState(storyPageVisualStateId(scene.id, page.id)))
          .not.toThrow();
      }
    }
  });

  it("references seven versioned deployable world plates", () => {
    for (const world of CAMPAIGN_WORLDS) {
      expect(world.assetPath).toMatch(
        /^\/assets\/milion-runner\/worlds\/world-\d{2}-[a-z0-9-]+-v\d+\.webp$/u
      );
      const localPath = new URL(`../public${world.assetPath}`, import.meta.url);
      expect(existsSync(localPath), localPath.pathname).toBe(true);
    }
  });

  it("keeps the full art set under 24 MB and the first two worlds under 3 MB", () => {
    const brandPaths = [
      "/assets/milion-runner/brand/mz-main-lockup-v1.avif",
      "/assets/milion-runner/brand/mz-compact-lockup-v1.avif"
    ];
    const localSize = (assetPath: string): number => statSync(
      new URL(`../public${assetPath}`, import.meta.url)
    ).size;
    const brandBytes = brandPaths.reduce((sum, assetPath) => sum + localSize(assetPath), 0);
    const worldBytes = CAMPAIGN_WORLDS.map(({ assetPath }) => localSize(assetPath));

    expect(brandBytes + worldBytes.reduce((sum, size) => sum + size, 0))
      .toBeLessThan(24 * 1024 * 1024);
    expect(brandBytes + worldBytes[0]! + worldBytes[1]!)
      .toBeLessThan(3 * 1024 * 1024);
  });

  it("rotates challenge through one positive gameplay state per world", () => {
    expect(CHALLENGE_WORLD_STATES).toHaveLength(7);
    expect(new Set(CHALLENGE_WORLD_STATES).size).toBe(7);
    expect(CHALLENGE_WORLD_STATES.map((stateId) => sceneVisualState(stateId).worldId))
      .toEqual(CAMPAIGN_WORLDS.map(({ worldId }) => worldId));
  });

  it("rejects missing states, orphan worlds, missing mobile cameras and unknown critical layers", () => {
    const sceneIds = productionConfig.story.scenes.map(({ id }) => id);
    expect(validateSceneManifest(sceneIds.slice(1))).toContain("scene_state_mismatch");

    const withoutFinale = CAMPAIGN_SCENE_MANIFEST.filter(
      ({ worldId }) => worldId !== "million-finale"
    );
    expect(validateSceneManifest(
      withoutFinale.map(({ stateId }) => stateId),
      withoutFinale
    )).toContain("orphan_world:million-finale");

    const missingMobile = CAMPAIGN_SCENE_MANIFEST.map((state, index) => index === 0
      ? { ...state, readingCamera: undefined }
      : state) as unknown as typeof CAMPAIGN_SCENE_MANIFEST;
    expect(validateSceneManifest(sceneIds, missingMobile))
      .toContain("missing_mobile_camera:story.first_package");

    const unknownLayer = CAMPAIGN_SCENE_MANIFEST.map((state, index) => index === 0
      ? { ...state, motifs: ["mystery-square"] }
      : state);
    expect(validateSceneManifest(sceneIds, unknownLayer))
      .toContain("unknown_critical_layer:mystery-square");
  });
});
