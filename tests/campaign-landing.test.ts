// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { GAME_INSTRUCTION_COPY } from "../src/config/game-instructions-copy";
import {
  CampaignShell,
  type CampaignShellCallbacks
} from "../src/ui/CampaignShell";

function createShell(): CampaignShell {
  const callbacks: CampaignShellCallbacks = {
    onStart: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onRestart: vi.fn(),
    onReturnToMenu: vi.fn(),
    onRetryLoad: vi.fn(),
    onJump: vi.fn(),
    onSlide: vi.fn(),
    onMuteChange: vi.fn(),
    onFullscreenPreferenceChange: vi.fn(),
    onStoryContinue: vi.fn()
  };
  const host = document.createElement("div");
  document.body.append(host);
  return new CampaignShell(host, callbacks);
}

describe("campaign landing composition", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    });
  });

  it("keeps desktop and mobile intro copy in one configured source", () => {
    const shell = createShell();
    shell.showLanding({
      challengeUnlocked: false,
      fullscreenPreference: null,
      muted: false
    });

    expect(document.querySelector("[data-campaign-landing-goal='desktop']")?.textContent)
      .toBe(GAME_INSTRUCTION_COPY.landingGoal);
    expect(document.querySelector("[data-campaign-landing-goal='mobile']")?.textContent)
      .toBe(GAME_INSTRUCTION_COPY.mobileLandingGoal);
    expect(GAME_INSTRUCTION_COPY.mobileLandingGoal).toBe(
      "Pomóż kurierowi realizować zamówienia, zbierając paczki i urządzenia podczas biegu przez historię AMSO aż do zamówienia nr 1 000 000."
    );

    shell.destroy();
  });

  it("places the primary path before records and the collapsed instructions after them", () => {
    const shell = createShell();
    shell.showLanding({
      challengeUnlocked: false,
      fullscreenPreference: null,
      muted: false
    });

    const copy = document.querySelector<HTMLElement>(".amso-campaign__landing-copy")!;
    const cta = copy.querySelector<HTMLElement>(".amso-campaign__landing-cta-group")!;
    const records = copy.querySelector<HTMLElement>("[data-campaign-landing-records]")!;
    const instructions = copy.querySelector<HTMLDetailsElement>(".amso-campaign__how-to")!;
    const children = Array.from(copy.children);

    expect(children.indexOf(cta)).toBeLessThan(children.indexOf(records));
    expect(children.indexOf(records)).toBeLessThan(children.indexOf(instructions));
    expect(instructions.open).toBe(false);
    expect(instructions.querySelector("summary")?.textContent).toBe("Jak działa gra?");

    const art = document.querySelector<HTMLElement>(".amso-campaign__landing-art")!;
    expect(art.getAttribute("aria-hidden")).toBe("true");
    expect(art.querySelector("img")?.getAttribute("alt")).toBe("");

    shell.destroy();
  });

  it("makes Story the only first path and Challenge the primary returning path", () => {
    const shell = createShell();
    shell.showLanding({ challengeUnlocked: false, fullscreenPreference: null, muted: false });
    expect(Array.from(document.querySelectorAll<HTMLButtonElement>(
      "[data-campaign-landing-actions] button"
    )).map((button) => button.textContent)).toEqual(["Zagraj z historią AMSO"]);

    shell.showLanding({ challengeUnlocked: true, fullscreenPreference: null, muted: false });
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(
      "[data-campaign-landing-actions] button"
    ));
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Szybki start",
      "Powtórz historię AMSO"
    ]);
    expect(buttons[0]?.classList.contains("amso-campaign__button--primary")).toBe(true);
    expect(buttons[1]?.classList.contains("amso-campaign__button--secondary")).toBe(true);
    shell.destroy();
  });

  it("uses the localized horizontal campaign lockup beside two header actions", () => {
    const shell = createShell();
    const header = document.querySelector<HTMLElement>(".amso-campaign__header")!;
    const brand = header.querySelector<HTMLElement>(".amso-campaign__brand")!;
    const brandLogo = brand.querySelector<HTMLImageElement>(".amso-campaign__brand-logo")!;
    const tools = header.querySelector<HTMLElement>(".amso-campaign__tools")!;
    const buttons = tools.querySelectorAll("button");

    expect(brandLogo.getAttribute("src"))
      .toBe("/assets/milion-runner/brand/mz-compact-lockup-v1.avif");
    expect(brandLogo.getAttribute("alt")).toBe("AMSO — Droga do Miliona");
    expect(brand.querySelector(".amso-campaign__brand-edition")).toBeNull();
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.textContent).toContain("Wycisz");
    expect(buttons[1]?.textContent).toMatch(/Pełny ekran|Tryb gry/);

    shell.destroy();
  });

  it("switches root geometry from the actual campaign container width", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1_200
    });
    class NarrowContainerObserver {
      public constructor(
        private readonly callback: ResizeObserverCallback
      ) {}

      public observe(target: Element): void {
        this.callback([{
          target,
          contentRect: { width: 500 }
        } as ResizeObserverEntry], this as unknown as ResizeObserver);
      }

      public disconnect(): void {}
      public unobserve(): void {}
    }
    vi.stubGlobal("ResizeObserver", NarrowContainerObserver);

    const shell = createShell();
    const root = document.querySelector<HTMLElement>(".amso-campaign")!;
    expect(root.dataset.mobileLayout).toBe("true");

    shell.destroy();
    vi.unstubAllGlobals();
  });
});
