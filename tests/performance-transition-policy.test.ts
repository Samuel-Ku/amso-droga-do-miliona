import { describe, expect, it } from "vitest";
import {
  REQUIRED_WORLD_SEAM_DESTINATIONS,
  REQUIRED_WORLD_SEAM_TRANSITIONS,
  qualifiedPanelTransitions,
  requiredWorldTransitionsPassed,
  selectRequiredWorldTransitions
} from "../scripts/performance-transition-policy.mjs";

describe("performance transition policy", () => {
  it("qualifies only the required visible world seams", () => {
    expect(qualifiedPanelTransitions([
      { worldId: "first-mile", atMs: 380 },
      { worldId: "order-process", atMs: 19_400 },
      { worldId: "quality-service", atMs: 37_600 },
      { worldId: "client-paths", atMs: 55_100 }
    ])).toEqual([
      { worldId: "order-process", atMs: 19_400 },
      { worldId: "quality-service", atMs: 37_600 }
    ]);
  });

  it("requires one ordered challenge world cycle including 7→1", () => {
    const transitions = [
      "first-mile",
      ...REQUIRED_WORLD_SEAM_DESTINATIONS,
      "order-process"
    ].map((worldId, index) => ({ worldId, atMs: index * 1_000 }));
    expect(requiredWorldTransitionsPassed(
      transitions,
      "world-seam-performance-v1"
    )).toBe(true);
    expect(requiredWorldTransitionsPassed(
      transitions.filter(({ worldId }) => worldId !== "first-mile"),
      "world-seam-performance-v1"
    )).toBe(false);
  });

  it("requires four complete ordered cycles for memory qualification", () => {
    const transitions = Array.from({ length: 4 }, () => REQUIRED_WORLD_SEAM_TRANSITIONS)
      .flat().map(({ worldId }, index) => ({ worldId, atMs: index * 2_000 }));
    expect(selectRequiredWorldTransitions(transitions, "four-cycle-memory-v1")).toHaveLength(28);
    expect(requiredWorldTransitionsPassed(transitions, "four-cycle-memory-v1")).toBe(true);
    expect(requiredWorldTransitionsPassed(transitions.slice(0, -1), "four-cycle-memory-v1"))
      .toBe(false);
  });
});
