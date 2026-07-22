import { FrameWindowTelemetry } from "../performance/frame-window-telemetry";
import {
  VisualQualityCoordinator,
  type QualityCommitContext,
  type QualityLevel,
  type QualityMode
} from "../performance/visual-quality-coordinator";

export type DecorationQualityLevel = QualityLevel;

/** Raw-rAF p95 observer. It requests decoration changes but never touches simulation. */
export class AdaptiveDecorationQuality {
  private telemetry = new FrameWindowTelemetry();
  private coordinator = new VisualQualityCoordinator("full");
  private windowDurationMs = 0;
  private windowSequence = 0;

  public get level(): DecorationQualityLevel { return this.coordinator.snapshot.committed; }
  public get pending(): QualityLevel | null { return this.coordinator.snapshot.pending?.target ?? null; }

  public observe(deltaSeconds: number, simulationStep = 0, visualFrame = 0): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    const intervalMs = deltaSeconds * 1_000;
    this.telemetry.observe(intervalMs);
    this.windowDurationMs += intervalMs;
    if (this.windowDurationMs < 2_000) return;
    this.coordinator.observe(this.telemetry.closeWindow(), simulationStep, visualFrame || ++this.windowSequence);
    this.windowDurationMs = 0;
  }

  public tryCommit(context: QualityCommitContext, simulationStep = 0, visualFrame = 0): boolean {
    return this.coordinator.tryCommit(context, simulationStep, visualFrame);
  }

  public setMode(mode: QualityMode, simulationStep = 0, visualFrame = 0): void {
    this.coordinator.setMode(mode, simulationStep, visualFrame);
  }

  public reset(): void {
    this.telemetry = new FrameWindowTelemetry();
    this.windowDurationMs = 0;
    this.windowSequence = 0;
    this.coordinator = new VisualQualityCoordinator("full");
  }
}
