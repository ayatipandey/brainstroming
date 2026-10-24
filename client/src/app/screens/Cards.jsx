import { useEffect, useRef, useState } from 'react';
import { BANKS, CATEGORIES, CATEGORY_IDS, money } from '@shared/catalog.js';
import { Screen } from '../AppRoutes.jsx';
import { useStore } from '../store.jsx';
import Icon from '../../components/Icon.jsx';
import Toggle from '../../components/Toggle.jsx';

// Demo accounts the mock bank returns. Only the last four digits exist here.
const DEMO_ACCOUNTS = {
  harbor: [{ last4: '4821', name: 'Harbor Everyday Card' }, { last4: '0937', name: 'Harbor Travel Card' }],
  summit: [{ last4: '2206', name: 'Summit Rewards Visa' }],
  meridian: [{ last4: '7714', name: 'Meridian Cash Card' }, { last4: '3358', name: 'Meridian Student Card' }],
};

function StepHeading({ step, children }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, [step]);
  return (
    <h2 ref={ref} tabIndex={-1} className="step-title">
      <span className="step-of">Step {step} of 4</span>
      {children}
    </h2>
  );
}

function LinkFlow({ onClose }) {
  const { act, state } = useStore();
  const [step, setStep] = useState(1);
  const [bank, setBank] = useState(null);
  const [account, setAccount] = useState(null);
  const [cats, setCats] = useState(['coffee', 'food']);
  const [result, setResult] = useState(null);
  const already = new Set(state.cards.map((c) => `${c.bank}-${c.last4}`));

  const finish = () => {
    act('link-card', { bank: bank.name, last4: account.last4, categories: cats });
    setResult({ bank: bank.name, last4: account.last4, categories: cats });
    setStep(4);
  };

  return (
    <section className="panel flow" aria-label="Link a card">
      <ol className="progress" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => <li key={n} className={n <= step ? 'is-on' : ''} />)}
      </ol>

      {step === 1 && (
        <div>
          <StepHeading step={1}>Choose your bank</StepHeading>
          <div className="choice-options">
            {BANKS.map((b) => (
              <label key={b.id} className="radio radio-big">
                <input type="radio" name="bank" checked={bank?.id === b.id} onChange={() => setBank(b)} />
                <span className="radio-ui" aria-hidden="true" />
                <Icon name="bank" />
                <span>{b.name}</span>
              </label>
            ))}
          </div>
          <div className="flow-actions">
            <button type="button" className="btn btn-primary" disabled={!bank} onClick={() => setStep(2)}>Continue</button>
            <button type="button" className="n-dismiss" onClick={onClose}>Cancel</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHeading step={2}>Sign in at {bank.name}</StepHeading>
          <div className="mock-bank">
            <p className="mock-bank-name"><Icon name="lock" /> {bank.name} sign-in</p>
            <p>In a real link, this is {bank.name}’s own page, and Perk Predict never sees what you type there.</p>
            <p className="fine">This prototype has no sign-in fields at all: no card numbers and no passwords. Continue as a demo customer.</p>
          </div>
          <div className="flow-actions">
            <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>Continue as a demo customer</button>
            <button type="button" className="n-dismiss" onClick={() => setStep(1)}>Back</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHeading step={3}>Pick a card and its categories</StepHeading>
          <fieldset className="plain">
            <legend className="field-label">Card</legend>
            <div className="choice-options">
              {DEMO_ACCOUNTS[bank.id].map((a) => {
                const taken = already.has(`${bank.name}-${a.last4}`);
                return (
                  <label key={a.last4} className={`radio radio-big ${taken ? 'is-disabled' : ''}`}>
                    <input type="radio" name="acct" disabled={taken} checked={account?.last4 === a.last4} onChange={() => setAccount(a)} />
                    <span className="radio-ui" aria-hidden="true" />
                    <span>{a.name}, ending {a.last4}{taken ? ' (already linked)' : ''}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <fieldset className="plain">
            <legend className="field-label">Spending categories</legend>
            <div className="choice-options choice-grid">
              {CATEGORY_IDS.map((c) => (
                <label key={c} className="check">
                  <input type="checkbox" checked={cats.includes(c)} onChange={(e) => setCats((x) => (e.target.checked ? [...x, c] : x.filter((y) => y !== c)))} />
                  <span className="check-ui" aria-hidden="true"><Icon name="check" size={18} /></span>
                  <span>{CATEGORIES[c].label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flow-actions">
            <button type="button" className="btn btn-primary" disabled={!account || cats.length === 0} onClick={finish}>Link this card</button>
            <button type="button" className="n-dismiss" onClick={() => setStep(2)}>Back</button>
          </div>
          {!account && <p className="fine">Pick a card to continue.</p>}
          {account && cats.length === 0 && <p className="fine">Pick at least one category to continue.</p>}
        </div>
      )}

      {step === 4 && result && (
        <div>
          <StepHeading step={4}>Card linked</StepHeading>
          <p>This is everything Perk Predict keeps about this card:</p>
          <dl className="kept-list">
            <dt>Bank</dt><dd>{result.bank}</dd>
            <dt>Card</dt><dd>Ending {result.last4}</dd>
            <dt>Categories</dt><dd>{result.categories.map((c) => CATEGORIES[c].label).join(', ')}</dd>
          </dl>
          <p className="fine">Auto-apply starts off. You can turn it on below.</p>
          <div className="flow-actions">
            <button type="button" className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      )}
    </section>
  );
}

function AutoApply({ card }) {
  const { act } = useStore();
  const rules = card.autoApply;
  const set = (patch) => act('auto-apply', { id: card.id, patch });
  return (
    <div className="auto">
      <Toggle id={`auto-${card.id}`} label="Apply my points automatically" hint="Simulation. No real payment is made." checked={rules.on} onChange={(on) => set({ on })} />
      <div className={`auto-rules ${rules.on ? '' : 'is-off'}`}>
        <div className="slider-row">
          <label htmlFor={`limit-${card.id}`} className="field-label inline">Up to <output>{money(rules.limit)}</output> per purchase</label>
          <input id={`limit-${card.id}`} type="range" min="1" max="10" step="0.5" value={rules.limit} onChange={(e) => set({ limit: Number(e.target.value) })} />
        </div>
        <fieldset className="plain">
          <legend className="field-label">Covers</legend>
          <div className="choice-options choice-grid">
            {CATEGORY_IDS.map((c) => (
              <label key={c} className="check">
                <input type="checkbox" checked={rules.categories.includes(c)} onChange={(e) => set({ categories: e.target.checked ? [...rules.categories, c] : rules.categories.filter((y) => y !== c) })} />
                <span className="check-ui" aria-hidden="true"><Icon name="check" size={18} /></span>
                <span>{CATEGORIES[c].label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="fine">Expiring points are always used first, and you get a confirmation with an Undo each time. In a real deployment this runs on FIS Premium Payback.</p>
      </div>
    </div>
  );
}

export default function Cards() {
  const { state, act } = useStore();
  const [linking, setLinking] = useState(false);
  const linkBtn = useRef(null);
  const close = () => { setLinking(false); setTimeout(() => linkBtn.current?.focus(), 0); };

  return (
    <Screen title="Cards" lead="We keep the bank name, the last four digits, and the categories you choose. Never a card number, never a password.">
      <div className="stack">
        {state.cards.map((card) => (
          <section key={card.id} className="panel card-panel" aria-labelledby={`c-${card.id}`}>
            <div className="card-face" aria-hidden="true">
              <span>{card.bank}</span>
              <span className="card-dots">•••• {card.last4}</span>
            </div>
            <h2 id={`c-${card.id}`} className="block-title">{card.bank}, ending {card.last4}</h2>
            <p className="fine">Categories: {card.categories.map((c) => CATEGORIES[c].label).join(', ')}</p>
            <AutoApply card={card} />
            <button type="button" className="n-dismiss" onClick={() => act('remove-card', { id: card.id })}>Remove this card</button>
          </section>
        ))}
        {state.cards.length === 0 && !linking && <p className="empty">No cards yet. Link one to apply points when you pay.</p>}
        {linking
          ? <LinkFlow onClose={close} />
          : <button ref={linkBtn} type="button" className="btn btn-primary" onClick={() => setLinking(true)}><Icon name="card" /> Link a card</button>}
      </div>
    </Screen>
  );
}
