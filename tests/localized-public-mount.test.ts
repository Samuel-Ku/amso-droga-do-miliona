// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import { parseRunnerConfig } from "../src/config/schema";
import { mountCampaign } from "../src/index";

describe("localized public campaign mount", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = "uk-UA";
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ entries: [] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    })));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("uses the server-rendered document language for the real landing", () => {
    const config = parseRunnerConfig(productionConfig);
    if (!config) throw new Error("production_config_invalid");
    const host = document.createElement("div");
    document.body.append(host);

    const campaign = mountCampaign(config, host);

    expect(host.querySelector("[data-campaign-copy='landingTitleAccent']")?.textContent)
      .toBe("Шлях до мільйона");
    expect(host.textContent).not.toContain("Pomóż kurierowi");
    expect(host.querySelector("[data-campaign-mute-label]")?.textContent)
      .toContain("звук");

    campaign.destroy();
  });

  it.each([
    ["pl-PL", "Droga do Miliona"],
    ["de-DE", "Der Weg zur Million"],
    ["en-GB", "Road to a Million"],
    ["es-ES", "Camino al millón"],
    ["cs-CZ", "Cesta k milionu"],
    ["it-IT", "La strada verso il milione"],
    ["fr-FR", "En route vers le million"],
    ["uk-UA", "Шлях до мільйона"]
  ] as const)("mounts %s through the same public boundary", (lang, title) => {
    document.documentElement.lang = lang;
    const config = parseRunnerConfig(productionConfig);
    if (!config) throw new Error("production_config_invalid");
    const host = document.createElement("div");
    document.body.append(host);
    const campaign = mountCampaign(config, host);
    expect(host.querySelector("[data-campaign-copy='landingTitleAccent']")?.textContent).toBe(title);
    campaign.destroy();
  });
});
