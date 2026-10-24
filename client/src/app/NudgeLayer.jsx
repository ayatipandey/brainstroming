import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from './store.jsx';
import Icon from '../components/Icon.jsx';
import { Mark } from '../components/Logo.jsx';

function useNow(active) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

function Why({ reasons, title }) {
  return (
    <details className="n-why">
      <summary>{title}</summary>
      <ul role="list">
        {reasons.map((r, i) => (
          <li key={i} className={r.ok === false || r.effect === 'down' ? 'is-no' : 'is-yes'}>
            <Icon name={r.ok === false || r.effect === 'down' ? 'close' : 'check'} size={20} />
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function NudgeLayer() {
  const { state, act } = useStore();
  const shown = state.nudges.slice(0, 3);
  const now = useNow(shown.some((n) => n.kind === 'payment'));

  return (
    <section className="nudges" aria-label="Notifications" aria-live="polite">
      {shown.map((n) => {
        const left = n.undoUntil ? Math.max(0, Math.ceil((n.undoUntil - now) / 1000)) : 0;
        return (
          <article key={n.id} className={`n n-${n.kind}`} aria-labelledby={`n-${n.id}`}>
            <div className="n-head">
              <span className="n-app"><Mark size={18} /> Perk Predict</span>
              <span>{n.kind === 'payment' ? 'Payment, simulated' : n.kind === 'ask' ? 'At payment, simulated' : 'Now'}</span>
            </div>
            <h2 id={`n-${n.id}`} className="n-title">{n.title}</h2>
            <p className="n-body">{n.body}</p>
            {n.reasons && <Why reasons={n.reasons} title={n.kind === 'offer' ? 'Why this offer' : n.kind === 'payment' ? 'Why this was applied' : 'Why we are asking'} />}
            <div className="n-actions">
              {n.kind === 'offer' && (
                <Link to={`/app/offer/${n.offerId}`} className="btn btn-primary btn-small" onClick={() => act('dismiss', { id: n.id })}>Use my points</Link>
              )}
              {n.kind === 'ask' && (
                <button type="button" className="btn btn-primary btn-small" onClick={() => act('confirm-ask', { id: n.id })}>Apply {n.quote.points.toLocaleString()} points</button>
              )}
              {n.kind === 'payment' && left > 0 && (
                <button type="button" className="btn btn-quiet btn-small" onClick={() => act('undo', { id: n.id })}>
                  <Icon name="undo" size={20} /> Undo <span className="n-count" aria-hidden="true">({left} s)</span>
                </button>
              )}
              <button type="button" className="n-dismiss" onClick={() => act('dismiss', { id: n.id })}>
                {n.kind === 'ask' ? 'Not now' : 'Dismiss'}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
