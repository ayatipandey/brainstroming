import { Screen } from '../AppRoutes.jsx';
import { useStore } from '../store.jsx';
import { usePrefs } from '../../lib/prefs.jsx';
import Toggle from '../../components/Toggle.jsx';
import { formatHour } from '@shared/catalog.js';

const ACCENTS = [
  { id: 'teal', name: 'Teal' },
  { id: 'blue', name: 'Blue' },
  { id: 'green', name: 'Green' },
];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

export default function Settings() {
  const { state, act } = useStore();
  const { prefs, set, reduced } = usePrefs();
  const s = state.settings;
  const patch = (p) => act('settings', { patch: p });

  return (
    <Screen title="Settings">
      <div className="stack">
        <section className="panel" aria-labelledby="s-nudges">
          <h2 id="s-nudges" className="block-title">Nudges</h2>
          <p className="fine">An offer is sent only when it scores 70% or more. Payment confirmations are always shown.</p>
          <fieldset className="seg app-seg">
            <legend>Most nudges a day</legend>
            {[1, 2, 3].map((n) => (
              <label key={n} className="seg-opt">
                <input type="radio" name="limit" checked={s.dailyLimit === n} onChange={() => patch({ dailyLimit: n })} />
                <span>{n}</span>
              </label>
            ))}
          </fieldset>
          <p className="fine">Sent today: {state.sentToday.count} of {s.dailyLimit}.</p>
          <Toggle id="quiet" label="Quiet hours" hint={`Nothing optional is sent from ${formatHour(s.quiet.start)} to ${formatHour(s.quiet.end)}`} checked={s.quiet.on} onChange={(on) => patch({ quiet: { ...s.quiet, on } })} />
          {s.quiet.on && (
            <div className="hours">
              <label className="field">
                <span className="field-label">From</span>
                <select value={s.quiet.start} onChange={(e) => patch({ quiet: { ...s.quiet, start: Number(e.target.value) } })}>
                  {HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field-label">To</span>
                <select value={s.quiet.end} onChange={(e) => patch({ quiet: { ...s.quiet, end: Number(e.target.value) } })}>
                  {HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
                </select>
              </label>
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="s-privacy">
          <h2 id="s-privacy" className="block-title">Privacy</h2>
          <Toggle id="loc" label="Use my location while the app is open" hint="Off by default. Never used in the background, never stored." checked={s.location} onChange={(on) => patch({ location: on })} />
          <p className="fine">Perk Predict never asks for your birthday, and cards keep only the bank name, the last four digits and categories.</p>
        </section>

        <section className="panel" aria-labelledby="s-look">
          <h2 id="s-look" className="block-title">Look and reading</h2>
          <fieldset className="seg app-seg">
            <legend>Accent color</legend>
            {ACCENTS.map((a) => (
              <label key={a.id} className="seg-opt">
                <input type="radio" name="accent" checked={s.accent === a.id} onChange={() => patch({ accent: a.id })} />
                <span><i className={`accent-dot accent-${a.id}`} aria-hidden="true" />{a.name}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="seg app-seg">
            <legend>Text size</legend>
            {[['normal', 'Standard'], ['large', 'Large'], ['largest', 'Largest']].map(([v, l]) => (
              <label key={v} className="seg-opt">
                <input type="radio" name="text" checked={prefs.text === v} onChange={() => set({ text: v })} />
                <span>{l}</span>
              </label>
            ))}
          </fieldset>
          <Toggle id="contrast" label="High contrast" checked={prefs.contrast === 'high'} onChange={(on) => set({ contrast: on ? 'high' : 'normal' })} />
          <Toggle id="motion" label="Reduce motion" hint="Drops travel and parallax, keeps all content" checked={reduced} onChange={(on) => set({ motion: on ? 'reduce' : 'full' })} />
        </section>

        <section className="panel" aria-labelledby="s-extra">
          <h2 id="s-extra" className="block-title">Extras</h2>
          <Toggle id="challenge" label="Weekly challenge" hint="Optional. Compares you only with anonymous demo totals." checked={s.challenge} onChange={(on) => patch({ challenge: on })} />
          <button type="button" className="btn btn-quiet" onClick={() => act('reset')}>Reset demo data</button>
        </section>
      </div>
    </Screen>
  );
}
