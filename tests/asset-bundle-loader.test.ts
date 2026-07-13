import { describe, expect, it, vi } from "vitest";
import {
  AssetBundleLoadError,
  AssetBundleLoader
} from "../src/assets/AssetBundleLoader";
import type { AssetBundleConfig, AssetResourceConfig } from "../src/shared/types";

function resource(
  id: string,
  source: string,
  critical = true
): AssetResourceConfig {
  return { id, type: "procedural", source, critical };
}

function bundle(
  id: AssetBundleConfig["id"],
  resources: AssetResourceConfig[]
): AssetBundleConfig {
  return { id, resources };
}

describe("AssetBundleLoader", () => {
  it("reports real critical readiness and resolves a ready bundle", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const loadResource = vi.fn(() => pending);
    const loader = new AssetBundleLoader([
      bundle("common", [resource("courier", "procedural:courier")])
    ], { loadResource });
    const progress: Array<[number, number]> = [];

    const resultPromise = loader.ensureBundles(["common"], (state) => {
      progress.push([state.readyCritical, state.totalCritical]);
    });

    expect(loader.isBundleReady("common")).toBe(false);
    expect(progress).toEqual([[0, 1]]);
    release();

    await expect(resultPromise).resolves.toMatchObject({
      readyBundles: ["common"],
      failedOptional: []
    });
    expect(loader.isBundleReady("common")).toBe(true);
    expect(progress.at(-1)).toEqual([1, 1]);
  });

  it("rejects a critical failure with a stable safe error code and allows retry", async () => {
    let attempt = 0;
    const loadResource = vi.fn(async () => {
      attempt += 1;
      if (attempt === 1) throw new Error("https://private.example/path.png");
    });
    const loader = new AssetBundleLoader([
      bundle("epoch_2", [resource("scene", "/assets/milion-runner/epoch-2.webp")])
    ], { loadResource });

    const firstAttempt = loader.ensureBundles(["epoch_2"]);
    await expect(firstAttempt).rejects.toBeInstanceOf(AssetBundleLoadError);
    await expect(firstAttempt).rejects.toMatchObject({
      code: "critical_asset_failed",
      bundleId: "epoch_2"
    });
    await expect(firstAttempt).rejects.not.toHaveProperty(
      "message",
      expect.stringContaining("private.example")
    );
    expect(loader.isBundleReady("epoch_2")).toBe(false);

    await expect(loader.ensureBundles(["epoch_2"])).resolves.toMatchObject({
      readyBundles: ["epoch_2"]
    });
    expect(loadResource).toHaveBeenCalledTimes(2);
  });

  it("records an optional failure without stopping a critical bundle", async () => {
    const loadResource = vi.fn(async (asset: AssetResourceConfig) => {
      if (asset.id === "spark") throw new Error("optional unavailable");
    });
    const loader = new AssetBundleLoader([
      bundle("epoch_3", [
        resource("scene", "procedural:epoch-3"),
        resource("spark", "/assets/milion-runner/spark.webp", false)
      ])
    ], { loadResource });

    await expect(loader.ensureBundles(["epoch_3"])).resolves.toEqual({
      readyBundles: ["epoch_3"],
      failedOptional: [{ bundleId: "epoch_3", resourceId: "spark" }]
    });
    expect(loader.isBundleReady("epoch_3")).toBe(true);
  });

  it("deduplicates concurrent resources and reuses ready bundles", async () => {
    const loadResource = vi.fn(async () => undefined);
    const loader = new AssetBundleLoader([
      bundle("common", [resource("courier", "procedural:courier")]),
      bundle("prologue", [resource("courier-shadow", "procedural:courier")])
    ], { loadResource });

    await Promise.all([
      loader.ensureBundles(["common", "prologue"]),
      loader.ensureBundles(["common"])
    ]);
    await loader.ensureBundles(["common", "prologue"]);

    expect(loadResource).toHaveBeenCalledTimes(1);
  });
});
