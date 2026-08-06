import { RecordsClient, sanitizePlayerName } from "../records-client";
import type { RecordBoardEntry } from "../shared/types";

function formatInt(number: number): string {
  return Math.round(number).toLocaleString("pl-PL");
}

export type RecordBoardContext = "landing" | "result";

export interface RecordBoardOptions {
  context?: RecordBoardContext;
}

/** One semantic leaderboard table with context-specific, bounded row selection. */
export class RecordBoard {
  private readonly client: RecordsClient;
  private readonly host: HTMLElement;
  private readonly context: RecordBoardContext;
  private entries: RecordBoardEntry[] = [];
  private playerEntry: RecordBoardEntry | null = null;
  private highlightedName: string | null = null;
  private playerId: string | null = null;
  private compact = false;
  private controller: AbortController | null = null;

  public constructor(host: HTMLElement, client: RecordsClient, options: RecordBoardOptions = {}) {
    this.host = host;
    this.client = client;
    this.context = options.context ?? "landing";
  }

  public setHighlight(name: string | null): void {
    this.highlightedName = name;
  }

  public setPlayerId(playerId: string | null): void {
    this.playerId = playerId;
  }

  public setCompact(compact: boolean): void {
    if (this.compact === compact) return;
    this.compact = compact;
    if (this.entries.length > 0) this.render();
  }

  public renderFrom(entries: RecordBoardEntry[], playerEntry: RecordBoardEntry | null = null): void {
    this.entries = entries.slice();
    this.playerEntry = playerEntry;
    this.render();
  }

  public async refresh(): Promise<void> {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.renderLoading();
    try {
      const snapshot = await this.client.fetchRanking(
        this.context === "result" ? this.playerId ?? undefined : undefined,
        this.context === "landing" ? 5 : 10,
        controller.signal
      );
      if (controller.signal.aborted) return;
      this.entries = snapshot.entries;
      this.playerEntry = snapshot.playerEntry;
      this.render();
    } catch {
      if (controller.signal.aborted) return;
      this.renderError();
    }
  }

  private renderLoading(): void {
    this.host.innerHTML = this.wrap(`<p class="amso-records__status">Ładowanie tablicy…</p>`);
  }

  private renderError(): void {
    this.host.innerHTML = this.wrap(
      `<p class="amso-records__status amso-records__status--error">Tablica niedostępna.</p>`
    );
  }

  private wrap(inner: string): string {
    return `
      <div class="amso-records" data-campaign-records data-records-context="${this.context}"${this.compact ? " data-records-compact=\"true\"" : ""}>
        <div class="amso-records__heading">
          <h2 class="amso-records__title">Tablica rekordów</h2>
          <span class="amso-records__badge">Tryb Wyzwania</span>
        </div>
        <div class="amso-records__body">${inner}</div>
      </div>`;
  }

  private visibleRows(): { entries: RecordBoardEntry[]; separatedPlayer: RecordBoardEntry | null } {
    if (this.context === "landing") {
      return { entries: this.entries.slice(0, 5), separatedPlayer: null };
    }
    const limit = this.compact ? 3 : 10;
    const visible = this.entries.slice(0, limit);
    const playerEntry = this.playerEntry;
    if (!playerEntry) return { entries: visible, separatedPlayer: null };
    const playerIsVisible = visible.some((entry) => this.samePlayer(entry, playerEntry));
    if (playerIsVisible) return { entries: visible, separatedPlayer: null };
    return {
      entries: this.compact ? visible : this.entries.slice(0, 9),
      separatedPlayer: playerEntry
    };
  }

  private samePlayer(entry: RecordBoardEntry, player: RecordBoardEntry): boolean {
    if (entry.id && player.id) return entry.id === player.id;
    return entry.rank === player.rank && entry.name === player.name;
  }

  private isCurrent(entry: RecordBoardEntry): boolean {
    if (this.playerEntry && this.samePlayer(entry, this.playerEntry)) return true;
    return Boolean(this.highlightedName && entry.name === this.highlightedName);
  }

  private row(entry: RecordBoardEntry, fallbackRank: number): string {
    const rank = Math.max(1, Math.round(Number(entry.rank) || fallbackRank));
    const current = this.isCurrent(entry);
    const safeName = escapeHtml(entry.name);
    const podium = rank <= 3 ? ` amso-records__row--podium amso-records__row--rank-${rank}` : "";
    return `
      <tr class="amso-records__row${podium}${current ? " amso-records__row--me" : ""}">
        <td class="amso-records__rank"><span class="amso-records__rank-value" aria-label="Miejsce ${rank}">${rank}</span></td>
        <th class="amso-records__name" scope="row" title="${safeName}"><span>${safeName}</span>${current ? `<small data-record-current-label>Ty</small>` : ""}</th>
        <td class="amso-records__score">
          <strong data-record-score>${formatInt(entry.challengeScore)}</strong>
          <small data-record-orders>${formatInt(entry.orders)} zamówień</small>
        </td>
      </tr>`;
  }

  private render(): void {
    if (this.entries.length === 0 && !this.playerEntry) {
      this.host.innerHTML = this.wrap(`<p class="amso-records__status">Bądź pierwszy na liście!</p>`);
      return;
    }
    const selection = this.visibleRows();
    const rows = selection.entries.map((entry, index) => this.row(entry, index + 1)).join("");
    const separated = selection.separatedPlayer
      ? `<tr class="amso-records__row--separator" aria-hidden="true"><td colspan="3">…</td></tr>${this.row(selection.separatedPlayer, selection.separatedPlayer.rank ?? 1)}`
      : "";
    this.host.innerHTML = this.wrap(`
      <table class="amso-records__table">
        <caption class="amso-records__caption">Tablica rekordów — Tryb Wyzwania</caption>
        <thead>
          <tr><th scope="col">#</th><th scope="col">Gracz</th><th scope="col">Wynik</th></tr>
        </thead>
        <tbody>${rows}${separated}</tbody>
      </table>`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export { sanitizePlayerName };
