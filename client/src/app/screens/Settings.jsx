import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BRAND } from '@shared/brand.config.js';
import { Screen } from '../AppRoutes.jsx';
import { useSession } from '../session.jsx';
import { api } from '../api.js';
import { usePrefs } from '../../lib/prefs.jsx';
import Toggle from '../../components/Toggle.jsx';
import Field from '../../components/Field.jsx';

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'never');

export default function Settings() {
  const { me, setMe, toast } = useSession();
  const { prefs, set, reduced } = usePrefs();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [delErr, setDelErr] = useState('');
  const c = me.consents;

  const consent = async (kind, granted) => {
    try {
      if (kind === 'notifications' && granted && 'Notification' in window && Notification.permission !== 'granted') {
        const p = await Notification.requestPermission();
        if (p !== 'granted') { toast('Notifications are blocked', 'Allow notifications for this site in your browser settings, then try again.'); return; }
      }
      setMe(await api('/consents', { method: 'POST', body: { kind, granted } }));
    } catch (e) {
      toast('Could not save your choice', e.message);
    }
  };

  const signOut = async () => {
    await api('/auth/logout', { method: 'POST', body: {} }).catch(() => {});
    setMe(null);
    navigate('/app/sign-in');
  };

  const del = async (e) => {
    e.preventDefault();
    try {
      await api('/me', { method: 'DELETE', body: { password: pw } });
      setMe(null);
      navigate('/');
    } catch (ex) {
      setDelErr(ex.message);
    }
  };

  return (
    <Screen title="Settings">
      <section className="panel glass" aria-labelledby="acct-h">
        <h2 id="acct-h" className="block-title">Account</h2>
        <dl className="kv"><dt>Name</dt><dd>{me.user.firstName}</dd><dt>Email</dt><dd>{me.user.email}{me.user.verified ? ', confirmed' : ', not confirmed yet'}</dd></dl>
        <button type="button" className="btn btn-quiet btn-small" onClick={signOut}>Sign out</button>
      </section>

      <section className="panel glass" aria-labelledby="consent-h">
        <h2 id="consent-h" className="block-title">Your permissions</h2>
        <p className="hint">Each choice is saved with the time and the policy version. You can change it whenever you like.</p>
        <Toggle id="c-marketing" label="Emails about news and new rewards" hint={`Last changed ${when(c.marketing.at)}`} checked={c.marketing.granted} onChange={(on) => consent('marketing', on)} />
        <Toggle id="c-notify" label="Browser notifications when a reward is applied" hint={`Last changed ${when(c.notifications.at)}`} checked={c.notifications.granted} onChange={(on) => consent('notifications', on)} />
        <div className="toggle-like">
          <p className="toggle-label">Card linking</p>
          <p className="hint">{me.cards.length ? `Given ${when(c.card_linking.at)} for ${me.cards.length} card${me.cards.length > 1 ? 's' : ''}. Remove a card to withdraw it.` : 'Not given. You give it when you link a card.'} <Link to="/app/cards">Manage cards</Link></p>
        </div>
        <div className="toggle-like">
          <p className="toggle-label">Location</p>
          <p className="hint">{BRAND.name} does not use your location, so there is nothing to allow.</p>
        </div>
      </section>

      <section className="panel glass" aria-labelledby="read-h">
        <h2 id="read-h" className="block-title">Reading and motion</h2>
        <fieldset className="seg">
          <legend>Text size</legend>
          {[['normal', 'Standard'], ['large', 'Large'], ['largest', 'Largest']].map(([v, l]) => (
            <label key={v} className="seg-opt"><input type="radio" name="text" checked={prefs.text === v} onChange={() => set({ text: v })} /><span>{l}</span></label>
          ))}
        </fieldset>
        <Toggle id="hc" label="High contrast" hint="Solid surfaces instead of glass" checked={prefs.contrast === 'high'} onChange={(on) => set({ contrast: on ? 'high' : 'normal' })} />
        <Toggle id="rm" label="Reduce motion" hint="Turns off 3D and animation" checked={reduced} onChange={(on) => set({ motion: on ? 'reduce' : 'full' })} />
      </section>

      <section className="panel glass" aria-labelledby="data-h">
        <h2 id="data-h" className="block-title">Your data</h2>
        <p className="hint">Download everything we hold about you as a file, or delete your account and all of its data.</p>
        <a className="btn btn-quiet btn-small" href="/api/me/export" download>Download my data</a>
        <form className="delete-form" onSubmit={del} noValidate>
          <h3 className="sub-title">Delete my account</h3>
          <p className="hint">This removes your account, cards, points and history for good.</p>
          <Field id="del-pw" label="Your password, to confirm" type="password" autoComplete="current-password" value={pw} onChange={(e) => { setPw(e.target.value); setDelErr(''); }} error={delErr} />
          <button type="submit" className="btn btn-danger btn-small">Delete my account and data</button>
        </form>
      </section>

      {me.user.isAdmin && <p><Link to="/app/admin">Open offer administration</Link></p>}
    </Screen>
  );
}
