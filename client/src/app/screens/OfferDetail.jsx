import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { offerById, merchantById, CATEGORIES, money, POINT_VALUE } from '@shared/catalog.js';
import { rulesScore, EXPIRY_HORIZON } from '@shared/scoring.js';
import { takePoints } from '@shared/autoApply.js';
import { Screen } from '../AppRoutes.jsx';
import { useStore } from '../store.jsx';
import Reasons from '../../components/Reasons.jsx';
import Icon, { categoryIcon } from '../../components/Icon.jsx';

const STEPS = ['Check the offer', 'Choose your points', 'Show this at the counter'];

function StepHeading({ step }) {
  const ref = useRef(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    ref.current?.focus();
  }, [step]);
  return (
    <h2 ref={ref} tabIndex={-1} className="step-title">
      <span className="step-of">Step {step} of 3</span>
      {STEPS[step - 1]}
    </h2>
  );
}

function lotLabel(lot) {
  if (lot.expiresInDays == null) return 'points that never expire';
  return `points that expire in ${lot.expiresInDays} days`;
}

export default function OfferDetail() {
  const { id } = useParams();
  const { state, act, balance, soonest } = useStore();
  const offer = offerById(id);
  const [step, setStep] = useState(1);
  const [code, setCode] = useState(null);
  const [savedNow, setSavedNow] = useState(0);

  const why = useMemo(() => {
    if (!offer) return null;
    const m = merchantById(offer.merchantId);
    const now = new Date();
    return rulesScore({
      category: m.category,
      hour: now.getHours() + now.getMinutes() / 60,
      favorite: !!state.favorites[m.category],
      special: null,
      daysUntilExpiry: soonest?.expiresInDays ?? null,
    });
  }, [offer, state.favorites, soonest]);

  const plan = useMemo(() => {
    if (!offer) return null;
    const sorted = [...state.lots].sort((a, b) => (a.expiresInDays ?? Infinity) - (b.expiresInDays ?? Infinity));
    let left = offer.points;
    const parts = [];
    for (const lot of sorted) {
      if (left <= 0) break;
      const use = Math.min(lot.points, left);
      parts.push({ lot, use });
      left -= use;
    }
    return { parts, after: takePoints(state.lots, offer.points) };
  }, [offer, state.lots]);

  if (!offer) {
    return (
      <Screen title="Offer not found" back={{ to: '/app', label: 'Wallet' }}>
        <p>This offer is not in the demo catalog. Go back to the wallet to see your offers.</p>
      </Screen>
    );
  }

  const m = merchantById(offer.merchantId);
  const enough = balance >= offer.points;

  const redeem = () => {
    setSavedNow(plan.after.fromExpiring * POINT_VALUE);
    act('redeem', { offerId: offer.id });
    setCode(`PP-${m.name.slice(0, 2).toUpperCase()}${String(Date.now()).slice(-4)}`);
    setStep(3);
  };

  return (
    <Screen title={offer.title} back={{ to: '/app', label: 'Wallet' }} className="offer">
      <div className="offer-head">
        <span className="brand-icon brand-icon-big"><Icon name={categoryIcon[m.category]} size={30} /></span>
        <div>
          <p className="offer-merchant">{m.name}</p>
          <p className="offer-price">{offer.points} points, worth {money(offer.value)}</p>
        </div>
      </div>

      <ol className="progress progress-3" aria-hidden="true">
        {[1, 2, 3].map((n) => <li key={n} className={n <= step ? 'is-on' : ''} />)}
      </ol>

      <section className="panel" aria-live="off">
        <StepHeading step={step} />

        {step === 1 && (
          <>
            <p className="score-line"><strong>{Math.round(why.score * 100)}%</strong> for you right now, by the published rules.</p>
            <Reasons reasons={why.reasons} title="Why this offer" headingLevel={3} />
            {!enough && <p className="error" role="alert">You need {offer.points - balance} more points for this offer.</p>}
            <div className="flow-actions">
              <button type="button" className="btn btn-primary" disabled={!enough} onClick={() => setStep(2)}>Use my points</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p>Points that expire soonest go first, so nothing is lost.</p>
            <ul className="plan" role="list">
              {plan.parts.map(({ lot, use }) => (
                <li key={lot.id} className={lot.expiresInDays != null && lot.expiresInDays <= EXPIRY_HORIZON ? 'is-expiring' : ''}>
                  <span><strong>{use.toLocaleString()}</strong> {lotLabel(lot)}</span>
                  <span>{money(use * POINT_VALUE)}</span>
                </li>
              ))}
            </ul>
            <p className="fine">Balance after: {(balance - offer.points).toLocaleString()} points.</p>
            <div className="flow-actions">
              <button type="button" className="btn btn-primary" onClick={redeem}>Confirm and redeem</button>
              <button type="button" className="n-dismiss" onClick={() => setStep(1)}>Back</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p>Redeemed. Show this code when you pay at {m.name}.</p>
            <p className="code" aria-label={`Code ${code.split('').join(' ')}`}>{code}</p>
            {savedNow > 0 && <p className="saved-line">You saved {money(savedNow)} from expiring.</p>}
            <p className="fine">Demo code. It is not valid at any real store.</p>
            <div className="flow-actions">
              <Link to="/app" className="btn btn-primary">Back to wallet</Link>
              <Link to="/app/activity" className="btn btn-quiet">See activity</Link>
            </div>
          </>
        )}
      </section>
      <p className="fine offer-cat">{CATEGORIES[m.category].label} offer from a favorite-brand catalog. Demo data.</p>
    </Screen>
  );
}
