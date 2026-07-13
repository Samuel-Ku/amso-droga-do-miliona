import { describe, expect, it } from "vitest";
import { requiredStartAssetBundles } from "../src/assets/asset-bundle-plan";

describe("campaign asset bundle plan", () => {
  it("guarantees every critical story chapter before the uninterrupted run starts", () => {
    expect(requiredStartAssetBundles("story")).toEqual([
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
  });

  it("loads only common and challenge bundles for the unlocked challenge", () => {
    expect(requiredStartAssetBundles("challenge")).toEqual([
      "common",
      "challenge"
    ]);
  });
});
