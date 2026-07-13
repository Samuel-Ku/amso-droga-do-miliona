import type { AssetBundleId, CampaignMode } from "../shared/types";

export type AssetStoryCheckpoint =
  | "prologue"
  | "epoch_1"
  | "epoch_2"
  | "epoch_3"
  | "epoch_4"
  | "epoch_5"
  | "finale"
  | "completed";

export function assetBundleForStoryCheckpoint(
  checkpoint: AssetStoryCheckpoint
): AssetBundleId | null {
  return checkpoint === "completed" ? null : checkpoint;
}

/** Critical bundle set that must be ready before the first gameplay frame. */
export function requiredStartAssetBundles(
  mode: CampaignMode,
  checkpoint: AssetStoryCheckpoint
): AssetBundleId[] {
  if (mode === "challenge") return ["common", "challenge"];
  const required: AssetBundleId[] = ["common", "prologue", "epoch_1"];
  const checkpointBundle = assetBundleForStoryCheckpoint(checkpoint);
  if (checkpointBundle !== null && !required.includes(checkpointBundle)) {
    required.push(checkpointBundle);
  }
  return required;
}
