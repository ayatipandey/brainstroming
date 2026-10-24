import { useParams, Link } from 'react-router-dom';
import { rewardById, merchantById, termsFor, tierRank, TIERS, validUntil, money2 } from '@shared/catalog.js';
import { Screen } from '../AppRoutes.jsx';
import { useStore } from '../store.jsx';
import { Qr, codeFor, StarButton } from '../../components/RewardParts.jsx';

export default function RewardDetail() {
  const { id } = useParams();
  const { state, act, pay, tier } = useStore();
  const r = rewardById(id);

  if (!r) {
    return (
      <Screen title="Reward not found" back={{ to: '/app', label: 'Rewards' }}>
        <p className="lead">This reward is not in the catalog. <Link to="/app">Go back to your rewards.</Link></p>
      </Screen>
    );
  }

  const m = merchantById(r.merchantId);
  const used = !!state.used[r.id];
  const locked = tierRank(r.tier) > tierRank(tier.id);
  const code = codeFor(r, state.user.name);
  const demoAmount = Math.max(r.minSpend + 2.4, r.value + 1.2);

  return (
    <Screen title={r.title} back={{ to: '/app', label: 'Rewards' }} className="detail">
      <div className="detail-head">
        <p className="detail-merchant">{m.name}</p>
        {!locked && !used && <StarButton reward={r} starred={state.starred.includes(r.id)} onStar={(x) => act('star', { id: x })} />}
      </div>

      {locked ? (
        <p className="state-note">Unlocks at {TIERS.find((t) => t.id === r.tier).name}. Keep using rewards to get there.</p>
      ) : used ? (
        <p className="state-note">You already used this reward. Each reward works once.</p>
      ) : (
        <section className="redeem on-claret" aria-labelledby="show-h">
          <h2 id="show-h" className="redeem-title">Show this at the counter</h2>
          <div className="redeem-codes">
            <div className="redeem-qr"><Qr text={`perkpredict:${r.id}:${code}`} size={196} /></div>
            <div>
              <p className="redeem-label">Or read out the code</p>
              <p className="redeem-code" aria-label={`Code: ${code.split('').join(' ')}`}>{code}</p>
              <p className="redeem-until">Valid until {validUntil(r.days)}.</p>
            </div>
          </div>
          <div className="redeem-actions">
            <button type="button" className="btn btn-primary" onClick={() => act('use', { id: r.id })}>Mark as used</button>
            {state.card && (
              <button type="button" className="btn btn-quiet" onClick={() => pay(r.merchantId, Math.round(demoAmount * 100) / 100)}>
                Pay {money2(Math.round(demoAmount * 100) / 100)} with card ending {state.card.last4}
              </button>
            )}
          </div>
          <p className="redeem-note">{state.card?.autoApply
            ? 'Paying with your linked card applies this reward for you, no code needed. The card payment here is a demo.'
            : 'Auto-apply is off, so show the code when you pay. Turn it on in Account.'}</p>
        </section>
      )}

      <section className="terms" aria-labelledby="terms-h">
        <h2 id="terms-h" className="block-title">Terms, in plain words</h2>
        <dl>
          {termsFor(r, { autoApply: !!state.card?.autoApply }).map((t) => (
            <div key={t.label} className="term">
              <dt>{t.label}</dt>
              <dd>{t.text}</dd>
            </div>
          ))}
        </dl>
        <p className="hint">Demo reward from a fictional store. Not valid anywhere real.</p>
      </section>
    </Screen>
  );
}
