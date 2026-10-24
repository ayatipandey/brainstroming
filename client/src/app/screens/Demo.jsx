import { useEffect, useRef, useState } from 'react';
import { PEOPLE, MERCHANTS, MOMENTS, CATEGORIES, formatHour, offerById, merchantById, money } from '@shared/catalog.js';
import { Screen } from '../AppRoutes.jsx';
import { useStore } from '../store.jsx';
import { scoreMoment } from '../../lib/api.js';
import Reasons from '../../components/Reasons.jsx';
import Toggle from '../../components/Toggle.jsx';
import Icon from '../../components/Icon.jsx';

const RUN = [
  { title: '2:47 pm, near Campus Coffee', text: 'Maya walks past her usual coffee shop. 300 of her points expire in 3 days.' },
  { title: '11:30 pm, same street', text: 'The same offer, late at night, with quiet hours on.' },
  { title: 'Turn on auto-apply', text: 'For Harbor Bank ending 4821: up to $3.00 per purchase, coffee only.' },
  { title: 'Pay $4.20 at Campus Coffee', text: 'A simulated payment on the linked card.' },
];

function useHealth() {
  const [h, setH] = useState('checking');
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    fetch('/api/health', { signal: ctrl.signal }).then((r) => setH(r.ok ? 'online' : 'offline')).catch(() => setH('offline')).finally(() => clearTimeout(t));
    return () => { clearTimeout(t); ctrl.abort(); };
  }, []);
  return h;
}

function Result({ r }) {
  if (!r) return null;
  const offer = offerById(r.offerId);
  return (
    <div className={`result ${r.send ? 'is-send' : 'is-quiet'}`}>
      <p className="result-verdict">{r.send ? `Sent: ${offer.title}` : r.held === 'quiet-hours' ? 'Held for quiet hours' : r.held === 'daily-limit' ? 'Held: daily limit reached' : 'Nothing sent'}</p>
      <dl className="result-facts">
        <div><dt>Score</dt><dd>{Math.round(r.score * 100)}%</dd></div>
        <div><dt>Threshold</dt><dd>{Math.round(r.threshold * 100)}%</dd></div>
        <div><dt>Scored by</dt><dd>{r.source === 'server' ? 'Server model' : 'On this device'}</dd></div>
        <div><dt>Time taken</dt><dd>{r.ms} ms</dd></div>
      </dl>
      {r.fallbackReason && <p className="fine">{r.fallbackReason}, so the same model scored it on this device.</p>}
      <p className="fine">Offer: {offer.title}, {merchantById(offer.merchantId).name}.</p>
      <Reasons reasons={r.reasons} title="Reasons" headingLevel={3} />
    </div>
  );
}

export default function Demo() {
  const { state, act, soonest } = useStore();
  const health = useHealth();
  const [place, setPlace] = useState('campus-coffee');
  const [time, setTime] = useState(14.75);
  const [moment, setMoment] = useState('none');
  const [expiring, setExpiring] = useState(true);
  const [days, setDays] = useState(soonest?.expiresInDays ?? 3);
  const [slow, setSlow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [card, setCard] = useState(state.cards[0]?.id || '');
  const [merchant, setMerchant] = useState('campus-coffee');
  const [amount, setAmount] = useState('4.20');
  const [payNote, setPayNote] = useState('');
  const [run, setRun] = useState({ step: 0, results: [] });
  const runHeading = useRef(null);

  useEffect(() => { if (!state.cards.find((c) => c.id === card)) setCard(state.cards[0]?.id || ''); }, [state.cards, card]);
  useEffect(() => { if (run.step > 0) runHeading.current?.focus(); }, [run.step]);

  const policy = () => ({ quietHours: state.settings.quiet, dailyLimit: state.settings.dailyLimit, sentToday: state.sentToday.count });

  async function fire(req, opts = {}) {
    const r = await scoreMoment({ ...req, policy: policy() }, opts);
    act('decision', { result: r });
    return r;
  }

  async function onFire(e) {
    e.preventDefault();
    setBusy(true);
    const r = await fire({ place, time, favorites: Object.keys(state.favorites), daysUntilExpiry: expiring ? days : null, specialMoment: moment }, { demoDelay: slow ? 3000 : 0 });
    setResult(r);
    setBusy(false);
  }

  function onPay(e) {
    e.preventDefault();
    const n = Number(amount);
    if (!card) { setPayNote('Link a card first, on the Cards screen.'); return; }
    if (!(n > 0 && n <= 500)) { setPayNote('Enter an amount between $0.01 and $500.'); return; }
    act('payment', { cardId: card, merchantId: merchant, amount: Math.round(n * 100) / 100 });
    setPayNote(`Simulated ${money(n)} at ${merchantById(merchant).name}. See the notification.`);
  }

  async function nextRunStep() {
    const step = run.step + 1;
    let out = '';
    if (step === 1) {
      act('reset');
      act('person', { id: 'maya' });
      // Wait one tick so the reset state is in place before scoring.
      await new Promise((r) => setTimeout(r, 0));
      const r = await scoreMoment({ place: 'campus-coffee', time: 14 + 47 / 60, favorites: ['coffee', 'books'], daysUntilExpiry: 3, specialMoment: 'none', policy: { quietHours: { on: true, start: 22, end: 7 }, dailyLimit: 2, sentToday: 0 } });
      act('decision', { result: r });
      out = `${r.send ? 'Sent' : 'Not sent'} at ${Math.round(r.score * 100)}%, scored ${r.source === 'server' ? 'by the server model' : 'on this device'}.`;
    } else if (step === 2) {
      const r = await scoreMoment({ place: 'campus-coffee', time: 23.5, favorites: ['coffee', 'books'], daysUntilExpiry: 3, specialMoment: 'none', policy: { quietHours: { on: true, start: 22, end: 7 }, dailyLimit: 2, sentToday: 1 } });
      act('decision', { result: r });
      out = `Nothing sent. Scored ${Math.round(r.score * 100)}%${r.held === 'quiet-hours' ? ', and quiet hours are on' : ', below the 70% bar'}.`;
    } else if (step === 3) {
      const c = state.cards.find((x) => x.last4 === '4821') || state.cards[0];
      act('auto-apply', { id: c.id, patch: { on: true, limit: 3, categories: ['coffee'] } });
      out = `Auto-apply is on for ${c.bank} ending ${c.last4}: up to $3.00, coffee.`;
    } else if (step === 4) {
      const c = state.cards.find((x) => x.last4 === '4821') || state.cards[0];
      act('payment', { cardId: c.id, merchantId: 'campus-coffee', amount: 4.2 });
      out = 'You paid $4.20 at Campus Coffee. 300 points covered $3.00, so you paid $1.20. The confirmation has an Undo for 10 seconds.';
    }
    setRun((x) => ({ step, results: [...x.results, out] }));
  }

  const current = run.step > 0 ? RUN[run.step - 1] : null;

  return (
    <Screen title="Demo panel" lead="Drive the engine by hand. Everything here is synthetic demo data, and payments are simulated.">
      <p className={`status status-${health}`} role="status">
        <span className="status-dot" aria-hidden="true" />
        {health === 'checking' ? 'Checking the server' : health === 'online' ? 'Server model online. Scoring falls back to this device after 2 seconds.' : 'Server unreachable. Scoring runs on this device with the same model.'}
      </p>

      <section className="panel run" aria-labelledby="run-h">
        <h2 id="run-h" className="block-title">The demo run</h2>
        <p>Four steps: one nudge, one quiet moment, auto-apply on, and a payment at Campus Coffee. Starting resets the demo data.</p>
        {current && (
          <div className="run-step">
            <h3 ref={runHeading} tabIndex={-1} className="step-title"><span className="step-of">Step {run.step} of 4</span>{current.title}</h3>
            <p>{current.text}</p>
            <p className="run-out" role="status">{run.results[run.step - 1]}</p>
          </div>
        )}
        <ol className="run-list" role="list" aria-label="Demo run steps">
          {RUN.map((s, i) => (
            <li key={s.title} className={i < run.step ? 'is-done' : ''}>
              <span className="run-n">{i < run.step ? <Icon name="check" size={18} /> : i + 1}</span>
              <span>{s.title}</span>
            </li>
          ))}
        </ol>
        <div className="flow-actions">
          {run.step < 4
            ? <button type="button" className="btn btn-primary" onClick={nextRunStep}>{run.step === 0 ? 'Start the demo run' : 'Next step'}</button>
            : <button type="button" className="btn btn-quiet" onClick={() => setRun({ step: 0, results: [] })}>Run it again</button>}
        </div>
      </section>

      <form className="panel" aria-labelledby="fire-h" onSubmit={onFire}>
        <h2 id="fire-h" className="block-title">Fire a nudge</h2>
        <fieldset className="seg app-seg">
          <legend>Person</legend>
          {PEOPLE.map((p) => (
            <label key={p.id} className="seg-opt">
              <input type="radio" name="person" checked={state.personId === p.id} onChange={() => act('person', { id: p.id })} />
              <span>{p.name}</span>
            </label>
          ))}
        </fieldset>
        <p className="fine">{PEOPLE.find((p) => p.id === state.personId).note}. Favorites: {Object.keys(state.favorites).map((c) => CATEGORIES[c].label).join(', ') || 'none'}.</p>

        <label className="field">
          <span className="field-label">Place</span>
          <select value={place} onChange={(e) => setPlace(e.target.value)}>
            {MERCHANTS.map((m) => <option key={m.id} value={m.id}>Near {m.name} ({CATEGORIES[m.category].label.toLowerCase()})</option>)}
            <option value="elsewhere">Not near a place</option>
          </select>
        </label>

        <div className="slider-row">
          <label htmlFor="time" className="field-label">Time <output>{formatHour(time)}</output></label>
          <input id="time" type="range" min="0" max="23.75" step="0.25" value={time} onChange={(e) => setTime(Number(e.target.value))} />
        </div>

        <label className="field">
          <span className="field-label">Special moment</span>
          <select value={moment} onChange={(e) => setMoment(e.target.value)}>
            {Object.entries(MOMENTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>

        <Toggle id="exp" label="Points about to expire" checked={expiring} onChange={setExpiring} />
        {expiring && (
          <div className="slider-row">
            <label htmlFor="days" className="field-label">Days until they expire <output>{days}</output></label>
            <input id="days" type="range" min="0" max="30" step="1" value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </div>
        )}
        <Toggle id="slow" label="Slow the server down" hint="Adds a 3 second delay to test the on-device fallback" checked={slow} onChange={setSlow} />

        <div className="flow-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Scoring' : 'Fire a nudge'}</button>
        </div>
        <div aria-live="polite">{result && <Result r={result} />}</div>
      </form>

      <form className="panel" aria-labelledby="pay-h" onSubmit={onPay}>
        <h2 id="pay-h" className="block-title">Simulate a payment</h2>
        <p className="fine">No real payment is made. If auto-apply covers the purchase, points are applied and you get a confirmation. If not, the app asks whether to apply points.</p>
        <label className="field">
          <span className="field-label">Card</span>
          <select value={card} onChange={(e) => setCard(e.target.value)}>
            {state.cards.length === 0 && <option value="">No cards linked</option>}
            {state.cards.map((c) => <option key={c.id} value={c.id}>{c.bank}, ending {c.last4} (auto-apply {c.autoApply.on ? `on, up to ${money(c.autoApply.limit)}` : 'off'})</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Merchant</span>
          <select value={merchant} onChange={(e) => setMerchant(e.target.value)}>
            {MERCHANTS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Amount in dollars</span>
          <input type="number" inputMode="decimal" min="0.01" max="500" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <div className="flow-actions">
          <button type="submit" className="btn btn-primary">Simulate payment</button>
        </div>
        <p className="fine" role="status">{payNote}</p>
      </form>
    </Screen>
  );
}
