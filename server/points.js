// Points, offers and transaction handling.
import { db, tx, now } from './db.js';
import { TIERS, tierFor, tierRank, POINTS_PER_DOLLAR, POINTS_EXPIRE_DAYS, EXPIRY_WINDOW_DAYS, merchantById } from '../shared/catalog.js';

const DAY = 864e5;
// Placeholder offers are visible in development and hidden in production
// unless SHOW_PLACEHOLDER_OFFERS=1, so unconfirmed content never reaches
// real customers by accident.
export const showPlaceholders = process.env.SHOW_PLACEHOLDER_OFFERS
  ? process.env.SHOW_PLACEHOLDER_OFFERS === '1'
  : process.env.NODE_ENV !== 'production';

export function offerFromRow(r) {
  return {
    id: r.id, merchantId: r.merchant_id, tier: r.tier, title: r.title,
    value: r.value_cents / 100, cost: r.points_cost, minSpend: r.min_spend_cents / 100,
    validUntil: r.valid_until, terms: JSON.parse(r.terms_json), status: r.status,
    days: Math.max(0, Math.ceil((new Date(`${r.valid_until}T23:59:59`) - Date.now()) / DAY)),
  };
}

export function visibleOffers() {
  const rows = db.prepare(`SELECT * FROM offers WHERE valid_until >= date('now') ${showPlaceholders ? '' : "AND status = 'confirmed'"} ORDER BY id`).all();
  return rows.map(offerFromRow);
}

export const balanceOf = (userId) => db.prepare('SELECT COALESCE(SUM(remaining), 0) AS n FROM point_lots WHERE user_id = ? AND expires_at > ?').get(userId, now()).n;
export const lifetimeOf = (userId) => db.prepare('SELECT COALESCE(SUM(amount), 0) AS n FROM point_lots WHERE user_id = ?').get(userId, ).n;

export function summary(userId) {
  const t = now();
  const yearStart = `${new Date().getUTCFullYear()}-01-01`;
  const balance = balanceOf(userId);
  const lifetime = lifetimeOf(userId);
  const earnedYear = db.prepare('SELECT COALESCE(SUM(amount), 0) AS n FROM point_lots WHERE user_id = ? AND earned_at >= ?').get(userId, yearStart).n;
  const usedYear = db.prepare('SELECT COALESCE(SUM(points_spent), 0) AS n FROM transactions WHERE user_id = ? AND occurred_at >= ?').get(userId, yearStart).n;
  const windowEnd = new Date(Date.now() + EXPIRY_WINDOW_DAYS * DAY).toISOString();
  const expiring = db.prepare(`SELECT COALESCE(SUM(remaining), 0) AS n, MIN(expires_at) AS soonest FROM point_lots
    WHERE user_id = ? AND remaining > 0 AND expires_at > ? AND expires_at <= ?`).get(userId, t, windowEnd);
  const savedPoints = db.prepare('SELECT COALESCE(SUM(saved_from_expiring), 0) AS n FROM transactions WHERE user_id = ?').get(userId).n;
  const used = db.prepare('SELECT offer_id FROM transactions WHERE user_id = ? AND offer_id IS NOT NULL').all(userId).map((r) => r.offer_id);
  const stars = db.prepare('SELECT offer_id FROM stars WHERE user_id = ?').all(userId).map((r) => r.offer_id);
  const tier = tierFor(lifetime);
  return {
    balance, lifetime, earnedYear, usedYear,
    expiring: { points: expiring.n, daysLeft: expiring.soonest ? Math.max(0, Math.ceil((new Date(expiring.soonest) - Date.now()) / DAY)) : null },
    savedFromExpiring: savedPoints,
    tier: tier.id,
    used, stars,
  };
}

function earn(userId, amount, txId, at) {
  if (amount <= 0) return;
  const expires = new Date(new Date(at).getTime() + POINTS_EXPIRE_DAYS * DAY).toISOString();
  db.prepare('INSERT INTO point_lots (user_id, amount, remaining, earned_at, expires_at, transaction_id) VALUES (?, ?, ?, ?, ?, ?)').run(userId, amount, amount, at, expires, txId);
}

/** Spend points, soonest-expiring first. Returns how many came from lots expiring within the window. */
function spend(userId, amount) {
  const t = now();
  const windowEnd = new Date(Date.now() + EXPIRY_WINDOW_DAYS * DAY).toISOString();
  const lots = db.prepare('SELECT id, remaining, expires_at FROM point_lots WHERE user_id = ? AND remaining > 0 AND expires_at > ? ORDER BY expires_at').all(userId, t);
  let left = amount;
  let fromExpiring = 0;
  const upd = db.prepare('UPDATE point_lots SET remaining = remaining - ? WHERE id = ?');
  for (const lot of lots) {
    if (left <= 0) break;
    const use = Math.min(lot.remaining, left);
    upd.run(use, lot.id);
    if (lot.expires_at <= windowEnd) fromExpiring += use;
    left -= use;
  }
  if (left > 0) throw new Error('Not enough points');
  return fromExpiring;
}

const event = (userId, kind, title, detail = '') => db.prepare('INSERT INTO events (user_id, kind, title, detail) VALUES (?, ?, ?, ?)').run(userId, kind, title, detail);

/**
 * Ingest one card transaction. Idempotent on externalId: sending the same
 * transaction twice returns the first result and changes nothing.
 */
export function ingestTransaction({ externalId, cardRef, merchantId, amountCents, occurredAt }) {
  const existing = db.prepare('SELECT * FROM transactions WHERE external_id = ?').get(externalId);
  if (existing) return { duplicate: true, transaction: existing };

  const card = db.prepare('SELECT * FROM cards WHERE card_ref = ?').get(cardRef);
  if (!card) return { error: 'Unknown card reference.', status: 404 };
  const merchant = merchantById(merchantId);
  if (!merchant) return { error: 'Unknown merchant.', status: 400 };
  const at = occurredAt || now();

  return tx(() => {
    const userId = card.user_id;
    const lifetimeBefore = lifetimeOf(userId);
    const tierBefore = tierFor(lifetimeBefore);
    const balance = balanceOf(userId);
    const used = new Set(db.prepare('SELECT offer_id FROM transactions WHERE user_id = ? AND offer_id IS NOT NULL').all(userId).map((r) => r.offer_id));

    let best = null;
    if (card.auto_apply) {
      best = visibleOffers()
        .filter((o) => o.merchantId === merchantId && !used.has(o.id) && tierRank(o.tier) <= tierRank(tierBefore.id)
          && o.minSpend * 100 <= amountCents && o.cost <= balance && o.validUntil >= at.slice(0, 10))
        .sort((a, b) => Math.min(b.value * 100, amountCents) - Math.min(a.value * 100, amountCents))[0] || null;
    }
    const discount = best ? Math.min(Math.round(best.value * 100), amountCents) : 0;
    const fromExpiring = best ? spend(userId, best.cost) : 0;
    const paid = amountCents - discount;
    const earned = Math.floor((paid / 100) * POINTS_PER_DOLLAR);

    const info = db.prepare(`INSERT INTO transactions (external_id, user_id, card_id, merchant_id, amount_cents, discount_cents, offer_id, points_earned, points_spent, saved_from_expiring, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(externalId, userId, card.id, merchantId, amountCents, discount, best?.id ?? null, earned, best?.cost ?? 0, fromExpiring, at);
    const txId = Number(info.lastInsertRowid);
    earn(userId, earned, txId, at);

    const tierAfter = tierFor(lifetimeBefore + earned);
    if (tierRank(tierAfter.id) > tierRank(tierBefore.id)) {
      const n = visibleOffers().filter((o) => o.tier === tierAfter.id).length;
      event(userId, 'tier', `You reached ${tierAfter.name}`, `${n} more rewards are now available.`);
    }
    return { duplicate: false, transaction: db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId), applied: best, tierUp: tierAfter.id !== tierBefore.id ? tierAfter.id : null };
  });
}

export function activity(userId) {
  const txs = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY occurred_at DESC LIMIT 200').all(userId);
  const offers = Object.fromEntries(db.prepare('SELECT id, title FROM offers').all().map((o) => [o.id, o.title]));
  const events = db.prepare('SELECT * FROM events WHERE user_id = ? ORDER BY at DESC LIMIT 100').all(userId);
  return {
    transactions: txs.map((t) => ({
      id: t.id, merchantId: t.merchant_id, merchant: merchantById(t.merchant_id)?.name ?? t.merchant_id,
      amount: t.amount_cents / 100, discount: t.discount_cents / 100, offerId: t.offer_id, offerTitle: t.offer_id ? offers[t.offer_id] : null,
      pointsEarned: t.points_earned, pointsSpent: t.points_spent, savedFromExpiring: t.saved_from_expiring, at: t.occurred_at,
    })),
    events: events.map((e) => ({ id: e.id, kind: e.kind, title: e.title, detail: e.detail, at: e.at })),
  };
}

export { TIERS };
