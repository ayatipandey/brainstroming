import { useParams, Link } from 'react-router-dom';
import { merchantById, termsFor, TIERS, money2 } from '@shared/catalog.js';
import { Screen } from '../AppRoutes.jsx';
import { useSession } from '../session.jsx';
import { api } from '../api.js';
import { Qr, codeFor, StarButton, keyTerms } from '../../components/RewardParts.jsx';
import BrandMark from '../../components/BrandMark.jsx';

export default function RewardDetail() {
  const { id } = useParams();
  const { me, offers, refreshMe, refreshOffers, toast } = useSession();
  if (!offers) return <Screen title="Reward"><p role="status">Loading</p></Screen>;
  const ranked = offers.ranked.find((o) => o.id === id);
  const r = ranked || offers.locked.find((o) => o.id === id) || offers.used.find((o) => o.id === id);
  if (!r) {
    return (
      <Screen title="Reward not found" back={{ to: '/app/rewards', label: 'Back to rewards' }}>
        <p className="lead">This reward is not available. <Link to="/app/rewards">See your rewards.</Link></p>
      </Screen>
    );
  }
  const m = merchantById(r.merchantId);
  const used = offers.used.some((o) => o.id === id);
  const locked = !ranked && !used;
  const starred = me.summary.stars.includes(r.id);
  const code = codeFor(r, me.user.email);
  const autoApply = me.cards.some((c) => c.autoApply);
  const need = r.cost - me.summary.balance;

  const onStar = async () => {
    try {
      await api(`/stars/${r.id}`, { method: 'POST', body: { on: !starred } });
      await Promise.all([refreshMe(), refreshOffers()]);
    } catch (e) {
      toast('Could not update favorites', e.message);
    }
  };

  return (
    <Screen title={r.title} back={{ to: '/app/rewards', label: 'Back to rewards' }} className="detail">
      <div className="detail-head">
        <BrandMark merchantId={r.merchantId} size={56} />
        <p className="detail-merchant">{m.name}</p>
        {!locked && !used && <StarButton reward={r} starred={starred} onStar={onStar} />}
      </div>
      <p className="detail-key">{keyTerms(r)}</p>

      {locked ? (
        <p className="state-note glass">Unlocks at {TIERS.find((t) => t.id === r.tier).name}.</p>
      ) : used ? (
        <p className="state-note glass">You used this reward. Each reward works once.</p>
      ) : (
        <section className="redeem on-sheet" aria-labelledby="show-h">
          <h2 id="show-h" className="redeem-title">Show this at the counter</h2>
          {need > 0 && <p className="redeem-need">You need {need.toLocaleString()} more points before this reward can be used.</p>}
          <div className="redeem-codes">
            <div className="redeem-qr"><Qr text={`reward:${r.id}:${code}`} size={196} /></div>
            <div>
              <p className="redeem-label">Or read out the code</p>
              <p className="redeem-code" aria-label={`Code: ${code.split('').join(' ')}`}>{code}</p>
            </div>
          </div>
          <p className="redeem-note">{autoApply
            ? 'Paying with a linked card applies this reward for you; no code needed.'
            : 'Auto-apply is off for your cards, so show the code when you pay.'}</p>
        </section>
      )}

      {ranked?.why?.length > 0 && (
        <section className="why glass" aria-labelledby="why-h">
          <h2 id="why-h" className="block-title">Why this offer</h2>
          <ul>{ranked.why.map((w) => <li key={w}>{w}</li>)}</ul>
        </section>
      )}

      <section className="terms" aria-labelledby="terms-h">
        <h2 id="terms-h" className="block-title">Terms, in plain words</h2>
        <dl className="glass">
          {termsFor(r, { autoApply }).map((t) => (
            <div key={t.label} className="term"><dt>{t.label}</dt><dd>{t.text}</dd></div>
          ))}
          <div className="term"><dt>Value</dt><dd>Up to {money2(r.value)} off one purchase.</dd></div>
        </dl>
      </section>
    </Screen>
  );
}
