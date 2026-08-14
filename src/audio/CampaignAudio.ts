import {
  MILESTONE_CELEBRATION_PRESENTATION,
  type MilestoneCelebrationKind
} from "../game/milestone-celebration";
import type { PowerUpKind } from "../shared/types";

export const CAMPAIGN_AUDIO_CUES = [
  "jump",
  "slide",
  "package",
  "power-up",
  "collision",
  "corridor-enter",
  "corridor-exit",
  "tape",
  "laptop-start",
  "test-signal",
  "scanner",
  "conveyor",
  "counter",
  "wave-success",
  "wave-perfect",
  "wave-retry",
  "chapter-complete",
  "million"
] as const;

export type CampaignAudioCue = (typeof CAMPAIGN_AUDIO_CUES)[number];

export interface CampaignMusicState {
  chapter: number;
  phase: "breath" | "burst";
  finaleLayer: 0 | 1 | 2 | 3 | 4;
}

export interface CampaignAudioOptions {
  /** Initial preference; the audio graph still starts only after `start()`. */
  muted?: boolean;
  /** Overall music level in the 0..1 range. */
  musicVolume?: number;
  /** Overall cue level in the 0..1 range. */
  cueVolume?: number;
  /** Optional host factory for embedded browsers with a custom AudioContext. */
  contextFactory?: () => AudioContext | null;
}

type AudioContextConstructor = new () => AudioContext;
type OfflineAudioContextConstructor = new (
  numberOfChannels: number,
  length: number,
  sampleRate: number
) => OfflineAudioContext;

interface ToneOptions {
  frequency: number;
  duration: number;
  volume: number;
  type?: OscillatorType;
  frequencyEnd?: number;
  delay?: number;
  destination: AudioNode;
}

interface BufferedTone {
  readonly frequency: number;
  readonly start: number;
  readonly duration: number;
  readonly volume: number;
  readonly type: OscillatorType;
}

const MUSIC_PHRASE_SECONDS = 2.4;
const MIN_GAIN = 0.0001;

/** Five-note pickup ladder; longer combos deliberately stop climbing. */
export function orderPickupFrequency(streak: number): number {
  const step = Math.max(0, Math.min(4, Math.floor(streak) - 1));
  return 622.25 * 2 ** (step / 12);
}

function clampUnit(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function audioContextConstructor(): AudioContextConstructor | null {
  const scope = globalThis as typeof globalThis & {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

function offlineAudioContextConstructor(): OfflineAudioContextConstructor | null {
  const scope = globalThis as typeof globalThis & {
    OfflineAudioContext?: OfflineAudioContextConstructor;
    webkitOfflineAudioContext?: OfflineAudioContextConstructor;
  };
  return scope.OfflineAudioContext ?? scope.webkitOfflineAudioContext ?? null;
}

/**
 * Small synthesized soundtrack used by the campaign shell.
 *
 * Constructing this class never creates an AudioContext or makes sound. Call
 * `start()` directly from a user gesture to unlock browser audio and begin the
 * background phrase. Before that, cues are intentional no-ops.
 */
export class CampaignAudio {
  private readonly contextFactory: (() => AudioContext | null) | undefined;
  private readonly musicVolume: number;
  private readonly cueVolume: number;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private cueGain: GainNode | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private pendingMusicSource: AudioBufferSourceNode | null = null;
  private musicLoopStartedAt = 0;
  private musicSwapAt: number | null = null;
  private musicRenderRevision = 0;
  private musicRenderRunning = false;
  private readonly activeOscillators = new Set<OscillatorNode>();
  private _muted: boolean;
  private _unlocked = false;
  private _started = false;
  private destroyed = false;
  private musicState: CampaignMusicState = { chapter: 0, phase: "breath", finaleLayer: 0 };

  public constructor(options: CampaignAudioOptions = {}) {
    this._muted = options.muted ?? false;
    this.musicVolume = clampUnit(options.musicVolume, 0.18);
    this.cueVolume = clampUnit(options.cueVolume, 0.42);
    this.contextFactory = options.contextFactory;
  }

  public get supported(): boolean {
    return !this.destroyed && (this.contextFactory !== undefined || audioContextConstructor() !== null);
  }

  public get unlocked(): boolean {
    return this._unlocked;
  }

  public get started(): boolean {
    return this._started;
  }

  public get muted(): boolean {
    return this._muted;
  }

  /**
   * Unlocks Web Audio without beginning the soundtrack. Invoke only in direct
   * response to a click/tap/keyboard gesture.
   */
  public async unlock(): Promise<boolean> {
    if (this.destroyed) return false;

    const context = this.ensureContext();
    if (context === null) return false;

    try {
      if (context.state === "suspended") {
        await context.resume();
      }
      if (context.state === "closed") return false;
      this._unlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Unlocks audio and starts the synthesized music. This is the normal entry
   * point for the campaign's explicit Start button.
   */
  public async start(): Promise<boolean> {
    if (this.destroyed) return false;
    if (!(await this.unlock())) return false;
    if (this._started) return true;

    this._started = true;
    this.requestMusicRender();
    return true;
  }

  /** Stops the soundtrack and cues while keeping the preference and context reusable. */
  public stop(): void {
    this._started = false;
    this.musicRenderRevision += 1;
    this.stopMusicLoop();
    this.stopActiveOscillators();
  }

  public setMuted(muted: boolean): void {
    this._muted = muted;
    const context = this.context;
    const gain = this.masterGain?.gain;
    if (context === null || gain === undefined || context.state === "closed") return;

    try {
      gain.cancelScheduledValues(context.currentTime);
      gain.setTargetAtTime(muted ? 0 : 1, context.currentTime, 0.012);
    } catch {
      // A closing or interrupted context must not affect the game.
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this._muted);
    return this._muted;
  }

  /** Selects musical layers without starting audio or changing gameplay. */
  public setMusicState(state: Readonly<CampaignMusicState>): void {
    const nextState: CampaignMusicState = {
      chapter: Math.max(0, Math.min(6, Math.floor(state.chapter))),
      phase: state.phase,
      finaleLayer: Math.max(0, Math.min(4, Math.floor(state.finaleLayer))) as CampaignMusicState["finaleLayer"]
    };
    if (nextState.chapter === this.musicState.chapter &&
        nextState.phase === this.musicState.phase &&
        nextState.finaleLayer === this.musicState.finaleLayer) return;
    this.musicState = nextState;
    if (this._started) this.requestMusicRender();
  }

  /** Plays a short synthesized cue after audio has been explicitly started. */
  public playCue(cue: CampaignAudioCue): void {
    if (!this._started || this.destroyed || this.context === null || this.cueGain === null) return;

    try {
      switch (cue) {
        case "jump":
          this.playTone({
            frequency: 420,
            frequencyEnd: 700,
            duration: 0.14,
            volume: 0.7,
            type: "sine",
            destination: this.cueGain
          });
          break;
        case "slide":
          this.playTone({
            frequency: 250,
            frequencyEnd: 120,
            duration: 0.16,
            volume: 0.54,
            type: "triangle",
            destination: this.cueGain
          });
          break;
        case "package":
          this.playTone({
            frequency: 660,
            frequencyEnd: 990,
            duration: 0.12,
            volume: 0.62,
            type: "sine",
            destination: this.cueGain
          });
          break;
        case "power-up":
          this.playSequence([523.25, 659.25, 783.99], 0.075, 0.13, 0.64, "triangle");
          break;
        case "collision":
          this.playTone({
            frequency: 150,
            frequencyEnd: 54,
            duration: 0.23,
            volume: 0.74,
            type: "sawtooth",
            destination: this.cueGain
          });
          break;
        case "corridor-enter":
          this.playSequence([392, 523.25, 659.25], 0.11, 0.24, 0.44, "sine");
          break;
        case "corridor-exit":
          this.playSequence([659.25, 523.25, 392], 0.1, 0.2, 0.42, "sine");
          break;
        case "tape":
          this.playSequence([1_680, 1_280], 0.055, 0.07, 0.28, "square");
          break;
        case "laptop-start":
          this.playSequence([220, 440, 659.25], 0.07, 0.12, 0.34, "sine");
          break;
        case "test-signal":
          this.playSequence([880, 1_046.5], 0.09, 0.08, 0.3, "square");
          break;
        case "scanner":
          this.playTone({
            frequency: 520,
            frequencyEnd: 1_240,
            duration: 0.2,
            volume: 0.32,
            type: "sine",
            destination: this.cueGain
          });
          break;
        case "conveyor":
          this.playTone({
            frequency: 105,
            frequencyEnd: 155,
            duration: 0.24,
            volume: 0.25,
            type: "triangle",
            destination: this.cueGain
          });
          break;
        case "counter":
          this.playSequence([523.25, 659.25, 783.99], 0.065, 0.085, 0.31, "triangle");
          break;
        case "wave-success":
          this.playSequence([523.25, 659.25], 0.07, 0.1, 0.42, "triangle");
          break;
        case "wave-perfect":
          this.playSequence([523.25, 659.25, 783.99], 0.055, 0.12, 0.5, "triangle");
          break;
        case "wave-retry":
          this.playTone({
            frequency: 196,
            frequencyEnd: 174.61,
            duration: 0.16,
            volume: 0.28,
            type: "sine",
            destination: this.cueGain
          });
          break;
        case "chapter-complete":
          this.playSequence([392, 523.25, 659.25, 783.99], 0.07, 0.16, 0.52, "triangle");
          break;
        case "million":
          this.playSequence([261.63, 329.63, 392, 523.25, 659.25], 0.08, 0.24, 0.58, "triangle");
          break;
      }
    } catch {
      // Web Audio is enhancement-only and must always fail open.
    }
  }

  /** Short order motif whose pitch communicates a sustained collection rhythm. */
  public playOrderPickup(streak: number): void {
    const frequency = orderPickupFrequency(streak);
    this.withCueOutput((destination) => {
      this.playTone({
        frequency,
        frequencyEnd: frequency * 1.18,
        duration: 0.1,
        volume: 0.54,
        type: "sine",
        destination
      });
    });
  }

  public playParcelPickup(streak: number): void {
    this.playOrderPickup(streak);
  }

  /** Premium equipment gets a brighter three-note answer distinct from a parcel. */
  public playEquipmentPickup(): void {
    this.withCueOutput(() => {
      this.playSequence([659.25, 880, 1174.66], 0.045, 0.11, 0.56, "triangle");
    });
  }

  /** Distinct signatures let players identify the bonus before reading its label. */
  public playPowerUpCue(kind: PowerUpKind): void {
    this.withCueOutput(() => {
      if (kind === "gwarancja_48") {
        this.playSequence([329.63, 392, 523.25, 659.25], 0.06, 0.14, 0.55, "sine");
      } else {
        this.playSequence([523.25, 783.99, 1046.5], 0.055, 0.12, 0.59, "triangle");
      }
    });
  }

  /** Plays the rotating achievement phrase; later cycles add a higher harmony. */
  public playMilestoneCue(kind: MilestoneCelebrationKind, intensity: number): void {
    this.withCueOutput(() => {
      const notes: number[] = [...MILESTONE_CELEBRATION_PRESENTATION[kind].audioNotes];
      if (intensity >= 2) notes.push(notes.at(-1)! * 1.25);
      if (intensity >= 3) notes.push(notes.at(-2)! * 1.5);
      this.playSequence(notes, 0.055, 0.12, 0.55, "triangle");
    });
  }

  /** A short upper-register answer reserved for the first record break in a run. */
  public playRecordCue(): void {
    this.withCueOutput(() => {
      this.playSequence([659.25, 783.99, 1046.5, 1318.51], 0.045, 0.1, 0.48, "triangle");
    });
  }

  /** Keeps the UI countdown audible while gameplay and locomotion stay frozen. */
  public playCountdownCue(value: 3 | 2 | 1): void {
    const frequency = value === 3 ? 659.25 : value === 2 ? 523.25 : 392;
    this.withCueOutput((destination) => {
      this.playTone({
        frequency,
        duration: 0.11,
        volume: 0.38,
        type: "sine",
        destination
      });
    });
  }

  private withCueOutput(play: (destination: GainNode) => void): void {
    if (this._muted || !this._started || this.destroyed || this.context === null ||
        this.cueGain === null) return;
    try {
      play(this.cueGain);
    } catch {
      // Web Audio is enhancement-only and must always fail open.
    }
  }

  public async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stop();
    this._unlocked = false;

    const context = this.context;
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.cueGain = null;
    if (context === null || context.state === "closed") return;

    try {
      await context.close();
    } catch {
      // Closing audio is best-effort in embedded and interrupted browsers.
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context !== null && this.context.state !== "closed") return this.context;

    try {
      const constructor = audioContextConstructor();
      const context = this.contextFactory !== undefined
        ? this.contextFactory()
        : constructor === null
          ? null
          : new constructor();
      if (context === null) return null;

      const masterGain = context.createGain();
      const musicGain = context.createGain();
      const cueGain = context.createGain();
      masterGain.gain.value = this._muted ? 0 : 1;
      musicGain.gain.value = this.musicVolume;
      cueGain.gain.value = this.cueVolume;
      musicGain.connect(masterGain);
      cueGain.connect(masterGain);
      masterGain.connect(context.destination);

      this.context = context;
      this.masterGain = masterGain;
      this.musicGain = musicGain;
      this.cueGain = cueGain;
      return context;
    } catch {
      this.context = null;
      this.masterGain = null;
      this.musicGain = null;
      this.cueGain = null;
      return null;
    }
  }

  private requestMusicRender(): void {
    this.musicRenderRevision += 1;
    if (this.musicRenderRunning) return;
    this.musicRenderRunning = true;
    void this.processMusicRenderQueue();
  }

  private async processMusicRenderQueue(): Promise<void> {
    let processedRevision = -1;
    try {
      while (this._started && !this.destroyed && processedRevision !== this.musicRenderRevision) {
        const revision = this.musicRenderRevision;
        const state = { ...this.musicState };
        let buffer: AudioBuffer;
        try {
          const sampleRate = this.context?.sampleRate;
          if (sampleRate === undefined) return;
          buffer = await this.renderMusicPhrase(state, sampleRate);
        } catch {
          processedRevision = revision;
          continue;
        }
        processedRevision = revision;
        if (!this._started || this.destroyed || revision !== this.musicRenderRevision) continue;
        if (this.musicSource === null) this.startMusicLoop(buffer);
        else this.scheduleMusicStateChange(buffer);
      }
    } finally {
      this.musicRenderRunning = false;
      if (this._started && !this.destroyed && processedRevision !== this.musicRenderRevision) {
        this.musicRenderRunning = true;
        void this.processMusicRenderQueue();
      }
    }
  }

  private startMusicLoop(buffer: AudioBuffer): void {
    const context = this.context;
    const destination = this.musicGain;
    if (!this._started || context === null || destination === null || context.state === "closed") {
      return;
    }

    try {
      const source = this.createLoopingMusicSource(context, destination, buffer);
      source.start();
      this.musicSource = source;
      this.musicLoopStartedAt = context.currentTime;
      this.musicSwapAt = null;
    } catch {
      this.musicSource = null;
      // The soundtrack is enhancement-only; cues and gameplay continue.
    }
  }

  private scheduleMusicStateChange(buffer: AudioBuffer): void {
    const context = this.context;
    const destination = this.musicGain;
    if (!this._started || context === null || destination === null || this.musicSource === null ||
        context.state === "closed") return;

    this.promotePendingMusicSourceIfDue(context.currentTime);
    const swapAt = this.musicSwapAt ?? this.musicLoopStartedAt +
      (Math.floor(Math.max(0, context.currentTime - this.musicLoopStartedAt) /
        MUSIC_PHRASE_SECONDS) + 1) * MUSIC_PHRASE_SECONDS;
    try {
      if (this.pendingMusicSource !== null) {
        this.stopAndDisconnectSource(this.pendingMusicSource);
        this.pendingMusicSource = null;
      }
      const source = this.createLoopingMusicSource(context, destination, buffer);
      source.start(swapAt);
      if (this.musicSwapAt === null) this.musicSource.stop(swapAt);
      this.pendingMusicSource = source;
      this.musicSwapAt = swapAt;
    } catch {
      // Keep the currently audible phrase if a replacement cannot be prepared.
    }
  }

  private createLoopingMusicSource(
    context: AudioContext,
    destination: GainNode,
    buffer: AudioBuffer
  ): AudioBufferSourceNode {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = MUSIC_PHRASE_SECONDS;
    source.connect(destination);
    source.addEventListener("ended", () => source.disconnect(), { once: true });
    return source;
  }

  private promotePendingMusicSourceIfDue(now: number): void {
    if (this.pendingMusicSource === null || this.musicSwapAt === null || now < this.musicSwapAt) return;
    this.musicSource = this.pendingMusicSource;
    this.pendingMusicSource = null;
    this.musicLoopStartedAt = this.musicSwapAt;
    this.musicSwapAt = null;
  }

  private renderMusicPhrase(
    state: Readonly<CampaignMusicState>,
    sampleRate: number
  ): Promise<AudioBuffer> {
    const OfflineContext = offlineAudioContextConstructor();
    if (OfflineContext === null) return Promise.reject(new Error("offline_audio_unsupported"));
    const context = new OfflineContext(
      1,
      Math.ceil(MUSIC_PHRASE_SECONDS * sampleRate),
      sampleRate
    );
    const tones: BufferedTone[] = [];
    const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23];
    for (let index = 0; index < notes.length; index += 1) {
      tones.push({
        frequency: notes[index]!,
        start: index * 0.4,
        duration: 0.32,
        volume: index % 3 === 0 ? 0.46 : 0.34,
        type: index % 2 === 0 ? "sine" : "triangle"
      });
    }
    const chapterRoot = 98 * Math.pow(2, (state.chapter % 4) / 12);
    tones.push(
      { frequency: chapterRoot, start: 0, duration: 0.28, volume: 0.18, type: "triangle" },
      { frequency: chapterRoot * 1.5, start: 1.2, duration: 0.28, volume: 0.18, type: "triangle" }
    );
    if (state.phase === "burst") {
      [82, 118, 82].forEach((frequency, index) => tones.push({
        frequency,
        start: index * 0.8,
        duration: 0.08,
        volume: 0.16,
        type: "square"
      }));
    }
    for (let layer = 0; layer < state.finaleLayer; layer += 1) {
      tones.push({
        frequency: 392 * Math.pow(2, layer / 12),
        start: 0,
        duration: 0.2,
        volume: 0.12,
        type: "sine"
      });
    }
    for (const tone of tones) this.scheduleOfflineTone(context, tone);
    return context.startRendering();
  }

  private scheduleOfflineTone(context: OfflineAudioContext, tone: BufferedTone): void {
    const startAt = Math.max(0, tone.start);
    const endAt = startAt + Math.max(0.03, tone.duration);
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(Math.max(1, tone.frequency), startAt);
    const peak = Math.max(MIN_GAIN, Math.min(1, tone.volume));
    envelope.gain.setValueAtTime(MIN_GAIN, startAt);
    envelope.gain.exponentialRampToValueAtTime(peak, startAt + 0.018);
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, endAt);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.02);
  }

  private stopMusicLoop(): void {
    const source = this.musicSource;
    const pendingSource = this.pendingMusicSource;
    this.musicSource = null;
    this.pendingMusicSource = null;
    this.musicSwapAt = null;
    if (source !== null) this.stopAndDisconnectSource(source);
    if (pendingSource !== null && pendingSource !== source) this.stopAndDisconnectSource(pendingSource);
  }

  private stopAndDisconnectSource(source: AudioBufferSourceNode): void {
    try {
      source.stop();
      source.disconnect();
    } catch {
      // A source may already have ended while the campaign was stopping.
    }
  }

  private playSequence(
    frequencies: readonly number[],
    spacing: number,
    duration: number,
    volume: number,
    type: OscillatorType
  ): void {
    if (this.cueGain === null) return;
    for (let index = 0; index < frequencies.length; index += 1) {
      const frequency = frequencies[index];
      if (frequency === undefined) continue;
      this.playTone({
        frequency,
        duration,
        volume,
        type,
        delay: index * spacing,
        destination: this.cueGain
      });
    }
  }

  private playTone(options: ToneOptions): void {
    const context = this.context;
    if (context === null || context.state === "closed") return;

    const startAt = context.currentTime + Math.max(0, options.delay ?? 0);
    const endAt = startAt + Math.max(0.03, options.duration);
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = options.type ?? "sine";
    oscillator.frequency.setValueAtTime(Math.max(1, options.frequency), startAt);
    if (options.frequencyEnd !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, options.frequencyEnd),
        endAt
      );
    }

    const peak = Math.max(MIN_GAIN, Math.min(1, options.volume));
    envelope.gain.setValueAtTime(MIN_GAIN, startAt);
    envelope.gain.exponentialRampToValueAtTime(peak, startAt + 0.018);
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, endAt);
    oscillator.connect(envelope);
    envelope.connect(options.destination);
    this.activeOscillators.add(oscillator);
    oscillator.addEventListener(
      "ended",
      () => {
        this.activeOscillators.delete(oscillator);
        oscillator.disconnect();
        envelope.disconnect();
      },
      { once: true }
    );
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.02);
  }

  private stopActiveOscillators(): void {
    for (const oscillator of this.activeOscillators) {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch {
        // A source may already have ended between iteration and stop().
      }
    }
    this.activeOscillators.clear();
  }
}

export default CampaignAudio;
