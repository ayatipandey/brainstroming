import { REWARDS, tierFor, nextTier, tierRank } from '@shared/catalog.js';
import { rankRewards } from '@shared/rank.js';
import model from '@shared/model.json';
import { RewardRow, TopPick, TierBar } from './RewardParts.jsx';
import Icon from './Icon.jsx';

// The app's Rewards screen, set with demo data, for the site's phones.
const POINTS = 1120;
const STARRED = new Set(['cc-coffee']);

export function demoRanking(hour = 14 + 47 / 60) {
  const tier = tierFor(POINTS);
  const available = REWARDS.filter((r) => tierRank(r.tier) <= tierRank(tier.id));
  return rankRewards(available, { starred: STARRED, hour, model });
}

export default function AppPreview({ rows = 3, hour }) {
  const tier = tierFor(POINTS);
  const next = nextTier(POINTS);
  const ranked = demoRanking(hour);
  return (
    <div className="ap">
      <p className="ap-hello">Hi, Maya</p>
      <TierBar points={POINTS} tier={tier} next={next} progress={(POINTS - tier.min) / (next.min - tier.min)} />
      <p className="ap-label">Best for right now</p>
      <TopPick item={ranked[0]} starred={STARRED.has(ranked[0].reward.id)} />
      <ul className="rr-list" role="list">
        {ranked.slice(1, 1 + rows).map(({ reward }) => (
          <RewardRow key={reward.id} reward={reward} starred={STARRED.has(reward.id)} />
        ))}
      </ul>
      <div className="ap-tabs">
        <span className="is-on"><Icon name="rewards" size={22} />Rewards</span>
        <span><Icon name="activity" size={22} />Activity</span>
        <span><Icon name="user" size={22} />Account</span>
      </div>
    </div>
  );
}
