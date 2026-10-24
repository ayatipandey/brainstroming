import { useMemo, useState } from 'react';
import { CATEGORIES, CATEGORY_IDS, merchantById, categoryOf, TIERS, tierRank } from '@shared/catalog.js';
import { Screen } from '../AppRoutes.jsx';
import { useStore } from '../store.jsx';
import { RewardRow, TopPick, TierBar } from '../../components/RewardParts.jsx';
import Icon from '../../components/Icon.jsx';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'starred', label: 'Starred' },
  ...CATEGORY_IDS.map((c) => ({ id: c, label: CATEGORIES[c].label })),
];

export default function Rewards() {
  const { state, act, ranked, locked, tier, next, progress, unlocked } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const starred = new Set(state.starred);
  const onStar = (id) => act('star', { id });

  const q = query.trim().toLowerCase();
  const filtering = q !== '' || filter !== 'all';
  const matches = useMemo(() => ranked.filter(({ reward: r }) => {
    if (filter === 'starred' && !starred.has(r.id)) return false;
    if (CATEGORIES[filter] && categoryOf(r) !== filter) return false;
    if (!q) return true;
    const m = merchantById(r.merchantId);
    return `${r.title} ${m.name} ${CATEGORIES[categoryOf(r)].label}`.toLowerCase().includes(q);
  }), [ranked, filter, q, state.starred]); // eslint-disable-line react-hooks/exhaustive-deps

  const top = !filtering ? ranked[0] : null;
  const list = top ? matches.slice(1) : matches;
  const usedList = unlocked.filter((r) => state.used[r.id]);
  const nextLocked = next ? locked.filter((r) => r.tier === next.id) : [];
  const laterLocked = locked.filter((r) => !next || r.tier !== next.id);

  return (
    <Screen title={`Hi, ${state.user.name}`} className="rewards">
      <TierBar points={state.points} tier={tier} next={next} progress={progress} />

      {top && (
        <section className="block" aria-labelledby="best-h">
          <h2 id="best-h" className="block-title">Best for right now</h2>
          <TopPick item={top} starred={starred.has(top.reward.id)} onStar={onStar} to={`/app/reward/${top.reward.id}`} />
        </section>
      )}

      <section className="block" aria-labelledby="all-h">
        <h2 id="all-h" className="block-title">{filtering ? 'Matching rewards' : 'All your rewards'}</h2>
        <p className="block-sub">Most likely to be used first.</p>
        <div className="search">
          <label htmlFor="q" className="visually-hidden">Search rewards</label>
          <Icon name="search" />
          <input id="q" type="search" className="input search-input" placeholder="Search rewards or stores" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="chips" role="radiogroup" aria-label="Filter by category">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" role="radio" aria-checked={filter === f.id} className="chip" onClick={() => setFilter(f.id)}>
              {f.id === 'starred' && <Icon name="star" size={18} filled={filter === 'starred'} />}{f.label}
            </button>
          ))}
        </div>
        <p className="count" aria-live="polite">{matches.length} {matches.length === 1 ? 'reward' : 'rewards'}{filtering ? ' match' : ' ready to use'}</p>
        {list.length > 0 ? (
          <ul className="rr-list" role="list">
            {list.map(({ reward }) => (
              <RewardRow key={reward.id} reward={reward} starred={starred.has(reward.id)} onStar={onStar} to={`/app/reward/${reward.id}`} />
            ))}
          </ul>
        ) : matches.length === 0 && (
          <div className="empty">
            <p>{filter === 'starred' && !q ? 'No starred rewards yet. Tap the star on any reward to keep it here.' : `No rewards match “${query || FILTERS.find((f) => f.id === filter).label}”.`}</p>
            <button type="button" className="btn btn-quiet btn-small" onClick={() => { setQuery(''); setFilter('all'); }}>Show all rewards</button>
          </div>
        )}
      </section>

      {nextLocked.length > 0 && !filtering && (
        <section className="block" aria-labelledby="next-h">
          <h2 id="next-h" className="block-title">Unlock at {next.name}</h2>
          <p className="block-sub">{(next.min - state.points).toLocaleString()} more points. Use rewards and pay with your linked card to earn them.</p>
          <ul className="rr-list" role="list">
            {nextLocked.map((r) => <RewardRow key={r.id} reward={r} locked />)}
          </ul>
        </section>
      )}

      {!filtering && laterLocked.length > 0 && (
        <details className="more">
          <summary>Rewards at higher tiers ({laterLocked.length})</summary>
          {TIERS.filter((t) => tierRank(t.id) > tierRank(next?.id || tier.id)).map((t) => (
            <div key={t.id}>
              <h3 className="more-tier">{t.name}, from {t.min.toLocaleString()} points</h3>
              <ul className="rr-list" role="list">
                {laterLocked.filter((r) => r.tier === t.id).map((r) => <RewardRow key={r.id} reward={r} locked />)}
              </ul>
            </div>
          ))}
        </details>
      )}

      {usedList.length > 0 && !filtering && (
        <details className="more">
          <summary>Used rewards ({usedList.length})</summary>
          <ul className="rr-list" role="list">
            {usedList.map((r) => <RewardRow key={r.id} reward={r} used />)}
          </ul>
        </details>
      )}
    </Screen>
  );
}
