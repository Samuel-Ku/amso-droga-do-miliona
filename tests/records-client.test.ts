import { describe, expect, it, vi } from "vitest";
import {
  RecordsClient,
  RecordsNameTakenError,
  sanitizePlayerName
} from "../src/records-client";
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
  it("keeps a disabled QA board fully offline", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const client = new RecordsClient("/api/records", {
      readsEnabled: false,
      writesEnabled: false
    });

    await expect(client.fetchBoard()).resolves.toEqual([]);

    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("does not submit when score does not beat submitted best", async () => {
    const profile = makeProfile();
    profile.setPlayerName("Anka");
    profile.markSubmitted(500);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: [],
        playerEntry: { name: "Anka", challengeScore: 500, orders: 12, updatedAt: 1, rank: 22 },
        updated: false,
        best: 500
      })
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const client = new RecordsClient("/api/records");
    const result = await client.submitIfBest(profile, 300, 12);

    expect(result.submitted).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1); // only GET, no POST
    expect(fetchMock.mock.calls[0]![0]).toContain("/api/records?limit=10&playerId=");

    vi.unstubAllGlobals();
  });

  it("submits POST when score beats submitted best", async () => {
    const profile = makeProfile();
    profile.setPlayerName("Anka");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: [{ name: "Anka", challengeScore: 700, orders: 20, updatedAt: 1, rank: 1 }],
        playerEntry: { name: "Anka", challengeScore: 700, orders: 20, updatedAt: 1, rank: 1 },
        updated: true,
        best: 700
      })
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const client = new RecordsClient("/api/records");
    const result = await client.submitIfBest(profile, 700, 20);

    expect(result.submitted).toBe(true);
    expect(result.playerEntry?.rank).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1); // single POST (name already set)
    expect(fetchMock.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]!.body))).toMatchObject({
      playerId: profile.playerId,
      name: "Anka",
      previousSubmittedBest: 0
    });

    vi.unstubAllGlobals();
  });

  it("requests the current player's exact row when no POST is needed", async () => {
    const profile = makeProfile();
    profile.setPlayerName("Anka");
    profile.markSubmitted(500);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: [],
        playerEntry: { name: "Anka", challengeScore: 500, orders: 12, updatedAt: 1, rank: 184 }
      })
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const result = await new RecordsClient("/api/records").submitIfBest(profile, 300, 7);

    expect(result.playerEntry?.rank).toBe(184);
    expect(fetchMock.mock.calls[0]![0]).toContain(`playerId=${encodeURIComponent(profile.playerId)}`);
    vi.unstubAllGlobals();
  });

  it("surfaces a reserved-name collision as a distinct public error", async () => {
    const profile = makeProfile();
    profile.setPlayerName("Anka");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "name_taken" })
    } as Response));

    await expect(new RecordsClient("/api/records").submitIfBest(profile, 700, 20))
      .rejects.toBeInstanceOf(RecordsNameTakenError);
    vi.unstubAllGlobals();
  });

  it("submits an equal score so a higher orders tiebreak can improve rank", async () => {
    const profile = makeProfile();
    profile.setPlayerName("Kurier");
    profile.markSubmitted(500);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      entries: [],
      playerEntry: {
        id: "record-1",
        name: "Kurier",
        challengeScore: 500,
        orders: 20,
        updatedAt: 2,
        rank: 1
      },
      updated: true
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await new RecordsClient("/api/records")
      .submitIfBest(profile, 500, 20);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      challengeScore: 500,
      orders: 20
    });
    expect(result.submitted).toBe(true);
    vi.unstubAllGlobals();
  });
});
