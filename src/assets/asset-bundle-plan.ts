import type { AssetBundleId, CampaignMode } from "../shared/types";

/** Critical bundle set that must be ready before the first gameplay frame. */
export function requiredStartAssetBundles(
  mode: CampaignMode
): AssetBundleId[] {
  if (mode === "challenge") return ["common", "challenge"];
  return [
    "common",
    "prologue",
    "epoch_1",
    "epoch_2",
    "epoch_3",
    "epoch_4",
    "epoch_5",
    "finale",
    "challenge"
  ];
}
