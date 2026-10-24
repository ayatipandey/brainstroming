import { useEffect, useState } from 'react';
import { CATEGORIES, CATEGORY_IDS } from '@shared/catalog.js';
import { Screen } from '../AppRoutes.jsx';
import { useSession } from '../session.jsx';
import { api } from '../api.js';
import BrandMark from '../../components/BrandMark.jsx';
import Icon from '../../components/Icon.jsx';

export default function Brands() {
  const { refreshMe, refreshOffers, toast } = useSession();
  const [brands, setBrands] = useState(null);
  useEffect(() => { api('/brands').then(setBrands).catch((e) => toast('Could not load brands', e.message)); }, [toast]);

  const flip = async (b) => {
    try {
      await api(`/brands/${b.id}`, { method: 'POST', body: { on: !b.favorite } });
      setBrands((list) => list.map((x) => (x.id === b.id ? { ...x, favorite: !b.favorite } : x)));
      refreshMe().catch(() => {});
      refreshOffers().catch(() => {});
    } catch (e) {
      toast('Could not update favorite brands', e.message);
    }
  };

  return (
    <Screen title="Favorite brands" back={{ to: '/app', label: 'Home' }}>
      <p className="lead">Rewards from your favorite brands rank higher and stay easy to find.</p>
      {!brands ? <p role="status">Loading brands</p> : CATEGORY_IDS.map((c) => (
        <section key={c} className="block" aria-labelledby={`b-${c}`}>
          <h2 id={`b-${c}`} className="block-title">{CATEGORIES[c].label}</h2>
          <ul className="brand-grid" role="list">
            {brands.filter((b) => b.category === c).map((b) => (
              <li key={b.id}>
                <button type="button" className={`brand-tile glass ${b.favorite ? 'is-on' : ''}`} aria-pressed={b.favorite} onClick={() => flip(b)}>
                  <BrandMark merchantId={b.id} size={48} />
                  <span className="brand-name">{b.name}</span>
                  <span className="brand-state"><Icon name="heart" size={20} filled={b.favorite} />{b.favorite ? 'Favorite' : 'Add to favorites'}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Screen>
  );
}
