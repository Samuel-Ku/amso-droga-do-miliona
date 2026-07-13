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
  "counter"
] as const;

export type CampaignAudioCue = (typeof CAMPAIGN_AUDIO_CUES)[number];

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

interface ToneOptions {
  frequency: number;
  duration: number;
  volume: number;
  type?: OscillatorType;
  frequencyEnd?: number;
  delay?: number;
  destination: AudioNode;
}

const MUSIC_PHRASE_SECONDS = 2.4;
const MIN_GAIN = 0.0001;

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
  private phraseTimer: ReturnType<typeof globalThis.setInterval> | null = null;
  private readonly activeOscillators = new Set<OscillatorNode>();
  private _muted: boolean;
  private _unlocked = false;
  private _started = false;
  private destroyed = false;

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
    this.scheduleMusicPhrase();
    this.phraseTimer = globalThis.setInterval(
      () => this.scheduleMusicPhrase(),
      MUSIC_PHRASE_SECONDS * 1_000
    );
    return true;
  }

  /** Stops the soundtrack and cues while keeping the preference and context reusable. */
  public stop(): void {
    if (this.phraseTimer !== null) {
      globalThis.clearInterval(this.phraseTimer);
      this.phraseTimer = null;
    }
    this._started = false;
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
      }
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

  private scheduleMusicPhrase(): void {
    if (!this._started || this.context === null || this.musicGain === null) return;

    const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23];
    for (let index = 0; index < notes.length; index += 1) {
      const frequency = notes[index];
      if (frequency === undefined) continue;
      this.playTone({
        frequency,
        duration: 0.32,
        volume: index % 3 === 0 ? 0.46 : 0.34,
        type: index % 2 === 0 ? "sine" : "triangle",
        delay: index * 0.4,
        destination: this.musicGain
      });
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
