import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { merchantById, money2, POINT_VALUE } from '@shared/catalog.js';
import { Screen } from '../AppRoutes.jsx';
import { useSession } from '../session.jsx';
import Icon from '../../components/Icon.jsx';
import ExpiryClock from '../../components/ExpiryClock.jsx';
import BrandMark from '../../components/BrandMark.jsx';
import Coin from '../../components/Coin.jsx';
import { motionReduced } from '../../lib/prefs.jsx';

const TICKS = 48;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** Tick-mark bar: points used against points earned this year. */
function Tracker({ used, earned }) {
  const ratio = earned ? Math.min(1, used / earned) : 0;
  const on = Math.round(ratio * TICKS);
  return (
    <div className="tracker">
      <div className="tracker-ticks" aria-hidden="true">
        {Array.from({ length: TICKS }, (_, i) => <i key={i} className={i < on ? 'is-on' : ''} />)}
      </div>
      <p className="tracker-label">
        {earned
          ? <><strong>{used.toLocaleString()}</strong> used of <strong>{earned.toLocaleString()}</strong> points earned this year</>
          : 'No points earned yet this year.'}
      </p>
    </div>
  );
}

function nextAction(me, offers) {
  if (!me.user.verified) return { title: 'Confirm your email', why: ['You need a confirmed email before linking a card.'], cta: null };
  if (!me.cards.length) return { title: 'Link a card to start earning', why: ['Points come only from purchases with a linked card.', 'Rewards then apply themselves when you pay.'], cta: { to: '/app/cards', label: 'Link a card' } };
  const top = offers?.ranked?.[0];
  if (!top) return { title: 'No rewards right now', why: ['New rewards appear here as stores add them.'], cta: null };
  const m = merchantById(top.merchantId);
  if (!top.affordable) {
    const need = top.cost - me.summary.balance;
    return { title: `Earn ${need.toLocaleString()} more points for ${top.title.toLowerCase()}`, merchantId: top.merchantId, why: [...top.why, `It uses ${top.cost.toLocaleString()} points at ${m.name}.`], cta: { to: `/app/reward/${top.id}`, label: 'See this reward' } };
  }
  return { title: `${top.title} at ${m.name}`, merchantId: top.merchantId, why: top.why.length ? top.why : ['It is the reward you are most likely to use right now.'], cta: { to: `/app/reward/${top.id}`, label: 'Show the code' } };
}

export default function Home() {
  const { me, offers, dollars, tier, next, progress, arrival, clearArrival } = useSession();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const sheet = useRef(null);
  const s = me.summary;
  const action = nextAction(me, offers);

  // A reward applied by a card payment flies from here into Activity.
  useEffect(() => {
    if (!arrival) return;
    const target = document.querySelector('[data-tab="Activity"]');
    const from = sheet.current;
    if (!target || !from || motionReduced()) { clearArrival(); return; }
    const a = from.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'fly-card';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.textContent = `${arrival.offerTitle}, saved ${money2(arrival.discount)}`;
    Object.assign(ghost.style, { left: `${a.left + 16}px`, top: `${a.top + 16}px`, width: `${Math.min(320, a.width - 32)}px` });
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + 16 + Math.min(320, a.width - 32) / 2);
    const dy = b.top + b.height / 2 - (a.top + 40);
    ghost.animate([
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 80}px) scale(0.8) rotate(-6deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12) rotate(-12deg)`, opacity: 0.2 },
    ], { duration: 1100, easing: 'cubic-bezier(.5,0,.2,1)' }).finished.finally(() => { ghost.remove(); clearArrival(); });
  }, [arrival, clearArrival]);

  const ready = offers?.ranked?.filter((o) => o.affordable).length ?? 0;

  return (
    <Screen title={`${greeting()}, ${me.user.firstName}`} className="home">
      <div className="home-actions-top">
        <Link to="/app/activity" className="icon-btn" aria-label="Open activity"><Icon name="activity" /></Link>
        <Link to="/app/settings" className="icon-btn" aria-label="Open settings"><Icon name="settings" /></Link>
      </div>

      <section className="points glass" aria-labelledby="points-h">
        <div className="points-top">
          <div>
            <h2 id="points-h" className="visually-hidden">Your points</h2>
            <p className="points-n">{s.balance.toLocaleString()}<span> points</span></p>
            <p className="points-value">Worth {money2(dollars)} at {POINT_VALUE * 100} cent a point</p>
          </div>
          <Coin />
        </div>
        <Tracker used={s.usedYear} earned={s.earnedYear} />
        <p className="points-tier"><span className={`tier-chip tier-${tier.id}`} aria-hidden="true" />{tier.name}{next ? `. ${(next.min - s.lifetime).toLocaleString()} points to ${next.name}` : '. Top tier'}</p>
        <div className="tierbar-track" aria-hidden="true"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
      </section>

      <div className="home-pair">
        <section className="tile glass" aria-labelledby="exp-h">
          <h2 id="exp-h" className="tile-title">Expiring soon</h2>
          <ExpiryClock tone="light" daysLeft={s.expiring.points ? s.expiring.daysLeft : 0} size={112}
            ariaLabel={s.expiring.points ? `${s.expiring.points} points expire in ${s.expiring.daysLeft} days` : 'No points expire in the next 14 days'} />
          <p className="tile-text">{s.expiring.points ? `${s.expiring.points.toLocaleString()} points expire in ${s.expiring.daysLeft} days. Rewards use these first.` : 'Nothing expires in the next 14 days.'}</p>
        </section>
        <section className="tile glass" aria-labelledby="saved-h">
          <h2 id="saved-h" className="tile-title">Saved from expiring</h2>
          <p className="tile-big">{money2(s.savedFromExpiring * POINT_VALUE)}</p>
          <p className="tile-text">Value of points you used before they ran out.</p>
        </section>
      </div>

      <form role="search" className="search-pill glass" onSubmit={(e) => { e.preventDefault(); navigate(`/app/rewards?q=${encodeURIComponent(q)}`); }}>
        <label htmlFor="home-q" className="visually-hidden">Find a reward</label>
        <Icon name="search" />
        <input id="home-q" type="search" placeholder="Find a reward" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="pill-go" aria-label="Search rewards"><Icon name="next" /></button>
      </form>

      <nav aria-label="Shortcuts">
        <ul role="list" className="pill-rows">
          <li><Link to="/app/rewards" className="pill-row glass"><span><strong>Rewards</strong> {ready} ready to use</span><span className="pill-go" aria-hidden="true"><Icon name="next" /></span></Link></li>
          <li><Link to="/app/brands" className="pill-row glass"><span><strong>Favorite brands</strong> {s.brands.length} chosen</span><span className="pill-go" aria-hidden="true"><Icon name="next" /></span></Link></li>
          <li><Link to="/app/cards" className="pill-row glass"><span><strong>Linked cards</strong> {me.cards.length}</span><span className="pill-go" aria-hidden="true"><Icon name="next" /></span></Link></li>
        </ul>
      </nav>

      <section ref={sheet} className="sheet on-sheet" aria-labelledby="next-h">
        <span className="sheet-handle" aria-hidden="true" />
        <h2 id="next-h" className="sheet-label">Your next best step</h2>
        <div className="sheet-main">
          {action.merchantId && <BrandMark merchantId={action.merchantId} size={52} />}
          <p className="sheet-title">{action.title}</p>
        </div>
        <h3 className="sheet-why-h">Why this was picked</h3>
        <ul className="sheet-why">
          {action.why.map((w) => <li key={w}>{w}</li>)}
        </ul>
        {action.cta && <Link to={action.cta.to} className="btn btn-primary">{action.cta.label}</Link>}
      </section>
    </Screen>
  );
}
