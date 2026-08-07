import { afterEach, describe, expect, it, vi } from "vitest";
import { CampaignAudio, orderPickupFrequency } from "../src/audio/CampaignAudio";

function audioHarness(options: { deferOfflineRendering?: boolean } = {}): {
  context: AudioContext;
  oscillatorCount: () => number;
  oscillatorFrequencies: () => readonly number[];
  bufferSourceCount: () => number;
  bufferSourceStarts: () => readonly number[];
  bufferSourceStops: () => readonly number[];
  musicRms: () => number;
  setCurrentTime: (time: number) => void;
  resolveMusicRendering: () => void;
} {
  let oscillators = 0;
  let bufferSources = 0;
  let currentTime = 0;
  const frequencies: number[] = [];
  const bufferSourceStarts: number[] = [];
  const bufferSourceStops: number[] = [];
  const renderedChannels: Float32Array[] = [];
  const offlineRenderResolvers: Array<() => void> = [];
  const param = {
    value: 1,
    setValueAtTime(): void {},
    setTargetAtTime(): void {},
    cancelScheduledValues(): void {},
    exponentialRampToValueAtTime(): void {}
  };
  const gain = () => ({ gain: { ...param }, connect(): void {}, disconnect(): void {} });
  class ControlledOfflineAudioContext {
    public readonly destination = {} as AudioDestinationNode;
    public readonly sampleRate: number;
    private oscillatorCount = 0;

    public constructor(_channels: number, private readonly length: number, sampleRate: number) {
      this.sampleRate = sampleRate;
    }

    public createGain(): GainNode {
      return gain() as unknown as GainNode;
    }

    public createOscillator(): OscillatorNode {
      this.oscillatorCount += 1;
      return {
        type: "sine",
        frequency: { ...param },
        connect(): void {}, disconnect(): void {}, start(): void {}, stop(): void {}
      } as unknown as OscillatorNode;
    }

    public startRendering(): Promise<AudioBuffer> {
      return new Promise((resolve) => {
        const finish = (): void => {
          const samples = new Float32Array(this.length);
          samples.fill(Math.min(0.9, this.oscillatorCount / 100));
          renderedChannels.push(samples);
          resolve({
            duration: this.length / this.sampleRate,
            length: this.length,
            numberOfChannels: 1,
            sampleRate: this.sampleRate,
            getChannelData: () => samples,
            copyFromChannel(): void {},
            copyToChannel(): void {}
          });
        };
        if (options.deferOfflineRendering) offlineRenderResolvers.push(finish);
        else finish();
      });
    }
  }
  vi.stubGlobal("OfflineAudioContext", ControlledOfflineAudioContext);
  const context = {
    state: "running",
    get currentTime(): number { return currentTime; },
    sampleRate: 48_000,
    destination: {},
    createGain: gain,
    createBuffer: (channels: number, length: number, sampleRate: number) => {
      const channelData = Array.from({ length: channels }, () => new Float32Array(length));
      renderedChannels.push(channelData[0]!);
      return {
        duration: length / sampleRate,
        length,
        numberOfChannels: channels,
        sampleRate,
        getChannelData: (channel: number) => channelData[channel]!,
        copyFromChannel(): void {},
        copyToChannel(): void {}
      };
    },
    createBufferSource: () => {
      bufferSources += 1;
      return {
        buffer: null,
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        connect(): void {},
        disconnect(): void {},
        start(when = 0): void { bufferSourceStarts.push(when); },
        stop(when = 0): void { bufferSourceStops.push(when); },
        addEventListener(): void {}
      };
    },
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
    oscillatorFrequencies: () => frequencies,
    bufferSourceCount: () => bufferSources,
    bufferSourceStarts: () => bufferSourceStarts,
    bufferSourceStops: () => bufferSourceStops,
    musicRms: () => {
      const samples = renderedChannels.at(-1) ?? [];
      const meanSquare = Array.from(samples).reduce((sum, sample) => sum + sample * sample, 0) /
        Math.max(1, samples.length);
      return Math.sqrt(meanSquare);
    },
    setCurrentTime: (time: number) => { currentTime = time; },
    resolveMusicRendering: () => { offlineRenderResolvers.shift()?.(); }
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("milestone audio", () => {
  it("does not delay start while the buffered phrase renders offline", async () => {
    const harness = audioHarness({ deferOfflineRendering: true });
    const audio = new CampaignAudio({ contextFactory: () => harness.context });

    await expect(audio.start()).resolves.toBe(true);
    expect(harness.bufferSourceCount()).toBe(0);

    harness.resolveMusicRendering();
    await vi.waitFor(() => expect(harness.bufferSourceCount()).toBe(1));
    await audio.destroy();
  });

  it("keeps one buffered music source across a 60-second stable soundtrack", async () => {
    vi.useFakeTimers();
    const harness = audioHarness();
    const audio = new CampaignAudio({ contextFactory: () => harness.context });

    await audio.start();
    const cueOscillatorsAtStart = harness.oscillatorCount();
    vi.advanceTimersByTime(30_000);
    audio.setMuted(true);
    vi.advanceTimersByTime(30_000);

    expect(harness.bufferSourceCount()).toBe(1);
    expect(harness.bufferSourceStarts()).toEqual([0]);
    expect(harness.oscillatorCount()).toBe(cueOscillatorsAtStart);
    await audio.destroy();
  });

  it("replaces a changed music state at the next phrase boundary", async () => {
    const harness = audioHarness();
    const audio = new CampaignAudio({ contextFactory: () => harness.context });
    await audio.start();
    harness.setCurrentTime(0.6);

    audio.setMusicState({ chapter: 3, phase: "burst", finaleLayer: 2 });

    await vi.waitFor(() => expect(harness.bufferSourceCount()).toBe(2));
    expect(harness.bufferSourceStarts()).toEqual([0, 2.4]);
    expect(harness.bufferSourceStops()).toEqual([2.4]);
    audio.setMuted(true);
    audio.setMusicState({ chapter: 3, phase: "burst", finaleLayer: 2 });
    expect(harness.bufferSourceCount()).toBe(2);
    await audio.destroy();
  });

  it("stops buffered music cleanly and creates one fresh loop on restart", async () => {
    const harness = audioHarness();
    const audio = new CampaignAudio({ contextFactory: () => harness.context });
    await audio.start();

    audio.stop();
    await audio.start();

    expect(harness.bufferSourceCount()).toBe(2);
    expect(harness.bufferSourceStarts()).toEqual([0, 0]);
    expect(harness.bufferSourceStops()).toEqual([0]);
    await audio.destroy();
    expect(harness.bufferSourceStops()).toEqual([0, 0]);
  });

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
    const breathRms = breathHarness.musicRms();

    const burstHarness = audioHarness();
    const burstAudio = new CampaignAudio({ contextFactory: () => burstHarness.context });
    burstAudio.setMusicState({ chapter: 3, phase: "burst", finaleLayer: 0 });
    await burstAudio.start();
    const burstRms = burstHarness.musicRms();

    const finaleHarness = audioHarness();
    const finaleAudio = new CampaignAudio({ contextFactory: () => finaleHarness.context });
    finaleAudio.setMusicState({ chapter: 6, phase: "burst", finaleLayer: 4 });
    await finaleAudio.start();
    const finaleRms = finaleHarness.musicRms();

    const beforeCues = finaleHarness.oscillatorCount();
    finaleAudio.playCue("wave-success");
    const successNotes = finaleHarness.oscillatorCount() - beforeCues;
    finaleAudio.playCue("wave-perfect");
    const perfectNotes = finaleHarness.oscillatorCount() - beforeCues - successNotes;
    finaleAudio.playCue("wave-retry");
    const retryNotes = finaleHarness.oscillatorCount() - beforeCues - successNotes - perfectNotes;
    finaleAudio.playCue("million");
    const millionNotes = finaleHarness.oscillatorCount() - beforeCues - successNotes - perfectNotes - retryNotes;

    expect(burstRms).toBeGreaterThan(breathRms);
    expect(finaleRms).toBeGreaterThan(burstRms);
    expect(successNotes).toBeGreaterThan(retryNotes);
    expect(perfectNotes).toBeGreaterThan(successNotes);
    expect(millionNotes).toBeGreaterThan(perfectNotes);

    await Promise.all([breathAudio.destroy(), burstAudio.destroy(), finaleAudio.destroy()]);
  });
});
