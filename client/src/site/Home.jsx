import { BRAND } from '@shared/brand.config.js';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { merchantById, CATEGORIES, categoryOf } from '@shared/catalog.js';
import Phone from '../components/Phone.jsx';
import AppPreview, { demoRanking } from '../components/AppPreview.jsx';
import Split from '../components/Split.jsx';
import Icon, { categoryIcon } from '../components/Icon.jsx';
import { Qr, keyTerms } from '../components/RewardParts.jsx';
import { usePageMotion, riseHeadings } from '../lib/motion.js';
import { NextPage } from './SiteLayout.jsx';
import { usePage } from '../lib/page.js';

const STAKES = [
  { figure: '$42B', text: 'in loyalty value is lost every year.', source: 'FIS Innovation Challenge brief' },
  { figure: '26.2%', text: 'of loyalty points go unspent.', source: 'Antavo, Global Customer Loyalty Report 2026' },
  { figure: '41.1%', text: 'are frustrated by expiring points.', source: 'Antavo, Global Customer Loyalty Report 2026' },
];

export default function Home() {
  const root = useRef(null);
  const h1 = usePage(`${BRAND.name}: rewards that find you`);
  const ranked = demoRanking();

  usePageMotion(root, (g) => {
    const ease = 'expo.out';
    // One load sequence: words rise, the phone swings in, the fragments land.
    g.timeline({ defaults: { ease } })
      .from('.hero-title .wi', { yPercent: 110, duration: 1.3, stagger: 0.07 })
      .from('.hero-sub, .hero-actions', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.08 }, '-=0.9')
      .from('.hero-rig', { rotateY: -48, rotateX: 28, y: 140, autoAlpha: 0, duration: 1.8 }, 0.1)
      .from('.float-qr', { z: -200, autoAlpha: 0, duration: 1.2 }, 1.0)
      .from('.float-toast', { z: -260, autoAlpha: 0, duration: 1.2 }, 1.25);

    // As the hero scrolls away the phone squares up to face you and the
    // fragments drift forward in depth.
    const out = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    g.to('.hero-rig', { rotateY: 0, rotateX: 0, rotateZ: 0, y: -60, ease: 'none', scrollTrigger: out });
    g.to('.float-toast', { z: 320, y: -120, ease: 'none', scrollTrigger: out });
    g.to('.float-qr', { z: 220, y: 80, ease: 'none', scrollTrigger: out });

    riseHeadings(g, 'section:not(.hero)');

    // The pile of rewards stands up and sorts itself into the ranked list.
    const cards = g.utils.toArray('.deck-card');
    const tl = g.timeline({ scrollTrigger: { trigger: '.sort', start: 'top 70%', end: 'center 45%', scrub: 0.6 } });
    cards.forEach((c, i) => {
      tl.from(c, {
        y: () => -c.offsetTop + i * 14,
        z: -i * 90,
        rotateX: 62,
        rotateZ: (i % 2 ? 1 : -1) * (4 + i * 2),
        ease: 'power2.out',
        duration: 1,
      }, i * 0.08);
    });

    g.utils.toArray('.stake').forEach((el, i) => {
      g.from(el, { rotateX: -70, y: 60, autoAlpha: 0, duration: 1.3, ease, delay: i * 0.08, transformOrigin: '50% 100%', scrollTrigger: { trigger: '.stakes-row', start: 'top 80%', once: true } });
    });
  });

  return (
    <div ref={root} className="page home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 ref={h1} tabIndex={-1} id="hero-title" className="hero-title" data-split><Split>Rewards that find you</Split></h1>
          <p className="hero-sub">Your most likely reward sits at the top. Show the code, or just pay with your linked card and it applies itself.</p>
          <div className="hero-actions">
            <Link to="/app" className="btn btn-primary">Sign in</Link>
            <Link to="/how-it-works" className="text-link">See how it works</Link>
          </div>
        </div>
        <div className="hero-stage">
          <div className="hero-rig">
            <Phone className="hero-phone" label={`The ${BRAND.name} app: Silver tier with 1,120 points, the top reward is any coffee on us at Campus Coffee, ending in 3 days, followed by more rewards.`}>
              <AppPreview rows={3} />
            </Phone>
            <div className="float float-toast" aria-hidden="true">
              <p className="float-title">Reward applied</p>
              <p>Any coffee, on us, at Campus Coffee. $4.20 became $0.00.</p>
            </div>
            <div className="float float-qr" aria-hidden="true">
              <Qr text="perkpredict:cc-coffee:demo" size={92} />
              <p className="float-code">PP-4K2-9QX</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sort" aria-labelledby="sort-title">
        <div className="sort-copy">
          <h2 id="sort-title" className="section-title" data-split><Split>Sorted for the moment</Split></h2>
          <p className="lede">Every reward is scored for the time of day, the stores you star, and how soon it ends. The one you are most likely to use rises to the top.</p>
          <p className="fine">Ranking at 2:47 pm for a demo member who starred Campus Coffee.</p>
        </div>
        <ol className="deck" role="list" aria-label="Rewards in ranked order">
          {ranked.slice(0, 5).map(({ reward, why }, i) => {
            const m = merchantById(reward.merchantId);
            const cat = categoryOf(reward);
            return (
              <li key={reward.id} className={`deck-card ${i === 0 ? 'is-top on-claret' : ''}`}>
                <span className="deck-icon"><Icon name={categoryIcon[cat]} size={26} /></span>
                <span className="deck-main">
                  <span className="deck-title">{reward.title}</span>
                  <span className="deck-meta">{m.name}. {i === 0 && why.length ? `${why.join('. ')}.` : keyTerms(reward)}</span>
                </span>
                <span className="deck-cat">{CATEGORIES[cat].label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="stakes on-claret" aria-labelledby="stakes-title">
        <h2 id="stakes-title" className="section-title" data-split><Split>Points earned, then forgotten</Split></h2>
        <ul className="stakes-row" role="list">
          {STAKES.map((s) => (
            <li key={s.figure} className="stake">
              <p className="stake-figure">{s.figure}</p>
              <p className="stake-text">{s.text}</p>
              <p className="stake-source">Source: {s.source}</p>
            </li>
          ))}
        </ul>
        <p className="stakes-view">We think it is a timing and relevance problem, not a generosity problem.</p>
      </section>

      <section className="close" aria-labelledby="close-title">
        <h2 id="close-title" className="close-title" data-split><Split>Your points, on time</Split></h2>
        <div className="close-actions">
          <Link to="/app" className="btn btn-primary">Sign in</Link>
        </div>
        <NextPage to="/how-it-works" label="Next" title="How it works" />
      </section>
    </div>
  );
}
