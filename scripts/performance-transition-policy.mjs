const QUALIFIED_WORLD_IDS = new Set(["order-process", "quality-service"]);

export function qualifiedPanelTransitions(transitions) {
  return transitions.filter(({ worldId }) => QUALIFIED_WORLD_IDS.has(worldId));
}
