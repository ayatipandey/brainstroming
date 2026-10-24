// SQLite storage through Node's built-in node:sqlite (no native build step).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REWARDS, MERCHANTS } from '../shared/catalog.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.env.DB_FILE || path.join(here, 'data', 'app.db');
if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });

export const db = new DatabaseSync(file);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  email_verified_at TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);
-- Append-only consent log: one row per grant or withdrawal.
CREATE TABLE IF NOT EXISTS consents (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  granted INTEGER NOT NULL,
  policy_version TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL
);
-- status: 'placeholder' until the merchant confirms the offer in writing.
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  tier TEXT NOT NULL,
  title TEXT NOT NULL,
  value_cents INTEGER NOT NULL,
  points_cost INTEGER NOT NULL,
  min_spend_cents INTEGER NOT NULL DEFAULT 0,
  valid_until TEXT NOT NULL,
  terms_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'placeholder',
  source_note TEXT NOT NULL DEFAULT ''
);
-- Linked cards keep only the bank name and last four digits. card_ref is an
-- opaque reference the card processor uses when it sends transactions.
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank TEXT NOT NULL,
  last4 TEXT NOT NULL CHECK (length(last4) = 4),
  card_ref TEXT NOT NULL UNIQUE,
  auto_apply INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS stars (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_id TEXT NOT NULL REFERENCES offers(id),
  PRIMARY KEY (user_id, offer_id)
);
-- external_id makes ingestion idempotent.
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER REFERENCES cards(id) ON DELETE SET NULL,
  merchant_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  offer_id TEXT,
  points_earned INTEGER NOT NULL DEFAULT 0,
  points_spent INTEGER NOT NULL DEFAULT 0,
  saved_from_expiring INTEGER NOT NULL DEFAULT 0,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
-- Points are kept in lots so the soonest-expiring are spent first.
CREATE TABLE IF NOT EXISTS point_lots (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  remaining INTEGER NOT NULL,
  earned_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_lots_user ON point_lots(user_id, expires_at);
`);

/** Run fn inside a transaction. */
export function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

// Seed merchants and offers once. Every seeded offer is placeholder content:
// fictional pilot merchants whose offers the team must replace or confirm.
const offerCount = db.prepare('SELECT COUNT(*) AS n FROM offers').get().n;
if (offerCount === 0) {
  tx(() => {
    const m = db.prepare('INSERT OR IGNORE INTO merchants (id, name, category) VALUES (?, ?, ?)');
    for (const x of MERCHANTS) m.run(x.id, x.name, x.category);
    const o = db.prepare(`INSERT INTO offers (id, merchant_id, tier, title, value_cents, points_cost, min_spend_cents, valid_until, terms_json, status, source_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'placeholder', ?)`);
    for (const r of REWARDS) {
      const until = new Date(Date.now() + Math.max(r.days, 30) * 864e5).toISOString().slice(0, 10);
      o.run(r.id, r.merchantId, r.tier, r.title, Math.round(r.value * 100), r.cost, Math.round(r.minSpend * 100), until,
        JSON.stringify(r.terms), 'Fictional pilot merchant and offer. Replace with an offer confirmed in writing by the merchant.');
    }
  });
}

export const now = () => new Date().toISOString();
