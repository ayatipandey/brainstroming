import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '@shared/brand.config.js';
import { Screen } from '../AppRoutes.jsx';
import { useSession } from '../session.jsx';
import { api } from '../api.js';
import Toggle from '../../components/Toggle.jsx';
import Field from '../../components/Field.jsx';

function LinkCard({ onDone }) {
  const { setMe } = useSession();
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState({ bank: '', last4: '', consent: false });
  const [err, setErr] = useState({ message: '', fields: {} });
  const [busy, setBusy] = useState(false);
  const h = useRef(null);
  useEffect(() => { api('/banks').then(setBanks).catch(() => {}); h.current?.focus(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      setMe(await api('/cards', { method: 'POST', body: { bank: form.bank, last4: form.last4, consent: form.consent } }));
      onDone(`${form.bank}, ending ${form.last4}`);
    } catch (ex) {
      setErr({ message: ex.message, fields: ex.fields });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel glass" onSubmit={submit} noValidate aria-labelledby="link-h">
      <h2 id="link-h" ref={h} tabIndex={-1} className="block-title">Link a card</h2>
      <p className="hint">We keep only the bank name and the last four digits. Never the full card number, and never a password.</p>
      {err.message && <p className="form-error" role="alert">{err.message}</p>}
      <div className="field-row">
        <label htmlFor="bank" className="field-label">Bank</label>
        <select id="bank" className="input" value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} aria-invalid={!!err.fields.bank} aria-describedby={err.fields.bank ? 'bank-err' : undefined}>
          <option value="">Choose your bank</option>
          {banks.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        {err.fields.bank && <p id="bank-err" className="field-error">{err.fields.bank}</p>}
      </div>
      <Field id="last4" label="Last four digits of the card" inputMode="numeric" maxLength={4} autoComplete="off" value={form.last4}
        onChange={(e) => setForm({ ...form, last4: e.target.value.replace(/\D/g, '') })} error={err.fields.last4} />
      <label className="check-row">
        <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} aria-invalid={!!err.fields.consent} aria-describedby={err.fields.consent ? 'consent-err' : undefined} />
        <span>I allow {BRAND.name} to receive the purchases I make with this card, so it can apply rewards and add points. I can remove the card at any time. <Link to="/legal/privacy" target="_blank">How we use card data</Link></span>
      </label>
      {err.fields.consent && <p id="consent-err" className="field-error">{err.fields.consent}</p>}
      <div className="row-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Linking the card' : 'Link this card'}</button>
        <button type="button" className="btn btn-quiet" onClick={() => onDone(null)}>Cancel linking</button>
      </div>
    </form>
  );
}

export default function Cards() {
  const { me, setMe, toast, refreshOffers } = useSession();
  const [linking, setLinking] = useState(false);
  const linkBtn = useRef(null);

  const done = (label) => {
    setLinking(false);
    if (label) { toast('Card linked', `${label}. Purchases with it now earn points.`); refreshOffers().catch(() => {}); }
    setTimeout(() => linkBtn.current?.focus(), 0);
  };
  const setAuto = async (card, on) => {
    try { setMe(await api(`/cards/${card.id}`, { method: 'PATCH', body: { autoApply: on } })); } catch (e) { toast('Could not change auto-apply', e.message); }
  };
  const remove = async (card) => {
    if (!window.confirm(`Remove ${card.bank}, ending ${card.last4}? Purchases with it will stop earning points.`)) return;
    try { setMe(await api(`/cards/${card.id}`, { method: 'DELETE' })); toast('Card removed', `${card.bank}, ending ${card.last4}.`); } catch (e) { toast('Could not remove the card', e.message); }
  };

  return (
    <Screen title="Cards">
      <p className="lead">Purchases with a linked card earn 2 points per dollar, and your best reward applies itself when you pay.</p>
      {me.cards.length === 0 && !linking && <p className="empty glass">No cards linked yet.</p>}
      <ul role="list" className="card-list">
        {me.cards.map((c) => (
          <li key={c.id} className="panel glass">
            <div className="card-face on-sheet" aria-hidden="true"><span>{c.bank}</span><span className="card-num">Ending {c.last4}</span></div>
            <h2 className="block-title">{c.bank}, ending {c.last4}</h2>
            <Toggle id={`auto-${c.id}`} label="Apply rewards automatically" hint="Your best reward at the store is used when you pay with this card." checked={c.autoApply} onChange={(on) => setAuto(c, on)} />
            <button type="button" className="btn btn-quiet btn-small" onClick={() => remove(c)}>Remove {c.bank} card ending {c.last4}</button>
          </li>
        ))}
      </ul>
      {linking
        ? <LinkCard onDone={done} />
        : <button ref={linkBtn} type="button" className="btn btn-primary" onClick={() => setLinking(true)} disabled={!me.user.verified}>Link a card</button>}
      {!me.user.verified && <p className="hint">Confirm your email first. Check your inbox for the link.</p>}
    </Screen>
  );
}
