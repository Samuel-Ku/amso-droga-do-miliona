import { describe, expect, it } from "vitest";
import { PlayerProfileStore } from "../src/profile";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  public get length(): number {
    return this.values.size;
  }

  public clear(): void {
    this.values.clear();
  }

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("PlayerProfileStore", () => {
  it("starts with a minimal unfinished profile and only story mode available", () => {
    const store = new PlayerProfileStore(new MemoryStorage());

    expect(store.snapshot).toMatchObject({
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
      submittedBestScore: 0
    });
    expect(store.snapshot.playerId).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(store.snapshot).not.toHaveProperty("storyCheckpoint");
    expect(store.availableModes).toEqual(["story"]);
  });

  it("ignores a legacy checkpoint so an unfinished reload starts from the intro", () => {
    const storage = new MemoryStorage();
    storage.setItem("amso_milion_runner_profile", JSON.stringify({
      schemaVersion: 3,
      storyCheckpoint: "epoch_5",
      storyCompleted: false,
      bestChallengeScore: 900,
      bestChallengeOrders: 7,
      challengeRuns: 0,
      soundMuted: false,
      fullscreenPromptSeen: false,
      discoveredFactIds: ["legacy-fact"],
      furthestEpoch: 4,
      runsPlayed: 3
    }));

    const restored = new PlayerProfileStore(storage);
    expect(restored.snapshot).not.toHaveProperty("storyCheckpoint");
    expect(restored.snapshot.storyCompleted).toBe(false);
    expect(restored.availableModes).toEqual(["story"]);

    restored.setSoundMuted(true);
    expect(JSON.parse(storage.getItem("amso_milion_runner_profile") ?? "null")).toMatchObject({
      schemaVersion: 6,
      challengeRecordVersion: 11,
      storyCompleted: false,
      bestChallengeScore: 0,
      bestChallengeOrders: 0,
      challengeRuns: 0,
      challengeRecordRuns: 0,
      soundMuted: true,
      fullscreenPreference: null,
      playerName: null,
      submittedBestScore: 0
    });
  });

  it("starts a fresh v11 record while preserving story completion and total runs", () => {
    const storage = new MemoryStorage();
    storage.setItem("amso_milion_runner_profile", JSON.stringify({
      schemaVersion: 3,
      storyCompleted: true,
      bestChallengeScore: 41_000,
      bestChallengePackages: 123,
      challengeRuns: 4
    }));

    const restored = new PlayerProfileStore(storage);
    expect(restored.snapshot.bestChallengeOrders).toBe(0);
    expect(restored.snapshot.bestChallengeScore).toBe(0);
    expect(restored.snapshot.storyCompleted).toBe(true);
    expect(restored.snapshot.challengeRuns).toBe(4);
    expect(restored.snapshot.challengeRecordRuns).toBe(0);

    restored.recordChallengeResult(9_500, 42);
    const persisted = storage.getItem("amso_milion_runner_profile") ?? "";
    expect(persisted).not.toContain("bestChallengePackages");
    expect(JSON.parse(persisted)).toMatchObject({
      schemaVersion: 6,
      challengeRecordVersion: 11,
      bestChallengeScore: 9_500,
      bestChallengeOrders: 42,
      challengeRuns: 5,
      challengeRecordRuns: 1,
      storyCompleted: true
    });

    const reloaded = new PlayerProfileStore(storage);
    expect(reloaded.snapshot.bestChallengeScore).toBe(9_500);
    expect(reloaded.snapshot.challengeRecordRuns).toBe(1);
  });

  it("keeps a v11 record across an unrelated future profile-schema migration", () => {
    const storage = new MemoryStorage();
    storage.setItem("amso_milion_runner_profile", JSON.stringify({
      schemaVersion: 7,
      challengeRecordVersion: 11,
      storyCompleted: true,
      bestChallengeScore: 77_250,
      bestChallengeOrders: 219,
      challengeRuns: 8,
      challengeRecordRuns: 3
    }));

    const restored = new PlayerProfileStore(storage);

    expect(restored.snapshot).toMatchObject({
      schemaVersion: 6,
      challengeRecordVersion: 11,
      bestChallengeScore: 77_250,
      bestChallengeOrders: 219,
      challengeRuns: 8,
      challengeRecordRuns: 3
    });
  });

  it("adds one stable anonymous player id without losing an existing leaderboard identity", () => {
    const storage = new MemoryStorage();
    storage.setItem("amso_milion_runner_profile", JSON.stringify({
      schemaVersion: 5,
      challengeRecordVersion: 11,
      storyCompleted: true,
      bestChallengeScore: 44_000,
      bestChallengeOrders: 88,
      challengeRuns: 4,
      challengeRecordRuns: 2,
      soundMuted: true,
      fullscreenPreference: "fullscreen",
      playerName: "Kurier",
      submittedBestScore: 44_000
    }));

    const first = new PlayerProfileStore(storage);
    const playerId = first.playerId;
    first.setSoundMuted(false);
    const restored = new PlayerProfileStore(storage);

    expect(playerId).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(restored.playerId).toBe(playerId);
    expect(restored.snapshot).toMatchObject({
      schemaVersion: 6,
      storyCompleted: true,
      bestChallengeScore: 44_000,
      playerName: "Kurier",
      submittedBestScore: 44_000
    });
  });

  it("unlocks challenge only when the full story is completed", () => {
    const storage = new MemoryStorage();
    const first = new PlayerProfileStore(storage);
    first.completeStory();

    const restored = new PlayerProfileStore(storage);
    expect(restored.snapshot.storyCompleted).toBe(true);
    expect(restored.snapshot).not.toHaveProperty("storyCheckpoint");
    expect(restored.availableModes).toEqual(["story", "challenge"]);
  });

  it("persists challenge records and presentation preferences", () => {
    const storage = new MemoryStorage();
    const first = new PlayerProfileStore(storage);
    first.recordChallengeResult(12_450, 87);
    first.recordChallengeResult(8_000, 102);
    first.setSoundMuted(true);
    first.setFullscreenPreference("fullscreen");

    const restored = new PlayerProfileStore(storage);
    expect(restored.snapshot.bestChallengeScore).toBe(12_450);
    expect(restored.snapshot.bestChallengeOrders).toBe(102);
    expect(restored.snapshot.challengeRuns).toBe(2);
    expect(restored.snapshot.challengeRecordRuns).toBe(2);
    expect(restored.snapshot.soundMuted).toBe(true);
    expect(restored.snapshot.fullscreenPreference).toBe("fullscreen");
  });

  it("keeps an in-memory story profile when storage is missing or corrupt", () => {
    const unavailable = new PlayerProfileStore(null);
    unavailable.completeStory();
    expect(unavailable.availableModes).toEqual(["story", "challenge"]);

    const corrupt = new MemoryStorage();
    corrupt.setItem("amso_milion_runner_profile", "{broken");
    const restored = new PlayerProfileStore(corrupt);
    expect(restored.snapshot.storyCompleted).toBe(false);
    expect(restored.snapshot).not.toHaveProperty("storyCheckpoint");
    expect(restored.availableModes).toEqual(["story"]);
  });
});
