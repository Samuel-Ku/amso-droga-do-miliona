import type { MotionPreference } from "../performance/visual-policy";
import type { QualityLevel } from "../performance/visual-quality-coordinator";

export interface ProtectedRegion { readonly id: string; readonly rect: { x: number; y: number; width: number; height: number }; readonly requiredElements: readonly string[]; }
export interface VisualRegressionFixture { readonly id: string; readonly completedThroughStep: number; readonly interpolationAlpha: 0 | 0.5 | 1; readonly viewport: { width: number; height: number }; readonly effectiveDpr: 1 | 2; readonly motionPreference: MotionPreference; readonly qualityLevel: QualityLevel; readonly protectedRegions: readonly ProtectedRegion[]; }
export interface DeterministicVisualHarness { replayThrough(completedThroughStep: number): void; applyGeometry(width: number, height: number, dpr: 1 | 2): void; renderOneFrame(alpha: 0 | 0.5 | 1, motion: MotionPreference, quality: QualityLevel): void; captureComposite(excludeSelector: string): Promise<Blob>; }
export interface VisualFixtureEvidence {
  readonly presentElements: readonly string[];
  readonly semanticOcclusionViolations: readonly string[];
  readonly panelCanvasSynchronized: boolean;
}
export interface VisualFixtureValidation {
  readonly passed: boolean;
  readonly reasons: readonly string[];
}

export function visualBaselineKey(fixture: VisualRegressionFixture, browserBuild: string): string {
  return [
    browserBuild, fixture.id, `${fixture.viewport.width}x${fixture.viewport.height}`,
    `dpr-${fixture.effectiveDpr}`, fixture.motionPreference, fixture.qualityLevel,
    `alpha-${fixture.interpolationAlpha}`
  ].join("__");
}

export function validateVisualFixture(
  fixture: VisualRegressionFixture,
  evidence: VisualFixtureEvidence
): VisualFixtureValidation {
  const reasons: string[] = [];
  const present = new Set(evidence.presentElements);
  for (const region of fixture.protectedRegions) {
    for (const required of region.requiredElements) {
      if (!present.has(required)) reasons.push(`missing:${region.id}:${required}`);
    }
  }
  for (const violation of evidence.semanticOcclusionViolations) reasons.push(`occlusion:${violation}`);
  if (!evidence.panelCanvasSynchronized) reasons.push("panel-canvas-desynchronized");
  return { passed: reasons.length === 0, reasons };
}

export async function captureVisualFixture(
  harness: DeterministicVisualHarness,
  fixture: VisualRegressionFixture
): Promise<Blob> {
  harness.replayThrough(fixture.completedThroughStep);
  harness.applyGeometry(fixture.viewport.width, fixture.viewport.height, fixture.effectiveDpr);
  harness.renderOneFrame(fixture.interpolationAlpha, fixture.motionPreference, fixture.qualityLevel);
  return harness.captureComposite("[data-qa-badge]");
}
