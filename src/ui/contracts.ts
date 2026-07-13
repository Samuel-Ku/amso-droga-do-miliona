import type { GameResult, GameSnapshot, GameState } from "../game/contracts";
import type { DiscountCodeConfig, RunnerConfig, RunnerOpenOptions } from "../shared/types";

export interface RunSummary {
  /** Legacy single fact shown on the non-narrative ending. */
  fact?: { id: string; text: string };
  discoveredFactIds: string[];
  factsUnlockedCount: number;
  cumulativeFactCount: number;
  outcome: "victory" | "dropout";
  narrative: boolean;
  discountCode?: DiscountCodeConfig;
  epochName?: string;
  epochYear?: string;
  bestScore: number;
  bestPackages: number;
}

export interface RunnerModalCallbacks {
  onStart(): void;
  onRestart(): void;
  onClose(reason: string): void;
  onPauseToggle(): void;
  onJump(method: "keyboard" | "pointer" | "touch"): void;
  onCrouch(active: boolean, method: "keyboard" | "pointer" | "touch"): void;
  onCta(event: MouseEvent): void;
  onShare(event: MouseEvent): void;
}

export interface RunnerModalApi {
  readonly canvas: HTMLCanvasElement;
  open(options: RunnerOpenOptions): void;
  close(): void;
  setState(state: GameState): void;
  update(snapshot: GameSnapshot): void;
  showGameOver(result: GameResult, summary: RunSummary): void;
  announce(message: string): void;
  destroy(): void;
}

export interface RunnerModalConstructor {
  new (config: RunnerConfig, callbacks: RunnerModalCallbacks): RunnerModalApi;
}
