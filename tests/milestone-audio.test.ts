import { afterEach, describe, expect, it, vi } from "vitest";
import { CampaignAudio, orderPickupFrequency } from "../src/audio/CampaignAudio";

function audioHarness(): {
  context: AudioContext;
  oscillatorCount: () => number;
  oscillatorFrequencies: () => readonly number[];
} {
  let oscillators = 0;
  const frequencies: number[] = [];
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
        frequency: {
          ...param,
          setValueAtTime(value: number): void {
            frequencies.push(value);
          }
        },
        connect(): void {}, disconnect(): void {}, start(): void {}, stop(): void {},
        addEventListener(): void {}
      };
    },
    resume: async () => undefined,
    close: async () => undefined
  } as unknown as AudioContext;
  return {
    context,
    oscillatorCount: () => oscillators,
    oscillatorFrequencies: () => frequencies
  };
}

afterEach(() => vi.useRealTimers());

describe("milestone audio", () => {
  it("maps 3-2-1 to descending cues and respects not-started and muted guards", async () => {
    vi.useFakeTimers();
    const harness = audioHarness();
    const audio = new CampaignAudio({ contextFactory: () => harness.context });

    audio.playCountdownCue(3);
    expect(harness.oscillatorCount()).toBe(0);

    await audio.start();
    const afterMusic = harness.oscillatorCount();
    const afterMusicFrequencies = harness.oscillatorFrequencies().length;
    audio.playCountdownCue(3);
    audio.playCountdownCue(2);
    audio.playCountdownCue(1);

    expect(harness.oscillatorCount() - afterMusic).toBe(3);
    expect(harness.oscillatorFrequencies().slice(afterMusicFrequencies))
      .toEqual([659.25, 523.25, 392]);

    audio.setMuted(true);
    audio.playCountdownCue(3);
    expect(harness.oscillatorCount() - afterMusic).toBe(3);
    await audio.destroy();
  });

  it("raises the order motif through exactly five steps and then caps it", () => {
    const frequencies = [1, 2, 3, 4, 5, 6, 20].map(orderPickupFrequency);
    expect(new Set(frequencies.slice(0, 5))).toHaveLength(5);
    expect(frequencies[5]).toBe(frequencies[4]);
    expect(frequencies[6]).toBe(frequencies[4]);
  });

  it("uses separate recognizable cues for both power-ups", async () => {
    vi.useFakeTimers();
    const harness = audioHarness();
    const audio = new CampaignAudio({ contextFactory: () => harness.context });
    await audio.start();
    const afterMusic = harness.oscillatorCount();

    audio.playPowerUpCue("gwarancja_48");
    const warrantyNotes = harness.oscillatorCount() - afterMusic;
    audio.playPowerUpCue("podwojny_wynik");
    const doubleScoreNotes = harness.oscillatorCount() - afterMusic - warrantyNotes;

    expect(warrantyNotes).toBe(4);
    expect(doubleScoreNotes).toBe(3);
    await audio.destroy();
  });

  it("uses a richer equipment pickup cue and mutes both pickup levels", async () => {
    vi.useFakeTimers();
    const harness = audioHarness();
    const audio = new CampaignAudio({ contextFactory: () => harness.context });
    await audio.start();
    const afterMusic = harness.oscillatorCount();

    audio.playParcelPickup(1);
    const parcelNotes = harness.oscillatorCount() - afterMusic;
    audio.playEquipmentPickup();
    const equipmentNotes = harness.oscillatorCount() - afterMusic - parcelNotes;
    audio.setMuted(true);
    audio.playParcelPickup(2);
    audio.playEquipmentPickup();

    expect(parcelNotes).toBe(1);
    expect(equipmentNotes).toBeGreaterThan(parcelNotes);
    expect(harness.oscillatorCount()).toBe(afterMusic + parcelNotes + equipmentNotes);
    await audio.destroy();
  });

  it("adds notes for higher tiers and produces no cue while muted", async () => {
    vi.useFakeTimers();
    const harness = audioHarness();
    const audio = new CampaignAudio({ contextFactory: () => harness.context });
    await audio.start();
    const afterMusic = harness.oscillatorCount();

    audio.playMilestoneCue("order-confetti", 1);
    const tierOneNotes = harness.oscillatorCount() - afterMusic;
    audio.playMilestoneCue("order-confetti", 3);
    const tierThreeNotes = harness.oscillatorCount() - afterMusic - tierOneNotes;
    audio.playRecordCue();
    const recordNotes = harness.oscillatorCount() - afterMusic - tierOneNotes - tierThreeNotes;
    audio.setMuted(true);
    audio.playMilestoneCue("order-confetti", 3);
    audio.playRecordCue();

    expect(tierOneNotes).toBe(3);
    expect(tierThreeNotes).toBe(5);
    expect(recordNotes).toBe(4);
    expect(harness.oscillatorCount()).toBe(
      afterMusic + tierOneNotes + tierThreeNotes + recordNotes
    );
    await audio.destroy();
  });

  it("uses distinct wave-result cues and richer finale music without adding percussion in breath", async () => {
    vi.useFakeTimers();
    const breathHarness = audioHarness();
    const breathAudio = new CampaignAudio({ contextFactory: () => breathHarness.context });
    breathAudio.setMusicState({ chapter: 3, phase: "breath", finaleLayer: 0 });
    await breathAudio.start();
    const breathNotes = breathHarness.oscillatorCount();

    const burstHarness = audioHarness();
    const burstAudio = new CampaignAudio({ contextFactory: () => burstHarness.context });
    burstAudio.setMusicState({ chapter: 3, phase: "burst", finaleLayer: 0 });
    await burstAudio.start();
    const burstNotes = burstHarness.oscillatorCount();

    const finaleHarness = audioHarness();
    const finaleAudio = new CampaignAudio({ contextFactory: () => finaleHarness.context });
    finaleAudio.setMusicState({ chapter: 6, phase: "burst", finaleLayer: 4 });
    await finaleAudio.start();
    const finaleNotes = finaleHarness.oscillatorCount();

    const beforeCues = finaleHarness.oscillatorCount();
    finaleAudio.playCue("wave-success");
    const successNotes = finaleHarness.oscillatorCount() - beforeCues;
    finaleAudio.playCue("wave-perfect");
    const perfectNotes = finaleHarness.oscillatorCount() - beforeCues - successNotes;
    finaleAudio.playCue("wave-retry");
    const retryNotes = finaleHarness.oscillatorCount() - beforeCues - successNotes - perfectNotes;
    finaleAudio.playCue("million");
    const millionNotes = finaleHarness.oscillatorCount() - beforeCues - successNotes - perfectNotes - retryNotes;

    expect(burstNotes).toBeGreaterThan(breathNotes);
    expect(finaleNotes).toBeGreaterThan(burstNotes);
    expect(successNotes).toBeGreaterThan(retryNotes);
    expect(perfectNotes).toBeGreaterThan(successNotes);
    expect(millionNotes).toBeGreaterThan(perfectNotes);

    await Promise.all([breathAudio.destroy(), burstAudio.destroy(), finaleAudio.destroy()]);
  });
});
