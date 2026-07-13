import { describe, expect, it } from "vitest";
import {
  nextWorldAssetBundle,
  requiredStartAssetBundles
} from "../src/assets/asset-bundle-plan";

describe("campaign asset bundle plan", () => {
  it("loads only the current and next story world before the first frame", () => {
    expect(requiredStartAssetBundles("story")).toEqual([
      "common",
      "prologue",
      "epoch_1"
    ]);
  });

  it("starts direct challenge in the first warehouse with challenge mechanics", () => {
    expect(requiredStartAssetBundles("challenge")).toEqual([
      "common",
      "prologue",
      "challenge"
    ]);
  });

  it("warms one world ahead in narrative order", () => {
    expect(nextWorldAssetBundle("prologue")).toBe("epoch_1");
    expect(nextWorldAssetBundle("epoch_3")).toBe("epoch_4");
    expect(nextWorldAssetBundle("finale")).toBeNull();
    expect(nextWorldAssetBundle("common")).toBeNull();
  });
});
