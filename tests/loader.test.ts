import { describe, expect, it, vi } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import { fetchRunnerConfig, RunnerConfigStore } from "../src/loader";

const CONFIG = productionConfig;

describe("production loader config", () => {
  it("imports safely without a browser DOM and validates fetched config", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(CONFIG), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const result = await fetchRunnerConfig(
      new URL("https://amso.pl/assets/milion-runner/runner-config.json"),
      fetchMock as typeof fetch,
      new Date("2026-07-10T12:00:00Z")
    );

    expect(result.enabled).toBe(true);
    expect(result.schemaVersion).toBe(4);
    expect(result.cta.path).toBe("/milion");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("reuses config only inside the 60-second TTL", async () => {
    let clock = Date.parse("2026-07-10T12:00:00Z");
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(CONFIG), { status: 200 })
    );
    const store = new RunnerConfigStore(
      new URL("https://amso.pl/assets/milion-runner/runner-config.json"),
      fetchMock as typeof fetch,
      () => clock
    );

    await store.get();
    clock += 59_000;
    await store.get();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    clock += 2_000;
    await store.get();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
