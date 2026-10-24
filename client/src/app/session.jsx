import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { tierFor, nextTier, POINT_VALUE } from '@shared/catalog.js';
import { api } from './api.js';

// Account state from the server. The only things kept in the browser are
// reading preferences, the Activity view you picked, and the last payment you
// have seen (see the Cookies policy); the session is an httpOnly cookie.

const Ctx = createContext(null);
const POLL_MS = 10_000;
const SEEN_KEY = 'last-seen-transaction';

const readSeen = () => { try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; } };
const writeSeen = (id) => { try { localStorage.setItem(SEEN_KEY, String(id)); } catch { /* storage off */ } };

export function SessionProvider({ children }) {
  const [me, setMe] = useState(undefined); // undefined = loading, null = signed out
  const [offers, setOffers] = useState(null);
  const [activity, setActivity] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [arrival, setArrival] = useState(null); // a reward a card payment just applied
  const seen = useRef(readSeen());

  const refreshMe = useCallback(async () => {
    try {
      setMe(await api('/me'));
    } catch (e) {
      if (e.status === 401) setMe(null);
      else throw e;
    }
  }, []);

  const refreshOffers = useCallback(async () => {
    const d = new Date();
    setOffers(await api(`/offers?hour=${(d.getHours() + d.getMinutes() / 60).toFixed(2)}`));
  }, []);

  const refreshActivity = useCallback(async () => {
    const a = await api('/activity');
    setActivity(a);
    // Announce payments that arrived since we last looked.
    const fresh = a.transactions.filter((t) => t.id > seen.current).sort((x, y) => x.id - y.id);
    if (seen.current !== 0 && fresh.length) {
      for (const t of fresh) {
        setToasts((ts) => [{
          id: `t${t.id}`,
          title: t.offerId ? 'Reward applied' : 'Payment received',
          body: t.offerId
            ? `${t.offerTitle} at ${t.merchant}. You saved $${t.discount.toFixed(2)} and earned ${t.pointsEarned} points.`
            : `$${t.amount.toFixed(2)} at ${t.merchant}. You earned ${t.pointsEarned} points.`,
        }, ...ts].slice(0, 3));
        if (t.offerId) setArrival(t);
      }
    }
    seen.current = a.transactions.length ? Math.max(seen.current, ...a.transactions.map((t) => t.id)) : -1;
    writeSeen(seen.current);
    return a;
  }, []);

  const refreshAll = useCallback(async () => {
    await refreshMe();
    await Promise.all([refreshOffers(), refreshActivity()]);
  }, [refreshMe, refreshOffers, refreshActivity]);

  useEffect(() => { refreshMe().catch(() => setMe(null)); }, [refreshMe]);

  // Poll while signed in and visible, so payments show up without a reload.
  const email = me?.user?.email;
  useEffect(() => {
    if (!email) return undefined;
    refreshOffers().catch(() => {});
    refreshActivity().catch(() => {});
    const tick = () => { if (document.visibilityState === 'visible') refreshAll().catch(() => {}); };
    const t = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', tick); };
  }, [email, refreshOffers, refreshActivity, refreshAll]);

  const derived = useMemo(() => {
    if (!me) return {};
    const s = me.summary;
    const tier = tierFor(s.lifetime);
    const next = nextTier(s.lifetime);
    return { tier, next, progress: next ? (s.lifetime - tier.min) / (next.min - tier.min) : 1, dollars: s.balance * POINT_VALUE };
  }, [me]);

  const value = useMemo(() => ({
    me, setMe, offers, activity, toasts, arrival, ...derived,
    refreshMe, refreshOffers, refreshActivity, refreshAll,
    clearArrival: () => setArrival(null),
    dismiss: (id) => setToasts((ts) => ts.filter((t) => t.id !== id)),
    toast: (title, body) => setToasts((ts) => [{ id: `m${Date.now()}`, title, body }, ...ts].slice(0, 3)),
  }), [me, offers, activity, toasts, arrival, derived, refreshMe, refreshOffers, refreshActivity, refreshAll]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
