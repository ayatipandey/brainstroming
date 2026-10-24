// Scoring shared by the server and the app (on-device fallback).
// The rules baseline follows the challenge spec exactly; the model is a
// logistic regression trained on synthetic data (see /model).

import {
  CATEGORIES, OFFERS, MOMENTS, merchantById, offerForMerchant, formatHour, describeWindows,
} from './catalog.js';

export const THRESHOLD = 0.7;
export const EXPIRY_HORIZON = 14; // days on the expiry clock

export const FEATURES = ['in_window', 'favorite', 'special', 'urgency', 'near', 'late', 'fav_x_window'];

export function inWindow(category, hour) {
  return CATEGORIES[category].windows.some(([a, b]) => hour >= a && hour < b);
}

const isLate = (hour) => hour >= 22 || hour < 6;

function favoriteCategories(favorites) {
  if (!favorites) return [];
  if (Array.isArray(favorites)) return favorites;
  return Object.keys(favorites).filter((k) => favorites[k]);
}

export function featureVector({ category, hour, favorite, special, daysUntilExpiry, near }) {
  const w = inWindow(category, hour) ? 1 : 0;
  const f = favorite ? 1 : 0;
  const days = daysUntilExpiry ?? null;
  const urgency = days !== null && days <= EXPIRY_HORIZON ? (EXPIRY_HORIZON - Math.max(0, days)) / EXPIRY_HORIZON : 0;
  return [w, f, special ? 1 : 0, urgency, near ? 1 : 0, isLate(hour) ? 1 : 0, f * w];
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const pts = (x) => `${x > 0 ? '+' : '−'}${Math.round(Math.abs(x) * 100)}`;

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

// Rules baseline, exactly as specified.
export function rulesScore(c) {
  const label = CATEGORIES[c.category].label.toLowerCase();
  const reasons = [{ text: 'Every moment starts at 50', amount: '50', effect: 'neutral' }];
  let s = 0.5;
  if (inWindow(c.category, c.hour)) {
    s += 0.15;
    reasons.push({ text: `${formatHour(c.hour)} is inside ${label} hours (${describeWindows(c.category)})`, amount: pts(0.15), effect: 'up' });
  } else {
    s -= 0.25;
    reasons.push({ text: `${formatHour(c.hour)} is outside ${label} hours (${describeWindows(c.category)})`, amount: pts(-0.25), effect: 'down' });
  }
  if (c.favorite) {
    s += 0.15;
    reasons.push({ text: `${CATEGORIES[c.category].label} is one of your favorite categories`, amount: pts(0.15), effect: 'up' });
  }
  if (c.special) {
    s += 0.1;
    reasons.push({ text: `It is ${MOMENTS[c.special].label.toLowerCase()}`, amount: pts(0.1), effect: 'up' });
  }
  if (c.daysUntilExpiry != null && c.daysUntilExpiry <= EXPIRY_HORIZON) {
    s += 0.1;
    reasons.push({ text: `Points expire in ${plural(c.daysUntilExpiry, 'day')}`, amount: pts(0.1), effect: 'up' });
  }
  return { score: clamp(s, 0, 0.99), reasons };
}

// Logistic regression from model.json.
export function modelScore(c, model) {
  const x = featureVector(c);
  let z = model.bias;
  const contributions = x.map((xi, i) => {
    const v = model.weights[i] * xi;
    z += v;
    return v;
  });
  const label = CATEGORIES[c.category].label.toLowerCase();
  const text = {
    in_window: `${formatHour(c.hour)} is inside ${label} hours`,
    favorite: `${CATEGORIES[c.category].label} is one of your favorite categories`,
    special: c.special ? `It is ${MOMENTS[c.special].label.toLowerCase()}` : '',
    urgency: `Points expire in ${plural(c.daysUntilExpiry ?? 0, 'day')}`,
    near: c.merchantName ? `You are near ${c.merchantName}` : 'You are nearby',
    late: `${formatHour(c.hour)} is late at night`,
    fav_x_window: 'A favorite, at a time you usually buy it',
  };
  const reasons = FEATURES
    .map((name, i) => ({ name, v: contributions[i], x: x[i] }))
    .filter((r) => r.x !== 0 && Math.abs(r.v) > 0.05)
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
    .map((r) => ({ text: text[r.name], effect: r.v > 0 ? 'up' : 'down', amount: r.v > 0 ? 'raises' : 'lowers' }));
  if (!inWindow(c.category, c.hour)) {
    reasons.push({ text: `${formatHour(c.hour)} is outside ${label} hours`, effect: 'down', amount: 'lowers' });
  }
  return { score: clamp(sigmoid(z), 0, 0.99), reasons };
}

function inQuietHours(hour, quiet) {
  if (!quiet || !quiet.on) return false;
  const { start, end } = quiet;
  return start > end ? hour >= start || hour < end : hour >= start && hour < end;
}

// Build candidate moments from a request. A place near a merchant scores that
// merchant's offer; "elsewhere" scores each favorite brand's offer.
function candidates(req) {
  const favCats = favoriteCategories(req.favorites);
  const special = req.specialMoment && req.specialMoment !== 'none' ? req.specialMoment : null;
  const base = { hour: req.time, daysUntilExpiry: req.daysUntilExpiry ?? null, special };
  const merchant = merchantById(req.place);
  if (merchant) {
    const offer = offerForMerchant(merchant.id);
    return [{ ...base, offer, category: merchant.category, near: true, merchantName: merchant.name, favorite: favCats.includes(merchant.category) }];
  }
  const pool = favCats.length ? OFFERS.filter((o) => favCats.includes(merchantById(o.merchantId).category)) : OFFERS;
  return pool.map((offer) => {
    const m = merchantById(offer.merchantId);
    return { ...base, offer, category: m.category, near: false, merchantName: m.name, favorite: favCats.includes(m.category) };
  });
}

/**
 * Decide whether to send a nudge.
 * req: { place, time (hour, 0-24), favorites, daysUntilExpiry, specialMoment,
 *        policy?: { quietHours: {on,start,end}, dailyLimit, sentToday } }
 */
export function decide(req, { model, method } = {}) {
  const scorer = model ? (c) => modelScore(c, model) : rulesScore;
  const scored = candidates(req)
    .map((c) => ({ c, ...scorer(c) }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  const policy = req.policy || {};
  const result = {
    send: best.score >= THRESHOLD,
    offerId: best.c.offer.id,
    score: Math.round(best.score * 100) / 100,
    threshold: THRESHOLD,
    reasons: best.reasons,
    method: method || (model ? 'model' : 'rules'),
    held: null,
  };
  if (result.send && inQuietHours(req.time, policy.quietHours)) {
    result.send = false;
    result.held = 'quiet-hours';
    result.reasons = [...result.reasons, { text: `Quiet hours are on (${formatHour(policy.quietHours.start)} to ${formatHour(policy.quietHours.end)})`, effect: 'down', amount: 'held' }];
  } else if (result.send && policy.dailyLimit != null && (policy.sentToday ?? 0) >= policy.dailyLimit) {
    result.send = false;
    result.held = 'daily-limit';
    result.reasons = [...result.reasons, { text: `You already had ${plural(policy.sentToday, 'nudge')} today, your limit`, effect: 'down', amount: 'held' }];
  } else if (!result.send) {
    result.reasons = [...result.reasons, { text: `${Math.round(best.score * 100)}% is below the 70% bar, so nothing is sent`, effect: 'down', amount: 'quiet' }];
    if (inQuietHours(req.time, policy.quietHours)) {
      result.reasons.push({ text: `Quiet hours are on too (${formatHour(policy.quietHours.start)} to ${formatHour(policy.quietHours.end)})`, effect: 'down', amount: 'held' });
    }
  }
  return result;
}
