import { RecordsClient, sanitizePlayerName } from "../records-client";
import type { RecordBoardEntry } from "../shared/types";
import { GAME_INSTRUCTION_COPY } from "../config/game-instructions-copy";

function formatInt(n: number): string {
  return Math.round(n).toLocaleString("pl-PL");
}

/**
 * Renders the records dashboard table into a host element and keeps it fresh.
 * Reads from a RecordsClient; never prompts for a name itself.
 */
export class RecordBoard {
  private readonly client: RecordsClient;
  private readonly host: HTMLElement;
  private entries: RecordBoardEntry[] = [];
  private highlightedName: string | null = null;
  private controller: AbortController | null = null;

  public constructor(host: HTMLElement, client: RecordsClient) {
    this.host = host;
    this.client = client;
  }

  public setHighlight(name: string | null): void {
    this.highlightedName = name;
  }

  public renderFrom(entries: RecordBoardEntry[]): void {
    this.entries = entries.slice();
    this.render();
  }

  public async refresh(): Promise<void> {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.renderLoading();
    try {
      this.entries = await this.client.fetchBoard(controller.signal);
      if (controller.signal.aborted) return;
      this.render();
    } catch (err) {
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
      <div class="amso-records" data-campaign-records>
        <h2 class="amso-records__title">Tablica rekordów</h2>
        <div class="amso-records__body">${inner}</div>
      </div>`;
  }

  private render(): void {
    if (this.entries.length === 0) {
      this.host.innerHTML = this.wrap(
        `<p class="amso-records__status">Bądź pierwszy na liście!</p>`
      );
      return;
    }
    const rows = this.entries
      .map((e, i) => {
        const me = this.highlightedName && e.name === this.highlightedName;
        const safeName = escapeHtml(e.name);
        return `
          <tr class="amso-records__row${me ? " amso-records__row--me" : ""}">
            <td class="amso-records__rank"><span class="amso-records__mobile-rank-mark" aria-hidden="true">#</span>${i + 1}</td>
            <th class="amso-records__name" scope="row" title="${safeName}">${safeName}</th>
            <td class="amso-records__score"><span class="amso-records__mobile-label" data-record-mobile-label>Wynik:</span><span>${formatInt(e.challengeScore)}</span></td>
            <td class="amso-records__orders"><span class="amso-records__mobile-separator" aria-hidden="true">·</span><span class="amso-records__mobile-label" data-record-mobile-label>Zamówienia:</span><span>${formatInt(e.orders)}</span></td>
          </tr>`;
      })
      .join("");
    this.host.innerHTML = this.wrap(`
      <table class="amso-records__table">
        <caption class="amso-records__caption">Tablica rekordów</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Gracz</th>
            <th scope="col">Wynik</th>
            <th scope="col">${GAME_INSTRUCTION_COPY.hudOrdersLabel}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
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
