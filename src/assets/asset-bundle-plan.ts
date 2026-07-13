import type { AssetBundleId, CampaignMode } from "../shared/types";

/** Critical bundle set that must be ready before the first gameplay frame. */
export function requiredStartAssetBundles(
  mode: CampaignMode
): AssetBundleId[] {
  if (mode === "challenge") return ["common", "prologue", "challenge"];
  return ["common", "prologue", "epoch_1"];
}

const WORLD_BUNDLE_ORDER: readonly AssetBundleId[] = [
  "prologue",
  "epoch_1",
  "epoch_2",
  "epoch_3",
  "epoch_4",
  "epoch_5",
  "finale"
];

/** Returns exactly one next art pack, keeping current + next as the hard lazy window. */
export function nextWorldAssetBundle(bundleId: AssetBundleId): AssetBundleId | null {
  const index = WORLD_BUNDLE_ORDER.indexOf(bundleId);
  return index < 0 ? null : WORLD_BUNDLE_ORDER[index + 1] ?? null;
}
