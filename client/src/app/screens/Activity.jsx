import { useCallback, useEffect, useRef, useState } from 'react';
import { merchantById, money2 } from '@shared/catalog.js';
import { Screen } from '../AppRoutes.jsx';
import { useSession } from '../session.jsx';
import { usePrefs } from '../../lib/prefs.jsx';
import BrandMark from '../../components/BrandMark.jsx';
import Icon from '../../components/Icon.jsx';

const VIEW_KEY = 'activity-view';
const CARD_TONE = { coffee: 'sand', food: 'pink', books: 'cyan', groceries: 'lime' };
const fmt = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function useView(reduced) {
  const [view, setView] = useState(() => {
    try { return localStorage.getItem(VIEW_KEY) || (reduced ? 'list' : 'cards'); } catch { return reduced ? 'list' : 'cards'; }
  });
  const choose = (v) => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* storage off */ } };
  return [view, choose];
}

/** Used rewards as a 3D stack you scroll through, with snap. */
function Stack({ items, reduced }) {
  const box = useRef(null);
  const [index, setIndex] = useState(0);

  const paint = useCallback(() => {
    const el = box.current;
    if (!el) return;
    const mid = el.scrollTop + el.clientHeight / 2;
    let nearest = 0;
    let best = Infinity;
    [...el.children].forEach((card, i) => {
      const center = card.offsetTop + card.offsetHeight / 2;
      const d = (center - mid) / card.offsetHeight;
      if (Math.abs(d) < best) { best = Math.abs(d); nearest = i; }
      if (reduced) return;
      const a = Math.max(-1.6, Math.min(1.6, d));
      card.style.transform = `translateZ(${-Math.abs(a) * 140}px) rotateX(${a * -32}deg) scale(${1 - Math.abs(a) * 0.08})`;
      card.style.opacity = String(1 - Math.min(0.55, Math.abs(a) * 0.4));
    });
    setIndex(nearest);
  }, [reduced]);

  useEffect(() => {
    const el = box.current;
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); };
    paint();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [paint, items.length]);

  const go = (i) => {
    const el = box.current;
    const card = el.children[Math.max(0, Math.min(items.length - 1, i))];
    card?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    card?.focus({ preventScroll: true });
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    if (e.key === 'Home') { e.preventDefault(); go(0); }
    if (e.key === 'End') { e.preventDefault(); go(items.length - 1); }
  };

  return (
    <div className="stack-wrap">
      <ol ref={box} className="stack" role="list" aria-label="Used rewards, newest first. Use the arrow keys to move between cards." onKeyDown={onKey}>
        {items.map((t, i) => {
          const cat = merchantById(t.merchantId)?.category;
          return (
            <li key={t.id} className={`stack-card tone-${CARD_TONE[cat] || 'sand'} ${t.isNew ? 'is-new' : ''}`} tabIndex={i === index ? 0 : -1}
              aria-label={`${t.offerTitle} at ${t.merchant}, saved ${money2(t.discount)} on ${fmt(t.at)}. Card ${i + 1} of ${items.length}.`}>
              <div className="sc-top">
                <BrandMark merchantId={t.merchantId} size={56} />
                <p className="sc-date">{fmt(t.at)}</p>
              </div>
              <p className="sc-title">{t.offerTitle}</p>
              <p className="sc-merchant">{t.merchant}</p>
              <div className="sc-bottom">
                <p className="sc-saved"><span>Saved</span>{money2(t.discount)}</p>
                <p className="sc-meta">Paid {money2(t.amount - t.discount)} of {money2(t.amount)}. {t.pointsSpent.toLocaleString()} points used.</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="stack-nav">
        <button type="button" className="btn btn-quiet btn-small" onClick={() => go(index - 1)} disabled={index === 0}><Icon name="back" /> Newer reward</button>
        <p className="stack-pos" aria-live="polite">{index + 1} of {items.length}</p>
        <button type="button" className="btn btn-quiet btn-small" onClick={() => go(index + 1)} disabled={index >= items.length - 1}>Older reward <Icon name="next" /></button>
      </div>
    </div>
  );
}

export default function Activity() {
  const { activity, me } = useSession();
  const { reduced } = usePrefs();
  const [view, setView] = useView(reduced);
  const [newest, setNewest] = useState(null);
  const firstId = useRef(null);

  // Mark a reward that arrives while this screen is open, so it drops onto the stack.
  useEffect(() => {
    const top = activity?.transactions.find((t) => t.offerId);
    if (!top) return;
    if (firstId.current !== null && top.id !== firstId.current) setNewest(top.id);
    firstId.current = top.id;
  }, [activity]);

  if (!activity) return <Screen title="Activity"><p role="status">Loading activity</p></Screen>;
  const used = activity.transactions.filter((t) => t.offerId).map((t) => ({ ...t, isNew: t.id === newest }));
  const rows = [
    ...activity.transactions.map((t) => ({ id: `t${t.id}`, at: t.at, title: t.offerId ? `${t.offerTitle}, ${t.merchant}` : `Payment at ${t.merchant}`, detail: t.offerId ? `Saved ${money2(t.discount)} on ${money2(t.amount)}. ${t.pointsSpent.toLocaleString()} points used, ${t.pointsEarned.toLocaleString()} earned.` : `${money2(t.amount)}. ${t.pointsEarned.toLocaleString()} points earned.`, merchantId: t.merchantId })),
    ...activity.events.map((e) => ({ id: `e${e.id}`, at: e.at, title: e.title, detail: e.detail })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <Screen title="Activity">
      <fieldset className="seg view-switch">
        <legend>Show activity as</legend>
        {[['cards', 'Cards'], ['list', 'List']].map(([v, l]) => (
          <label key={v} className="seg-opt">
            <input type="radio" name="activity-view" value={v} checked={view === v} onChange={() => setView(v)} />
            <span>{l}</span>
          </label>
        ))}
      </fieldset>
      {view === 'cards' ? (
        used.length
          ? <Stack items={used} reduced={reduced} />
          : <p className="empty glass">No rewards used yet. {me.cards.length ? 'When you pay with a linked card at a store where you have a reward, it lands here.' : 'Link a card and rewards apply themselves when you pay.'}</p>
      ) : (
        rows.length ? (
          <ol className="feed glass" role="list">
            {rows.map((r) => (
              <li key={r.id} className="feed-item">
                <span className="feed-icon">{r.merchantId ? <BrandMark merchantId={r.merchantId} size={44} /> : <Icon name="star" />}</span>
                <div>
                  <p className="feed-title">{r.title}</p>
                  <p className="feed-detail">{r.detail}</p>
                  <p className="feed-when"><time dateTime={r.at}>{fmt(r.at)}</time></p>
                </div>
              </li>
            ))}
          </ol>
        ) : <p className="empty glass">Nothing here yet. Payments with a linked card will show up here.</p>
      )}
    </Screen>
  );
}
