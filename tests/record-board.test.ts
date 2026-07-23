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
    expect(host.querySelector("caption")?.textContent).toBe("Tablica rekordów");
    expect(Array.from(host.querySelectorAll("thead th")).map((cell) => [
      cell.textContent,
      cell.getAttribute("scope")
    ])).toEqual([
      ["#", "col"],
      ["Gracz", "col"],
      ["Wynik", "col"],
      ["Zamówienia", "col"]
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
      "amso-records__rank",
      "amso-records__name",
      "amso-records__score",
      "amso-records__orders"
    ]);
    expect(cells[2]?.querySelector("[data-record-mobile-label]")?.textContent).toBe("Wynik:");
    expect(cells[3]?.querySelector("[data-record-mobile-label]")?.textContent).toBe("Zamówienia:");
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

    expect(host.querySelector(".amso-records__row--me")).not.toBeNull();
    expect(host.querySelector("img")).toBeNull();
    expect(host.querySelector(".amso-records__name")?.textContent)
      .toBe("<img src=x onerror=alert(1)>");
    expect(host.querySelector(".amso-records__name")?.getAttribute("title"))
      .toBe("<img src=x onerror=alert(1)>");
  });
});
