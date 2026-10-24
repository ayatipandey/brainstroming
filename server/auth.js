// Accounts, sessions and request guards. Passwords use scrypt; sessions are
// random tokens in an httpOnly cookie, stored only as a SHA-256 hash.
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { db, now } from './db.js';

const SESSION_DAYS = 30;
const COOKIE = 'sid';
export const isProd = process.env.NODE_ENV === 'production';

export const sha256 = (s) => createHash('sha256').update(s).digest('hex');
export const token = () => randomBytes(32).toString('base64url');

export function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`;
}

export function verifyPassword(pw, stored) {
  const [alg, N, r, p, salt, key] = stored.split('$');
  if (alg !== 'scrypt') return false;
  const expected = Buffer.from(key, 'base64');
  const got = scryptSync(pw, Buffer.from(salt, 'base64'), expected.length, { N: +N, r: +r, p: +p });
  return timingSafeEqual(got, expected);
}

export function passwordProblem(pw) {
  if (typeof pw !== 'string' || pw.length < 10) return 'Use at least 10 characters.';
  if (pw.length > 200) return 'Use 200 characters or fewer.';
  return null;
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((p) => p.trim().split('=')).filter((x) => x[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
}

function cookieAttrs(maxAgeSeconds) {
  return [`Path=/`, 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`, isProd ? 'Secure' : null].filter(Boolean).join('; ');
}

export function startSession(res, userId) {
  const t = token();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha256(t), userId, expires);
  res.setHeader('Set-Cookie', `${COOKIE}=${t}; ${cookieAttrs(SESSION_DAYS * 86400)}`);
}

export function endSession(req, res) {
  const t = parseCookies(req.headers.cookie)[COOKIE];
  if (t) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(t));
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieAttrs(0)}`);
}

/** Attaches req.user when a valid session cookie is present. */
export function loadUser(req, _res, next) {
  const t = parseCookies(req.headers.cookie)[COOKIE];
  if (t) {
    const row = db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`).get(sha256(t), now());
    if (row) req.user = row;
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in to continue.' });
  next();
}

export function requireVerified(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in to continue.' });
  if (!req.user.email_verified_at) return res.status(403).json({ error: 'Verify your email address first. We sent you a link when you signed up.' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ error: 'Admins only.' });
  next();
}

/**
 * Cross-site request guard for cookie-authenticated writes: state-changing
 * requests must be JSON and, when the browser sends an Origin, come from
 * this site. SameSite=Lax cookies cover the rest.
 */
export function sameOriginWrites(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.path.startsWith('/api/ingest/')) return next(); // server-to-server, key-authenticated
  const origin = req.get('origin');
  const host = req.get('x-forwarded-host') || req.get('host');
  if (origin && new URL(origin).host !== host) return res.status(403).json({ error: 'Cross-site request refused.' });
  if (req.body && Object.keys(req.body).length && !req.is('application/json')) return res.status(415).json({ error: 'Send JSON.' });
  next();
}

// Small in-memory limiter for sign-in and sign-up.
const hits = new Map();
export function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = `${req.path}:${req.ip}`;
    const t = Date.now();
    const list = (hits.get(key) || []).filter((x) => t - x < windowMs);
    if (list.length >= max) return res.status(429).json({ error: 'Too many attempts. Wait a minute and try again.' });
    list.push(t);
    hits.set(key, list);
    next();
  };
}
