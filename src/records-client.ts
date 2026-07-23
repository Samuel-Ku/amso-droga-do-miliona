import type { RecordBoardEntry } from "./shared/types";
import { PlayerProfileStore } from "./profile";
import { validatePlayerName } from "./moderation/player-name-policy";

const DEFAULT_ENDPOINT = "/api/records";

export interface BoardResponse {
  entries: RecordBoardEntry[];
  updated?: boolean;
  best?: number;
}

export class RecordsClient {
  private readonly endpoint: string;
  private readonly writesEnabled: boolean;

  public constructor(endpoint: string = DEFAULT_ENDPOINT, options: { writesEnabled?: boolean } = {}) {
    this.endpoint = endpoint;
    this.writesEnabled = options.writesEnabled !== false;
  }

  public async fetchBoard(signal?: AbortSignal): Promise<RecordBoardEntry[]> {
    const res = await fetch(this.endpoint, {
      method: "GET",
      headers: { accept: "application/json" },
      signal
    });
    if (!res.ok) throw new Error(`records GET ${res.status}`);
    const data = (await res.json()) as Partial<BoardResponse>;
    if (!Array.isArray(data.entries)) return [];
    return data.entries
      .filter(
        (e): e is RecordBoardEntry =>
          !!e &&
          typeof e.name === "string" &&
          typeof e.challengeScore === "number"
      )
      .map((e) => ({
        name: e.name,
        challengeScore: Math.round(e.challengeScore),
        orders: Math.round(Number(e.orders) || 0),
        updatedAt: Number(e.updatedAt) || 0
      }));
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
  ): Promise<{ board: RecordBoardEntry[]; submitted: boolean }> {
    const storedName = profile.playerName;
    const score = Math.round(challengeScore);
    if (!storedName) return { board: [], submitted: false };
    const validatedName = validatePlayerName(storedName);
    if (!validatedName.valid) {
      return { board: await this.fetchBoard(signal), submitted: false };
    }
    const name = validatedName.name;
    if (!this.writesEnabled) return { board: await this.fetchBoard(signal), submitted: false };
    if (score <= profile.submittedBestScore) {
      return { board: await this.fetchBoard(signal), submitted: false };
    }

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, challengeScore: score, orders: Math.round(orders) }),
      signal
    });
    if (!res.ok) throw new Error(`records POST ${res.status}`);
    const data = (await res.json()) as Partial<BoardResponse>;
    const board = Array.isArray(data.entries) ? data.entries : [];
    if (data.updated === true) profile.markSubmitted(score);
    return { board, submitted: data.updated === true };
  }
}

export function sanitizePlayerName(raw: string): string | null {
  const result = validatePlayerName(raw);
  return result.valid ? result.name : null;
}
