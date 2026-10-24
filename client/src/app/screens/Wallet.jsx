import { Link } from 'react-router-dom';
import { CATEGORIES, CATEGORY_IDS, OFFERS, merchantById, offerForMerchant, money } from '@shared/catalog.js';
import { Screen } from '../AppRoutes.jsx';
import { useStore } from '../store.jsx';
import ExpiryClock from '../../components/ExpiryClock.jsx';
import Icon, { categoryIcon } from '../../components/Icon.jsx';

const PERKS = [
  'Double points at Green Bowl until 9 pm',
  'A free extra shot at Campus Coffee before noon',
  '100 bonus points on any Fresh Lane basket over $30',
  'Half points off paperbacks at Chapter House Books',
];
const perkOfDay = () => PERKS[new Date().getDate() % PERKS.length];

export const BADGES = [
  { id: 'first', name: 'First redeem', icon: 'check', how: 'Redeem or apply points once' },
  { id: 'saver', name: 'Saved from expiring', icon: 'wallet', how: 'Use points before they expire' },
  { id: 'quiet', name: 'Quiet hours kept', icon: 'moon', how: 'Have an offer held for quiet hours' },
  { id: 'linked', name: 'Card linked', icon: 'card', how: 'Link a card' },
  { id: 'week', name: 'Weekly challenge', icon: 'calendar', how: 'Join the weekly challenge' },
];

export default function Wallet() {
  const { state, act, balance, soonest, earned, name } = useStore();
  const favOffers = CATEGORY_IDS.filter((c) => state.favorites[c]).map((c) => offerForMerchant(state.favorites[c]));
  const firstUse = soonest ? (favOffers.find((o) => o.points <= soonest.points) || favOffers[0] || OFFERS[0]) : null;
  const perkOpen = state.perk.date === new Date().toISOString().slice(0, 10);

  return (
    <Screen title={`Hi, ${name}`} className="wallet">
      <section className="w-hero" aria-label="Points and expiry" data-surface="field">
        <div className="w-hero-text">
          <p className="w-balance"><span className="w-balance-n">{balance.toLocaleString()}</span> points</p>
          <p className="w-balance-sub">Worth about {money(balance * 0.01)} at the demo rate</p>
          {soonest ? (
            <>
              <p className="w-expiring"><strong>{soonest.points.toLocaleString()} points</strong> expire in {soonest.expiresInDays} {soonest.expiresInDays === 1 ? 'day' : 'days'}.</p>
              <Link to={`/app/offer/${firstUse.id}`} className="btn btn-primary">Use them first</Link>
            </>
          ) : (
            <p className="w-expiring">Nothing expires in the next 14 days.</p>
          )}
        </div>
        <ExpiryClock daysLeft={soonest ? soonest.expiresInDays : 0} points={soonest?.points} size={220} />
      </section>

      <section className="w-block w-perk" aria-labelledby="perk-h">
        <div className="perk">
          <Icon name="gift" size={28} />
          <div>
            <h2 id="perk-h" className="block-title">Today’s perk</h2>
            {perkOpen
              ? <p aria-live="polite">{perkOfDay()}.</p>
              : <p>One small extra, a new one each day.</p>}
          </div>
          {!perkOpen && <button type="button" className="btn btn-quiet btn-small" onClick={() => act('perk')}>Reveal</button>}
        </div>
      </section>

      <section className="w-block w-brands" aria-labelledby="brands-h">
        <div className="block-head">
          <h2 id="brands-h" className="block-title">Your brands</h2>
          <Link to="/app/brands" className="block-link">Edit</Link>
        </div>
        <ul className="brand-list" role="list">
          {CATEGORY_IDS.map((c) => {
            const m = state.favorites[c] && merchantById(state.favorites[c]);
            const offer = m && offerForMerchant(m.id);
            return (
              <li key={c}>
                {m ? (
                  <Link to={`/app/offer/${offer.id}`} className="brand-item">
                    <span className="brand-icon"><Icon name={categoryIcon[c]} /></span>
                    <span className="brand-main">
                      <span className="brand-cat">{CATEGORIES[c].label}</span>
                      <span className="brand-name">{m.name}</span>
                      <span className="brand-offer">{offer.title}, {offer.points} points</span>
                    </span>
                    <Icon name="next" />
                  </Link>
                ) : (
                  <Link to="/app/brands" className="brand-item is-empty">
                    <span className="brand-icon"><Icon name={categoryIcon[c]} /></span>
                    <span className="brand-main">
                      <span className="brand-cat">{CATEGORIES[c].label}</span>
                      <span className="brand-name">Pick a brand</span>
                    </span>
                    <Icon name="next" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        {!state.settings.location && (
          <p className="note"><Icon name="pin" size={20} /> Location is off, so offers come from your brands and calendar moments. <Link to="/app/settings">Change in Settings</Link></p>
        )}
      </section>

      <section className="w-block w-wins" aria-labelledby="wins-h">
        <h2 id="wins-h" className="block-title">Small wins</h2>
        <p className="saved"><span className="saved-n">{money(state.saved)}</span> saved from expiring</p>
        <ul className="badges" role="list">
          {BADGES.map((b) => (
            <li key={b.id} className={earned[b.id] ? 'is-earned' : ''}>
              <span className="badge-dot"><Icon name={b.icon} /></span>
              <span className="badge-name">{b.name}</span>
              <span className="badge-state">{earned[b.id] ? 'Earned' : b.how}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="w-block w-week" aria-labelledby="week-h">
        <h2 id="week-h" className="block-title">Weekly challenge</h2>
        {state.settings.challenge ? (
          <div className="challenge">
            <p>Use 3 offers before Sunday. You have used {state.activity.filter((e) => (e.kind === 'redeem' || e.kind === 'payment') && e.points < 0 && !e.undone).length} so far.</p>
            <p className="fine">Anonymous demo totals: 1,284 demo people joined this week, and they used 2.1 offers on average. These numbers are demo data.</p>
            <button type="button" className="btn btn-quiet btn-small" onClick={() => act('settings', { patch: { challenge: false } })}>Leave the challenge</button>
          </div>
        ) : (
          <div className="challenge">
            <p>Optional. Use 3 offers this week and see how you compare with anonymous totals. Nothing about you is shared.</p>
            <button type="button" className="btn btn-quiet btn-small" onClick={() => act('settings', { patch: { challenge: true } })}>Join this week</button>
          </div>
        )}
      </section>
    </Screen>
  );
}
