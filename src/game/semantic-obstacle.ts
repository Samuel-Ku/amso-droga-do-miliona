export const SEMANTIC_OBSTACLE_PRESENTATION = {
  "parcel-arc": { label: "PACZKA", icon: "package" },
  "box-stack": { label: "ZATOR", icon: "package" },
  "scanner-gate": { label: "SKAN", icon: "scanner" },
  "dispatch-pair": { label: "WYSYŁKA", icon: "truck" },
  "shelf-beam": { label: "REGAŁ", icon: "shelf" },
  "loaded-pallet": { label: "PALETA", icon: "package" },
  "warehouse-curtain": { label: "STREFA", icon: "process" },
  "parcel-trolley": { label: "WÓZEK", icon: "truck" },
  "equipment-crate": { label: "SPRZĘT", icon: "device" },
  "low-conveyor": { label: "TAŚMA", icon: "process" },
  "device-pallet": { label: "LAPTOP", icon: "device" },
  "checked-device": { label: "SPRAWDZONY", icon: "device" },
  "first-laptop": { label: "LAPTOP", icon: "device" },
  "growing-team": { label: "ZESPÓŁ", icon: "team" },
  "established-office": { label: "BIURO", icon: "office" },
  intake: { label: "PRZYJĘCIE", icon: "intake" },
  routing: { label: "REALIZACJA", icon: "process" },
  dispatch: { label: "WYSYŁKA", icon: "truck" },
  single: { label: "1 RUCH", icon: "movement" },
  doublet: { label: "2 RUCHY", icon: "movement" },
  "three-action": { label: "3 RUCHY", icon: "movement" },
  "long-arc": { label: "DŁUGI ŁUK", icon: "movement" },
  "low-line": { label: "NISKO", icon: "movement" },
  "tempo-change": { label: "ZMIANA TEMPA", icon: "movement" },
  mastery: { label: "FINAŁ", icon: "movement" },
  "recovery-route": { label: "ODZYSKAJ", icon: "package" }
} as const;

export type SemanticObstacleVariant = keyof typeof SEMANTIC_OBSTACLE_PRESENTATION;
export type SemanticObstacleIcon =
  (typeof SEMANTIC_OBSTACLE_PRESENTATION)[SemanticObstacleVariant]["icon"];

export function isSemanticObstacleVariant(value: string): value is SemanticObstacleVariant {
  return Object.hasOwn(SEMANTIC_OBSTACLE_PRESENTATION, value);
}
