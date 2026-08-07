/**
 * Cloudflare Worker for the optional public leaderboard.
 * D1 is the source of truth; the autonomous game remains usable without it.
 */

import {
  PLAYER_NAME_POLICY_VERSION,
  validatePlayerName
} from "../../src/moderation/player-name-policy.ts";

const DEFAULT_BOARD_SIZE = 10;
const MAX_BOARD_SIZE = 10;
const MAX_INTEGER = 2_147_483_647;
const MAX_POST_BYTES = 2_048;

function headers() {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-moderation-policy-version": PLAYER_NAME_POLICY_VERSION
  };
}

function allowedOrigins(env) {
  const configured = typeof env.CORS_ALLOWED_ORIGINS === "string"
    ? env.CORS_ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  return new Set(["https://amso.pl", "https://amso.eu", ...configured]);
}

function originAllowed(request, env) {
  const origin = request.headers.get("origin");
  return origin === null || allowedOrigins(env).has(origin);
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  headers.append("vary", "Origin");
  const origin = request.headers.get("origin");
  if (origin && allowedOrigins(env).has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
    headers.set("access-control-allow-headers", "content-type, authorization");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function validPreflight(request) {
  const method = request.headers.get("access-control-request-method");
  if (method !== null && method !== "GET" && method !== "POST") return false;
  const requestedHeaders = (request.headers.get("access-control-request-headers") ?? "")
    .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return requestedHeaders.every((header) => header === "content-type" || header === "authorization");
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers() });
}

function boundedInteger(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > MAX_INTEGER) return null;
  return Math.round(number);
}

function sanitizeLegacyScore(value) {
  return boundedInteger(value) ?? 0;
}

function validPlayerId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/u.test(value);
}

function canonicalName(name) {
  return name.normalize("NFKC").toLocaleLowerCase("pl-PL");
}

function publicRow(row) {
  if (!row) return null;
  const validation = validatePlayerName(String(row.name));
  return {
    id: String(row.id),
    ...(validation.valid ? { name: validation.name } : { nameModerated: true }),
    challengeScore: Number(row.challenge_score),
    orders: Number(row.orders),
    updatedAt: Number(row.updated_at),
    rank: Number(row.rank)
  };
}

async function topRows(database, limit) {
  const result = await database.prepare(`
    SELECT id, name, challenge_score, orders, updated_at
    FROM records
    ORDER BY challenge_score DESC, orders DESC, updated_at ASC, id ASC
    LIMIT ?`).bind(limit).all();
  return result.results.map((row, index) => publicRow({ ...row, rank: index + 1 }));
}

async function playerRow(database, playerId) {
  if (!playerId) return null;
  const row = await database.prepare(`
    SELECT id, name, challenge_score, orders, updated_at
    FROM records WHERE owner_id = ? LIMIT 1`).bind(playerId).first();
  if (!row) return null;
  const ahead = await database.prepare(`
    SELECT COUNT(*) AS count
    FROM records
    WHERE challenge_score > ?
       OR (challenge_score = ? AND orders > ?)
       OR (challenge_score = ? AND orders = ? AND updated_at < ?)
       OR (challenge_score = ? AND orders = ? AND updated_at = ? AND id < ?)`)
    .bind(
      row.challenge_score,
      row.challenge_score,
      row.orders,
      row.challenge_score,
      row.orders,
      row.updated_at,
      row.challenge_score,
      row.orders,
      row.updated_at,
      row.id
    )
    .first();
  return publicRow({ ...row, rank: Number(ahead?.count) + 1 });
}

async function boardResponse(database, limit, playerId) {
  const [entries, playerEntry] = await Promise.all([
    topRows(database, limit),
    playerRow(database, playerId)
  ]);
  return {
    entries,
    ...(playerEntry ? { playerEntry } : {})
  };
}

async function findByOwner(database, playerId) {
  return database.prepare(`
    SELECT id, owner_id, name, canonical_name, challenge_score, orders, updated_at
    FROM records WHERE owner_id = ? LIMIT 1`).bind(playerId).first();
}

async function findByName(database, name) {
  return database.prepare(`
    SELECT id, owner_id, name, canonical_name, challenge_score, orders, updated_at
    FROM records WHERE canonical_name = ? LIMIT 1`).bind(name).first();
}

async function handleGet(request, database) {
  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? DEFAULT_BOARD_SIZE);
  const limit = Math.min(MAX_BOARD_SIZE, Math.max(1, Math.floor(rawLimit) || DEFAULT_BOARD_SIZE));
  const requestedPlayerId = url.searchParams.get("playerId");
  if (requestedPlayerId !== null && !validPlayerId(requestedPlayerId)) {
    return json({ error: "invalid_player_id" }, 400);
  }
  return json(await boardResponse(database, limit, requestedPlayerId));
}

async function allowWrite(request, env, playerId) {
  if (!env.WRITE_RATE_LIMITER) return true;
  const network = request.headers.get("cf-connecting-ip") ?? "unknown";
  const [playerLimit, networkLimit] = await Promise.all([
    env.WRITE_RATE_LIMITER.limit({ key: `player:${playerId}` }),
    env.WRITE_RATE_LIMITER.limit({ key: `network:${network}` })
  ]);
  return playerLimit.success && networkLimit.success;
}

async function handlePost(request, env) {
  const database = env.DB;
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_POST_BYTES) return json({ error: "payload_too_large" }, 413);
  let payload;
  try {
    const raw = await request.text();
    if (raw.length > MAX_POST_BYTES) return json({ error: "payload_too_large" }, 413);
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const playerId = payload?.playerId;
  if (!validPlayerId(playerId)) return json({ error: "invalid_player_id" }, 400);
  if (!(await allowWrite(request, env, playerId))) {
    return json({ error: "rate_limited" }, 429);
  }

  const validation = validatePlayerName(typeof payload?.name === "string" ? payload.name : "");
  if (!validation.valid) {
    return json({ error: validation.reason === "too_long" ? "name_too_long" : "name_disallowed" }, 400);
  }

  const name = validation.name;
  const canonical = canonicalName(name);
  const challengeScore = boundedInteger(payload?.challengeScore);
  const orders = boundedInteger(payload?.orders);
  const previousSubmittedBest = boundedInteger(payload?.previousSubmittedBest ?? 0);
  if (challengeScore === null || orders === null || previousSubmittedBest === null) {
    return json({ error: "invalid_score" }, 400);
  }
  const [owned, named] = await Promise.all([
    findByOwner(database, playerId),
    findByName(database, canonical)
  ]);

  if (named && named.owner_id && named.owner_id !== playerId) {
    return json({ error: "name_taken" }, 409);
  }
  if (owned && owned.canonical_name !== canonical) {
    return json({ error: "name_taken" }, 409);
  }

  let current = owned ?? named;
  if (current && !current.owner_id) {
    if (Number(current.challenge_score) !== previousSubmittedBest) {
      return json({ error: "name_taken" }, 409);
    }
    const claim = await database.prepare(`UPDATE records SET owner_id = ? WHERE id = ? AND owner_id IS NULL`)
      .bind(playerId, current.id).run();
    if (Number(claim.meta?.changes) === 0) return json({ error: "name_taken" }, 409);
    current = { ...current, owner_id: playerId };
  }

  let updated = false;
  try {
    if (!current) {
      await database.prepare(`
        INSERT INTO records (
          id, owner_id, name, canonical_name, challenge_score, orders, updated_at, legacy_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`)
        .bind(crypto.randomUUID(), playerId, name, canonical, challengeScore, orders, Date.now())
        .run();
      updated = true;
    } else {
      const result = await database.prepare(`
        UPDATE records
        SET name = ?, canonical_name = ?, challenge_score = ?, orders = ?, updated_at = ?
        WHERE id = ?
          AND owner_id = ?
          AND (challenge_score < ? OR (challenge_score = ? AND orders < ?))`)
        .bind(
          name,
          canonical,
          challengeScore,
          orders,
          Date.now(),
          current.id,
          playerId,
          challengeScore,
          challengeScore,
          orders
        )
        .run();
      updated = Number(result.meta?.changes) > 0;
    }
  } catch (error) {
    if (/unique|constraint/iu.test(String(error))) return json({ error: "name_taken" }, 409);
    throw error;
  }

  const board = await boardResponse(database, DEFAULT_BOARD_SIZE, playerId);
  return json({
    ...board,
    updated,
    best: board.playerEntry?.challengeScore ?? challengeScore
  });
}

async function handleMigration(request, env) {
  const expected = typeof env.MIGRATION_TOKEN === "string" ? env.MIGRATION_TOKEN : "";
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return json({ error: "forbidden" }, 403);
  }
  const source = await env.LEGACY_RECORDS?.get("records.json");
  if (!source) return json({ sourceCount: 0, imported: 0, skipped: 0, invalid: 0 });

  let rows;
  try {
    rows = JSON.parse(await source.text());
  } catch {
    return json({ error: "invalid_legacy_data" }, 422);
  }
  if (!Array.isArray(rows)) return json({ error: "invalid_legacy_data" }, 422);

  let imported = 0;
  let skipped = 0;
  let invalid = 0;
  for (const row of rows) {
    const legacyName = typeof row?.name === "string" ? row.name : "";
    if (!legacyName || !Number.isFinite(Number(row?.challengeScore))) {
      invalid += 1;
      continue;
    }
    const legacyId = typeof row.id === "string" && row.id ? row.id : crypto.randomUUID();
    const result = await env.DB.prepare(`
      INSERT OR IGNORE INTO records (
        id, owner_id, name, canonical_name, challenge_score, orders, updated_at, legacy_id
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`)
      .bind(
        `legacy:${legacyId}`,
        legacyName,
        canonicalName(legacyName),
        sanitizeLegacyScore(row.challengeScore),
        sanitizeLegacyScore(row.orders),
        Number.isFinite(Number(row.updatedAt)) ? Number(row.updatedAt) : Date.now(),
        legacyId
      )
      .run();
    if (Number(result.meta?.changes) > 0) imported += 1;
    else skipped += 1;
  }
  return json({ sourceCount: rows.length, imported, skipped, invalid });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/records")) {
      return new Response("Not found", { status: 404 });
    }
    if (!originAllowed(request, env)) return json({ error: "origin_not_allowed" }, 403);
    if (request.method === "OPTIONS") {
      if (!validPreflight(request)) {
        return withCors(json({ error: "preflight_not_allowed" }, 403), request, env);
      }
      return withCors(new Response(null, { status: 204, headers: headers() }), request, env);
    }
    let response;
    if (!env.DB) response = json({ error: "records_unavailable" }, 503);
    else if (url.pathname === "/api/records/migrate" && request.method === "POST") {
      response = await handleMigration(request, env);
    } else if (url.pathname !== "/api/records") response = json({ error: "not_found" }, 404);
    else if (request.method === "GET") response = await handleGet(request, env.DB);
    else if (request.method === "POST") response = await handlePost(request, env);
    else response = json({ error: "method_not_allowed" }, 405);
    return withCors(response, request, env);
  }
};
