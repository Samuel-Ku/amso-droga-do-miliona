import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const watchdogSource = readFileSync(
  new URL("../public/assets/milion-runner/boot-watchdog.js", import.meta.url),
  "utf8"
);

class FakeHTMLElement {
  public readonly dataset: Record<string, string> = {};
  public textContent = "";

  public constructor(
    private readonly children: Record<string, FakeHTMLElement> = {}
  ) {}

  public lang = "pl";

  public querySelector(selector: string): FakeHTMLElement | null {
    return this.children[selector] ?? null;
  }
}

describe("campaign boot watchdog", () => {
  it("persists an early script failure until the boot screen exists", () => {
    const windowListeners = new Map<string, () => void>();
    const documentListeners = new Map<string, () => void>();
    const documentElement = new FakeHTMLElement();
    const eyebrow = new FakeHTMLElement();
    const status = new FakeHTMLElement();
    const boot = new FakeHTMLElement({
      ".amso-campaign-boot__eyebrow": eyebrow,
      ".amso-campaign-boot__status": status
    });
    let activeBoot: FakeHTMLElement | null = null;

    const fakeWindow = {
      addEventListener(type: string, listener: () => void): void {
        windowListeners.set(type, listener);
      }
    };
    const fakeDocument = {
      documentElement,
      querySelector(): FakeHTMLElement | null {
        return activeBoot;
      },
      addEventListener(type: string, listener: () => void): void {
        documentListeners.set(type, listener);
      }
    };

    const execute = new Function("window", "document", "HTMLElement", watchdogSource);
    execute(fakeWindow, fakeDocument, FakeHTMLElement);

    windowListeners.get("error")?.();
    activeBoot = boot;
    documentListeners.get("DOMContentLoaded")?.();

    expect(documentElement.dataset.campaignScripting).toBe("enabled");
    expect(boot.dataset.campaignBootState).toBe("error");
    expect(eyebrow.textContent).toBe("Trasa chwilowo niedostępna");
    expect(status.textContent).toBe("Nie udało się uruchomić gry.");
  });

  it("uses the document locale and English fallback before the app mounts", () => {
    const listeners = new Map<string, () => void>();
    const documentElement = new FakeHTMLElement();
    documentElement.lang = "uk-UA";
    const eyebrow = new FakeHTMLElement();
    const status = new FakeHTMLElement();
    const boot = new FakeHTMLElement({
      ".amso-campaign-boot__eyebrow": eyebrow,
      ".amso-campaign-boot__status": status
    });
    const execute = new Function("window", "document", "HTMLElement", watchdogSource);
    execute({ addEventListener(type: string, listener: () => void) { listeners.set(type, listener); } }, {
      documentElement,
      querySelector: () => boot,
      addEventListener() {}
    }, FakeHTMLElement);
    listeners.get("error")?.();
    expect(eyebrow.textContent).toBe("Маршрут тимчасово недоступний");
    expect(status.textContent).toBe("Не вдалося запустити гру.");
  });
});
