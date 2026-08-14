// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import { NamePrompt } from "../src/ui/name-prompt";

describe("NamePrompt", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("gives immediate neutral feedback and a separate grapheme-length message", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const prompt = new NamePrompt(host);
    void prompt.ask();
    const input = host.querySelector<HTMLInputElement>("[data-campaign-name-input]")!;
    const error = host.querySelector<HTMLElement>("[data-campaign-name-error]")!;

    input.value = "a".repeat(15);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe("Nazwa może mieć maksymalnie 14 znaków.");

    input.value = "a.d.m.i.n";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(error.textContent).toBe("Ta nazwa jest niedozwolona.");

    input.value = "Anka";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(error.hidden).toBe(true);
  });

  it("reopens a reserved name with the value preserved for editing", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const prompt = new NamePrompt(host);

    void prompt.ask("Kurier", "Ta nazwa jest już zajęta. Wybierz inną.");

    expect(host.querySelector<HTMLInputElement>("[data-campaign-name-input]")?.value).toBe("Kurier");
    expect(host.querySelector<HTMLElement>("[data-campaign-name-error]")?.textContent)
      .toBe("Ta nazwa jest już zajęta. Wybierz inną.");
    expect(host.querySelector<HTMLElement>("[data-campaign-name-error]")?.hidden).toBe(false);
  });
});
