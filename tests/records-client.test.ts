import { describe, expect, it, vi } from "vitest";
import { RecordsClient, sanitizePlayerName } from "../src/records-client";
import { PlayerProfileStore } from "../src/profile";

function makeProfile(): PlayerProfileStore {
  const mem = new Map<string, string>();
  const storage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: (i: number) => Array.from(mem.keys())[i] ?? null,
    get length() {
      return mem.size;
    }
  } as Storage;
  return new PlayerProfileStore(storage);
}

describe("sanitizePlayerName", () => {
  it("normalizes spaces and rejects names over 14 grapheme clusters", () => {
    expect(sanitizePlayerName("  Kurier  ")).toBe("Kurier");
    expect(sanitizePlayerName("Jan   Kowalski")).toBe("Jan Kowalski");
    expect(sanitizePlayerName("a".repeat(15))).toBeNull();
  });

  it("rejects empty and disallowed characters", () => {
    expect(sanitizePlayerName("")).toBeNull();
    expect(sanitizePlayerName("   ")).toBeNull();
    expect(sanitizePlayerName("hax<script>")).toBeNull();
  });
});

describe("RecordsClient.submitIfBest", () => {
  it("does not submit when score does not beat submitted best", async () => {
    const profile = makeProfile();
    profile.setPlayerName("Anka");
    profile.markSubmitted(500);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ entries: [], updated: false, best: 500 })
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const client = new RecordsClient("/api/records");
    const result = await client.submitIfBest(profile, 300, 12);

    expect(result.submitted).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1); // only GET, no POST
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/records");

    vi.unstubAllGlobals();
  });

  it("submits POST when score beats submitted best", async () => {
    const profile = makeProfile();
    profile.setPlayerName("Anka");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ entries: [{ name: "Anka", challengeScore: 700, orders: 20, updatedAt: 1 }], updated: true, best: 700 })
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const client = new RecordsClient("/api/records");
    const result = await client.submitIfBest(profile, 700, 20);

    expect(result.submitted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1); // single POST (name already set)
    expect(fetchMock.mock.calls[0]![1]!.method).toBe("POST");

    vi.unstubAllGlobals();
  });
});
