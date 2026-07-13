import { describe, expect, it, vi } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import { parseRunnerConfig } from "../src/config/schema";
import { createCampaignRedirectApi } from "../src/index";

describe("migration redirect adapter", () => {
  it("opens the canonical campaign URL without creating modal state", () => {
    const config = parseRunnerConfig(productionConfig);
    if (config === null) throw new Error("production config should parse");
    const navigate = vi.fn();
    const api = createCampaignRedirectApi(config, navigate);

    api.open({ sourceLocation: "landing_hero" });
    api.close("user");

    expect(navigate).toHaveBeenCalledExactlyOnceWith("/milion");
  });

  it("stops redirecting after destroy", () => {
    const config = parseRunnerConfig(productionConfig);
    if (config === null) throw new Error("production config should parse");
    const navigate = vi.fn();
    const api = createCampaignRedirectApi(config, navigate);

    api.destroy();
    api.open({ sourceLocation: "homepage_logo" });

    expect(navigate).not.toHaveBeenCalled();
  });
});
