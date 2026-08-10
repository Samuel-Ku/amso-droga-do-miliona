// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const campaignStyles = readFileSync("src/styles/campaign.css", "utf8");

describe("story body outline", () => {
  it("keeps the magenta contour without depending on focus-visible", () => {
    const style = document.createElement("style");
    style.textContent = campaignStyles;
    document.head.append(style);

    const campaign = document.createElement("main");
    campaign.className = "amso-million-runner-2026";
    const body = document.createElement("div");
    body.className = "amso-million-runner-2026__story-scene-body";
    body.append(document.createElement("p"));
    campaign.append(body);
    document.body.append(campaign);

    const computed = getComputedStyle(body);
    expect(computed.borderTopWidth).toBe("2px");
    expect(computed.borderTopStyle).toBe("solid");
    expect(computed.borderTopColor).toMatch(/235[^\d]+50[^\d]+164/u);

    body.tabIndex = 0;
    body.focus();
    const focused = getComputedStyle(body);
    expect(focused.outlineStyle).toBe("none");
    expect(focused.borderTopWidth).toBe("2px");
  });
});
