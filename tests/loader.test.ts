// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import productionConfig from "../public/assets/milion-runner/runner-config.json";
import {
  embeddedRunnerConfig,
  fetchRunnerConfig,
  RunnerConfigStore,
  startProductionLoader
} from "../src/loader";

const CONFIG = productionConfig;

function setEmbeddedConfig(value: unknown): () => void {
  const g = globalThis as Record<string, unknown>;
  const previous = g.__RUNNER_CONFIG__;
  g.__RUNNER_CONFIG__ = value;
  return () => {
    g.__RUNNER_CONFIG__ = previous;
  };
}

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
    expect(result.cta.path).toBe("/million");
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

  it("falls back to the embedded config when the config URL cannot be resolved", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 404 }));
    const script = document.createElement("script");
    script.dataset.runnerConfig = "/assets/milion-runner/runner-config.json";
    const trigger = document.createElement("button");
    trigger.dataset.amsoMillionRunner = "";
    document.body.append(script, trigger);

    const restore = setEmbeddedConfig(CONFIG);
    let controller: Awaited<ReturnType<typeof startProductionLoader>> = null;
    try {
      controller = await startProductionLoader({
        script,
        configPath: "https://other.example.com/assets/milion-runner/runner-config.json",
        fetch: fetchMock as unknown as typeof fetch,
        window: window as unknown as Window & typeof globalThis,
        document: document as unknown as Document
      });
    } finally {
      script.remove();
      trigger.remove();
      restore();
    }

    expect(controller).not.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null from the embedded resolver without an injected config", () => {
    const restore = setEmbeddedConfig(undefined);
    try {
      expect(embeddedRunnerConfig()).toBeNull();
    } finally {
      restore();
    }
  });

  it("parses the injected embedded config into a valid runner config", () => {
    const restore = setEmbeddedConfig(CONFIG);
    try {
      const parsed = embeddedRunnerConfig();
      expect(parsed?.enabled).toBe(true);
      expect(parsed?.schemaVersion).toBe(4);
    } finally {
      restore();
    }
  });

  it("rejects an invalid injected embedded config instead of throwing", () => {
    const restore = setEmbeddedConfig({ not: "a config" });
    try {
      expect(embeddedRunnerConfig()).toBeNull();
    } finally {
      restore();
    }
  });
});
