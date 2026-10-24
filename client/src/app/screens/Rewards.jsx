import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATEGORIES, CATEGORY_IDS, merchantById, categoryOf, TIERS } from '@shared/catalog.js';
import { Screen } from '../AppRoutes.jsx';
import { useSession } from '../session.jsx';
import { api } from '../api.js';
import { RewardRow } from '../../components/RewardParts.jsx';
import Icon from '../../components/Icon.jsx';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'starred', label: 'Favorites' },
  ...CATEGORY_IDS.map((c) => ({ id: c, label: CATEGORIES[c].label })),
];

export default function Rewards() {
  const { me, offers, refreshOffers, refreshMe, toast } = useSession();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [filter, setFilter] = useState('all');
  const stars = new Set(me.summary.stars);

  const onStar = async (id) => {
    try {
      await api(`/stars/${id}`, { method: 'POST', body: { on: !stars.has(id) } });
      await Promise.all([refreshMe(), refreshOffers()]);
    } catch (e) {
      toast('Could not update favorites', e.message);
    }
  };

  const q = query.trim().toLowerCase();
  const filtering = q !== '' || filter !== 'all';
  const ranked = (offers?.ranked || []).map((r) => ({ ...r, need: r.cost - me.summary.balance }));
  const matches = useMemo(() => ranked.filter((r) => {
    if (filter === 'starred' && !stars.has(r.id)) return false;
    if (CATEGORIES[filter] && categoryOf(r) !== filter) return false;
    if (!q) return true;
    return `${r.title} ${merchantById(r.merchantId).name} ${CATEGORIES[categoryOf(r)].label}`.toLowerCase().includes(q);
  }), [ranked, filter, q, me.summary.stars]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen title="Rewards" className="rewards">
      <p className="lead">Most likely to be used first. Rewards apply themselves when you pay with a linked card and have the points.</p>
      <div className="search-pill glass" role="search">
        <label htmlFor="q" className="visually-hidden">Find a reward</label>
        <Icon name="search" />
        <input id="q" type="search" placeholder="Find a reward or store" value={query}
          onChange={(e) => { setQuery(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}, { replace: true }); }} />
      </div>
      <div className="chips" role="radiogroup" aria-label="Filter rewards">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="radio" aria-checked={filter === f.id} className="chip" onClick={() => setFilter(f.id)}>
            {f.id === 'starred' && <Icon name="star" size={18} filled={filter === 'starred'} />}{f.label}
          </button>
        ))}
      </div>
      <p className="count" aria-live="polite">{!offers ? 'Loading rewards' : `${matches.length} ${matches.length === 1 ? 'reward' : 'rewards'}${filtering ? ' match' : ' available'}`}</p>
      {!offers ? <div className="list-loading glass-list" aria-hidden="true" /> : matches.length ? (
        <ul className="rr-list glass-list" role="list">
          {matches.map((r, i) => (
            <RewardRow key={r.id} reward={r} starred={stars.has(r.id)} onStar={onStar} to={`/app/reward/${r.id}`} top={i === 0 && !filtering} />
          ))}
        </ul>
      ) : (
        <div className="empty glass">
          <p>{filter === 'starred' && !q ? 'No favorites yet. Tap the star on a reward, or pick favorite brands.' : ranked.length ? `No rewards match “${query || FILTERS.find((f) => f.id === filter).label}”.` : 'There are no rewards available right now.'}</p>
          {filtering && <button type="button" className="btn btn-quiet btn-small" onClick={() => { setQuery(''); setFilter('all'); setParams({}); }}>Show all rewards</button>}
        </div>
      )}
      {offers && !filtering && offers.locked.length > 0 && (
        <section className="block" aria-labelledby="locked-h">
          <h2 id="locked-h" className="block-title">Unlock with more points</h2>
          <p className="block-sub">Tiers unlock with all the points you have earned.</p>
          <ul className="rr-list glass-list" role="list">
            {offers.locked.map((r) => <RewardRow key={r.id} reward={r} locked tierName={TIERS.find((t) => t.id === r.tier).name} />)}
          </ul>
        </section>
      )}
      {offers && !filtering && offers.used.length > 0 && (
        <details className="more">
          <summary>Used rewards ({offers.used.length})</summary>
          <ul className="rr-list glass-list" role="list">{offers.used.map((r) => <RewardRow key={r.id} reward={r} used />)}</ul>
        </details>
      )}
    </Screen>
  );
}
