export type GameMode = "story" | "challenge";
export type { RecordBoardEntry } from "./shared/types";

export interface PlayerProfile {
  schemaVersion: 6;
  challengeRecordVersion: 11;
  storyCompleted: boolean;
  bestChallengeScore: number;
  bestChallengeOrders: number;
  challengeRuns: number;
  challengeRecordRuns: number;
  soundMuted: boolean;
  fullscreenPreference: "fullscreen" | "portrait" | null;
  /** Player-chosen display name for the records board; asked once. */
  playerName: string | null;
  /** Anonymous local owner key used only to update this player's public record. */
  playerId: string;
  /** Best challenge score we have already submitted to the board. */
  submittedBestScore: number;
}

const STORAGE_KEY = "amso_milion_runner_profile";

function emptyProfile(): PlayerProfile {
  return {
    schemaVersion: 6,
    challengeRecordVersion: 11,
    storyCompleted: false,
    bestChallengeScore: 0,
    bestChallengeOrders: 0,
    challengeRuns: 0,
    challengeRecordRuns: 0,
    soundMuted: false,
    fullscreenPreference: null,
    playerName: null,
    playerId: createPlayerId(),
    submittedBestScore: 0
  };
}

function createPlayerId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
  }
}

function isPlayerId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/u.test(value);
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
    this.write();
  }

  private read(): PlayerProfile {
    if (this.storage === null) return emptyProfile();
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return emptyProfile();
      const parsed = JSON.parse(raw) as Partial<PlayerProfile> & {
        bestScore?: unknown;
        bestPackages?: unknown;
        bestChallengePackages?: unknown;
      };
      const storyCompleted = parsed.storyCompleted === true;
      const currentChallengeEconomy = parsed.challengeRecordVersion === 11;
      const fullscreenPreference = parsed.fullscreenPreference === "fullscreen" ||
        parsed.fullscreenPreference === "portrait"
        ? parsed.fullscreenPreference
        : null;
      return {
        schemaVersion: 6,
        challengeRecordVersion: 11,
        storyCompleted,
        bestChallengeScore: currentChallengeEconomy
          ? Math.round(safeNonNegativeNumber(parsed.bestChallengeScore ?? parsed.bestScore))
          : 0,
        bestChallengeOrders: currentChallengeEconomy
          ? Math.round(safeNonNegativeNumber(
              parsed.bestChallengeOrders ?? parsed.bestChallengePackages ?? parsed.bestPackages
            ))
          : 0,
        challengeRuns: Math.round(safeNonNegativeNumber(parsed.challengeRuns)),
        challengeRecordRuns: currentChallengeEconomy
          ? Math.round(safeNonNegativeNumber(parsed.challengeRecordRuns))
          : 0,
        soundMuted: parsed.soundMuted === true,
        fullscreenPreference,
        playerName:
          typeof parsed.playerName === "string" && parsed.playerName.length > 0
            ? parsed.playerName
            : null,
        playerId: isPlayerId(parsed.playerId) ? parsed.playerId : createPlayerId(),
        submittedBestScore: Math.round(safeNonNegativeNumber(parsed.submittedBestScore))
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

  public recordChallengeResult(score: number, orders: number): void {
    this.profile.bestChallengeScore = Math.max(
      this.profile.bestChallengeScore,
      Math.round(safeNonNegativeNumber(score))
    );
    this.profile.bestChallengeOrders = Math.max(
      this.profile.bestChallengeOrders,
      Math.round(safeNonNegativeNumber(orders))
    );
    this.profile.challengeRuns += 1;
    this.profile.challengeRecordRuns += 1;
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

  public get playerName(): string | null {
    return this.profile.playerName;
  }

  public get playerId(): string {
    return this.profile.playerId;
  }

  public setPlayerName(name: string | null): void {
    this.profile.playerName = name && name.length > 0 ? name : null;
    this.write();
  }

  public get submittedBestScore(): number {
    return this.profile.submittedBestScore;
  }

  public markSubmitted(score: number): void {
    this.profile.submittedBestScore = Math.max(
      this.profile.submittedBestScore,
      Math.round(safeNonNegativeNumber(score))
    );
    this.write();
  }
}
