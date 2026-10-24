import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { PEOPLE, offerById, merchantById, POINT_VALUE, money } from '@shared/catalog.js';
import { EXPIRY_HORIZON } from '@shared/scoring.js';
import { evaluatePayment, takePoints, balanceOf, confirmationText, UNDO_SECONDS } from '@shared/autoApply.js';

// All app state is demo state, kept in this browser only. Cards hold only the
// bank name, the last four digits, and spending categories.

const KEY = 'pp-state-v1';
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

export function initialState() {
  const maya = PEOPLE[0];
  return {
    account: null,
    personId: maya.id,
    favorites: { ...maya.favorites },
    lots: [
      { id: 'lot-a', points: 300, expiresInDays: 3 },
      { id: 'lot-b', points: 1150, expiresInDays: 41 },
      { id: 'lot-c', points: 900, expiresInDays: null },
    ],
    cards: [
      { id: 'card-1', bank: 'Harbor Bank', last4: '4821', categories: ['coffee', 'food'], autoApply: { on: false, limit: 3, categories: ['coffee'] } },
    ],
    activity: [
      { id: 'a0', at: new Date(Date.now() - 864e5).toISOString(), kind: 'card', title: 'Linked Harbor Bank, ending 4821', detail: 'Kept: bank name, last four digits, coffee and food.' },
    ],
    saved: 0,
    perk: { date: null },
    settings: {
      dailyLimit: 2,
      quiet: { on: true, start: 22, end: 7 },
      location: false,
      accent: 'teal',
      challenge: false,
    },
    sentToday: { date: today(), count: 0 },
    heldByQuiet: false,
    nudges: [],
  };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    const s = raw ? { ...initialState(), ...raw, nudges: [] } : initialState();
    if (s.sentToday.date !== today()) s.sentToday = { date: today(), count: 0 };
    // Set by the Create account page.
    const name = localStorage.getItem('pp-account-name');
    if (name) {
      s.account = { name };
      localStorage.removeItem('pp-account-name');
    }
    return s;
  } catch {
    return initialState();
  }
}

const log = (s, entry) => ({ ...s, activity: [{ id: uid(), at: new Date().toISOString(), ...entry }, ...s.activity].slice(0, 80) });

function applyQuote(s, q, how) {
  const before = { lots: s.lots, saved: s.saved };
  let next = { ...s, lots: q.lotsAfter, saved: Math.round((s.saved + q.savedFromExpiring) * 100) / 100 };
  const paymentId = uid();
  next = log(next, {
    kind: 'payment',
    paymentId,
    title: `${q.merchant.name}, ${money(q.amount)}`,
    detail: `${how}: ${q.points.toLocaleString()} points covered ${money(q.covered)}, you paid ${money(q.paid)}. ${q.card.bank} ending ${q.card.last4}. Simulated.`,
    points: -q.points,
  });
  // Payment confirmations are always shown, whatever the nudge limit.
  next.nudges = [{
    id: uid(), kind: 'payment', paymentId, title: 'Points applied', body: confirmationText(q), reasons: q.reasons,
    undoUntil: Date.now() + UNDO_SECONDS * 1000, before,
  }, ...next.nudges.filter((n) => n.kind !== 'ask')];
  return next;
}

function reducer(s, a) {
  switch (a.type) {
    case 'account':
      return { ...s, account: { name: a.name } };
    case 'person': {
      const p = PEOPLE.find((x) => x.id === a.id);
      return { ...s, personId: p.id, favorites: { ...p.favorites } };
    }
    case 'favorite': {
      const favorites = { ...s.favorites };
      if (a.merchantId) favorites[a.category] = a.merchantId; else delete favorites[a.category];
      return { ...s, favorites };
    }
    case 'link-card': {
      const card = { id: uid(), bank: a.bank, last4: a.last4, categories: a.categories, autoApply: { on: false, limit: 5, categories: a.categories } };
      return log({ ...s, cards: [...s.cards, card] }, { kind: 'card', title: `Linked ${a.bank}, ending ${a.last4}`, detail: `Kept: bank name, last four digits, ${a.categories.join(' and ')}.` });
    }
    case 'remove-card': {
      const card = s.cards.find((c) => c.id === a.id);
      return log({ ...s, cards: s.cards.filter((c) => c.id !== a.id) }, { kind: 'card', title: `Removed ${card.bank}, ending ${card.last4}`, detail: 'Nothing about this card is kept.' });
    }
    case 'auto-apply':
      return { ...s, cards: s.cards.map((c) => (c.id === a.id ? { ...c, autoApply: { ...c.autoApply, ...a.patch } } : c)) };
    case 'settings':
      return { ...s, settings: { ...s.settings, ...a.patch } };
    case 'decision': {
      const r = a.result;
      const offer = offerById(r.offerId);
      const merchant = merchantById(offer.merchantId);
      if (r.send) {
        const next = log({ ...s, sentToday: { date: today(), count: s.sentToday.count + 1 } }, {
          kind: 'nudge', title: `Nudge sent: ${offer.title}`, detail: `${merchant.name}. Scored ${Math.round(r.score * 100)}% (${r.source === 'device' ? 'on this device' : 'server model'}).`,
        });
        next.nudges = [{ id: uid(), kind: 'offer', offerId: offer.id, title: offer.title, body: `${merchant.name}. ${offer.points} points, worth ${money(offer.value)}.`, reasons: r.reasons, score: r.score }, ...next.nudges];
        return next;
      }
      return log({ ...s, heldByQuiet: s.heldByQuiet || r.held === 'quiet-hours' }, {
        kind: 'quiet', title: r.held === 'quiet-hours' ? 'Held for quiet hours' : r.held === 'daily-limit' ? 'Held: daily limit reached' : 'Nothing sent',
        detail: `${merchant.name}. Scored ${Math.round(r.score * 100)}%, below or held at the 70% bar.`,
      });
    }
    case 'redeem': {
      const offer = offerById(a.offerId);
      const take = takePoints(s.lots, offer.points);
      const savedNow = Math.round(take.fromExpiring * POINT_VALUE * 100) / 100;
      return log({ ...s, lots: take.lots, saved: Math.round((s.saved + savedNow) * 100) / 100 }, {
        kind: 'redeem', title: `Redeemed: ${offer.title}`, detail: `${merchantById(offer.merchantId).name}. ${offer.points} points${take.fromExpiring ? `, ${take.fromExpiring} of them about to expire` : ''}.`, points: -offer.points,
      });
    }
    case 'payment': {
      const card = s.cards.find((c) => c.id === a.cardId);
      const q = evaluatePayment({ card, merchantId: a.merchantId, amount: a.amount, lots: s.lots });
      if (q.status === 'applied') return applyQuote(s, q, 'Auto-applied');
      if (q.status === 'ask') {
        const next = log(s, { kind: 'payment', title: `${q.merchant.name}, ${money(q.amount)}`, detail: `Paid in full on ${card.bank} ending ${card.last4}. Asked whether to apply points. Simulated.` });
        next.nudges = [{ id: uid(), kind: 'ask', quote: q, title: 'Apply points now?', body: `${money(q.amount)} at ${q.merchant.name}. ${q.points.toLocaleString()} points can cover ${money(q.covered)}.`, reasons: q.reasons }, ...next.nudges];
        return next;
      }
      return log(s, { kind: 'payment', title: `${q.merchant.name}, ${money(a.amount)}`, detail: 'No points left to apply. Simulated.' });
    }
    case 'confirm-ask': {
      const n = s.nudges.find((x) => x.id === a.id);
      if (!n) return s;
      return applyQuote({ ...s, nudges: s.nudges.filter((x) => x.id !== a.id) }, n.quote, 'Applied after payment');
    }
    case 'undo': {
      const n = s.nudges.find((x) => x.id === a.id);
      if (!n || Date.now() > n.undoUntil) return s;
      const next = log({ ...s, lots: n.before.lots, saved: n.before.saved, nudges: s.nudges.filter((x) => x.id !== a.id) }, {
        kind: 'undo', title: 'Undid points on a payment', detail: 'The points are back in your balance.',
      });
      next.activity = next.activity.map((e) => (e.paymentId === n.paymentId ? { ...e, undone: true } : e));
      return next;
    }
    case 'dismiss':
      return { ...s, nudges: s.nudges.filter((n) => n.id !== a.id) };
    case 'perk':
      return { ...s, perk: { date: today() } };
    case 'reset':
      return { ...initialState(), account: s.account };
    default:
      return s;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      const { nudges, ...persist } = state;
      localStorage.setItem(KEY, JSON.stringify(persist));
    } catch { /* storage unavailable: demo still works for this visit */ }
  }, [state]);

  const derived = useMemo(() => {
    const balance = balanceOf(state.lots);
    const expiringLots = state.lots.filter((l) => l.expiresInDays != null && l.expiresInDays <= EXPIRY_HORIZON);
    const soonest = expiringLots.sort((a, b) => a.expiresInDays - b.expiresInDays)[0] || null;
    const person = PEOPLE.find((p) => p.id === state.personId);
    const earned = {
      first: state.activity.some((e) => (e.kind === 'redeem' || e.kind === 'payment') && !e.undone && e.points < 0),
      saver: state.saved > 0,
      quiet: state.heldByQuiet,
      linked: state.cards.length > 0,
      week: state.settings.challenge,
    };
    return { balance, soonest, person, earned, name: state.account?.name || person.name };
  }, [state]);

  const act = useCallback((type, payload = {}) => dispatch({ type, ...payload }), []);
  const value = useMemo(() => ({ state, ...derived, act }), [state, derived, act]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
