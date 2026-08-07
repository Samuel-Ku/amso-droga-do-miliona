import { describe, expect, it } from "vitest";
import { qualifiedPanelTransitions } from "../scripts/performance-transition-policy.mjs";

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
});
