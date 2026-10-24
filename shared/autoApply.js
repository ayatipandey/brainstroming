// Simulated payment handling. In a real deployment this sits on FIS Premium
// Payback, which redeems points for discounts in real time. Here nothing is
// charged: it only changes demo state.

import { CATEGORIES, merchantById, money, POINT_VALUE } from './catalog.js';
import { EXPIRY_HORIZON } from './scoring.js';

export const UNDO_SECONDS = 10;

const byExpiry = (a, b) => (a.expiresInDays ?? Infinity) - (b.expiresInDays ?? Infinity);

export const balanceOf = (lots) => lots.reduce((n, l) => n + l.points, 0);

// Take points from lots, soonest-expiring first.
export function takePoints(lots, wanted) {
  const sorted = [...lots].sort(byExpiry);
  let left = wanted;
  let fromExpiring = 0;
  const after = sorted.map((lot) => {
    const use = Math.min(lot.points, left);
    left -= use;
    if (lot.expiresInDays != null && lot.expiresInDays <= EXPIRY_HORIZON) fromExpiring += use;
    return { ...lot, points: lot.points - use };
  }).filter((l) => l.points > 0);
  return { lots: after, used: wanted - left, fromExpiring };
}

/**
 * Check auto-apply rules for a simulated payment.
 * Returns { status: 'applied' | 'ask' | 'none', ... }.
 * 'ask' means auto-apply is off or does not cover this purchase, so the app
 * asks "Apply points now?" instead.
 */
export function evaluatePayment({ card, merchantId, amount, lots }) {
  const merchant = merchantById(merchantId);
  const category = merchant.category;
  const rules = card.autoApply || { on: false, limit: 5, categories: [] };
  const balance = balanceOf(lots);
  const reasons = [];
  const coverable = Math.min(amount, rules.limit);
  const pointsNeeded = Math.round(coverable / POINT_VALUE);

  if (balance <= 0) {
    return { status: 'none', merchant, amount, reasons: [{ text: 'No points left to apply', ok: false }] };
  }

  reasons.push(rules.on
    ? { text: `Auto-apply is on for ${card.bank} ending ${card.last4}`, ok: true }
    : { text: `Auto-apply is off for ${card.bank} ending ${card.last4}`, ok: false });
  const categoryOk = rules.categories.includes(category);
  reasons.push(categoryOk
    ? { text: `${CATEGORIES[category].label} is a category you allowed`, ok: true }
    : { text: `${CATEGORIES[category].label} is not in your auto-apply categories`, ok: false });
  reasons.push({ text: `Your limit is ${money(rules.limit)} per purchase`, ok: true });

  const points = Math.min(pointsNeeded, balance);
  const take = takePoints(lots, points);
  const covered = Math.round(take.used * POINT_VALUE * 100) / 100;
  reasons.push(take.used >= pointsNeeded
    ? { text: `You have enough points (${balance.toLocaleString()})`, ok: true }
    : { text: `Only ${balance.toLocaleString()} points available, so we used them all`, ok: true });
  if (take.fromExpiring > 0) {
    reasons.push({ text: `${take.fromExpiring.toLocaleString()} of these points were about to expire, so they went first`, ok: true });
  }

  const quote = {
    merchant, amount, card,
    points: take.used,
    covered,
    paid: Math.round((amount - covered) * 100) / 100,
    lotsAfter: take.lots,
    savedFromExpiring: Math.round(take.fromExpiring * POINT_VALUE * 100) / 100,
    reasons,
  };
  return rules.on && categoryOk ? { status: 'applied', ...quote } : { status: 'ask', ...quote };
}

export function confirmationText(q) {
  return `You paid ${money(q.amount)} at ${q.merchant.name}. ${q.points.toLocaleString()} points covered ${money(q.covered)}, so you paid ${money(q.paid)}.`;
}
