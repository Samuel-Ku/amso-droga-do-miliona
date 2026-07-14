import type { StoryChallengeSemantic } from "../shared/types";

/** Approved v5 names carried beside stable legacy runtime ids during migration. */
export const V5_CHALLENGE_SEMANTICS = Object.freeze({
  "epoch_1.cable_chaos": { id: "epoch_1.order_backlog", name: "Zator Zamówień" },
  "epoch_2.doubt_cloud": { id: "epoch_2.quality_trial", name: "Próba Jakości" },
  "epoch_3.budget_eater": { id: "epoch_3.matching_challenge", name: "Wyzwanie Dopasowania" },
  "epoch_4.logistic_hydra": { id: "epoch_4.order_peak", name: "Szczyt Zamówień" },
  "epoch_5.million_wave": { id: "epoch_5.million_threshold", name: "Próg Miliona" }
} satisfies Readonly<Record<string, StoryChallengeSemantic>>);
