import { RecordsClient, sanitizePlayerName } from "../records-client";
import type { RecordBoardEntry } from "../shared/types";
import { createCampaignI18n, type CampaignI18n } from "../localization";

export type RecordBoardContext = "landing" | "result";

export interface RecordBoardOptions {
  context?: RecordBoardContext;
  i18n?: CampaignI18n;
}

/** One semantic leaderboard table with context-specific, bounded row selection. */
export class RecordBoard {
  private readonly client: RecordsClient;
  private readonly host: HTMLElement;
  private readonly context: RecordBoardContext;
  private readonly i18n: CampaignI18n;
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
    this.i18n = options.i18n ?? createCampaignI18n("pl");
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
    this.host.innerHTML = this.wrap(
      `<p class="amso-million-runner-2026-records__status">${escapeHtml(this.i18n.translate("Ładowanie tablicy…"))}</p>`
    );
  }

  private renderError(): void {
    this.host.innerHTML = this.wrap(
      `<p class="amso-million-runner-2026-records__status amso-million-runner-2026-records__status--error">${escapeHtml(this.i18n.translate("Tablica niedostępna."))}</p>`
    );
  }

  private wrap(inner: string): string {
    return `
      <div class="amso-million-runner-2026-records" data-campaign-records data-records-context="${this.context}"${this.compact ? " data-records-compact=\"true\"" : ""}>
        <div class="amso-million-runner-2026-records__heading">
          <h2 class="amso-million-runner-2026-records__title">${escapeHtml(this.i18n.translate("Tablica rekordów"))}</h2>
          <span class="amso-million-runner-2026-records__badge">${escapeHtml(this.i18n.translate("Tryb Wyzwania"))}</span>
        </div>
        <div class="amso-million-runner-2026-records__body">${inner}</div>
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
    const displayName = entry.nameModerated ? this.i18n.translate("Gracz") : entry.name;
    const safeName = escapeHtml(displayName);
    const podium = rank <= 3 ? ` amso-million-runner-2026-records__row--podium amso-million-runner-2026-records__row--rank-${rank}` : "";
    return `
      <tr class="amso-million-runner-2026-records__row${podium}${current ? " amso-million-runner-2026-records__row--me" : ""}">
        <td class="amso-million-runner-2026-records__rank"><span class="amso-million-runner-2026-records__rank-value" aria-label="${escapeHtml(this.i18n.translate("Miejsce"))} ${rank}">${rank}</span></td>
        <th class="amso-million-runner-2026-records__name" scope="row" title="${safeName}"><span>${safeName}</span>${current ? `<small data-record-current-label>${escapeHtml(this.i18n.translate("Ty"))}</small>` : ""}</th>
        <td class="amso-million-runner-2026-records__score">
          <strong data-record-score>${this.i18n.formatInteger(entry.challengeScore)}</strong>
          <small data-record-orders>${this.i18n.formatOrders(entry.orders)}</small>
        </td>
      </tr>`;
  }

  private render(): void {
    if (this.entries.length === 0 && !this.playerEntry) {
      this.host.innerHTML = this.wrap(
        `<p class="amso-million-runner-2026-records__status">${escapeHtml(this.i18n.translate("Bądź pierwszy na liście!"))}</p>`
      );
      return;
    }
    const selection = this.visibleRows();
    const rows = selection.entries.map((entry, index) => this.row(entry, index + 1)).join("");
    const separated = selection.separatedPlayer
      ? `<tr class="amso-million-runner-2026-records__row--separator" aria-hidden="true"><td colspan="3">…</td></tr>${this.row(selection.separatedPlayer, selection.separatedPlayer.rank ?? 1)}`
      : "";
    this.host.innerHTML = this.wrap(`
      <table class="amso-million-runner-2026-records__table">
        <caption class="amso-million-runner-2026-records__caption">${escapeHtml(this.i18n.translate("Tablica rekordów — Tryb Wyzwania"))}</caption>
        <thead>
          <tr><th scope="col">#</th><th scope="col">${escapeHtml(this.i18n.translate("Gracz"))}</th><th scope="col">${escapeHtml(this.i18n.translate("Wynik"))}</th></tr>
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
