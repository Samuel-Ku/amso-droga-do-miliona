import type { FrameWindowClassification } from "./frame-window-telemetry";
export type QualityLevel = "full" | "reduced";
export type QualityMode = "auto" | "force-full" | "force-reduced";
export interface QualityCommitContext { panelBoundarySafe: boolean; assetSwapComplete: boolean; celebrationActive: boolean; cutsceneOverlayActive: boolean; }
export interface PendingQualityRequest { target: QualityLevel; source: "telemetry" | "forced"; requestSequence: number; requestedAtStep: number; requestedAtVisualFrame: number; }

export class VisualQualityCoordinator {
  private committedLevel: QualityLevel;
  private pendingRequest: PendingQualityRequest | null = null;
  private slowStreak = 0;
  private stableMs = 0;
  private requestSequence = 0;
  private mode: QualityMode = "auto";
  public constructor(initial: QualityLevel = "full") { this.committedLevel = initial; }
  public get snapshot(): { committed: QualityLevel; pending: PendingQualityRequest | null; slowStreak: number; stableDurationMs: number } {
    return { committed: this.committedLevel, pending: this.pendingRequest, slowStreak: this.slowStreak, stableDurationMs: this.stableMs };
  }
  public setMode(mode: QualityMode, step: number, frame: number): void {
    this.mode = mode;
    this.slowStreak = 0; this.stableMs = 0; this.pendingRequest = null;
    if (mode !== "auto") this.request(mode === "force-full" ? "full" : "reduced", "forced", step, frame);
  }
  public observe(window: { classification: FrameWindowClassification; sampledDurationMs: number }, step: number, frame: number): void {
    if (this.mode !== "auto" || window.classification === "insufficient-samples") return;
    if (this.pendingRequest?.target === "full" && window.classification !== "stable") { this.pendingRequest = null; this.stableMs = 0; }
    if (this.committedLevel === "full") {
      if (window.classification === "slow") this.slowStreak += 1; else this.slowStreak = 0;
      if (this.pendingRequest?.target === "reduced") {
        if (window.classification === "stable") this.stableMs += window.sampledDurationMs; else this.stableMs = 0;
        if (this.stableMs >= 15_000) { this.pendingRequest = null; this.stableMs = 0; }
      } else if (this.slowStreak >= 2) this.request("reduced", "telemetry", step, frame);
    } else {
      if (window.classification === "stable") this.stableMs += window.sampledDurationMs; else this.stableMs = 0;
      if (this.stableMs >= 15_000 && this.pendingRequest === null) this.request("full", "telemetry", step, frame);
    }
  }
  public tryCommit(context: QualityCommitContext, _step: number, _frame: number): boolean {
    if (!this.pendingRequest || !context.panelBoundarySafe || !context.assetSwapComplete || context.celebrationActive || context.cutsceneOverlayActive) return false;
    this.committedLevel = this.pendingRequest.target; this.pendingRequest = null; this.slowStreak = 0; this.stableMs = 0; return true;
  }
  private request(target: QualityLevel, source: "telemetry" | "forced", step: number, frame: number): void {
    if (target === this.committedLevel) return;
    this.pendingRequest = { target, source, requestSequence: ++this.requestSequence, requestedAtStep: step, requestedAtVisualFrame: frame };
  }
}
