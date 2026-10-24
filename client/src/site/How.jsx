import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { rewardById, REWARDS } from '@shared/catalog.js';
import model from '@shared/model.json';
import Phone from '../components/Phone.jsx';
import AppPreview from '../components/AppPreview.jsx';
import Split from '../components/Split.jsx';
import Icon from '../components/Icon.jsx';
import ModelChart from '../components/ModelChart.jsx';
import { Qr, keyTerms, RewardRow } from '../components/RewardParts.jsx';
import { usePageMotion, riseHeadings } from '../lib/motion.js';
import { usePage } from '../lib/page.js';
import { NextPage } from './SiteLayout.jsx';

const pct = (v) => `${Math.round(v * 100)}%`;
const coffee = rewardById('cc-coffee');
const goldRewards = REWARDS.filter((r) => r.tier === 'gold');

export default function How() {
  const root = useRef(null);
  const h1 = usePage('How it works, Perk Predict');

  const reduced = usePageMotion(root, (g) => {
    riseHeadings(g);
    // The ranked phone leans back as it enters, then squares up.
    g.fromTo('.how-rig', { rotateX: 32, rotateY: 20, y: 80 }, { rotateX: 0, rotateY: 0, y: 0, ease: 'none', scrollTrigger: { trigger: '.how-rank', start: 'top bottom', end: 'center center', scrub: true } });

    // The reward card turns over to show its code.
    g.fromTo('.flip-inner', { rotateY: 0 }, { rotateY: 180, ease: 'power1.inOut', scrollTrigger: { trigger: '.how-show', start: 'top 60%', end: 'center 40%', scrub: 0.6 } });

    // Points climb, the bar fills, and the Gold rewards turn face up.
    const st = { trigger: '.how-tier', start: 'top 65%', end: 'center 45%', scrub: 0.6 };
    const counter = { v: 1120 };
    const pointsEl = root.current.querySelector('.climb-points');
    const tierEl = root.current.querySelector('.climb-tier-name');
    const chipEl = root.current.querySelector('.climb-tier .tier-chip');
    const nextEl = root.current.querySelector('.climb-next');
    const paint = () => {
      const v = Math.round(counter.v);
      const gold = v >= 1250;
      pointsEl.textContent = v.toLocaleString();
      tierEl.textContent = gold ? 'Gold' : 'Silver';
      chipEl.className = `tier-chip ${gold ? 'tier-gold' : 'tier-silver'}`;
      nextEl.textContent = gold ? 'Gold reached. 4 new rewards unlocked.' : `${(1250 - v).toLocaleString()} points to Gold`;
    };
    g.fromTo(counter, { v: 1120 }, { v: 1270, ease: 'none', scrollTrigger: st, onUpdate: paint, onStart: paint });
    paint();
    g.fromTo('.climb-fill', { width: '80%' }, { width: '100%', ease: 'none', scrollTrigger: st });
    g.from('.unlock-list .rr', { rotateX: -90, autoAlpha: 0, transformOrigin: '50% 0%', stagger: 0.15, ease: 'power2.out', scrollTrigger: { trigger: '.unlock-list', start: 'top 80%', end: 'top 40%', scrub: 0.6 } });
  });

  return (
    <div ref={root} className="page how">
      <header className="page-head">
        <h1 ref={h1} tabIndex={-1} className="page-title" data-split><Split>How it works</Split></h1>
        <p className="lede">One list, sorted for you. Show a code at the counter, or pay with your linked card and let the reward apply itself. Every reward you use moves you toward better ones.</p>
      </header>

      <section className="how-row how-rank" aria-labelledby="rank-h">
        <div className="how-copy">
          <h2 id="rank-h" className="section-title" data-split><Split>The likeliest reward, on top</Split></h2>
          <p>Each reward gets a score from the time of day, the rewards and stores you star, and how soon it ends. The highest score sits at the top of your list in claret, with the reasons written underneath.</p>
          <p>Search, filter by category, or show only your starred rewards whenever you want to look past the top pick.</p>
        </div>
        <div className="how-stage">
          <div className="how-rig">
            <Phone className="how-phone" label="The rewards list with the top pick and three more rewards below it.">
              <AppPreview rows={2} />
            </Phone>
          </div>
        </div>
      </section>

      <section className="how-row how-show" aria-labelledby="show-h">
        <div className="how-copy">
          <h2 id="show-h" className="section-title" data-split><Split>Show the code, or just pay</Split></h2>
          <p>Tap a reward and its QR code and a short written code appear together, so it works with a scanner or a person reading it out.</p>
          <p>Or skip the tap. Pay with a linked card and your best reward at that store applies itself, then your list, points and activity update.</p>
          <p className="fine">Card payments are simulated in this prototype. In a real deployment they run on FIS Premium Payback.</p>
        </div>
        <div className="flip" aria-label="A reward card and its code">
          <div className={`flip-inner ${reduced ? 'is-static' : ''}`}>
            <div className="flip-face flip-front on-claret">
              <p className="flip-merchant">Campus Coffee</p>
              <p className="flip-title">{coffee.title}</p>
              <p className="flip-terms">{keyTerms(coffee)}</p>
            </div>
            <div className="flip-face flip-back">
              <Qr text="perkpredict:cc-coffee:demo" size={150} />
              <p className="flip-code">PP-4K2-9QX</p>
              <p className="flip-hint">Scan, or read out the code</p>
            </div>
          </div>
          <div className="receipt">
            <p className="receipt-title"><Icon name="card" /> Paid with Harbor Bank, ending 4821</p>
            <p className="receipt-line"><span>Campus Coffee</span><span>$4.20</span></p>
            <p className="receipt-line receipt-off"><span>{coffee.title}</span><span>−$4.20</span></p>
            <p className="receipt-line receipt-total"><span>You paid</span><span>$0.00</span></p>
            <p className="receipt-earn">+150 points</p>
          </div>
        </div>
      </section>

      <section className="how-row how-tier" aria-labelledby="tier-h">
        <div className="how-copy">
          <h2 id="tier-h" className="section-title" data-split><Split>Use rewards, unlock better ones</Split></h2>
          <p>Using a reward earns bonus points, and paying with your linked card earns 10 points for every dollar. Points move you from Member to Silver, Gold and Platinum, and each tier unlocks bigger rewards.</p>
          <Link to="/tiers" className="text-link">See every tier</Link>
        </div>
        <div className="climb">
          <div className="climb-head">
            <p className="climb-tier"><span className="tier-chip tier-gold" aria-hidden="true" /><span className="climb-tier-name">Gold</span></p>
            <p><strong className="climb-points">1,270</strong> points</p>
          </div>
          <div className="climb-track" aria-hidden="true"><span className="climb-fill" /></div>
          <p className="climb-next">Gold reached. 4 new rewards unlocked.</p>
          <ul className="rr-list unlock-list" role="list" aria-label="Rewards unlocked at Gold">
            {goldRewards.slice(0, 3).map((r) => <RewardRow key={r.id} reward={r} starred={false} />)}
          </ul>
        </div>
      </section>

      <section className="how-model" aria-labelledby="model-h">
        <div className="how-copy">
          <h2 id="model-h" className="section-title" data-split><Split>Checked against simple rules</Split></h2>
          <p>The ranking uses a logistic regression trained on synthetic data, compared with a plain rules baseline. On held-out synthetic people it ranks better, AUC {model.metrics.model.auc.toFixed(3)} against {model.metrics.rules.auc.toFixed(3)}, and its top pick was used {pct(model.metrics.model.precisionAt1)} of the time against {pct(model.metrics.rules.precisionAt1)}.</p>
          <p className="strong">The data is synthetic. This shows the pipeline works, not that it lifts results for real customers.</p>
        </div>
        <ModelChart />
      </section>

      <div className="page-end">
        <NextPage to="/tiers" label="Next" title="Tiers and terms" />
      </div>
    </div>
  );
}
