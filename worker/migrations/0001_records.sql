CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  owner_id TEXT UNIQUE,
  name TEXT NOT NULL,
  canonical_name TEXT NOT NULL UNIQUE,
  challenge_score INTEGER NOT NULL CHECK (challenge_score >= 0),
  orders INTEGER NOT NULL DEFAULT 0 CHECK (orders >= 0),
  updated_at INTEGER NOT NULL,
  legacy_id TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_records_ranking
  ON records (challenge_score DESC, orders DESC, updated_at ASC, id ASC);
