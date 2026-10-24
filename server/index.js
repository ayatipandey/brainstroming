import express from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { BRAND } from '../shared/brand.config.js';
import { decide } from '../shared/scoring.js';
import { rankRewards } from '../shared/rank.js';
import { CATEGORY_IDS, MOMENTS, MERCHANTS, merchantById, tierRank, tierFor } from '../shared/catalog.js';
import { db, now } from './db.js';
import {
  hashPassword, verifyPassword, passwordProblem, startSession, endSession, loadUser, requireUser, requireVerified,
  requireAdmin, sameOriginWrites, rateLimit, sha256, token, isProd,
} from './auth.js';
import { sendMail, recentMail } from './mailer.js';
import { summary, visibleOffers, ingestTransaction, activity, offerFromRow } from './points.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const model = JSON.parse(readFileSync(path.join(here, '../shared/model.json'), 'utf8'));
const app = express();
const PORT = process.env.PORT || 3001;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const DEV_TOOLS = process.env.ENABLE_DEV_TOOLS ? process.env.ENABLE_DEV_TOOLS === '1' : !isProd;
const INGEST_KEY = process.env.INGEST_API_KEY || (isProd ? null : 'dev-ingest-key');
const BANKS = ['Harbor Bank', 'Summit Credit Union', 'First Meridian'];
export const CONSENT_KINDS = ['terms', 'marketing', 'notifications', 'card_linking'];

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '16kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
app.use(loadUser);
app.use(sameOriginWrites);

const clean = (s, max = 100) => String(s ?? '').trim().slice(0, max);
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function logConsent(userId, kind, granted) {
  db.prepare('INSERT INTO consents (user_id, kind, granted, policy_version) VALUES (?, ?, ?, ?)').run(userId, kind, granted ? 1 : 0, BRAND.policyVersion);
}

function currentConsents(userId) {
  const rows = db.prepare(`SELECT kind, granted, policy_version, at FROM consents c WHERE user_id = ? AND id = (
    SELECT MAX(id) FROM consents WHERE user_id = c.user_id AND kind = c.kind)`).all(userId);
  return Object.fromEntries(CONSENT_KINDS.map((k) => {
    const r = rows.find((x) => x.kind === k);
    return [k, r ? { granted: !!r.granted, policyVersion: r.policy_version, at: r.at } : { granted: false, policyVersion: null, at: null }];
  }));
}

function me(user) {
  const cards = db.prepare('SELECT id, bank, last4, auto_apply, created_at FROM cards WHERE user_id = ? ORDER BY id').all(user.id)
    .map((c) => ({ id: c.id, bank: c.bank, last4: c.last4, autoApply: !!c.auto_apply, linkedAt: c.created_at }));
  return {
    user: { firstName: user.first_name, email: user.email, verified: !!user.email_verified_at, isAdmin: !!user.is_admin },
    summary: summary(user.id),
    cards,
    consents: currentConsents(user.id),
  };
}

async function sendVerification(user) {
  const t = token();
  db.prepare('INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at) VALUES (?, ?, ?, ?)')
    .run(sha256(t), user.id, 'verify', new Date(Date.now() + 2 * 864e5).toISOString());
  await sendMail({
    to: user.email,
    subject: `Confirm your email for ${BRAND.name}`,
    text: `Hi ${user.first_name},\n\nConfirm your email address to start using ${BRAND.name}:\n${APP_URL}/app/verify?token=${t}\n\nThe link works for 48 hours. If you did not sign up, ignore this email.`,
  });
}

/* ---------- Accounts ---------- */

app.post('/api/auth/signup', rateLimit(10, 60_000), async (req, res) => {
  const firstName = clean(req.body.firstName, 60);
  const email = clean(req.body.email, 254).toLowerCase();
  const { password, consents = {} } = req.body;
  const errors = {};
  if (!firstName) errors.firstName = 'Enter your first name.';
  if (!isEmail(email)) errors.email = 'Enter an email address like name@example.com.';
  const pwErr = passwordProblem(password);
  if (pwErr) errors.password = pwErr;
  if (consents.terms !== true) errors.terms = 'Agree to the Terms and the Privacy policy to create an account.';
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Check the highlighted fields.', fields: errors });
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.', fields: { email: 'Already registered.' } });
  }
  const info = db.prepare('INSERT INTO users (email, password_hash, first_name) VALUES (?, ?, ?)').run(email, hashPassword(password), firstName);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(info.lastInsertRowid));
  logConsent(user.id, 'terms', true);
  logConsent(user.id, 'marketing', consents.marketing === true);
  try {
    await sendVerification(user);
  } catch (e) {
    return res.status(503).json({ error: e.message });
  }
  startSession(res, user.id);
  res.status(201).json(me(user));
});

app.post('/api/auth/login', rateLimit(10, 60_000), (req, res) => {
  const email = clean(req.body.email, 254).toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(String(req.body.password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'That email and password do not match an account.' });
  }
  startSession(res, user.id);
  res.json(me(user));
});

app.post('/api/auth/logout', (req, res) => {
  endSession(req, res);
  res.json({ ok: true });
});

app.post('/api/auth/verify', (req, res) => {
  const row = db.prepare(`SELECT * FROM email_tokens WHERE token_hash = ? AND purpose = 'verify' AND used_at IS NULL AND expires_at > ?`)
    .get(sha256(String(req.body.token || '')), now());
  if (!row) return res.status(400).json({ error: 'This link has expired or was already used. Sign in and ask for a new one.' });
  db.prepare('UPDATE email_tokens SET used_at = ? WHERE token_hash = ?').run(now(), row.token_hash);
  db.prepare('UPDATE users SET email_verified_at = ? WHERE id = ? AND email_verified_at IS NULL').run(now(), row.user_id);
  res.json({ ok: true });
});

app.post('/api/auth/resend', requireUser, rateLimit(3, 60_000), async (req, res) => {
  if (req.user.email_verified_at) return res.json({ ok: true });
  try {
    await sendVerification(req.user);
    res.json({ ok: true });
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
});

app.get('/api/me', requireUser, (req, res) => res.json(me(req.user)));

/* ---------- Offers ---------- */

app.get('/api/offers', requireUser, (req, res) => {
  const hour = Math.min(23.99, Math.max(0, Number(req.query.hour) || new Date().getHours()));
  const s = summary(req.user.id);
  const used = new Set(s.used);
  const all = visibleOffers();
  const favBrands = new Set(s.brands);
  const stars = new Set([...s.stars, ...all.filter((o) => favBrands.has(o.merchantId)).map((o) => o.id)]);
  const unlockedNow = (o) => tierRank(o.tier) <= tierRank(s.tier);
  const available = all.filter((o) => unlockedNow(o) && !used.has(o.id));
  const ranked = rankRewards(available, { starred: stars, hour, model });
  res.json({
    ranked: ranked.map((r) => ({ ...r.reward, score: Math.round(r.score * 100) / 100, why: r.why, affordable: r.reward.cost <= s.balance })),
    locked: all.filter((o) => !unlockedNow(o)),
    used: all.filter((o) => used.has(o.id)),
  });
});

app.post('/api/stars/:offerId', requireUser, (req, res) => {
  const offer = db.prepare('SELECT id FROM offers WHERE id = ?').get(req.params.offerId);
  if (!offer) return res.status(404).json({ error: 'No such reward.' });
  if (req.body.on) db.prepare('INSERT OR IGNORE INTO stars (user_id, offer_id) VALUES (?, ?)').run(req.user.id, offer.id);
  else db.prepare('DELETE FROM stars WHERE user_id = ? AND offer_id = ?').run(req.user.id, offer.id);
  res.json({ ok: true });
});

app.get('/api/brands', requireUser, (req, res) => {
  const fav = new Set(summary(req.user.id).brands);
  res.json(MERCHANTS.map((m) => ({ ...m, favorite: fav.has(m.id) })));
});

app.post('/api/brands/:id', requireUser, (req, res) => {
  if (!merchantById(req.params.id)) return res.status(404).json({ error: 'No such brand.' });
  if (req.body.on) db.prepare('INSERT OR IGNORE INTO favorite_brands (user_id, merchant_id) VALUES (?, ?)').run(req.user.id, req.params.id);
  else db.prepare('DELETE FROM favorite_brands WHERE user_id = ? AND merchant_id = ?').run(req.user.id, req.params.id);
  res.json({ ok: true });
});

/* ---------- Cards ---------- */

app.get('/api/banks', (_req, res) => res.json(BANKS));

app.post('/api/cards', requireVerified, (req, res) => {
  const bank = clean(req.body.bank, 60);
  const last4 = clean(req.body.last4, 4);
  const fields = {};
  if (!BANKS.includes(bank)) fields.bank = 'Choose your bank from the list.';
  if (!/^\d{4}$/.test(last4)) fields.last4 = 'Enter the last four digits shown on your card.';
  if (req.body.consent !== true) fields.consent = 'Agree to card linking to continue.';
  if (Object.keys(fields).length) return res.status(400).json({ error: 'Check the highlighted fields.', fields });
  if (db.prepare('SELECT 1 FROM cards WHERE user_id = ? AND bank = ? AND last4 = ?').get(req.user.id, bank, last4)) {
    return res.status(409).json({ error: 'This card is already linked.' });
  }
  logConsent(req.user.id, 'card_linking', true);
  db.prepare('INSERT INTO cards (user_id, bank, last4, card_ref) VALUES (?, ?, ?, ?)').run(req.user.id, bank, last4, `card_${token().slice(0, 20)}`);
  db.prepare('INSERT INTO events (user_id, kind, title, detail) VALUES (?, ?, ?, ?)').run(req.user.id, 'card', `Linked ${bank}, ending ${last4}`, 'Kept: bank name and last four digits.');
  res.status(201).json(me(req.user));
});

app.patch('/api/cards/:id', requireUser, (req, res) => {
  const r = db.prepare('UPDATE cards SET auto_apply = ? WHERE id = ? AND user_id = ?').run(req.body.autoApply ? 1 : 0, Number(req.params.id), req.user.id);
  if (!r.changes) return res.status(404).json({ error: 'No such card.' });
  res.json(me(req.user));
});

app.delete('/api/cards/:id', requireUser, (req, res) => {
  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.user.id);
  if (!card) return res.status(404).json({ error: 'No such card.' });
  db.prepare('DELETE FROM cards WHERE id = ?').run(card.id);
  db.prepare('INSERT INTO events (user_id, kind, title, detail) VALUES (?, ?, ?, ?)').run(req.user.id, 'card', `Removed ${card.bank}, ending ${card.last4}`, 'Nothing about this card is kept.');
  if (!db.prepare('SELECT 1 FROM cards WHERE user_id = ?').get(req.user.id)) logConsent(req.user.id, 'card_linking', false);
  res.json(me(req.user));
});

/* ---------- Activity, consent, data ---------- */

app.get('/api/activity', requireUser, (req, res) => res.json(activity(req.user.id)));

app.post('/api/consents', requireUser, (req, res) => {
  const kind = String(req.body.kind);
  if (!['marketing', 'notifications'].includes(kind)) return res.status(400).json({ error: 'This consent is changed elsewhere.' });
  logConsent(req.user.id, kind, req.body.granted === true);
  res.json(me(req.user));
});

app.get('/api/me/export', requireUser, (req, res) => {
  const id = req.user.id;
  const pick = (sql) => db.prepare(sql).all(id);
  res.setHeader('Content-Disposition', 'attachment; filename="my-data.json"');
  res.json({
    exportedAt: now(),
    account: { firstName: req.user.first_name, email: req.user.email, emailVerifiedAt: req.user.email_verified_at, createdAt: req.user.created_at },
    consents: pick('SELECT kind, granted, policy_version, at FROM consents WHERE user_id = ? ORDER BY id'),
    cards: pick('SELECT bank, last4, auto_apply, created_at FROM cards WHERE user_id = ?'),
    transactions: pick('SELECT merchant_id, amount_cents, discount_cents, offer_id, points_earned, points_spent, occurred_at FROM transactions WHERE user_id = ?'),
    points: pick('SELECT amount, remaining, earned_at, expires_at FROM point_lots WHERE user_id = ?'),
    stars: pick('SELECT offer_id FROM stars WHERE user_id = ?'),
    favoriteBrands: pick('SELECT merchant_id FROM favorite_brands WHERE user_id = ?'),
    events: pick('SELECT kind, title, detail, at FROM events WHERE user_id = ?'),
  });
});

app.delete('/api/me', requireUser, (req, res) => {
  if (!verifyPassword(String(req.body.password || ''), req.user.password_hash)) {
    return res.status(401).json({ error: 'That password is not right. Your account was not deleted.' });
  }
  endSession(req, res);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.json({ ok: true });
});

/* ---------- Transaction ingestion (card processor) ---------- */

function ingestBody(b) {
  const amountCents = Math.round(Number(b.amount) * 100);
  const errors = [];
  if (!b.externalId || String(b.externalId).length > 100) errors.push('externalId is required (max 100 characters)');
  if (!b.cardRef) errors.push('cardRef is required');
  if (!merchantById(b.merchantId)) errors.push(`merchantId must be one of: ${MERCHANTS.map((m) => m.id).join(', ')}`);
  if (!(amountCents > 0 && amountCents <= 1_000_000)) errors.push('amount must be between 0.01 and 10000');
  return { errors, data: { externalId: String(b.externalId), cardRef: String(b.cardRef), merchantId: b.merchantId, amountCents, occurredAt: b.occurredAt ? new Date(b.occurredAt).toISOString() : undefined } };
}

app.post('/api/ingest/transactions', (req, res) => {
  if (!INGEST_KEY || req.get('x-ingest-key') !== INGEST_KEY) return res.status(401).json({ error: 'Invalid ingestion key.' });
  const { errors, data } = ingestBody(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Invalid transaction', details: errors });
  const r = ingestTransaction(data);
  if (r.error) return res.status(r.status).json({ error: r.error });
  res.status(r.duplicate ? 200 : 201).json({ duplicate: r.duplicate, transactionId: r.transaction.id, appliedOfferId: r.transaction.offer_id, discount: r.transaction.discount_cents / 100, pointsEarned: r.transaction.points_earned });
});

/* ---------- Admin ---------- */

app.get('/api/admin/offers', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT o.*, m.name AS merchant FROM offers o JOIN merchants m ON m.id = o.merchant_id ORDER BY o.tier, o.id').all()
    .map((r) => ({ ...offerFromRow(r), merchant: r.merchant, sourceNote: r.source_note })));
});

app.patch('/api/admin/offers/:id', requireAdmin, (req, res) => {
  const status = req.body.status;
  if (!['placeholder', 'confirmed'].includes(status)) return res.status(400).json({ error: 'status must be placeholder or confirmed' });
  db.prepare('UPDATE offers SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

/* ---------- Developer simulator (never in production unless ENABLE_DEV_TOOLS=1) ---------- */

if (DEV_TOOLS) {
  app.get('/api/dev/state', (_req, res) => {
    res.json({
      users: db.prepare('SELECT id, email, first_name, email_verified_at, is_admin FROM users ORDER BY id DESC LIMIT 50').all(),
      cards: db.prepare('SELECT c.id, c.user_id, c.bank, c.last4, c.card_ref, c.auto_apply, u.email FROM cards c JOIN users u ON u.id = c.user_id ORDER BY c.id DESC LIMIT 50').all(),
      merchants: MERCHANTS,
      mail: recentMail(10),
      ingestKey: INGEST_KEY,
    });
  });
  app.post('/api/dev/transactions', (req, res) => {
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(Number(req.body.cardId));
    if (!card) return res.status(404).json({ error: 'Pick a linked card.' });
    const { errors, data } = ingestBody({ ...req.body, cardRef: card.card_ref, externalId: req.body.externalId || `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` });
    if (errors.length) return res.status(400).json({ error: errors.join('; ') });
    const r = ingestTransaction(data);
    res.json({ duplicate: r.duplicate, transaction: r.transaction, applied: r.applied ?? null });
  });
  app.post('/api/dev/admin', (req, res) => {
    db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(String(req.body.email || '').toLowerCase());
    res.json({ ok: true });
  });
  app.post('/api/dev/verify', (req, res) => {
    db.prepare('UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?').run(now(), Number(req.body.userId));
    res.json({ ok: true });
  });
  console.log('Developer tools are ON (/api/dev). They are off in production unless ENABLE_DEV_TOOLS=1.');
}

/* ---------- Scoring engine ---------- */

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/score', (req, res) => {
  const b = req.body || {};
  const errors = [];
  const places = ['elsewhere', ...MERCHANTS.map((m) => m.id)];
  if (!places.includes(b.place)) errors.push(`place must be one of: ${places.join(', ')}`);
  if (typeof b.time !== 'number' || b.time < 0 || b.time >= 24) errors.push('time must be an hour from 0 to 23.99');
  const favs = Array.isArray(b.favorites) ? b.favorites : [];
  if (favs.some((f) => !CATEGORY_IDS.includes(f))) errors.push(`favorites must be categories: ${CATEGORY_IDS.join(', ')}`);
  if (b.specialMoment != null && !(b.specialMoment in MOMENTS)) errors.push(`specialMoment must be one of: ${Object.keys(MOMENTS).join(', ')}`);
  if (errors.length) return res.status(400).json({ error: 'Invalid request', details: errors });
  res.json(decide(b, { model, method: 'server-model' }));
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

const dist = path.join(here, '../client/dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`${BRAND.name} API on http://localhost:${PORT}`));
export { tierFor };
