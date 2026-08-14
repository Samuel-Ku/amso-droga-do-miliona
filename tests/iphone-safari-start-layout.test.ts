import { readFileSync } from "node:fs";
import { devices, webkit } from "playwright";
import { describe, expect, it } from "vitest";

const campaignCss = readFileSync(new URL("../src/styles/campaign.css", import.meta.url), "utf8");

describe("iPhone Safari start layout", () => {
  it("keeps a drawable stage while the mobile game mode is loading", async () => {
    const browser = await webkit.launch({ headless: true });
    try {
      const context = await browser.newContext({
        ...devices["iPhone 13"],
        viewport: { width: 844, height: 390 },
        screen: { width: 844, height: 390 }
      });
      const page = await context.newPage();
      await page.setContent(`
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <div class="amso-million-runner-2026"
          data-view="loading" data-mobile-layout="true" data-css-game-mode="true">
          <div class="amso-million-runner-2026__backdrop"></div>
          <header class="amso-million-runner-2026__header"></header>
          <div class="amso-million-runner-2026__main">
            <section class="amso-million-runner-2026__stage" data-campaign-stage>
              <canvas class="amso-million-runner-2026__canvas"></canvas>
              <section class="amso-million-runner-2026__screen">Loading</section>
            </section>
          </div>
          <footer class="amso-million-runner-2026__footer"></footer>
        </div>
      `);
      await page.addStyleTag({ content: campaignCss });

      const stage = await page.locator("[data-campaign-stage]").boundingBox();
      expect(stage?.width).toBeGreaterThan(0);
      expect(stage?.height).toBeGreaterThan(0);
    } finally {
      await browser.close();
    }
  }, 30_000);
});
