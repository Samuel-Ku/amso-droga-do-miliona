/**
 * Cloudflare Worker: records board for "Droga do Miliona".
 *
 * Storage: a single R2 object "records.json" holding at most MAX_ROWS rows,
 * one row per player name. A new submission for an existing name overwrites
 * that row only when the incoming challengeScore is higher.
 *
 * Endpoints:
 *   GET  /api/records        -> { entries: RecordRow[] }
 *   POST /api/records        -> stores/updates a row, returns updated board
 *
 * No auth: this is a public, client-facing leaderboard. Validation and a
 * row cap keep the object small and prevent trivial abuse.
 */

const R2_KEY = "records.json";
const MAX_ROWS = 50;            // hard cap on stored rows (board shows top 10)
const BOARD_SIZE = 10;          // rows returned to clients
const MAX_NAME_LEN = 24;
const NAME_ALLOWED = /^[\p{L}\p{N} _.\-']+$/u;

/**
 * @typedef {Object} RecordRow
 * @property {string} name
 * @property {number} challengeScore
 * @property {number} orders
 * @property {number} updatedAt  epoch ms
 */

/**
 * @param {R2Bucket} bucket
 * @returns {Promise<RecordRow[]>}
 */
async function loadBoard(bucket) {
  try {
    const obj = await bucket.get(R2_KEY);
    if (obj === null) return [];
    const text = await obj.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isValidRow)
      .map(normalizeRow)
      .sort((a, b) => b.challengeScore - a.challengeScore)
      .slice(0, MAX_ROWS);
  } catch {
    return [];
  }
}

/**
 * @param {R2Bucket} bucket
 * @param {RecordRow[]} rows
 */
async function saveBoard(bucket, rows) {
  await bucket.put(R2_KEY, JSON.stringify(rows), {
    httpMetadata: { contentType: "application/json" }
  });
}

/**
 * @param {unknown} row
 * @returns {boolean}
 */
function isValidRow(row) {
  if (typeof row !== "object" || row === null) return false;
  const r = /** @type {any} */ (row);
  return (
    typeof r.name === "string" &&
    typeof r.challengeScore === "number" &&
    Number.isFinite(r.challengeScore) &&
    r.challengeScore >= 0
  );
}

/**
 * @param {any} row
 * @returns {RecordRow}
 */
function normalizeRow(row) {
  return {
    name: String(row.name).slice(0, MAX_NAME_LEN),
    challengeScore: Math.round(Number(row.challengeScore)),
    orders: Number.isFinite(Number(row.orders)) ? Math.round(Number(row.orders)) : 0,
    updatedAt: Number.isFinite(Number(row.updatedAt)) ? Number(row.updatedAt) : Date.now()
  };
}

/**
 * @param {string} raw
 * @returns {string | null}
 */
function sanitizeName(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().slice(0, MAX_NAME_LEN);
  if (trimmed.length === 0) return null;
  if (!NAME_ALLOWED.test(trimmed)) return null;
  return trimmed;
}

/**
 * @param {unknown} v
 * @returns {number}
 */
function sanitizeScore(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

export default {
  /**
   * @param {Request} request
   * @param {any} env
   * @param {any} ctx
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/records")) {
      return new Response("Not found", { status: 404 });
    }

    const headers = {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method === "GET") {
      const board = await loadBoard(env.RECORDS);
      return new Response(JSON.stringify({ entries: board.slice(0, BOARD_SIZE) }), {
        status: 200,
        headers
      });
    }

    if (request.method === "POST") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "invalid_json" }), {
          status: 400,
          headers
        });
      }

      const name = sanitizeName(payload && payload.name);
      const challengeScore = sanitizeScore(payload && payload.challengeScore);
      const orders = sanitizeScore(payload && payload.orders);

      if (name === null) {
        return new Response(JSON.stringify({ error: "invalid_name" }), {
          status: 400,
          headers
        });
      }

      const bucket = /** @type {R2Bucket} */ (env.RECORDS);
      const board = await loadBoard(bucket);

      const existingIndex = board.findIndex(
        (r) => r.name.toLowerCase() === name.toLowerCase()
      );
      const previous = existingIndex >= 0 ? board[existingIndex] : null;

      // Only insert/update when this beats the player's previous best.
      if (previous && previous.challengeScore >= challengeScore) {
        return new Response(
          JSON.stringify({
            entries: board.slice(0, BOARD_SIZE),
            updated: false,
            best: previous.challengeScore
          }),
          { status: 200, headers }
        );
      }

      const row = {
        name,
        challengeScore,
        orders,
        updatedAt: Date.now()
      };

      if (existingIndex >= 0) {
        board[existingIndex] = row;
      } else {
        board.push(row);
      }
      board.sort((a, b) => b.challengeScore - a.challengeScore);
      const trimmed = board.slice(0, MAX_ROWS);

      await saveBoard(bucket, trimmed);
      return new Response(
        JSON.stringify({
          entries: trimmed.slice(0, BOARD_SIZE),
          updated: true,
          best: challengeScore
        }),
        { status: 200, headers }
      );
    }

    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers
    });
  }
};
