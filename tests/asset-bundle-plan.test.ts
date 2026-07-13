import { describe, expect, it } from "vitest";
import {
  assetBundleForStoryCheckpoint,
  requiredStartAssetBundles
} from "../src/assets/asset-bundle-plan";

describe("campaign asset bundle plan", () => {
  it("requires common, prologue and epoch 1 before a fresh story", () => {
    expect(requiredStartAssetBundles("story", "prologue")).toEqual([
      "common",
      "prologue",
      "epoch_1"
    ]);
  });

  it("adds the selected resume chapter to the initial critical gate", () => {
    expect(requiredStartAssetBundles("story", "epoch_4")).toEqual([
      "common",
      "prologue",
      "epoch_1",
      "epoch_4"
    ]);
    expect(requiredStartAssetBundles("story", "finale")).toContain("finale");
  });

  it("loads only common and challenge bundles for the unlocked challenge", () => {
    expect(requiredStartAssetBundles("challenge", "completed")).toEqual([
      "common",
      "challenge"
    ]);
    expect(assetBundleForStoryCheckpoint("completed")).toBeNull();
  });
});
