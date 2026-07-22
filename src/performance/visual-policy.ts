import type { QualityLevel } from "./visual-quality-coordinator";
export type MotionPreference = "full-motion" | "reduced-motion";
export interface EffectiveVisualPolicy { readonly id: string; readonly particleBudget: number; readonly allowScreenShake: boolean; readonly motionAmplitude: number; readonly allowBlur: boolean; readonly glowLevel: number; readonly celebrationVariant: "full" | "calm" | "economy" | "calm-economy"; }
const POLICIES: Record<MotionPreference, Record<QualityLevel, EffectiveVisualPolicy>> = {
  "full-motion": {
    full: { id: "full-motion/full", particleBudget: 100, allowScreenShake: true, motionAmplitude: 1, allowBlur: true, glowLevel: 1, celebrationVariant: "full" },
    reduced: { id: "full-motion/reduced", particleBudget: 52, allowScreenShake: true, motionAmplitude: 1, allowBlur: false, glowLevel: 0.45, celebrationVariant: "economy" }
  },
  "reduced-motion": {
    full: { id: "reduced-motion/full", particleBudget: 60, allowScreenShake: false, motionAmplitude: 0.25, allowBlur: true, glowLevel: 1, celebrationVariant: "calm" },
    reduced: { id: "reduced-motion/reduced", particleBudget: 32, allowScreenShake: false, motionAmplitude: 0.25, allowBlur: false, glowLevel: 0.45, celebrationVariant: "calm-economy" }
  }
};
export function resolveVisualPolicy(motion: MotionPreference, quality: QualityLevel): EffectiveVisualPolicy { return POLICIES[motion][quality]; }
