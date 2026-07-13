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

    expect(store.snapshot).toEqual({
      schemaVersion: 4,
      storyCompleted: false,
      bestChallengeScore: 0,
      bestChallengePackages: 0,
      soundMuted: false,
      fullscreenPreference: null
    });
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
      bestChallengePackages: 7,
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
    expect(JSON.parse(storage.getItem("amso_milion_runner_profile") ?? "null")).toEqual({
      schemaVersion: 4,
      storyCompleted: false,
      bestChallengeScore: 900,
      bestChallengePackages: 7,
      soundMuted: true,
      fullscreenPreference: null
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
    expect(restored.snapshot.bestChallengePackages).toBe(102);
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
