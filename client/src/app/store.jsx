import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { REWARDS, tierFor, nextTier, tierRank, TIERS, rewardById } from '@shared/catalog.js';
import { rankRewards } from '@shared/rank.js';
import { payWithCard, receiptText } from '@shared/autoApply.js';
import model from '@shared/model.json';

// Demo state, kept in this browser only. The card keeps only the bank name
// and the last four digits.

const KEY = 'pp-rewards-v2';
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

export function initialState() {
  return {
    user: null,
    points: 1120,
    starred: ['cc-coffee'],
    used: {},
    card: { bank: 'Harbor Bank', last4: '4821', autoApply: true },
    activity: [
      { id: 'a0', at: new Date(Date.now() - 2 * 864e5).toISOString(), kind: 'tier', title: 'You reached Silver', detail: '3 more rewards unlocked.' },
    ],
    toasts: [],
  };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    return raw ? { ...initialState(), ...raw, toasts: [] } : initialState();
  } catch {
    return initialState();
  }
}

const log = (s, e) => ({ ...s, activity: [{ id: uid(), at: now(), ...e }, ...s.activity].slice(0, 60) });

function addPoints(s, earned) {
  const before = tierFor(s.points);
  const points = s.points + earned;
  const after = tierFor(points);
  let next = { ...s, points };
  if (tierRank(after.id) > tierRank(before.id)) {
    const unlocked = REWARDS.filter((r) => r.tier === after.id).length;
    next = log(next, { kind: 'tier', title: `You reached ${after.name}`, detail: `${unlocked} new rewards unlocked.` });
    next.toasts = [{ id: uid(), kind: 'tier', title: `You reached ${after.name}`, body: `${unlocked} new rewards are unlocked and waiting in your list.` }, ...next.toasts];
  }
  return next;
}

function reducer(s, a) {
  switch (a.type) {
    case 'sign-in':
      return { ...s, user: { name: a.name } };
    case 'sign-out':
      return { ...s, user: null };
    case 'star': {
      const on = s.starred.includes(a.id);
      return { ...s, starred: on ? s.starred.filter((x) => x !== a.id) : [...s.starred, a.id] };
    }
    case 'use': {
      // Used at the counter with the QR or the code.
      const r = rewardById(a.id);
      if (s.used[r.id]) return s;
      let next = { ...s, used: { ...s.used, [r.id]: now() } };
      next = log(next, { kind: 'use', title: `Used: ${r.title}`, detail: `Shown at the counter. +${r.earn} points.`, points: r.earn });
      next.toasts = [{ id: uid(), kind: 'use', title: 'Reward used', body: `${r.title}. You earned ${r.earn} points.` }, ...next.toasts];
      return addPoints(next, r.earn);
    }
    case 'pay': {
      const p = payWithCard({ merchantId: a.merchantId, amount: a.amount, available: a.available, autoApply: !!s.card?.autoApply });
      let next = s;
      if (p.reward) next = { ...next, used: { ...next.used, [p.reward.id]: now() } };
      next = log(next, {
        kind: 'pay',
        title: `${p.merchant.name}, $${p.amount.toFixed(2)}`,
        detail: p.reward ? `${p.reward.title} applied automatically. You paid $${p.paid.toFixed(2)}.` : `No reward applied. ${p.missed ? 'Auto-apply is off.' : p.note || 'No reward at this store yet.'}`,
        points: p.earned,
      });
      next.toasts = [{
        id: uid(), kind: p.reward ? 'applied' : 'paid',
        title: p.reward ? 'Reward applied' : 'Payment recorded',
        body: receiptText(p) + (p.missed ? ` You had “${p.missed.title}” here; turn on auto-apply to use it next time.` : '') + (p.note ? ` ${p.note}` : ''),
        rewardId: p.reward?.id,
      }, ...next.toasts.filter((t) => t.kind !== 'applied' && t.kind !== 'paid')];
      return addPoints(next, p.earned);
    }
    case 'auto-apply':
      return { ...s, card: { ...s.card, autoApply: a.on } };
    case 'link-card':
      return log({ ...s, card: { bank: a.bank, last4: a.last4, autoApply: true } }, { kind: 'card', title: `Linked ${a.bank}, ending ${a.last4}`, detail: 'Kept: bank name and last four digits.' });
    case 'unlink-card':
      return log({ ...s, card: null }, { kind: 'card', title: 'Card removed', detail: 'Nothing about the card is kept.' });
    case 'dismiss':
      return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };
    case 'reset':
      return { ...initialState(), user: s.user };
    default:
      return s;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      const { toasts, ...keep } = state;
      localStorage.setItem(KEY, JSON.stringify(keep));
    } catch { /* storage unavailable */ }
  }, [state]);

  const derived = useMemo(() => {
    const tier = tierFor(state.points);
    const next = nextTier(state.points);
    const unlocked = REWARDS.filter((r) => tierRank(r.tier) <= tierRank(tier.id));
    const available = unlocked.filter((r) => !state.used[r.id]);
    const locked = REWARDS.filter((r) => tierRank(r.tier) > tierRank(tier.id));
    const d = new Date();
    const ranked = rankRewards(available, { starred: new Set(state.starred), hour: d.getHours() + d.getMinutes() / 60, model });
    const progress = next ? (state.points - tier.min) / (next.min - tier.min) : 1;
    return { tier, next, unlocked, available, locked, ranked, progress, tiers: TIERS };
  }, [state.points, state.used, state.starred]);

  const act = useCallback((type, payload = {}) => dispatch({ type, ...payload }), []);
  const pay = useCallback((merchantId, amount) => dispatch({ type: 'pay', merchantId, amount, available: derived.available }), [derived.available]);
  const value = useMemo(() => ({ state, ...derived, act, pay }), [state, derived, act, pay]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
