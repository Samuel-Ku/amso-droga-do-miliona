// Minimal local dev server for the campaign.
//  - Serves the built demo from ./dist-demo (same as `python -m http.server`)
//  - Implements /api/records (GET/POST) backed by a local ./dist-demo/records.local.json
//    so the records dashboard is testable without deploying the Cloudflare Worker.
//
// Usage: node scripts/dev-server.mjs [port]
// The worker (worker/src/index.js) is the source of truth for production logic;
// this file mirrors its validation/rules for local preview only.

import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "dist-demo");
const RECORDS_FILE = path.join(ROOT, "records.local.json");
const PORT = Number(process.argv[2] ?? 8123);
const MAX_ROWS = 50;
const BOARD_SIZE = 10;
const MAX_NAME_LEN = 24;
const NAME_ALLOWED = /^[\p{L}\p{N} _.\-']+$/u;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sanitizeName(raw) {
  if (typeof raw !== "string") return null;
  const t = raw.trim().slice(0, MAX_NAME_LEN);
  if (t.length === 0 || !NAME_ALLOWED.test(t)) return null;
  return t;
}
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

async function loadBoard() {
  try {
    if (!existsSync(RECORDS_FILE)) return [];
    const text = await readFile(RECORDS_FILE, "utf8");
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ROWS);
  } catch {
    return [];
  }
}
async function saveBoard(rows) {
  await mkdir(ROOT, { recursive: true });
  await writeFile(RECORDS_FILE, JSON.stringify(rows.slice(0, MAX_ROWS)), "utf8");
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    ...headers
  });
  res.end(body);
}

async function handleRecords(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, "");
  if (req.method === "GET") {
    const board = await loadBoard();
    return send(res, 200, JSON.stringify({ entries: board.slice(0, BOARD_SIZE) }), {
      "content-type": "application/json"
    });
  }
  if (req.method === "POST") {
    let payload;
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return send(res, 400, JSON.stringify({ error: "invalid_json" }), {
        "content-type": "application/json"
      });
    }
    const name = sanitizeName(payload?.name);
    const score = num(payload?.challengeScore);
    const orders = num(payload?.orders);
    if (!name) {
      return send(res, 400, JSON.stringify({ error: "invalid_name" }), {
        "content-type": "application/json"
      });
    }
    const board = await loadBoard();
    const idx = board.findIndex((r) => r.name.toLowerCase() === name.toLowerCase());
    const prev = idx >= 0 ? board[idx] : null;
    if (prev && prev.challengeScore >= score) {
      return send(res, 200, JSON.stringify({ entries: board.slice(0, BOARD_SIZE), updated: false, best: prev.challengeScore }), {
        "content-type": "application/json"
      });
    }
    const row = { name, challengeScore: score, orders, updatedAt: Date.now() };
    if (idx >= 0) board[idx] = row;
    else board.push(row);
    board.sort((a, b) => b.challengeScore - a.challengeScore);
    await saveBoard(board);
    return send(res, 200, JSON.stringify({ entries: board.slice(0, BOARD_SIZE), updated: true, best: score }), {
      "content-type": "application/json"
    });
  }
  return send(res, 405, JSON.stringify({ error: "method_not_allowed" }), {
    "content-type": "application/json"
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.startsWith("/api/records")) {
    try {
      return await handleRecords(req, res);
    } catch (err) {
      return send(res, 500, JSON.stringify({ error: "server_error" }), {
        "content-type": "application/json"
      });
    }
  }

  // Static file serving from dist-demo.
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const filePath = path.join(ROOT, path.normalize(rel));
  if (!filePath.startsWith(ROOT)) return send(res, 403, "Forbidden");
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, { "content-type": MIME[ext] ?? "application/octet-stream" });
  } catch {
    send(res, 404, "Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Dev server: http://localhost:${PORT}/  (records: ${RECORDS_FILE})`);
});
