import { BRAND } from '@shared/brand.config.js';
import { useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './store.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import Rewards from './screens/Rewards.jsx';
import RewardDetail from './screens/RewardDetail.jsx';
import Activity from './screens/Activity.jsx';
import Account from './screens/Account.jsx';
import '../styles/app.css';

const TABS = [
  { to: '/app', label: 'Rewards', icon: 'rewards', end: true },
  { to: '/app/activity', label: 'Activity', icon: 'activity' },
  { to: '/app/account', label: 'Account', icon: 'user' },
];

/** A screen whose h1 takes focus when it opens. */
export function Screen({ title, children, back, className = '', hideTitle = false }) {
  const h = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => { h.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => { document.title = `${title}, ${BRAND.name}`; }, [title]);
  return (
    <div className={`screen ${className}`}>
      {back && <Link to={back.to} className="back"><Icon name="back" /> {back.label}</Link>}
      <h1 ref={h} tabIndex={-1} className={hideTitle ? 'visually-hidden' : 'screen-title'}>{title}</h1>
      {children}
    </div>
  );
}

function Toasts() {
  const { state, act } = useStore();
  const shown = state.toasts.slice(0, 2);
  useEffect(() => {
    if (!shown.length) return undefined;
    const t = setTimeout(() => act('dismiss', { id: shown[shown.length - 1].id }), 9000);
    return () => clearTimeout(t);
  }, [shown, act]);
  return (
    <section className="toasts" aria-label="Notifications" aria-live="polite">
      {shown.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <p className="toast-title">{t.title}</p>
          <p className="toast-body">{t.body}</p>
          <div className="toast-actions">
            {t.kind === 'tier' && <Link to="/app" className="toast-link" onClick={() => act('dismiss', { id: t.id })}>See rewards</Link>}
            <button type="button" className="toast-link" onClick={() => act('dismiss', { id: t.id })}>Dismiss</button>
          </div>
        </div>
      ))}
    </section>
  );
}

function SignIn() {
  const { act } = useStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const h = useRef(null);
  const input = useRef(null);
  const navigate = useNavigate();
  useEffect(() => { document.title = `Sign in, ${BRAND.name}`; h.current?.focus(); }, []);
  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Enter your first name to continue.'); input.current?.focus(); return; }
    act('sign-in', { name: name.trim() });
    navigate('/app');
  };
  return (
    <div className="signin">
      <div className="signin-side on-claret">
        <Link to="/" className="signin-logo" aria-label={`${BRAND.name}, home`}><Logo /></Link>
        <p className="signin-big" aria-hidden="true">Your best reward, on top.</p>
      </div>
      <main className="signin-main" id="app-main">
        <h1 ref={h} tabIndex={-1}>Sign in</h1>
        <p className="signin-lead">No password. In the real app we email you a sign-in link; in this demo you go straight in.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="name" className="field-label">First name</label>
          <input ref={input} id="name" className="input" type="text" autoComplete="given-name" value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'name-err' : undefined} />
          {error && <p id="name-err" className="error" role="alert">{error}</p>}
          <label htmlFor="email" className="field-label">Email, optional</label>
          <input id="email" className="input" type="email" autoComplete="email" aria-describedby="email-hint" />
          <p id="email-hint" className="hint">Not stored or sent anywhere in this demo.</p>
          <button type="submit" className="btn btn-primary signin-go">Continue</button>
        </form>
      </main>
    </div>
  );
}

function Shell() {
  const { state } = useStore();
  if (!state.user) return <SignIn />;
  return (
    <div className="app">
      <a className="skip-link" href="#app-main">Skip to content</a>
      <header className="app-top">
        <Link to="/" className="app-logo" aria-label={`${BRAND.name}, back to the website`}><Logo size={24} /></Link>
        <nav className="app-nav" aria-label="App">
          <ul role="list">
            {TABS.map((t) => (
              <li key={t.to}>
                <NavLink to={t.to} end={t.end} className="tab"><Icon name={t.icon} /><span>{t.label}</span></NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="app-main" className="app-main">
        <Routes>
          <Route index element={<Rewards />} />
          <Route path="reward/:id" element={<RewardDetail />} />
          <Route path="activity" element={<Activity />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<Rewards />} />
        </Routes>
      </main>
      <Toasts />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
