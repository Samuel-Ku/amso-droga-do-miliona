import { afterEach, describe, expect, it, vi } from "vitest";
import { CampaignAudio } from "../src/audio/CampaignAudio";

function audioHarness(): { context: AudioContext; oscillatorCount: () => number } {
  let oscillators = 0;
  const param = {
    value: 1,
    setValueAtTime(): void {},
    setTargetAtTime(): void {},
    cancelScheduledValues(): void {},
    exponentialRampToValueAtTime(): void {}
  };
  const gain = () => ({ gain: { ...param }, connect(): void {}, disconnect(): void {} });
  const context = {
    state: "running",
    currentTime: 0,
    destination: {},
    createGain: gain,
    createOscillator: () => {
      oscillators += 1;
      return {
        type: "sine",
        frequency: { ...param },
        connect(): void {}, disconnect(): void {}, start(): void {}, stop(): void {},
        addEventListener(): void {}
      };
    },
    resume: async () => undefined,
    close: async () => undefined
  } as unknown as AudioContext;
  return { context, oscillatorCount: () => oscillators };
}

afterEach(() => vi.useRealTimers());

describe("milestone audio", () => {
  it("adds notes for higher tiers and produces no cue while muted", async () => {
    vi.useFakeTimers();
    const harness = audioHarness();
    const audio = new CampaignAudio({ contextFactory: () => harness.context });
    await audio.start();
    const afterMusic = harness.oscillatorCount();

    audio.playMilestoneCue("confetti", 1);
    const tierOneNotes = harness.oscillatorCount() - afterMusic;
    audio.playMilestoneCue("confetti", 3);
    const tierThreeNotes = harness.oscillatorCount() - afterMusic - tierOneNotes;
    audio.setMuted(true);
    audio.playMilestoneCue("confetti", 3);

    expect(tierOneNotes).toBe(3);
    expect(tierThreeNotes).toBe(5);
    expect(harness.oscillatorCount()).toBe(afterMusic + tierOneNotes + tierThreeNotes);
    await audio.destroy();
  });
});
