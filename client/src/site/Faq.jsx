import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Split from '../components/Split.jsx';
import Toggle from '../components/Toggle.jsx';
import { usePrefs } from '../lib/prefs.jsx';
import { usePageMotion, riseHeadings } from '../lib/motion.js';
import { usePage } from '../lib/page.js';

const FAQ = [
  { q: 'Which reward goes on top?', a: 'The one you are most likely to use right now. Each reward is scored from the time of day, the rewards and stores you star, and how soon it ends. The reasons are written on the top card.' },
  { q: 'How does a reward apply itself?', a: 'Link a card and keep auto-apply on. When you pay with that card at a store where you have a reward, the best one for that purchase is used, your list and points update, and you get a confirmation. You can turn auto-apply off in Account and show the code instead.' },
  { q: 'Do you store my card number?', a: 'No. Perk Predict keeps the bank name and the last four digits, nothing else. It never sees a card number or a password. In this prototype the card link and payments are simulated.' },
  { q: 'How do I unlock better rewards?', a: 'Use rewards and pay with your linked card. Using a reward earns bonus points and every dollar you pay earns 10 points. Silver starts at 600 points, Gold at 1,250, and Platinum at 2,500.' },
  { q: 'Where are the terms?', a: 'On every reward, under “Terms, in plain words”: what you get, where, valid until, how many times, minimum spend, points you earn, what happens with a linked card, and anything else that applies.' },
  { q: 'Is this real data?', a: 'No. Every person, store, bank, balance and reward is demo data, and the ranking model was trained on synthetic data. It has not been tested with real customers, and we make no claims about real results.' },
  { q: 'Does it use my location?', a: 'No. The ranking uses the time of day, your stars and how soon rewards end. The app never asks for your birthday either.' },
];

export default function Faq() {
  const root = useRef(null);
  const h1 = usePage('Questions, Perk Predict');
  const { prefs, set, reduced } = usePrefs();

  usePageMotion(root, (g) => {
    riseHeadings(g);
    g.from('.faq-item', { autoAlpha: 0, y: 24, rotateX: -40, transformOrigin: '50% 0%', stagger: 0.06, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.faq-list', start: 'top 80%', once: true } });
  });

  return (
    <div ref={root} className="page faq">
      <header className="page-head">
        <h1 ref={h1} tabIndex={-1} className="page-title" data-split><Split>Questions, answered</Split></h1>
      </header>

      <section className="faq-list" aria-label="Frequently asked questions">
        {FAQ.map((f) => (
          <details key={f.q} className="faq-item">
            <summary><h2 className="faq-q">{f.q}</h2><span className="faq-icon" aria-hidden="true" /></summary>
            <p className="faq-a">{f.a}</p>
          </details>
        ))}
      </section>

      <section className="access" aria-labelledby="access-h">
        <div>
          <h2 id="access-h" className="section-title" data-split><Split>Built for everyone</Split></h2>
          <p className="lede">Built to meet WCAG 2.1 AA, not certified. These are the app’s own reading settings, and they work on this page now.</p>
        </div>
        <div className="access-controls">
          <fieldset className="seg">
            <legend>Text size</legend>
            {[['normal', 'Standard'], ['large', 'Large'], ['largest', 'Largest']].map(([v, l]) => (
              <label key={v} className="seg-opt">
                <input type="radio" name="text-size" checked={prefs.text === v} onChange={() => set({ text: v })} />
                <span>{l}</span>
              </label>
            ))}
          </fieldset>
          <Toggle id="site-hc" label="High contrast" checked={prefs.contrast === 'high'} onChange={(on) => set({ contrast: on ? 'high' : 'normal' })} />
          <Toggle id="site-rm" label="Reduce motion" hint="Turns off 3D and scroll effects, keeps every word" checked={reduced} onChange={(on) => set({ motion: on ? 'reduce' : 'full' })} />
        </div>
      </section>

      <section className="close close-small" aria-labelledby="go-h">
        <h2 id="go-h" className="close-title" data-split><Split>See your rewards</Split></h2>
        <div className="close-actions"><Link to="/app" className="btn btn-primary">Sign in</Link></div>
      </section>
    </div>
  );
}
