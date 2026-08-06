import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { memoryD1 } from "./helpers/memory-d1";

// @ts-expect-error - plain JS module without bundled declarations
const worker = await import("../worker/src/index.js").then((module) => module.default);
const schema = readFileSync(new URL("../worker/migrations/0001_records.sql", import.meta.url), "utf8");
const openDatabases: Array<ReturnType<typeof memoryD1>> = [];

function env() {
  const database = memoryD1(schema);
  openDatabases.push(database);
  return { DB: database.binding };
}

function post(body: unknown) {
  return new Request("https://x.test/api/records", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

function legacyR2(rows: unknown[]) {
  const raw = JSON.stringify(rows);
  return {
    raw,
    binding: {
      async get(key: string) {
        return key === "records.json" ? { text: async () => raw } : null;
      }
    }
  };
}

describe("D1 records worker HTTP contract", () => {
  afterEach(() => {
    while (openDatabases.length) openDatabases.pop()?.close();
  });

  it("reserves a unique name for one anonymous player", async () => {
    const bindings = env();
    const first = await worker.fetch(post({
      playerId: "player-a",
      name: "Kurier",
      challengeScore: 500,
      orders: 12
    }), bindings, {});
    const collision = await worker.fetch(post({
      playerId: "player-b",
      name: "kurier",
      challengeScore: 900,
      orders: 20
    }), bindings, {});

    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ updated: true, playerEntry: { rank: 1 } });
    expect(collision.status).toBe(409);
    expect(await collision.json()).toEqual({ error: "name_taken" });
  });

  it("returns deterministic top rows and the exact player rank outside the top", async () => {
    const bindings = env();
    for (const [index, score, orders] of [
      [1, 900, 10], [2, 800, 20], [3, 800, 15], [4, 700, 30]
    ]) {
      await worker.fetch(post({
        playerId: `player-${index}`,
        name: `Gracz ${index}`,
        challengeScore: score,
        orders
      }), bindings, {});
    }

    const response = await worker.fetch(
      new Request("https://x.test/api/records?limit=2&playerId=player-4"),
      bindings,
      {}
    );
    const body = await response.json();

    expect(body.entries.map((entry: { name: string }) => entry.name))
      .toEqual(["Gracz 1", "Gracz 2"]);
    expect(body.playerEntry).toMatchObject({ name: "Gracz 4", rank: 4 });
    expect(body.playerEntry).not.toHaveProperty("ownerId");
  });

  it("imports legacy R2 rows idempotently without modifying the source", async () => {
    const bindings = env();
    const legacy = legacyR2([
      { id: "legacy-1", name: "Anka", challengeScore: 700, orders: 17, updatedAt: 123 },
      { id: "legacy-2", name: "Dell", challengeScore: 600, orders: 12, updatedAt: 124 }
    ]);
    const migrationRequest = () => new Request("https://x.test/api/records/migrate", {
      method: "POST",
      headers: { authorization: "Bearer migration-secret" }
    });
    const migrationEnv = {
      ...bindings,
      LEGACY_RECORDS: legacy.binding,
      MIGRATION_TOKEN: "migration-secret"
    };

    const first = await worker.fetch(migrationRequest(), migrationEnv, {});
    const second = await worker.fetch(migrationRequest(), migrationEnv, {});
    const board = await worker.fetch(new Request("https://x.test/api/records"), bindings, {});

    expect(await first.json()).toEqual({ sourceCount: 2, imported: 2, skipped: 0, invalid: 0 });
    expect(await second.json()).toEqual({ sourceCount: 2, imported: 0, skipped: 2, invalid: 0 });
    expect((await board.json()).entries).toHaveLength(2);
    expect(legacy.raw).toContain("legacy-1");
  });

  it("claims only a matching ownerless legacy row and never exposes the owner id", async () => {
    const bindings = env();
    const legacy = legacyR2([
      { id: "legacy-claim", name: "Anka", challengeScore: 700, orders: 17, updatedAt: 123 }
    ]);
    const migrationEnv = {
      ...bindings,
      LEGACY_RECORDS: legacy.binding,
      MIGRATION_TOKEN: "migration-secret"
    };
    await worker.fetch(new Request("https://x.test/api/records/migrate", {
      method: "POST",
      headers: { authorization: "Bearer migration-secret" }
    }), migrationEnv, {});

    const rejected = await worker.fetch(post({
      playerId: "player-wrong",
      name: "Anka",
      challengeScore: 701,
      orders: 18,
      previousSubmittedBest: 699
    }), bindings, {});
    const claimed = await worker.fetch(post({
      playerId: "player-right",
      name: "Anka",
      challengeScore: 701,
      orders: 18,
      previousSubmittedBest: 700
    }), bindings, {});
    const body = await claimed.json();

    expect(rejected.status).toBe(409);
    expect(claimed.status).toBe(200);
    expect(body.playerEntry).toMatchObject({ name: "Anka", challengeScore: 701 });
    expect(body.playerEntry).not.toHaveProperty("ownerId");
  });

  it("preserves a moderated legacy name in D1 but neutralizes the public row", async () => {
    const bindings = env();
    const blockedName = "AMSO Team";
    const legacy = legacyR2([
      { id: "legacy-blocked", name: blockedName, challengeScore: 701, orders: 18, updatedAt: 125 }
    ]);
    const migrationEnv = {
      ...bindings,
      LEGACY_RECORDS: legacy.binding,
      MIGRATION_TOKEN: "migration-secret"
    };
    await worker.fetch(new Request("https://x.test/api/records/migrate", {
      method: "POST",
      headers: { authorization: "Bearer migration-secret" }
    }), migrationEnv, {});

    const raw = bindings.DB.prepare("SELECT name FROM records WHERE legacy_id = ?")
      .bind("legacy-blocked");
    const board = await worker.fetch(new Request("https://x.test/api/records"), bindings, {});

    expect(await raw.first()).toEqual({ name: blockedName });
    expect((await board.json()).entries[0].name).toBe("Gracz");
    expect(legacy.raw).toContain(blockedName);
  });

  it("keeps more than one thousand players and ranks the last one exactly", async () => {
    const bindings = env();
    const insert = bindings.DB.prepare(`
      INSERT INTO records (
        id, owner_id, name, canonical_name, challenge_score, orders, updated_at, legacy_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`);
    const statements = Array.from({ length: 1_001 }, (_, index) => {
      const number = index + 1;
      return insert.bind(
        `record-${number}`,
        `player-${String(number).padStart(4, "0")}`,
        `Gracz ${number}`,
        `gracz ${number}`,
        2_000 - number,
        number,
        number
      );
    });
    await bindings.DB.batch(statements);

    const response = await worker.fetch(new Request(
      "https://x.test/api/records?limit=10&playerId=player-1001"
    ), bindings, {});
    const body = await response.json();
    const plan = await bindings.DB.prepare(`
      EXPLAIN QUERY PLAN
      SELECT COUNT(*) AS count FROM records
      WHERE challenge_score > ?
         OR (challenge_score = ? AND orders > ?)
         OR (challenge_score = ? AND orders = ? AND updated_at < ?)
         OR (challenge_score = ? AND orders = ? AND updated_at = ? AND id < ?)`)
      .bind(999, 999, 1_001, 999, 1_001, 1_001, 999, 1_001, 1_001, "record-1001")
      .all();

    expect(body.entries).toHaveLength(10);
    expect(body.playerEntry).toMatchObject({ name: "Gracz 1001", rank: 1_001 });
    expect(plan.results.map((row: { detail?: string }) => row.detail).join(" "))
      .toContain("idx_records_ranking");
  });

  it("rejects a limited write before touching D1", async () => {
    const bindings = env();
    const response = await worker.fetch(post({
      playerId: "player-limited",
      name: "Kurier",
      challengeScore: 500,
      orders: 12
    }), {
      ...bindings,
      WRITE_RATE_LIMITER: { limit: async () => ({ success: false }) }
    }, {});
    const count = await bindings.DB.prepare("SELECT COUNT(*) AS count FROM records").first();

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rate_limited" });
    expect(count).toEqual({ count: 0 });
  });
});
