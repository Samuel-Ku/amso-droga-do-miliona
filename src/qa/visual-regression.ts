import type { MotionPreference } from "../performance/visual-policy";
import type { QualityLevel } from "../performance/visual-quality-coordinator";

export interface ProtectedRegion { readonly id: string; readonly rect: { x: number; y: number; width: number; height: number }; readonly requiredElements: readonly string[]; }
export interface VisualRegressionFixture { readonly id: string; readonly completedThroughStep: number; readonly interpolationAlpha: 0 | 0.5 | 1; readonly viewport: { width: number; height: number }; readonly effectiveDpr: 1 | 2; readonly motionPreference: MotionPreference; readonly qualityLevel: QualityLevel; readonly protectedRegions: readonly ProtectedRegion[]; }
export interface DeterministicVisualHarness { replayThrough(completedThroughStep: number): void; applyGeometry(width: number, height: number, dpr: 1 | 2): void; renderOneFrame(alpha: 0 | 0.5 | 1, motion: MotionPreference, quality: QualityLevel): void; captureComposite(excludeSelector: string): Promise<Blob>; }

export async function captureVisualFixture(
  harness: DeterministicVisualHarness,
  fixture: VisualRegressionFixture
): Promise<Blob> {
  harness.replayThrough(fixture.completedThroughStep);
  harness.applyGeometry(fixture.viewport.width, fixture.viewport.height, fixture.effectiveDpr);
  harness.renderOneFrame(fixture.interpolationAlpha, fixture.motionPreference, fixture.qualityLevel);
  return harness.captureComposite("[data-qa-badge]");
}
