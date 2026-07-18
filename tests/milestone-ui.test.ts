// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CampaignShell, type CampaignShellCallbacks } from "../src/ui/CampaignShell";
import {
  layoutRectsOverlap,
  milestoneLayoutForViewport
} from "../src/ui/milestone-layout";

function createShell(): CampaignShell {
  const callbacks: CampaignShellCallbacks = {
    onStart: vi.fn(), onPause: vi.fn(), onResume: vi.fn(), onRestart: vi.fn(),
    onReturnToMenu: vi.fn(), onRetryLoad: vi.fn(), onJump: vi.fn(), onSlide: vi.fn(),
    onMuteChange: vi.fn(), onFullscreenPreferenceChange: vi.fn(), onStoryContinue: vi.fn()
  };
  const host = document.createElement("div");
  document.body.append(host);
  return new CampaignShell(host, callbacks);
}

describe("responsive milestone message", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
    Object.defineProperties(window, {
      innerWidth: { configurable: true, value: 1_024 },
      innerHeight: { configurable: true, value: 768 }
    });
  });

  it.each([
    [390, 844],
    [1_600, 900]
  ])("keeps the reward clear of HUD and gameplay at %d×%d", (width, height) => {
    const { message, hud, courierZone, obstacleSpawnZone } =
      milestoneLayoutForViewport(width, height);
    expect(layoutRectsOverlap(message, hud)).toBe(false);
    expect(layoutRectsOverlap(message, courierZone)).toBe(false);
    expect(layoutRectsOverlap(message, obstacleSpawnZone)).toBe(false);
    expect(message.x).toBeGreaterThanOrEqual(0);
    expect(message.x + message.width).toBeLessThanOrEqual(width);
  });

  it("applies the 390×844 placement to the rendered shell", () => {
    Object.defineProperties(window, {
      innerWidth: { configurable: true, value: 390 },
      innerHeight: { configurable: true, value: 844 }
    });
    const shell = createShell();
    const root = document.querySelector<HTMLElement>(".amso-campaign")!;
    expect(root.style.getPropertyValue("--campaign-milestone-top")).toBe("132px");
    expect(root.style.getPropertyValue("--campaign-milestone-max-width")).toBe("340px");
    shell.destroy();
  });

  it("shows only the reached threshold in a DOM layer below the HUD", () => {
    const shell = createShell();
    shell.showMilestoneCelebration({
      threshold: 1_000,
      kind: "order-confetti",
      intensity: 1,
      durationSeconds: 1.45,
      remainingSeconds: 1,
      progress: 0.3,
      text: "1 000 PACZEK!"
    });
    const message = document.querySelector<HTMLElement>("[data-campaign-milestone-message]")!;

    expect(message.hidden).toBe(false);
    expect(message.textContent).toBe("1 000 PACZEK!");
    expect(message.textContent).not.toContain("Następny próg");
    expect(message.dataset.kind).toBe("order-confetti");
    shell.destroy();
  });

  it("keeps the message but disables its animation in reduced motion", () => {
    const shell = createShell();
    const celebration = {
      threshold: 50,
      kind: "order-confetti" as const,
      intensity: 1,
      durationSeconds: 1.3,
      remainingSeconds: 1,
      progress: 0.2,
      text: "50 PACZEK!"
    };
    shell.showMilestoneCelebration(celebration, true);
    const message = document.querySelector<HTMLElement>("[data-campaign-milestone-message]")!;
    expect(message.hasAttribute("data-reduced-motion")).toBe(true);

    shell.showMilestoneCelebration(null);
    expect(message.hidden).toBe(true);
    shell.destroy();
  });
});
