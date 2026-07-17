export type DecorationQualityLevel = "full" | "reduced";

/** Sustained frame-budget observer. It owns decoration only, never simulation. */
export class AdaptiveDecorationQuality {
  private sampleSeconds = 0;
  private sampleFrames = 0;
  private goodSeconds = 0;
  private current: DecorationQualityLevel = "full";

  public get level(): DecorationQualityLevel {
    return this.current;
  }

  public observe(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    if (this.current === "reduced") {
      this.goodSeconds = deltaSeconds <= 1 / 58
        ? this.goodSeconds + deltaSeconds
        : 0;
      if (this.goodSeconds >= 4.8) {
        this.current = "full";
        this.goodSeconds = 0;
        this.sampleSeconds = 0;
        this.sampleFrames = 0;
        return;
      }
    }
    this.sampleSeconds += Math.min(deltaSeconds, 0.25);
    this.sampleFrames += 1;
    if (this.sampleSeconds < 2) return;
    const fps = this.sampleFrames / this.sampleSeconds;
    if (this.current === "full" && fps < 52) {
      this.current = "reduced";
      this.goodSeconds = 0;
    }
    this.sampleSeconds = 0;
    this.sampleFrames = 0;
  }

  public reset(): void {
    this.sampleSeconds = 0;
    this.sampleFrames = 0;
    this.goodSeconds = 0;
    this.current = "full";
  }
}
