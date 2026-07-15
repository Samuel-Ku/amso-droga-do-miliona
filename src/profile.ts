export type GameMode = "story" | "challenge";

export interface PlayerProfile {
  schemaVersion: 4;
  storyCompleted: boolean;
  bestChallengeScore: number;
  bestChallengePackages: number;
  challengeRuns: number;
  soundMuted: boolean;
  fullscreenPreference: "fullscreen" | "portrait" | null;
}

const STORAGE_KEY = "amso_milion_runner_profile";

function emptyProfile(): PlayerProfile {
  return {
    schemaVersion: 4,
    storyCompleted: false,
    bestChallengeScore: 0,
    bestChallengePackages: 0,
    challengeRuns: 0,
    soundMuted: false,
    fullscreenPreference: null
  };
}

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeNonNegativeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

export class PlayerProfileStore {
  private readonly storage: Storage | null;
  private profile: PlayerProfile;

  public constructor(storage: Storage | null = safeStorage()) {
    this.storage = storage;
    this.profile = this.read();
  }

  private read(): PlayerProfile {
    if (this.storage === null) return emptyProfile();
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return emptyProfile();
      const parsed = JSON.parse(raw) as Partial<PlayerProfile> & {
        bestScore?: unknown;
        bestPackages?: unknown;
      };
      const storyCompleted = parsed.storyCompleted === true;
      const fullscreenPreference = parsed.fullscreenPreference === "fullscreen" ||
        parsed.fullscreenPreference === "portrait"
        ? parsed.fullscreenPreference
        : null;
      return {
        schemaVersion: 4,
        storyCompleted,
        bestChallengeScore: Math.round(
          safeNonNegativeNumber(parsed.bestChallengeScore ?? parsed.bestScore)
        ),
        bestChallengePackages: Math.round(
          safeNonNegativeNumber(parsed.bestChallengePackages ?? parsed.bestPackages)
        ),
        challengeRuns: Math.round(safeNonNegativeNumber(parsed.challengeRuns)),
        soundMuted: parsed.soundMuted === true,
        fullscreenPreference
      };
    } catch {
      return emptyProfile();
    }
  }

  private write(): void {
    if (this.storage === null) return;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch {
      // Persistence is best-effort. The in-memory profile remains fully usable.
    }
  }

  public get snapshot(): Readonly<PlayerProfile> {
    return this.profile;
  }

  public get availableModes(): readonly GameMode[] {
    return this.profile.storyCompleted ? ["story", "challenge"] : ["story"];
  }

  public completeStory(): void {
    this.profile.storyCompleted = true;
    this.write();
  }

  public recordChallengeResult(score: number, packages: number): void {
    this.profile.bestChallengeScore = Math.max(
      this.profile.bestChallengeScore,
      Math.round(safeNonNegativeNumber(score))
    );
    this.profile.bestChallengePackages = Math.max(
      this.profile.bestChallengePackages,
      Math.round(safeNonNegativeNumber(packages))
    );
    this.profile.challengeRuns += 1;
    this.write();
  }

  public setSoundMuted(muted: boolean): void {
    this.profile.soundMuted = muted;
    this.write();
  }

  public setFullscreenPreference(preference: "fullscreen" | "portrait"): void {
    this.profile.fullscreenPreference = preference;
    this.write();
  }
}
