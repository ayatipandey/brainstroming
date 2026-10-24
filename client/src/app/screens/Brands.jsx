import { CATEGORIES, CATEGORY_IDS, MERCHANTS, describeWindows } from '@shared/catalog.js';
import { Screen } from '../AppRoutes.jsx';
import { useStore } from '../store.jsx';
import Icon, { categoryIcon } from '../../components/Icon.jsx';

export default function Brands() {
  const { state, act } = useStore();
  return (
    <Screen title="My brands" lead="Pick one brand for each category. Your brands stay on the wallet even on days the engine sends nothing, and a favorite category adds 15 to a moment’s score.">
      <div className="stack">
        {CATEGORY_IDS.map((c) => {
          const options = MERCHANTS.filter((m) => m.category === c);
          return (
            <fieldset key={c} className="panel choice">
              <legend className="choice-legend">
                <Icon name={categoryIcon[c]} /> {CATEGORIES[c].label}
              </legend>
              <p className="choice-hint">Usual hours: {describeWindows(c)}</p>
              <div className="choice-options">
                {options.map((m) => (
                  <label key={m.id} className="radio">
                    <input type="radio" name={`fav-${c}`} checked={state.favorites[c] === m.id} onChange={() => act('favorite', { category: c, merchantId: m.id })} />
                    <span className="radio-ui" aria-hidden="true" />
                    <span>{m.name}</span>
                  </label>
                ))}
                <label className="radio">
                  <input type="radio" name={`fav-${c}`} checked={!state.favorites[c]} onChange={() => act('favorite', { category: c, merchantId: null })} />
                  <span className="radio-ui" aria-hidden="true" />
                  <span>No favorite</span>
                </label>
              </div>
            </fieldset>
          );
        })}
      </div>
    </Screen>
  );
}
