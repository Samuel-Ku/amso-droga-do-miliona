const QUALIFIED_WORLD_IDS = new Set(["order-process", "quality-service"]);
export const REQUIRED_WORLD_SEAM_TRANSITIONS = Object.freeze([
  Object.freeze({ worldId: "order-process", assetFragment: "world-02-order-process" }),
  Object.freeze({ worldId: "quality-service", assetFragment: "world-03-quality-service" }),
  Object.freeze({ worldId: "client-paths", assetFragment: "world-04-client-paths" }),
  Object.freeze({ worldId: "scale-logistics", assetFragment: "world-05-scale-logistics" }),
  Object.freeze({ worldId: "million-approach", assetFragment: "world-06-million-approach" }),
  Object.freeze({ worldId: "million-finale", assetFragment: "world-07-million-finale" }),
  Object.freeze({ worldId: "first-mile", assetFragment: "world-01-first-mile" })
]);
export const REQUIRED_WORLD_SEAM_DESTINATIONS = Object.freeze(
  REQUIRED_WORLD_SEAM_TRANSITIONS.map(({ worldId }) => worldId)
);

export function qualifiedPanelTransitions(transitions, scenarioId = "performance-reference-v1") {
  const qualifiedWorldIds = scenarioId === "world-seam-performance-v1"
    ? new Set(REQUIRED_WORLD_SEAM_DESTINATIONS)
    : QUALIFIED_WORLD_IDS;
  return transitions.filter(({ worldId }) => qualifiedWorldIds.has(worldId));
}

export function requiredWorldTransitionsPassed(transitions, scenarioId) {
  const required = scenarioId === "world-seam-performance-v1"
    ? REQUIRED_WORLD_SEAM_DESTINATIONS
    : [...QUALIFIED_WORLD_IDS];
  return selectRequiredWorldTransitions(transitions, scenarioId).length === required.length;
}

export function selectRequiredWorldTransitions(transitions, scenarioId) {
  const required = scenarioId === "world-seam-performance-v1"
    ? REQUIRED_WORLD_SEAM_DESTINATIONS
    : [...QUALIFIED_WORLD_IDS];
  let requiredIndex = 0;
  const selected = [];
  for (const transition of transitions) {
    if (transition.worldId !== required[requiredIndex]) continue;
    selected.push(transition);
    requiredIndex += 1;
    if (requiredIndex === required.length) break;
  }
  return selected;
}
