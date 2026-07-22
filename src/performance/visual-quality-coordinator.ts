import type { FrameWindowClassification } from "./frame-window-telemetry";

export type QualityLevel = "full" | "reduced";
export type QualityMode = "auto" | "force-full" | "force-reduced";
export interface QualityCommitContext {
  panelBoundarySafe: boolean;
  assetSwapComplete: boolean;
  celebrationActive: boolean;
  cutsceneOverlayActive: boolean;
}
export interface PendingQualityRequest {
  target: QualityLevel;
  source: "telemetry" | "forced";
  requestSequence: number;
  requestedAtStep: number;
  requestedAtVisualFrame: number;
}
export type QualityDiagnostic =
  | { type: "quality-requested"; target: QualityLevel; source: "telemetry" | "forced"; requestSequence: number; simulationStep: number; visualFrameSequence: number }
  | { type: "quality-request-cancelled"; target: QualityLevel; source: "telemetry" | "forced"; reason: "slow-window" | "contract-violation" | "stable-recovery-complete" | "force-mode-changed" | "superseded"; requestSequence: number; simulationStep: number; visualFrameSequence: number }
  | { type: "quality-committed"; from: QualityLevel; to: QualityLevel; reason: "telemetry" | "forced"; requestSequence: number; simulationStep: number; visualFrameSequence: number };

const MAX_DIAGNOSTICS = 64;

export class VisualQualityCoordinator {
  private committedLevel: QualityLevel;
  private pendingRequest: PendingQualityRequest | null = null;
  private slowStreak = 0;
  private stableMs = 0;
  private requestSequence = 0;
  private mode: QualityMode = "auto";
  private readonly diagnosticRecords: QualityDiagnostic[] = [];
  public droppedDiagnosticRecords = 0;

  public constructor(initial: QualityLevel = "full") { this.committedLevel = initial; }

  public get snapshot(): { committed: QualityLevel; pending: PendingQualityRequest | null; slowStreak: number; stableDurationMs: number } {
    return { committed: this.committedLevel, pending: this.pendingRequest, slowStreak: this.slowStreak, stableDurationMs: this.stableMs };
  }

  /** Report extraction only; never called from the visual hot path. */
  public get diagnostics(): readonly QualityDiagnostic[] { return this.diagnosticRecords.slice(); }

  public setMode(mode: QualityMode, step: number, frame: number): void {
    if (this.pendingRequest !== null) this.cancel("force-mode-changed", step, frame);
    this.mode = mode;
    this.slowStreak = 0;
    this.stableMs = 0;
    if (mode !== "auto") this.request(mode === "force-full" ? "full" : "reduced", "forced", step, frame);
  }

  public observe(window: { classification: FrameWindowClassification; sampledDurationMs: number }, step: number, frame: number): void {
    if (this.mode !== "auto" || window.classification === "insufficient-samples") return;
    if (this.pendingRequest?.target === "full" && window.classification !== "stable") {
      this.cancel(window.classification === "slow" ? "slow-window" : "contract-violation", step, frame);
      this.stableMs = 0;
    }
    if (this.committedLevel === "full") {
      if (window.classification === "slow") this.slowStreak += 1;
      else this.slowStreak = 0;
      if (this.pendingRequest?.target === "reduced") {
        if (window.classification === "stable") this.stableMs += window.sampledDurationMs;
        else this.stableMs = 0;
        if (this.stableMs >= 15_000) {
          this.cancel("stable-recovery-complete", step, frame);
          this.stableMs = 0;
        }
      } else if (this.slowStreak >= 2) {
        this.request("reduced", "telemetry", step, frame);
      }
    } else {
      if (window.classification === "stable") this.stableMs += window.sampledDurationMs;
      else this.stableMs = 0;
      if (this.stableMs >= 15_000 && this.pendingRequest === null) this.request("full", "telemetry", step, frame);
    }
  }

  public tryCommit(context: QualityCommitContext, step: number, frame: number): boolean {
    const request = this.pendingRequest;
    if (!request || !context.panelBoundarySafe || !context.assetSwapComplete ||
        context.celebrationActive || context.cutsceneOverlayActive) return false;
    const from = this.committedLevel;
    this.committedLevel = request.target;
    this.pendingRequest = null;
    this.slowStreak = 0;
    this.stableMs = 0;
    this.record({
      type: "quality-committed", from, to: request.target, reason: request.source,
      requestSequence: request.requestSequence, simulationStep: step, visualFrameSequence: frame
    });
    return true;
  }

  private request(target: QualityLevel, source: "telemetry" | "forced", step: number, frame: number): void {
    if (target === this.committedLevel) return;
    if (this.pendingRequest !== null) this.cancel("superseded", step, frame);
    const request: PendingQualityRequest = {
      target, source, requestSequence: ++this.requestSequence,
      requestedAtStep: step, requestedAtVisualFrame: frame
    };
    this.pendingRequest = request;
    this.record({
      type: "quality-requested", target, source, requestSequence: request.requestSequence,
      simulationStep: step, visualFrameSequence: frame
    });
  }

  private cancel(reason: Extract<QualityDiagnostic, { type: "quality-request-cancelled" }>["reason"], step: number, frame: number): void {
    const request = this.pendingRequest;
    if (request === null) return;
    this.pendingRequest = null;
    this.record({
      type: "quality-request-cancelled", target: request.target, source: request.source,
      reason, requestSequence: request.requestSequence,
      simulationStep: step, visualFrameSequence: frame
    });
  }

  private record(event: QualityDiagnostic): void {
    if (this.diagnosticRecords.length >= MAX_DIAGNOSTICS) {
      this.droppedDiagnosticRecords += 1;
      return;
    }
    this.diagnosticRecords.push(event);
  }
}
