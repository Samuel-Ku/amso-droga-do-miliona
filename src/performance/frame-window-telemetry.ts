export const FRAME_BIN_WIDTH_MS = 0.1;
export const FRAME_BIN_MAX_MS = 250;
export const FRAME_REGULAR_BIN_COUNT = 2500;
export const FRAME_OVERFLOW_BIN_INDEX = 2500;
export const FRAME_BIN_COUNT = 2501;
export const MIN_FRAME_SAMPLE_COUNT = 30;

export type FrameWindowClassification = "slow" | "stable" | "contract-violation" | "insufficient-samples";
export interface FrameWindowSummary {
  readonly sampleCount: number;
  readonly sampledDurationMs: number;
  readonly p50FrameTimeMs: number;
  readonly p95FrameTimeMs: number;
  readonly p99FrameTimeMs: number;
  readonly maxFrameTimeMs: number;
  readonly over33msCount: number;
  readonly over100msCount: number;
  readonly overflowCount: number;
  readonly classification: FrameWindowClassification;
}

export function getFrameBinIndex(intervalMs: number): number {
  if (!Number.isFinite(intervalMs) || intervalMs < 0 || intervalMs > FRAME_BIN_MAX_MS) return FRAME_OVERFLOW_BIN_INDEX;
  return Math.min(FRAME_REGULAR_BIN_COUNT - 1, Math.max(0, Math.ceil(intervalMs / FRAME_BIN_WIDTH_MS) - 1));
}

export function histogramPercentile(histogram: Uint16Array, sampleCount: number, percentile: number): number {
  if (sampleCount <= 0) return Number.NaN;
  const rank = Math.ceil(sampleCount * percentile);
  let cumulative = 0;
  for (let index = 0; index < FRAME_BIN_COUNT; index += 1) {
    cumulative += histogram[index] ?? 0;
    if (cumulative >= rank) return index === FRAME_OVERFLOW_BIN_INDEX ? 250.1 : (index + 1) * FRAME_BIN_WIDTH_MS;
  }
  return Number.NaN;
}

export class FrameWindowTelemetry {
  private readonly histogram = new Uint16Array(FRAME_BIN_COUNT);
  private samples = 0;
  private duration = 0;
  private max = 0;
  private over33 = 0;
  private over100 = 0;
  private overflow = 0;
  public histogramBinOverflows = 0;

  public observe(rawIntervalMs: number): void {
    const index = getFrameBinIndex(rawIntervalMs);
    if (this.histogram[index] === 0xffff) this.histogramBinOverflows += 1;
    else this.histogram[index] = (this.histogram[index] ?? 0) + 1;
    this.samples += 1;
    this.duration += rawIntervalMs;
    if (rawIntervalMs > this.max) this.max = rawIntervalMs;
    if (rawIntervalMs > 33) this.over33 += 1;
    if (rawIntervalMs > 100) this.over100 += 1;
    if (index === FRAME_OVERFLOW_BIN_INDEX) this.overflow += 1;
  }

  public closeWindow(): FrameWindowSummary {
    const p50 = histogramPercentile(this.histogram, this.samples, 0.5);
    const p95 = histogramPercentile(this.histogram, this.samples, 0.95);
    const p99 = histogramPercentile(this.histogram, this.samples, 0.99);
    const classification: FrameWindowClassification = this.samples < MIN_FRAME_SAMPLE_COUNT
      ? "insufficient-samples"
      : p95 > 18 ? "slow" : p99 <= 33 && this.max <= 100 ? "stable" : "contract-violation";
    const result = { sampleCount: this.samples, sampledDurationMs: this.duration, p50FrameTimeMs: p50, p95FrameTimeMs: p95, p99FrameTimeMs: p99, maxFrameTimeMs: this.max, over33msCount: this.over33, over100msCount: this.over100, overflowCount: this.overflow, classification };
    this.histogram.fill(0);
    this.samples = this.duration = this.max = this.over33 = this.over100 = this.overflow = 0;
    return result;
  }
}
