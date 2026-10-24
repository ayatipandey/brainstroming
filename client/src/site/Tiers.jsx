import { BRAND } from '@shared/brand.config.js';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { TIERS, REWARDS, rewardById, merchantById, termsFor, POINTS_PER_DOLLAR } from '@shared/catalog.js';
import Split from '../components/Split.jsx';
import { usePageMotion, riseHeadings } from '../lib/motion.js';
import { usePage } from '../lib/page.js';
import { NextPage } from './SiteLayout.jsx';

const sample = rewardById('fl-basket');

const HOW = {
  member: 'Where everyone starts.',
  silver: 'After a few weeks of everyday use.',
  gold: 'For regulars.',
  platinum: 'For the people who use it most.',
};

export default function Tiers() {
  const root = useRef(null);
  const h1 = usePage(`Tiers and terms, ${BRAND.name}`);

  usePageMotion(root, (g) => {
    riseHeadings(g);
    // The four tier cards come up out of a stack and fan into a row.
    const cards = g.utils.toArray('.tier-card');
    const tl = g.timeline({ scrollTrigger: { trigger: '.fan', start: 'top 75%', end: 'center 50%', scrub: 0.7 } });
    cards.forEach((c, i) => {
      tl.from(c, {
        x: () => (cards[0].getBoundingClientRect().left - c.getBoundingClientRect().left) + i * 18,
        y: () => (cards[0].getBoundingClientRect().top - c.getBoundingClientRect().top) + i * 18,
        z: -i * 120,
        rotateY: -38,
        rotateX: 18,
        ease: 'power2.out',
        duration: 1,
      }, 0);
    });
    g.from('.term-sample .term', { autoAlpha: 0, x: -24, stagger: 0.06, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '.term-sample', start: 'top 75%', once: true } });
  });

  return (
    <div ref={root} className="page tiers">
      <header className="page-head">
        <h1 ref={h1} tabIndex={-1} className="page-title" data-split><Split>Use more, unlock better</Split></h1>
        <p className="lede">Points from paying with your linked card add up. Each tier keeps every reward from the tiers below and adds better value ones.</p>
      </header>

      <section className="fan-wrap" aria-labelledby="fan-h">
        <h2 id="fan-h" className="visually-hidden">The four tiers</h2>
        <ol className="fan" role="list">
          {TIERS.map((t) => {
            const rewards = REWARDS.filter((r) => r.tier === t.id);
            return (
              <li key={t.id} className={`tier-card tc-${t.id}`}>
                <div className="tc-top">
                  <h3 className="tc-name">{t.name}</h3>
                  <p className="tc-min">{t.min ? `From ${t.min.toLocaleString()} points` : 'From your first day'}</p>
                </div>
                <p className="tc-how">{HOW[t.id]}</p>
                <ul role="list" className="tc-list">
                  {rewards.map((r) => (
                    <li key={r.id}><span className="tc-title">{r.title}</span><span className="tc-where">{merchantById(r.merchantId).name}</span></li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
        <p className="fine fan-note">You earn {POINTS_PER_DOLLAR} points for every dollar you pay with a linked card. Tiers are based on all the points you have ever earned, so using points on rewards never moves you down.</p>
      </section>

      <section className="terms-section" aria-labelledby="terms-h">
        <div className="terms-copy">
          <h2 id="terms-h" className="section-title" data-split><Split>Terms you can actually read</Split></h2>
          <p className="lede">Every reward shows the same eight terms, in the same order, in plain words. No small print, no asterisks, nothing hidden behind a link.</p>
          <Link to="/app" className="btn btn-primary">See your rewards</Link>
        </div>
        <div className="term-sample">
          <p className="term-sample-title">{sample.title}</p>
          <p className="term-sample-merchant">{merchantById(sample.merchantId).name}</p>
          <dl>
            {termsFor(sample).map((t) => (
              <div key={t.label} className="term">
                <dt>{t.label}</dt>
                <dd>{t.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="page-end">
        <NextPage to="/faq" label="Next" title="Questions, answered" />
      </div>
    </div>
  );
}
