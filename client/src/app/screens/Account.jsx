import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MERCHANTS, money2 } from '@shared/catalog.js';
import { Screen } from '../AppRoutes.jsx';
import { useStore } from '../store.jsx';
import { usePrefs } from '../../lib/prefs.jsx';
import Toggle from '../../components/Toggle.jsx';

export default function Account() {
  const { state, act, pay } = useStore();
  const { prefs, set, reduced } = usePrefs();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState('campus-coffee');
  const [amount, setAmount] = useState('4.20');
  const [error, setError] = useState('');

  const onPay = (e) => {
    e.preventDefault();
    const n = Number(amount);
    if (!(n > 0 && n <= 500)) { setError('Enter an amount between $0.01 and $500.'); return; }
    setError('');
    pay(merchant, Math.round(n * 100) / 100);
  };

  return (
    <Screen title="Account">
      <section className="panel" aria-labelledby="card-h">
        <h2 id="card-h" className="block-title">Your card</h2>
        {state.card ? (
          <>
            <div className="card-face on-claret" aria-hidden="true">
              <span>{state.card.bank}</span>
              <span className="card-num">Ending {state.card.last4}</span>
            </div>
            <p className="hint">We keep the bank name and the last four digits. Never the card number, never a password.</p>
            <Toggle id="auto" label="Apply rewards automatically" hint="When you pay with this card, your best reward at that store is used for you." checked={state.card.autoApply} onChange={(on) => act('auto-apply', { on })} />
            <button type="button" className="text-btn" onClick={() => act('unlink-card')}>Remove this card</button>
          </>
        ) : (
          <>
            <p className="lead">Link a card and rewards apply when you pay, without showing a code.</p>
            <button type="button" className="btn btn-primary" onClick={() => act('link-card', { bank: 'Harbor Bank', last4: '4821' })}>Link Harbor Bank card ending 4821 (demo)</button>
          </>
        )}
      </section>

      {state.card && (
        <form className="panel" aria-labelledby="try-h" onSubmit={onPay}>
          <h2 id="try-h" className="block-title">Try a card purchase</h2>
          <p className="hint">A demo payment. Nothing is charged.</p>
          <label className="field">
            <span className="field-label">Store</span>
            <select className="input" value={merchant} onChange={(e) => setMerchant(e.target.value)}>
              {MERCHANTS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Amount in dollars</span>
            <input className="input" type="number" inputMode="decimal" min="0.01" max="500" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
              aria-invalid={!!error} aria-describedby={error ? 'amt-err' : undefined} />
          </label>
          {error && <p id="amt-err" className="error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary">Pay {Number(amount) > 0 ? money2(Number(amount)) : ''} with card ending {state.card.last4}</button>
        </form>
      )}

      <section className="panel" aria-labelledby="read-h">
        <h2 id="read-h" className="block-title">Reading and motion</h2>
        <fieldset className="seg">
          <legend>Text size</legend>
          {[['normal', 'Standard'], ['large', 'Large'], ['largest', 'Largest']].map(([v, l]) => (
            <label key={v} className="seg-opt">
              <input type="radio" name="text" checked={prefs.text === v} onChange={() => set({ text: v })} />
              <span>{l}</span>
            </label>
          ))}
        </fieldset>
        <Toggle id="hc" label="High contrast" checked={prefs.contrast === 'high'} onChange={(on) => set({ contrast: on ? 'high' : 'normal' })} />
        <Toggle id="rm" label="Reduce motion" checked={reduced} onChange={(on) => set({ motion: on ? 'reduce' : 'full' })} />
      </section>

      <section className="panel" aria-labelledby="you-h">
        <h2 id="you-h" className="block-title">{state.user.name}</h2>
        <div className="row-actions">
          <button type="button" className="btn btn-quiet btn-small" onClick={() => act('reset')}>Reset demo data</button>
          <button type="button" className="btn btn-quiet btn-small" onClick={() => { act('sign-out'); navigate('/app'); }}>Sign out</button>
        </div>
      </section>
    </Screen>
  );
}
