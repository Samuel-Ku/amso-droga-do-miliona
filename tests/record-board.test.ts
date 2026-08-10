// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import { RecordsClient } from "../src/records-client";
import { RecordBoard } from "../src/ui/record-board";

describe("RecordBoard.renderFrom", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("renders one semantic table with column and row headers", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const board = new RecordBoard(host, new RecordsClient("/api/records"));

    board.renderFrom([
      { name: "Karcz", challengeScore: 695_741, orders: 745, updatedAt: 1 }
    ]);

    expect(host.querySelectorAll("table")).toHaveLength(1);
    expect(host.querySelector("caption")?.textContent).toBe("Tablica rekordów — Tryb Wyzwania");
    expect(Array.from(host.querySelectorAll("thead th")).map((cell) => [
      cell.textContent,
      cell.getAttribute("scope")
    ])).toEqual([
      ["#", "col"],
      ["Gracz", "col"],
      ["Wynik", "col"]
    ]);
    expect(host.querySelector("tbody th")?.getAttribute("scope")).toBe("row");
    expect(host.querySelector("tbody th")?.textContent).toBe("Karcz");
  });

  it("keeps real mobile labels and original cell order", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const board = new RecordBoard(host, new RecordsClient("/api/records"));

    board.renderFrom([
      { name: "Karcz", challengeScore: 695_741, orders: 745, updatedAt: 1 }
    ]);

    const cells = Array.from(host.querySelector("tbody tr")!.children);
    expect(cells.map((cell) => cell.className)).toEqual([
      "amso-million-runner-2026-records__rank",
      "amso-million-runner-2026-records__name",
      "amso-million-runner-2026-records__score"
    ]);
    expect(cells[2]?.querySelector("[data-record-score]")?.textContent).toBe("695 741");
    expect(cells[2]?.querySelector("[data-record-orders]")?.textContent).toBe("745 zamówień");
  });

  it("highlights the current player and renders hostile names only as text", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const board = new RecordBoard(host, new RecordsClient("/api/records"));
    board.setHighlight("<img src=x onerror=alert(1)>");

    board.renderFrom([
      {
        name: "<img src=x onerror=alert(1)>",
        challengeScore: 100,
        orders: 2,
        updatedAt: 1
      }
    ]);

    expect(host.querySelector(".amso-million-runner-2026-records__row--me")).not.toBeNull();
    expect(host.querySelector("[data-record-current-label]")?.textContent).toBe("Ty");
    expect(host.querySelector("img")).toBeNull();
    expect(host.querySelector(".amso-million-runner-2026-records__name > span")?.textContent)
      .toBe("<img src=x onerror=alert(1)>");
    expect(host.querySelector(".amso-million-runner-2026-records__name")?.getAttribute("title"))
      .toBe("<img src=x onerror=alert(1)>");
  });

  it("renders the desktop result as top nine plus the exact current row", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const board = new RecordBoard(host, new RecordsClient("/api/records"), { context: "result" });
    const entries = Array.from({ length: 10 }, (_, index) => ({
      name: `Gracz ${index + 1}`,
      challengeScore: 1_000 - index,
      orders: 100 - index,
      updatedAt: index,
      rank: index + 1
    }));

    board.renderFrom(entries, {
      name: "Kurier",
      challengeScore: 500,
      orders: 40,
      updatedAt: 99,
      rank: 184
    });

    expect(host.querySelectorAll(".amso-million-runner-2026-records__row")).toHaveLength(10);
    expect(host.querySelector(".amso-million-runner-2026-records__row--separator")?.textContent).toContain("…");
    expect(host.querySelector(".amso-million-runner-2026-records__row--me .amso-million-runner-2026-records__rank")?.textContent)
      .toContain("184");
  });

  it("renders compact results as top three plus the exact current row", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const board = new RecordBoard(host, new RecordsClient("/api/records"), { context: "result" });
    board.setCompact(true);
    const entries = Array.from({ length: 10 }, (_, index) => ({
      name: `Gracz ${index + 1}`,
      challengeScore: 1_000 - index,
      orders: 100 - index,
      updatedAt: index,
      rank: index + 1
    }));

    board.renderFrom(entries, { name: "Kurier", challengeScore: 500, orders: 40, updatedAt: 99, rank: 184 });

    expect(host.querySelectorAll(".amso-million-runner-2026-records__row")).toHaveLength(4);
    expect(host.querySelector(".amso-million-runner-2026-records")?.getAttribute("data-records-context")).toBe("result");
  });
});
