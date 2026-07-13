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
  it("starts at the prologue with only story mode available", () => {
    const store = new PlayerProfileStore(new MemoryStorage());

    expect(store.snapshot.storyCheckpoint).toBe("prologue");
    expect(store.snapshot.storyCompleted).toBe(false);
    expect(store.availableModes).toEqual(["story"]);
  });

  it("restores an epoch checkpoint without unlocking the challenge at the finale", () => {
    const storage = new MemoryStorage();
    const first = new PlayerProfileStore(storage);
    first.setStoryCheckpoint("epoch_3");

    expect(new PlayerProfileStore(storage).snapshot.storyCheckpoint).toBe("epoch_3");

    first.setStoryCheckpoint("finale");
    const atFinale = new PlayerProfileStore(storage);
    expect(atFinale.snapshot.storyCompleted).toBe(false);
    expect(atFinale.availableModes).toEqual(["story"]);
  });

  it("unlocks challenge only when the full story is completed", () => {
    const storage = new MemoryStorage();
    const first = new PlayerProfileStore(storage);
    first.completeStory();

    const restored = new PlayerProfileStore(storage);
    expect(restored.snapshot.storyCheckpoint).toBe("completed");
    expect(restored.snapshot.storyCompleted).toBe(true);
    expect(restored.availableModes).toEqual(["story", "challenge"]);
  });

  it("keeps challenge unlocked while a completed player replays the story", () => {
    const storage = new MemoryStorage();
    const first = new PlayerProfileStore(storage);
    first.completeStory();
    first.setStoryCheckpoint("epoch_2");

    const restored = new PlayerProfileStore(storage);
    expect(restored.snapshot.storyCompleted).toBe(true);
    expect(restored.snapshot.storyCheckpoint).toBe("epoch_2");
    expect(restored.availableModes).toEqual(["story", "challenge"]);
  });

  it("persists challenge records and presentation preferences", () => {
    const storage = new MemoryStorage();
    const first = new PlayerProfileStore(storage);
    first.recordChallengeResult(12_450, 87);
    first.recordChallengeResult(8_000, 102);
    first.setSoundMuted(true);
    first.markFullscreenPromptSeen();

    const restored = new PlayerProfileStore(storage);
    expect(restored.snapshot.bestChallengeScore).toBe(12_450);
    expect(restored.snapshot.bestChallengePackages).toBe(102);
    expect(restored.snapshot.soundMuted).toBe(true);
    expect(restored.snapshot.fullscreenPromptSeen).toBe(true);
  });

  it("keeps an in-memory story profile when storage is missing or corrupt", () => {
    const unavailable = new PlayerProfileStore(null);
    unavailable.setStoryCheckpoint("epoch_5");
    unavailable.completeStory();
    expect(unavailable.availableModes).toEqual(["story", "challenge"]);

    const corrupt = new MemoryStorage();
    corrupt.setItem("amso_milion_runner_profile", "{broken");
    expect(new PlayerProfileStore(corrupt).snapshot.storyCheckpoint).toBe("prologue");
  });
});
