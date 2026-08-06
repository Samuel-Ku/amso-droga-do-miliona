import type { RecordBoardEntry } from "./shared/types";
import { PlayerProfileStore } from "./profile";
import { validatePlayerName } from "./moderation/player-name-policy";

const DEFAULT_ENDPOINT = "/api/records";

export interface BoardResponse {
  entries: RecordBoardEntry[];
  playerEntry?: RecordBoardEntry;
  updated?: boolean;
  best?: number;
}

export interface LeaderboardSnapshot {
  entries: RecordBoardEntry[];
  playerEntry: RecordBoardEntry | null;
}

export class RecordsNameTakenError extends Error {
  public constructor() {
    super("name_taken");
    this.name = "RecordsNameTakenError";
  }
}

export class RecordsClient {
  private readonly endpoint: string;
  private readonly readsEnabled: boolean;
  private readonly writesEnabled: boolean;

  public constructor(
    endpoint: string = DEFAULT_ENDPOINT,
    options: { readsEnabled?: boolean; writesEnabled?: boolean } = {}
  ) {
    this.endpoint = endpoint;
    this.readsEnabled = options.readsEnabled !== false;
    this.writesEnabled = options.writesEnabled !== false;
  }

  public async fetchBoard(signal?: AbortSignal): Promise<RecordBoardEntry[]> {
    return (await this.fetchRanking(undefined, 10, signal)).entries;
  }

  public async fetchRanking(
    playerId?: string,
    limit = 10,
    signal?: AbortSignal
  ): Promise<LeaderboardSnapshot> {
    if (!this.readsEnabled) return { entries: [], playerEntry: null };
    const url = new URL(this.endpoint, "https://records.local");
    url.searchParams.set("limit", String(Math.min(10, Math.max(1, Math.floor(limit)))));
    if (playerId) url.searchParams.set("playerId", playerId);
    const target = this.endpoint.startsWith("http") ? url.toString() : `${url.pathname}${url.search}`;
    const res = await fetch(target, {
      method: "GET",
      headers: { accept: "application/json" },
      signal
    });
    if (!res.ok) throw new Error(`records GET ${res.status}`);
    const data = (await res.json()) as Partial<BoardResponse>;
    const entries = normalizeEntries(data.entries);
    const playerEntry = normalizeEntry(data.playerEntry, data.playerEntry?.rank ?? 0);
    return { entries, playerEntry };
  }

  /**
   * Submits a result to the board, but only when it beats the player's
   * previously submitted best. Returns the fetched board (which may be
   * unchanged when the score did not qualify).
   */
  public async submitIfBest(
    profile: PlayerProfileStore,
    challengeScore: number,
    orders: number,
    signal?: AbortSignal
  ): Promise<{ board: RecordBoardEntry[]; playerEntry: RecordBoardEntry | null; submitted: boolean }> {
    const storedName = profile.playerName;
    const score = Math.round(challengeScore);
    if (!storedName) return { board: [], playerEntry: null, submitted: false };
    const validatedName = validatePlayerName(storedName);
    if (!validatedName.valid) {
      const snapshot = await this.fetchRanking(profile.playerId, 10, signal);
      return { board: snapshot.entries, playerEntry: snapshot.playerEntry, submitted: false };
    }
    const name = validatedName.name;
    if (!this.writesEnabled) {
      const snapshot = await this.fetchRanking(profile.playerId, 10, signal);
      return { board: snapshot.entries, playerEntry: snapshot.playerEntry, submitted: false };
    }
    let submittedScore = score;
    let submittedOrders = Math.round(orders);
    if (score < profile.submittedBestScore) {
      const snapshot = await this.fetchRanking(profile.playerId, 10, signal);
      if (snapshot.playerEntry) {
        return { board: snapshot.entries, playerEntry: snapshot.playerEntry, submitted: false };
      }
      submittedScore = profile.submittedBestScore;
      // A legacy claim must not combine the stored score with orders from a
      // different run. Zero preserves the imported tuple because it cannot
      // win the Worker's equal-score orders tiebreak.
      submittedOrders = 0;
    }

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        playerId: profile.playerId,
        name,
        challengeScore: submittedScore,
        orders: submittedOrders,
        previousSubmittedBest: profile.submittedBestScore
      }),
      signal
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({})) as { error?: string };
      if (res.status === 409 && error.error === "name_taken") throw new RecordsNameTakenError();
      throw new Error(`records POST ${res.status}`);
    }
    const data = (await res.json()) as Partial<BoardResponse>;
    const board = normalizeEntries(data.entries);
    const playerEntry = normalizeEntry(data.playerEntry, data.playerEntry?.rank ?? 0);
    if (data.updated === true) profile.markSubmitted(submittedScore);
    return { board, playerEntry, submitted: data.updated === true };
  }
}

function normalizeEntry(value: unknown, fallbackRank: number): RecordBoardEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Partial<RecordBoardEntry>;
  if (typeof entry.name !== "string" || typeof entry.challengeScore !== "number") return null;
  return {
    ...(typeof entry.id === "string" ? { id: entry.id } : {}),
    name: entry.name,
    challengeScore: Math.round(entry.challengeScore),
    orders: Math.round(Number(entry.orders) || 0),
    updatedAt: Number(entry.updatedAt) || 0,
    rank: Math.max(1, Math.round(Number(entry.rank) || fallbackRank || 1))
  };
}

function normalizeEntries(value: unknown): RecordBoardEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    const normalized = normalizeEntry(entry, index + 1);
    return normalized ? [normalized] : [];
  });
}

export function sanitizePlayerName(raw: string): string | null {
  const result = validatePlayerName(raw);
  return result.valid ? result.name : null;
}
