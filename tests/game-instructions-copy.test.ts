// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  GAME_INSTRUCTION_COPY,
  GAME_INTRODUCTION_COPY,
  GAME_INTRODUCTION_COPY_REF
} from "../src/config/game-instructions-copy";
import { CampaignShell, type CampaignShellCallbacks } from "../src/ui/CampaignShell";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import { parseRunnerConfig } from "../src/config/schema";
import { RecordBoard } from "../src/ui/record-board";
import { RecordsClient } from "../src/records-client";

function createShell(overrides: Partial<CampaignShellCallbacks> = {}): CampaignShell {
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
    onStoryContinue: vi.fn(),
    ...overrides
  };
  const host = document.createElement("div");
  document.body.append(host);
  return new CampaignShell(host, callbacks);
}

describe("canonical game instructions", () => {
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

  it("uses one approved Polish source across the landing, HUD and canvas", () => {
    const shell = createShell();
    const howToParagraphs = Array.from(
      document.querySelectorAll(".amso-campaign__how-to p"),
      (paragraph) => paragraph.textContent
    );

    expect(GAME_INTRODUCTION_COPY_REF).toBe("game-introduction");
    expect(document.querySelector("[data-campaign-landing-goal]")?.textContent)
      .toBe(GAME_INSTRUCTION_COPY.landingGoal);
    expect(howToParagraphs).toEqual([
      GAME_INSTRUCTION_COPY.storySafety,
      GAME_INSTRUCTION_COPY.jump,
      GAME_INSTRUCTION_COPY.slide,
      GAME_INSTRUCTION_COPY.ordersAndCombo
    ]);
    expect(document.querySelector("[data-campaign-hud-orders-label]")?.textContent)
      .toBe("Zamówienia");
    expect(document.querySelector("[data-campaign-canvas]")?.getAttribute("aria-label"))
      .toBe(`Pole gry. ${GAME_INSTRUCTION_COPY.jump} ${GAME_INSTRUCTION_COPY.slide}`);
    expect(GAME_INSTRUCTION_COPY.compactControls)
      .toBe("Skok: Spacja/W/↑/tap · Ślizg: S/↓/swipe ↓");

    const boardHost = document.createElement("div");
    const board = new RecordBoard(boardHost, new RecordsClient("/api/records"));
    board.renderFrom([{
      name: "Kurier",
      challengeScore: 100,
      orders: 2,
      updatedAt: Date.UTC(2026, 6, 23, 8)
    }]);
    expect(boardHost.querySelector("th:last-child")?.textContent)
      .toBe(GAME_INSTRUCTION_COPY.hudOrdersLabel);

    shell.destroy();
  });

  it("resolves the semantic introduction without raw instruction overrides", () => {
    const raw = structuredClone(productionConfig) as Record<string, unknown>;
    const rawStory = raw.story as Record<string, unknown>;
    const rawScenes = rawStory.scenes as Array<Record<string, unknown>>;
    const rawIntro = (rawScenes[0]?.steps as Array<Record<string, unknown>>)
      .find(({ id }) => id === "game-purpose");

    expect(rawIntro).toMatchObject({
      id: "game-purpose",
      copyRef: GAME_INTRODUCTION_COPY_REF,
      safe: true
    });
    expect(rawIntro).not.toHaveProperty("title");
    expect(rawIntro).not.toHaveProperty("body");
    expect(rawIntro).not.toHaveProperty("continueLabel");

    const parsed = parseRunnerConfig(raw);
    const parsedIntro = parsed?.story.scenes[0]?.steps
      ?.find(({ id }) => id === "game-purpose");
    expect(parsedIntro).toMatchObject({
      copyRef: GAME_INTRODUCTION_COPY_REF,
      ...GAME_INTRODUCTION_COPY
    });

    const rawCopy = structuredClone(productionConfig) as Record<string, unknown>;
    const rawCopyScenes = (rawCopy.story as Record<string, unknown>)
      .scenes as Array<Record<string, unknown>>;
    const rawCopyIntro = (rawCopyScenes[0]?.steps as Array<Record<string, unknown>>)
      .find(({ id }) => id === "game-purpose");
    if (rawCopyIntro === undefined) throw new Error("Introduction should exist");
    delete rawCopyIntro.copyRef;
    rawCopyIntro.title = "Stary tytuł";
    rawCopyIntro.body = ["Stary opis"];
    rawCopyIntro.continueLabel = "Dalej";
    expect(parseRunnerConfig(rawCopy)).toBeNull();

    for (const retiredKey of [
      "landingLead",
      "controlsHud",
      "hudPackages",
      "tutorialJump",
      "tutorialSlide"
    ]) {
      const stale = structuredClone(productionConfig) as Record<string, unknown>;
      (stale.ui as Record<string, unknown>)[retiredKey] = "Stary wariant";
      expect(parseRunnerConfig(stale)).toBeNull();
    }
  });

  it("renders the resolved introduction and continues the authored scene", () => {
    const parsed = parseRunnerConfig(productionConfig);
    if (parsed === null) throw new Error("Production config should parse");
    const firstScene = parsed.story.scenes[0];
    const intro = firstScene?.steps?.find(({ id }) => id === "game-purpose");
    if (firstScene === undefined || intro === undefined) {
      throw new Error("Canonical introduction should exist");
    }
    const onStoryContinue = vi.fn();
    const shell = createShell({ onStoryContinue });

    shell.showStoryScene({
      sceneId: firstScene.id,
      presentationId: `${firstScene.id}:${intro.id}`,
      title: intro.title ?? "",
      body: intro.body,
      vignette: firstScene.vignette,
      continueLabel: intro.continueLabel
    });

    expect(document.querySelector("[data-campaign-story-scene-title]")?.textContent)
      .toBe(GAME_INTRODUCTION_COPY.title);
    expect(Array.from(
      document.querySelectorAll("[data-campaign-story-scene-body] p"),
      (paragraph) => paragraph.textContent
    )).toEqual(GAME_INTRODUCTION_COPY.body);
    const button = document.querySelector<HTMLButtonElement>("[data-campaign-story-continue]");
    expect(button?.textContent).toBe("Rozpocznij historię");
    button?.click();
    expect(onStoryContinue).toHaveBeenCalledExactlyOnceWith(firstScene.id);

    shell.destroy();
  });

  it("rejects misleading general instructions without banning parcel-specific history", () => {
    const generalInstructionSources = [
      JSON.stringify(GAME_INSTRUCTION_COPY),
      readFileSync("src/ui/CampaignShell.ts", "utf8"),
      readFileSync("src/ui/story-presentation.ts", "utf8"),
      JSON.stringify(productionConfig)
    ];
    const authoredStory = JSON.stringify(productionConfig.story);

    for (const source of generalInstructionSources) {
      expect(source).not.toMatch(/zebrać wszystkie paczki/iu);
    }
    expect(JSON.stringify(GAME_INSTRUCTION_COPY)).not.toMatch(/<[^>]+>/u);
    expect(JSON.stringify(GAME_INSTRUCTION_COPY)).toContain("paczki i urządzenia");
    expect(authoredStory).toContain("Pierwsza paczka");
  });
});
