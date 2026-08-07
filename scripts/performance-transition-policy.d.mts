export interface PanelTransition {
  readonly worldId: string;
  readonly atMs: number;
  readonly [key: string]: unknown;
}

export function qualifiedPanelTransitions<T extends PanelTransition>(transitions: T[]): T[];
