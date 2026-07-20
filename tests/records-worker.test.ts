// The worker is plain ESM at worker/src/index.js with an `export default { fetch }`.
// We import the module and exercise it with an in-memory R2 bucket mock.
// Note: wrangler types are not installed, so we mock the minimal R2 surface.
import { describe, expect, it } from "vitest";

// @ts-expect-error - plain JS module without bundled declarations
const worker = await import("../worker/src/index.js").then((m) => m.default);

function memoryR2(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    store,
    async get(key: string) {
      return store.has(key)
        ? { text: async () => store.get(key)!, json: async () => JSON.parse(store.get(key)!) }
        : null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async delete(key: string) {
      store.delete(key);
    }
  };
}

function jsonRequest(body: unknown, method = "POST") {
  return new Request("https://x.test/api/records", {
    method,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" }
  });
}

describe("records worker", () => {
  it("rejects invalid names", async () => {
    const env = { RECORDS: memoryR2() };
    const res = await worker.fetch(jsonRequest({ name: "<script>", challengeScore: 10 }), env, {});
    expect(res.status).toBe(400);
  });

  it("stores a first record and returns top entries", async () => {
    const env = { RECORDS: memoryR2() };
    const post = await worker.fetch(jsonRequest({ name: "Anka", challengeScore: 500, orders: 12 }), env, {});
    expect(post.status).toBe(200);
    const body = await post.json();
    expect(body.updated).toBe(true);
    expect(body.entries[0].name).toBe("Anka");

    const get = await worker.fetch(new Request("https://x.test/api/records"), env, {});
    const getBody = await get.json();
    expect(getBody.entries).toHaveLength(1);
  });

  it("keeps one row per name, updating only on a better score", async () => {
    const env = { RECORDS: memoryR2() };
    await worker.fetch(jsonRequest({ name: "Anka", challengeScore: 500, orders: 12 }), env, {});
    const worse = await worker.fetch(jsonRequest({ name: "Anka", challengeScore: 300, orders: 5 }), env, {});
    expect((await worse.json()).updated).toBe(false);

    const better = await worker.fetch(jsonRequest({ name: "Anka", challengeScore: 900, orders: 30 }), env, {});
    const betterBody = await better.json();
    expect(betterBody.updated).toBe(true);
    expect(betterBody.entries[0].challengeScore).toBe(900);

    const raw = JSON.parse(env.RECORDS.store.get("records.json")!);
    expect(raw).toHaveLength(1);
  });

  it("returns 405 for unsupported methods", async () => {
    const env = { RECORDS: memoryR2() };
    const res = await worker.fetch(new Request("https://x.test/api/records", { method: "DELETE" }), env, {});
    expect(res.status).toBe(405);
  });

  it("returns 404 for non-records paths", async () => {
    const env = { RECORDS: memoryR2() };
    const res = await worker.fetch(new Request("https://x.test/api/other"), env, {});
    expect(res.status).toBe(404);
  });
});
