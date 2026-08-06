import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { PLAYER_NAME_POLICY_VERSION } from "../src/moderation/player-name-policy";
import { allowedPlayerNames, disallowedPlayerNames } from "./fixtures/player-name-moderation";
import { memoryD1 } from "./helpers/memory-d1";

// @ts-expect-error - plain JS module without bundled declarations
const worker = await import("../worker/src/index.js").then((module) => module.default);
const schema = readFileSync(new URL("../worker/migrations/0001_records.sql", import.meta.url), "utf8");
const databases: Array<ReturnType<typeof memoryD1>> = [];

function env() {
  const database = memoryD1(schema);
  databases.push(database);
  return { DB: database.binding };
}

function jsonRequest(body: unknown, method = "POST") {
  return new Request("https://x.test/api/records", {
    method,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" }
  });
}

function submission(name: string, playerId = "player-001", score = 10) {
  return { playerId, name, challengeScore: score, orders: 1, previousSubmittedBest: 0 };
}

describe("records worker", () => {
  afterEach(() => {
    while (databases.length) databases.pop()?.close();
  });

  it.each(disallowedPlayerNames)("rejects a direct moderated POST for %s", async (name) => {
    const response = await worker.fetch(jsonRequest(submission(name)), env(), {});
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_name" });
  });

  it.each(allowedPlayerNames)("accepts the shared allowed fixture %s", async (name) => {
    const response = await worker.fetch(jsonRequest(submission(name)), env(), {});
    expect(response.status).toBe(200);
    expect((await response.json()).entries[0].name).toBe(name);
  });

  it("shares frontend normalization and length outcomes", async () => {
    const normalized = await worker.fetch(
      jsonRequest(submission("  Jan   Kowalski  ")),
      env(),
      {}
    );
    expect(normalized.status).toBe(200);
    expect((await normalized.json()).entries[0].name).toBe("Jan Kowalski");

    const tooLong = await worker.fetch(jsonRequest(submission("a".repeat(15))), env(), {});
    expect(tooLong.status).toBe(400);
  });

  it("updates only a better result owned by the same player", async () => {
    const bindings = env();
    await worker.fetch(jsonRequest(submission("Anka", "player-001", 500)), bindings, {});
    const worse = await worker.fetch(jsonRequest({
      ...submission("Anka", "player-001", 300), previousSubmittedBest: 500
    }), bindings, {});
    const better = await worker.fetch(jsonRequest({
      ...submission("Anka", "player-001", 900), orders: 30, previousSubmittedBest: 500
    }), bindings, {});

    expect((await worse.json()).updated).toBe(false);
    expect((await better.json()).playerEntry.challengeScore).toBe(900);
  });

  it("keeps routing and public cache headers explicit", async () => {
    const bindings = env();
    const unsupported = await worker.fetch(
      new Request("https://x.test/api/records", { method: "DELETE" }), bindings, {}
    );
    const missing = await worker.fetch(new Request("https://x.test/api/other"), bindings, {});
    const board = await worker.fetch(new Request("https://x.test/api/records"), bindings, {});

    expect(unsupported.status).toBe(405);
    expect(missing.status).toBe(404);
    expect(board.headers.get("cache-control")).toBe("no-store");
    expect(board.headers.get("x-moderation-policy-version")).toBe(PLAYER_NAME_POLICY_VERSION);
  });

  it("rejects scores outside the bounded D1 integer contract", async () => {
    const response = await worker.fetch(jsonRequest({
      ...submission("Anka"),
      challengeScore: Number.MAX_SAFE_INTEGER
    }), env(), {});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_score" });
  });
});
