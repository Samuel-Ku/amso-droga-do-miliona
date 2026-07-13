export type GameMode = "story" | "challenge";
export type StoryCheckpoint =
  | "prologue"
  | "epoch_1"
  | "epoch_2"
  | "epoch_3"
  | "epoch_4"
  | "epoch_5"
  | "finale"
  | "completed";

export interface PlayerProfile {
  schemaVersion: 3;
  storyCheckpoint: StoryCheckpoint;
  storyCompleted: boolean;
  bestChallengeScore: number;
  bestChallengePackages: number;
  soundMuted: boolean;
  fullscreenPromptSeen: boolean;
  /** Legacy fields are retained only so an existing local profile can migrate safely. */
  discoveredFactIds: string[];
  furthestEpoch: number;
  runsPlayed: number;
}

const STORAGE_KEY = "amso_milion_runner_profile";
const CHECKPOINTS: readonly StoryCheckpoint[] = [
  "prologue",
  "epoch_1",
  "epoch_2",
  "epoch_3",
  "epoch_4",
  "epoch_5",
  "finale",
  "completed"
];

function emptyProfile(): PlayerProfile {
  return {
    schemaVersion: 3,
    storyCheckpoint: "prologue",
    storyCompleted: false,
    bestChallengeScore: 0,
    bestChallengePackages: 0,
    soundMuted: false,
    fullscreenPromptSeen: false,
    discoveredFactIds: [],
    furthestEpoch: 0,
    runsPlayed: 0
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

function isCheckpoint(value: unknown): value is StoryCheckpoint {
  return typeof value === "string" && (CHECKPOINTS as readonly string[]).includes(value);
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
      return {
        schemaVersion: 3,
        storyCheckpoint: isCheckpoint(parsed.storyCheckpoint)
          ? parsed.storyCheckpoint
          : storyCompleted
            ? "completed"
            : "prologue",
        storyCompleted,
        bestChallengeScore: Math.round(
          safeNonNegativeNumber(parsed.bestChallengeScore ?? parsed.bestScore)
        ),
        bestChallengePackages: Math.round(
          safeNonNegativeNumber(parsed.bestChallengePackages ?? parsed.bestPackages)
        ),
        soundMuted: parsed.soundMuted === true,
        fullscreenPromptSeen: parsed.fullscreenPromptSeen === true,
        discoveredFactIds: Array.isArray(parsed.discoveredFactIds)
          ? parsed.discoveredFactIds.filter((id): id is string => typeof id === "string")
          : [],
        furthestEpoch: Math.round(safeNonNegativeNumber(parsed.furthestEpoch)),
        runsPlayed: Math.round(safeNonNegativeNumber(parsed.runsPlayed))
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

  public setStoryCheckpoint(checkpoint: StoryCheckpoint): void {
    this.profile.storyCheckpoint = checkpoint;
    this.write();
  }

  public completeStory(): void {
    this.profile.storyCheckpoint = "completed";
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
    this.profile.runsPlayed += 1;
    this.write();
  }

  public setSoundMuted(muted: boolean): void {
    this.profile.soundMuted = muted;
    this.write();
  }

  public markFullscreenPromptSeen(): void {
    this.profile.fullscreenPromptSeen = true;
    this.write();
  }

  /** Compatibility during the v2-to-v3 controller migration. */
  public hasDiscovered(factId: string): boolean {
    return this.profile.discoveredFactIds.includes(factId);
  }

  /** Compatibility during the v2-to-v3 controller migration. */
  public recordRun(
    score: number,
    packages: number,
    furthestEpoch: number,
    discoveredFactIds: readonly string[]
  ): string[] {
    const fresh: string[] = [];
    for (const id of discoveredFactIds) {
      if (!this.profile.discoveredFactIds.includes(id)) {
        this.profile.discoveredFactIds.push(id);
        fresh.push(id);
      }
    }
    this.profile.bestChallengeScore = Math.max(
      this.profile.bestChallengeScore,
      Math.round(safeNonNegativeNumber(score))
    );
    this.profile.bestChallengePackages = Math.max(
      this.profile.bestChallengePackages,
      Math.round(safeNonNegativeNumber(packages))
    );
    this.profile.furthestEpoch = Math.max(
      this.profile.furthestEpoch,
      Math.round(safeNonNegativeNumber(furthestEpoch))
    );
    this.profile.runsPlayed += 1;
    this.write();
    return fresh;
  }

  public resetFacts(): void {
    this.profile.discoveredFactIds = [];
    this.write();
  }
}
