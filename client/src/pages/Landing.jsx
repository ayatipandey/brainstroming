import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Logo from '../components/Logo.jsx';
import Phone from '../components/Phone.jsx';
import ExpiryClock from '../components/ExpiryClock.jsx';
import WalletFragment from '../components/WalletFragment.jsx';
import Nudge from '../components/Nudge.jsx';
import Reasons from '../components/Reasons.jsx';
import ModelChart from '../components/ModelChart.jsx';
import Icon, { categoryIcon } from '../components/Icon.jsx';
import Toggle from '../components/Toggle.jsx';
import { usePrefs } from '../lib/prefs.jsx';
import { useLazyEffect } from '../lib/motion.js';
import { SCENES } from './landing/scenes.js';
import { COMPARE, DAY, FAQ } from './landing/content.js';
import model from '@shared/model.json';
import '../styles/landing.css';

gsap.registerPlugin(ScrollTrigger);

const pct = (v) => `${Math.round(v * 100)}%`;

/* Splits a heading into masked words for the entrance. Text stays real text. */
function Split({ children }) {
  return String(children).split(' ').map((w, i, a) => (
    <Fragment key={i}><span className="w"><span className="wi">{w}</span></span>{i < a.length - 1 ? ' ' : ''}</Fragment>
  ));
}

function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo" aria-label="Perk Predict, home"><Logo /></Link>
        <nav aria-label="Page sections" className="nav-links">
          <a href="#engine">How it decides</a>
          <a href="#compare">Compare</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="nav-actions">
          <Link to="/app/demo" className="nav-demo">Try the demo</Link>
          <Link to="/signup" className="btn btn-primary btn-small">Create account</Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title" className="hero-title" data-split>
          <Split>Rewards that find you</Split>
        </h1>
        <p className="hero-sub">Perk Predict sends one offer at the moment it fits, tells you why, and stays quiet the rest of the time.</p>
        <div className="hero-actions">
          <Link to="/signup" className="btn btn-primary">Create account</Link>
          <Link to="/app/demo" className="text-link">Try the live demo</Link>
        </div>
      </div>
      <div className="hero-visual">
        <Phone className="hero-phone" label="The Perk Predict wallet: 2,350 points, with 300 points expiring in 3 days on the 14-day clock, an offer for Campus Coffee, and favorite brands.">
          <WalletFragment />
        </Phone>
        <div className="hero-nudge" data-depth="-0.35" aria-hidden="true">
          <Nudge title="Your coffee is on your points" body="300 points cover any coffee at Campus Coffee. They expire in 3 days." />
        </div>
        <p className="hero-caption">The real wallet, set with demo data.</p>
      </div>
    </section>
  );
}

function Meter({ value, dark = false }) {
  return (
    <div className={`meter ${dark ? 'meter-dark' : ''}`}>
      <div className="meter-row">
        <span className="meter-value">{pct(value)}</span>
        <span className="meter-bar-label">{value >= 0.7 ? 'Above the 70% bar' : 'Below the 70% bar'}</span>
      </div>
      <div className="meter-track" aria-hidden="true">
        <span className="meter-fill" style={{ width: pct(value) }} />
        <span className="meter-bar" style={{ left: '70%' }} />
      </div>
    </div>
  );
}

const STAKES = [
  { figure: '$42B', text: 'in loyalty value is lost every year.', source: 'FIS Innovation Challenge brief' },
  { figure: '26.2%', text: 'of loyalty points go unspent.', source: 'Antavo, Global Customer Loyalty Report 2026' },
  { figure: '41.1%', text: 'are frustrated by expiring points.', source: 'Antavo, Global Customer Loyalty Report 2026' },
];

function Stakes({ clockRef, stakeDays }) {
  return (
    <section className="stakes on-field" aria-labelledby="stakes-title" data-surface="field">
      <div className="stakes-inner">
        <div className="stakes-head">
          <h2 id="stakes-title" className="section-title" data-split><Split>Points are earned, then forgotten</Split></h2>
        </div>
        <div className="stakes-grid">
          <ol className="stakes-list" role="list">
            {STAKES.map((s) => (
              <li key={s.figure} className="stake">
                <p className="stake-line"><span className="stake-figure">{s.figure}</span> <span className="stake-text">{s.text}</span></p>
                <p className="stake-source">Source: {s.source}</p>
              </li>
            ))}
          </ol>
          <div className="stakes-clock">
            <ExpiryClock ref={clockRef} daysLeft={stakeDays} size={360} />
          </div>
        </div>
        <div className="stakes-view">
          <p className="stakes-view-lead">We think this is a timing and relevance problem, not a generosity problem.</p>
          <p className="stakes-view-body">Programs already give. Banks lose engagement when rewards sit unused, and merchants fund offers nobody claims. The offer arrives at the wrong moment, or never arrives at all.</p>
        </div>
      </div>
    </section>
  );
}

function OnTheClock() {
  const [points, setPoints] = useState(1200);
  const [days, setDays] = useState(5);
  const dollars = (points * 0.01).toFixed(2);
  return (
    <section className="clock-piece" aria-labelledby="clock-title">
      <div className="clock-piece-copy">
        <h2 id="clock-title" className="section-title" data-split><Split>See what is on the clock</Split></h2>
        <div className="slider">
          <label htmlFor="pts">Points about to expire <output htmlFor="pts">{points.toLocaleString()}</output></label>
          <input id="pts" type="range" min="100" max="5000" step="50" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
        </div>
        <div className="slider">
          <label htmlFor="days">Days left <output htmlFor="days">{days}</output></label>
          <input id="days" type="range" min="1" max="14" step="1" value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </div>
        <p className="clock-piece-result" aria-live="polite">
          <strong>${dollars}</strong> disappears in {days} {days === 1 ? 'day' : 'days'}.
        </p>
        <p className="fine">Demo math at 1 cent a point. Programs value points differently.</p>
      </div>
      <div className="clock-piece-visual">
        <div className="clock-piece-field">
          <ExpiryClock daysLeft={days} points={points} size={380} />
          <p className="clock-piece-caption">{points.toLocaleString()} points, {days} {days === 1 ? 'day' : 'days'} left</p>
        </div>
      </div>
    </section>
  );
}

function SceneVisual({ scene }) {
  const quiet = scene.phone === 'quiet';
  return (
    <div className={`scene-visual ${quiet ? 'is-quiet' : ''}`}>
      <div className="scene-phone">
        <Phone dark={quiet} time={scene.time.split(' ')[0].replace(',', '')} label={quiet ? `At ${scene.time}, nothing is sent.` : `At ${scene.time}, the nudge reads: ${scene.nudge.title}.`}>
          <div className="lock">
            <p className="lock-time">{scene.time.split(' ')[0].replace(',', '')}</p>
            {quiet ? (
              <div className="lock-quiet">
                <Icon name="moon" size={28} />
                <p>Nothing sent</p>
                <span>{scene.held}</span>
              </div>
            ) : (
              <Nudge title={scene.nudge.title} body={scene.nudge.body} />
            )}
          </div>
        </Phone>
      </div>
      <div className="scene-why">
        <Meter value={scene.rules.score} dark={quiet} />
        <Reasons compact title={quiet ? 'Why nothing was sent' : 'Why this offer'} reasons={scene.rules.reasons} />
        <p className="scene-model">The trained model scores this {pct(scene.model.score)}{scene.model.score >= 0.7 === scene.rules.score >= 0.7 ? ', the same call.' : ', so the server, which is pickier, would hold it.'}</p>
      </div>
    </div>
  );
}

function Engine() {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  activeRef.current = active;
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const dissolve = useRef(null);
  const { reduced } = usePrefs();

  useLazyEffect(stageRef, async () => {
    const { createDissolve } = await import('../webgl/dissolve.js');
    dissolve.current = createDissolve(canvasRef.current, SCENES[activeRef.current].tone);
    stageRef.current.classList.add('has-gl');
    return dissolve.current;
  }, [reduced]);

  useEffect(() => { dissolve.current?.to(SCENES[active].tone); }, [active]);

  useEffect(() => {
    if (reduced) return undefined;
    const triggers = gsap.utils.toArray('.scene').map((el, i) => ScrollTrigger.create({
      trigger: el, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => self.isActive && setActive(i),
    }));
    return () => triggers.forEach((t) => t.kill());
  }, [reduced]);

  return (
    <section id="engine" className="engine" aria-labelledby="engine-title">
      <div className="engine-head">
        <h2 id="engine-title" className="section-title" data-split><Split>How the engine decides</Split></h2>
        <p className="lede">Every moment gets a score from 0 to 99. At 70 or above, one offer goes out with its reasons. Below that, nothing does, and the app can tell you why.</p>
      </div>
      <div className={`engine-body ${reduced ? 'is-static' : ''}`}>
        <div className="engine-scenes">
          {SCENES.map((s, i) => (
            <article key={s.id} className={`scene ${i === active ? 'is-active' : ''}`} aria-labelledby={`scene-${s.id}`}>
              <p className="scene-time">{s.time}</p>
              <h3 id={`scene-${s.id}`} className="scene-title">{s.title}</h3>
              <p className="scene-place"><Icon name="pin" size={20} /> {s.place}</p>
              <p className="scene-body">{s.body}</p>
              <div className="scene-inline">
                <SceneVisual scene={s} />
              </div>
            </article>
          ))}
        </div>
        <div className="engine-stage" ref={stageRef} aria-hidden="true" style={{ '--tone': SCENES[active].tone }}>
          <canvas ref={canvasRef} className="engine-canvas" />
          {SCENES.map((s, i) => (
            <div key={s.id} className={`stage-slide ${i === active ? 'is-active' : ''}`}>
              <SceneVisual scene={s} />
            </div>
          ))}
        </div>
      </div>
      <div className="model">
        <div className="model-copy">
          <h3 className="model-title">The model against the rules</h3>
          <p>The rules above are the published baseline. On the server, a logistic regression trained on synthetic moments does the scoring, and the app falls back to the same model on the device if the server takes more than 2 seconds.</p>
          <p>On held-out synthetic people it ranks moments better, AUC {model.metrics.model.auc.toFixed(3)} against {model.metrics.rules.auc.toFixed(3)}, and its top pick of the day was used {pct(model.metrics.model.precisionAt1)} of the time against {pct(model.metrics.rules.precisionAt1)}. It is also pickier: {pct(model.metrics.model.sendRate)} of moments clear the bar, against {pct(model.metrics.rules.sendRate)}.</p>
          <p className="model-honest">The data is synthetic. This shows the pipeline works end to end. It says nothing about lift on real customers.</p>
        </div>
        <ModelChart />
      </div>
    </section>
  );
}

const TILE_COLORS = [
  { bg: '#f5f4f1', line: '#015b7e' },
  { bg: '#012834', line: '#4bcd3e' },
  { bg: '#ecebe6', line: '#285bc5' },
];

function OfferTile({ icon, merchant, offer, points, colors, dark }) {
  const ref = useRef(null);
  const canvas = useRef(null);
  useLazyEffect(ref, async () => {
    if (!matchMedia('(hover: hover)').matches) return null;
    const { createGuilloche } = await import('../webgl/guilloche.js');
    const h = createGuilloche(canvas.current, colors, { animate: () => document.documentElement.dataset.motion !== 'reduce' });
    ref.current.classList.add('has-gl');
    return h;
  });
  return (
    <li ref={ref} className={`tile ${dark ? 'tile-dark' : ''}`} style={{ '--tile-bg': colors.bg }}>
      <canvas ref={canvas} className="tile-canvas" aria-hidden="true" />
      <div className="tile-body">
        <Icon name={icon} size={28} />
        <p className="tile-offer">{offer}</p>
        <p className="tile-merchant">{merchant}</p>
        <p className="tile-points">{points} points</p>
      </div>
    </li>
  );
}

const BADGES = [
  { id: 'first', name: 'First redeem', icon: 'check' },
  { id: 'saver', name: 'Saved from expiring', icon: 'wallet' },
  { id: 'quiet', name: 'Quiet hours kept', icon: 'moon' },
  { id: 'linked', name: 'Card linked', icon: 'card' },
  { id: 'week', name: 'Weekly challenge', icon: 'calendar' },
];

const ACCENTS = [
  { id: 'teal', name: 'Teal', color: '#015b7e' },
  { id: 'blue', name: 'Blue', color: '#285bc5' },
  { id: 'green', name: 'Green', color: '#2f8f25' },
];

function Features() {
  const [perk, setPerk] = useState(false);
  const [accent, setAccent] = useState('teal');
  const accentColor = ACCENTS.find((a) => a.id === accent).color;
  return (
    <section className="features" aria-labelledby="features-title">
      <h2 id="features-title" className="section-title features-title" data-split><Split>What lives in the wallet</Split></h2>

      <article className="feat feat-brands" aria-labelledby="f-brands">
        <div className="feat-copy">
          <h3 id="f-brands" className="feat-title">Your brands, always in view</h3>
          <p>Pick one brand for each category. They stay on your wallet even on the days the engine decides to send nothing.</p>
        </div>
        <dl className="brand-index reveal-mask">
          {[['coffee', 'Coffee', 'Campus Coffee'], ['food', 'Food', 'Market Street Tacos'], ['books', 'Books', 'Chapter House Books'], ['groceries', 'Groceries', 'Fresh Lane Market']].map(([k, c, b]) => (
            <div key={k} className="brand-row">
              <dt><Icon name={categoryIcon[k]} size={26} /> {c}</dt>
              <dd>{b}</dd>
            </div>
          ))}
        </dl>
        <ul className="tiles" role="list" aria-label="Offers from favorite brands">
          <OfferTile icon="coffee" merchant="Campus Coffee" offer="Any coffee" points={300} colors={TILE_COLORS[0]} />
          <OfferTile icon="food" merchant="Market Street Tacos" offer="Two tacos" points={400} colors={TILE_COLORS[1]} dark />
          <OfferTile icon="books" merchant="Chapter House Books" offer="$6 off a paperback" points={600} colors={TILE_COLORS[2]} />
        </ul>
      </article>

      <article className="feat feat-cards" aria-labelledby="f-cards">
        <div className="feat-copy">
          <h3 id="f-cards" className="feat-title">Link a card without sharing it</h3>
          <p>Sign in at your bank, pick a card and the categories it covers. We keep the bank name and the last four digits. Never a card number, never a password.</p>
        </div>
        <ol className="link-steps" role="list">
          <li className="link-step reveal-mask" data-depth="0.1">
            <span className="link-step-n">1</span>
            <p className="link-step-title">Choose your bank</p>
            <div className="mini-list"><span><Icon name="bank" size={20} /> Harbor Bank</span><span><Icon name="bank" size={20} /> Summit Credit Union</span></div>
          </li>
          <li className="link-step reveal-mask" data-depth="0.2">
            <span className="link-step-n">2</span>
            <p className="link-step-title">Sign in at Harbor Bank</p>
            <div className="mini-bank"><Icon name="lock" size={20} /> You sign in on the bank’s own page. Perk Predict never sees it.</div>
          </li>
          <li className="link-step reveal-mask" data-depth="0.3">
            <span className="link-step-n">3</span>
            <p className="link-step-title">Pick a card and categories</p>
            <div className="mini-list"><span className="is-on"><Icon name="card" size={20} /> Ending 4821</span><span>Coffee, Food</span></div>
          </li>
          <li className="link-step link-step-done reveal-mask" data-depth="0.4">
            <span className="link-step-n">4</span>
            <p className="link-step-title">What we kept</p>
            <dl className="kept"><dt>Bank</dt><dd>Harbor Bank</dd><dt>Card</dt><dd>Ending 4821</dd><dt>Categories</dt><dd>Coffee, Food</dd></dl>
          </li>
        </ol>
      </article>

      <article className="feat feat-pay" aria-labelledby="f-pay">
        <div className="feat-copy">
          <h3 id="f-pay" className="feat-title">Points that pay at the counter</h3>
          <p>Turn on auto-apply for a linked card, set a limit per purchase and the categories it covers. Expiring points go first, and you get a confirmation with an Undo every time.</p>
          <p className="fine">Simulated in this prototype, with no real payment. In a real deployment it sits on FIS Premium Payback, which already redeems points for discounts in real time.</p>
        </div>
        <div className="receipt reveal-mask" data-depth="0.15">
          <div className="receipt-head">
            <span>Campus Coffee</span>
            <span>Harbor Bank, ending 4821</span>
          </div>
          <div className="receipt-row"><span>Purchase</span><span>$4.20</span></div>
          <div className="receipt-row receipt-points"><span>300 points applied</span><span>−$3.00</span></div>
          <div className="receipt-row receipt-total"><span>You paid</span><span>$1.20</span></div>
          <div className="receipt-why">
            <Reasons compact title="Why this was applied" reasons={[
              { text: 'Auto-apply is on for this card', effect: 'up' },
              { text: 'Coffee is a category you allowed', effect: 'up' },
              { text: 'Within your $3.00 limit per purchase', effect: 'up' },
              { text: 'These 300 points were due to expire in 3 days, so they went first', effect: 'up' },
            ]} />
          </div>
          <span className="receipt-undo"><Icon name="undo" size={20} /> Undo, 10 s</span>
        </div>
      </article>

      <article className="feat feat-wins" aria-labelledby="f-wins">
        <div className="feat-copy">
          <h3 id="f-wins" className="feat-title">Small wins, kept honest</h3>
          <p>A running total of what you saved from expiring, five badges, one perk to reveal each day, and an accent color of your own.</p>
        </div>
        <div className="wins">
          <div className="win win-saved reveal-mask">
            <p className="win-big">$3.00</p>
            <p>saved from expiring this week</p>
          </div>
          <ul className="win win-badges" role="list" aria-label="Five badges">
            {BADGES.map((b) => (
              <li key={b.id}><span className="badge"><Icon name={b.icon} size={24} /></span>{b.name}</li>
            ))}
          </ul>
          <div className="win win-perk">
            <p className="win-label">Daily perk</p>
            {perk
              ? <p className="perk-reveal" aria-live="polite"><strong>Double points at Green Bowl</strong> until 9 pm today.</p>
              : <button type="button" className="btn btn-quiet btn-small" onClick={() => setPerk(true)}><Icon name="gift" size={22} /> Reveal today’s perk</button>}
          </div>
          <div className="win win-theme" style={{ '--pick': accentColor }}>
            <p className="win-label" id="theme-label">Accent color</p>
            <div className="swatches" role="radiogroup" aria-labelledby="theme-label">
              {ACCENTS.map((a) => (
                <button key={a.id} type="button" role="radio" aria-checked={accent === a.id} className="swatch" style={{ '--c': a.color }} onClick={() => setAccent(a.id)}>
                  <span className="visually-hidden">{a.name}</span>
                </button>
              ))}
            </div>
            <div className="theme-preview" aria-hidden="true">
              <span className="theme-tab is-on"><Icon name="wallet" size={22} /></span>
              <span className="theme-tab"><Icon name="heart" size={22} /></span>
              <span className="theme-toggle"><i /></span>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

function Compare() {
  return (
    <section id="compare" className="compare" aria-labelledby="compare-title">
      <div className="compare-head">
        <h2 id="compare-title" className="section-title" data-split><Split>Most programs wait for you</Split></h2>
        <p className="lede">Chase Ultimate Rewards, Starbucks Rewards and Discover it are strong programs. Each one waits for the customer to come to it.</p>
      </div>
      <div className="table-wrap" role="region" aria-labelledby="compare-title" tabIndex={0}>
        <table className="compare-table">
          <caption className="visually-hidden">Typical programs compared with Perk Predict</caption>
          <thead>
            <tr>
              <td />
              {COMPARE.columns.map((c, i) => <th key={c} scope="col" className={i === 3 ? 'is-us' : ''}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {COMPARE.rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {r.cells.map((c, i) => <td key={i} className={i === 3 ? 'is-us' : ''}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fine compare-note">Based on each program’s public terms as we understand them in 2026. Terms change, so check the program before relying on this.</p>
    </section>
  );
}

function Access() {
  const { prefs, set, reduced } = usePrefs();
  return (
    <section className="access" aria-labelledby="access-title">
      <div className="access-copy">
        <h2 id="access-title" className="section-title" data-split><Split>Built for everyone</Split></h2>
        <p className="lede">Built to meet WCAG 2.1 AA. These are the same settings the app ships with, and they work on this page right now.</p>
        <ul className="access-list" role="list">
          <li>Every tap target is at least 48 pixels.</li>
          <li>Focus moves to the new heading at each step.</li>
          <li>Every nudge is read aloud with its reasons.</li>
          <li>Text stays at 16 pixels or larger, in full ink.</li>
        </ul>
      </div>
      <div className="access-controls">
        <fieldset className="seg">
          <legend>Text size</legend>
          {[['normal', 'Standard'], ['large', 'Large'], ['largest', 'Largest']].map(([v, l]) => (
            <label key={v} className="seg-opt">
              <input type="radio" name="text-size" value={v} checked={prefs.text === v} onChange={() => set({ text: v })} />
              <span>{l}</span>
            </label>
          ))}
        </fieldset>
        <Toggle label="High contrast" checked={prefs.contrast === 'high'} onChange={(on) => set({ contrast: on ? 'high' : 'normal' })} />
        <Toggle label="Reduce motion" hint={prefs.motion === 'auto' && reduced ? 'On because your device asks for it' : 'Drops travel and parallax, keeps all content'} checked={reduced} onChange={(on) => set({ motion: on ? 'reduce' : 'full' })} />
      </div>
    </section>
  );
}


function Day() {
  return (
    <section className="day" aria-labelledby="day-title">
      <div className="day-head">
        <h2 id="day-title" className="section-title" data-split><Split>A day with Perk Predict</Split></h2>
        <p className="lede">An illustrative day with demo data. Not a customer story.</p>
      </div>
      <ol className="day-list" role="list">
        {DAY.map((d) => (
          <li key={d.time} className={`day-item ${d.sent ? 'is-sent' : ''}`}>
            <p className="day-time">{d.time}</p>
            <div>
              <p className="day-what">{d.what}</p>
              <p className="day-detail">{d.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="day-end">By midnight Maya saved $3.00 from expiring. She got one nudge and one payment confirmation.</p>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="faq" aria-labelledby="faq-title">
      <h2 id="faq-title" className="section-title" data-split><Split>Questions, answered plainly</Split></h2>
      <div className="faq-list">
        {FAQ.map((f) => (
          <details key={f.q} className="faq-item">
            <summary><h3>{f.q}</h3><span className="faq-icon" aria-hidden="true" /></summary>
            <div className="faq-a">{f.a.map((p, i) => <p key={i}>{p}</p>)}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

function Close() {
  return (
    <>
      <section className="close" aria-labelledby="close-title">
        <h2 id="close-title" className="close-title" data-split><Split>Your points, on time</Split></h2>
        <div className="close-actions">
          <Link to="/signup" className="btn btn-primary">Create account</Link>
          <Link to="/app/demo" className="btn btn-quiet">Try the live demo</Link>
        </div>
      </section>
      <footer className="footer on-field" data-surface="field">
        <p className="footer-name" aria-hidden="true">Perk Predict</p>
        <div className="footer-meta">
          <p>A prototype for the FIS Innovation Challenge, Predictive Loyalty Engine.</p>
          <p>All people, merchants, banks, balances and model data are synthetic demo data. No real payments are made and no real card data is used. FIS product names belong to FIS.</p>
          <nav aria-label="Footer" className="footer-links">
            <Link to="/app/demo">Live demo</Link>
            <Link to="/app">Open the app</Link>
            <a href="#faq">FAQ</a>
          </nav>
        </div>
      </footer>
    </>
  );
}

export default function Landing() {
  const root = useRef(null);
  const stakeClock = useRef(null);
  const { reduced } = usePrefs();
  const [stakeDays, setStakeDays] = useState(14);

  useEffect(() => {
    document.title = 'Perk Predict: rewards that find you';
  }, []);

  useEffect(() => {
    if (reduced) {
      setStakeDays(3);
      return undefined;
    }
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // In-page anchors go through Lenis so the smooth scroll stays in step.
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
      const focusEl = target.matches('section') ? target.querySelector('h2') || target : target;
      focusEl.setAttribute('tabindex', '-1');
      focusEl.focus({ preventScroll: true });
    };
    document.addEventListener('click', onClick);

    const ctx = gsap.context(() => {
      const ease = 'expo.out';
      // One orchestrated load: headline words rise out of their masks, the
      // phone arrives, then the nudge lands on it.
      const intro = gsap.timeline({ defaults: { ease } });
      intro
        .from('.hero-title .wi', { yPercent: 110, duration: 1.3, stagger: 0.07 })
        .from('.hero-sub, .hero-actions', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.08 }, '-=0.9')
        .from('.hero-phone', { y: 120, autoAlpha: 0, duration: 1.6 }, 0.15)
        .from('.hero-nudge', { y: -40, scale: 0.94, autoAlpha: 0, duration: 1.1 }, 1.25);

      // Parallax depth on the phone and its fragments.
      gsap.to('.hero-phone', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.utils.toArray('.hero [data-depth]').forEach((el) => {
        gsap.to(el, { yPercent: Number(el.dataset.depth) * 100, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      });

      // Section headings: words rise from their masks once.
      gsap.utils.toArray('section:not(.hero) [data-split]').forEach((h) => {
        gsap.from(h.querySelectorAll('.wi'), { yPercent: 110, duration: 1.1, ease, stagger: 0.05, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
      });

      // The stakes: each figure is unmasked from below, and the clock
      // drains from 14 days to none as the section passes.
      gsap.utils.toArray('.stake').forEach((el) => {
        gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      });
      ScrollTrigger.create({
        trigger: '.stakes', start: 'top 70%', end: 'bottom 40%', scrub: true,
        onUpdate: (self) => setStakeDays(14 * (1 - self.progress)),
      });

      // Image-mask reveals on the feature compositions.
      gsap.utils.toArray('.reveal-mask').forEach((el) => {
        gsap.fromTo(el, { clipPath: 'inset(8% 8% 8% 8% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.4, ease, scrollTrigger: { trigger: el, start: 'top 85%', once: true }, clearProps: 'clipPath' });
      });
      gsap.utils.toArray('.features [data-depth]').forEach((el) => {
        gsap.fromTo(el, { y: Number(el.dataset.depth) * 160 }, { y: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 40%', scrub: true } });
      });
      gsap.from('.tile', { y: 60, autoAlpha: 0, duration: 1.1, ease, stagger: 0.1, scrollTrigger: { trigger: '.tiles', start: 'top 85%', once: true } });

      gsap.from('.compare-table tbody tr', { autoAlpha: 0, y: 16, duration: 0.8, ease, stagger: 0.05, scrollTrigger: { trigger: '.compare-table', start: 'top 80%', once: true } });
      gsap.from('.day-item', { autoAlpha: 0, x: -24, duration: 0.9, ease, stagger: 0.08, scrollTrigger: { trigger: '.day-list', start: 'top 80%', once: true } });

      gsap.fromTo('.footer-name', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    }, root);

    return () => {
      document.removeEventListener('click', onClick);
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [reduced]);

  return (
    <div ref={root} className="landing">
      <a className="skip-link" href="#main">Skip to content</a>
      <Nav />
      <main id="main">
        <Hero />
        <Stakes clockRef={stakeClock} stakeDays={stakeDays} />
        <OnTheClock />
        <Engine />
        <Features />
        <Compare />
        <Access />
        <Day />
        <Faq />
        <Close />
      </main>
    </div>
  );
}
