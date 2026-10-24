import { useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BRAND } from '@shared/brand.config.js';
import { SessionProvider, useSession } from './session.jsx';
import { api } from './api.js';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import Field from '../components/Field.jsx';
import Home from './screens/Home.jsx';
import Rewards from './screens/Rewards.jsx';
import RewardDetail from './screens/RewardDetail.jsx';
import Brands from './screens/Brands.jsx';
import Cards from './screens/Cards.jsx';
import Activity from './screens/Activity.jsx';
import Settings from './screens/Settings.jsx';
import Admin from './screens/Admin.jsx';
import '../styles/app.css';

const TABS = [
  { to: '/app', label: 'Home', icon: 'wallet', end: true },
  { to: '/app/rewards', label: 'Rewards', icon: 'rewards' },
  { to: '/app/activity', label: 'Activity', icon: 'activity' },
  { to: '/app/cards', label: 'Cards', icon: 'card' },
  { to: '/app/settings', label: 'Settings', icon: 'settings' },
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
  const { toasts, dismiss } = useSession();
  useEffect(() => {
    if (!toasts.length) return undefined;
    const t = setTimeout(() => dismiss(toasts[toasts.length - 1].id), 10000);
    return () => clearTimeout(t);
  }, [toasts, dismiss]);
  return (
    <section className="toasts" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <p className="toast-title">{t.title}</p>
          <p className="toast-body">{t.body}</p>
          <button type="button" className="toast-link" onClick={() => dismiss(t.id)}>Dismiss notification</button>
        </div>
      ))}
    </section>
  );
}

function AuthLayout({ title, lead, children }) {
  const h = useRef(null);
  useEffect(() => { document.title = `${title}, ${BRAND.name}`; h.current?.focus(); }, [title]);
  return (
    <div className="auth">
      <div className="field" aria-hidden="true"><i /><i /><i /><i /></div>
      <header className="auth-top">
        <Link to="/" className="auth-logo" aria-label={`${BRAND.name}, home`}><Logo /></Link>
      </header>
      <main id="app-main" className="auth-card glass">
        <h1 ref={h} tabIndex={-1}>{title}</h1>
        {lead && <p className="auth-lead">{lead}</p>}
        {children}
      </main>
      <LegalLinks />
    </div>
  );
}

export function LegalLinks() {
  return (
    <nav className="legal-links" aria-label="Legal">
      <Link to="/legal/privacy">Privacy policy</Link>
      <Link to="/legal/terms">Terms and conditions</Link>
      <Link to="/legal/cookies">Cookies policy</Link>
      <Link to="/legal/refunds">Refund policy</Link>
    </nav>
  );
}

function SignUp() {
  const { setMe } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', email: '', password: '', terms: false, marketing: false });
  const [err, setErr] = useState({ message: '', fields: {} });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const me = await api('/auth/signup', { method: 'POST', body: { firstName: form.firstName, email: form.email, password: form.password, consents: { terms: form.terms, marketing: form.marketing } } });
      setMe(me);
      navigate('/app');
    } catch (ex) {
      setErr({ message: ex.message, fields: ex.fields });
      document.querySelector('[aria-invalid="true"]')?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Create your account" lead="You start with zero points. Link a card and every purchase earns points toward rewards.">
      <form onSubmit={submit} noValidate className="auth-form">
        {err.message && <p className="form-error" role="alert">{err.message}</p>}
        <Field id="firstName" label="First name" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} error={err.fields.firstName} />
        <Field id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={err.fields.email} hint="We send a link to confirm it." />
        <Field id="password" label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={err.fields.password} hint="At least 10 characters." />
        <fieldset className="consents">
          <legend>Your choices</legend>
          <label className="check-row">
            <input type="checkbox" checked={form.terms} onChange={set('terms')} aria-invalid={!!err.fields.terms} aria-describedby={err.fields.terms ? 'terms-err' : undefined} />
            <span>I agree to the <Link to="/legal/terms" target="_blank">Terms and conditions</Link> and have read the <Link to="/legal/privacy" target="_blank">Privacy policy</Link>. Required.</span>
          </label>
          {err.fields.terms && <p id="terms-err" className="field-error">{err.fields.terms}</p>}
          <label className="check-row">
            <input type="checkbox" checked={form.marketing} onChange={set('marketing')} />
            <span>Email me news and new rewards. Optional; change it any time in Settings.</span>
          </label>
        </fieldset>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creating your account' : 'Create account'}</button>
        <p className="auth-alt">Already have an account? <Link to="/app/sign-in">Sign in</Link></p>
      </form>
    </AuthLayout>
  );
}

function SignIn() {
  const { setMe } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      setMe(await api('/auth/login', { method: 'POST', body: form }));
      navigate('/app');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthLayout title="Sign in">
      <form onSubmit={submit} noValidate className="auth-form">
        {err && <p className="form-error" role="alert">{err}</p>}
        <Field id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field id="password" label="Password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Signing in' : 'Sign in'}</button>
        <p className="auth-alt">New here? <Link to="/app/sign-up">Create an account</Link></p>
      </form>
    </AuthLayout>
  );
}

function Verify() {
  const [params] = useSearchParams();
  const { refreshMe } = useSession();
  const [state, setState] = useState({ status: 'checking', message: '' });
  useEffect(() => {
    api('/auth/verify', { method: 'POST', body: { token: params.get('token') } })
      .then(() => { setState({ status: 'ok', message: 'Your email is confirmed.' }); refreshMe().catch(() => {}); })
      .catch((e) => setState({ status: 'error', message: e.message }));
  }, [params, refreshMe]);
  return (
    <AuthLayout title={state.status === 'ok' ? 'Email confirmed' : state.status === 'error' ? 'Link not valid' : 'Confirming your email'}>
      <p role="status">{state.message || 'One moment.'}</p>
      <p className="auth-alt"><Link to="/app">Go to your account</Link></p>
    </AuthLayout>
  );
}

function VerifyBanner() {
  const { me, toast } = useSession();
  const [sent, setSent] = useState(false);
  if (me.user.verified) return null;
  const resend = async () => {
    try {
      await api('/auth/resend', { method: 'POST', body: {} });
      setSent(true);
    } catch (e) {
      toast('Could not send the email', e.message);
    }
  };
  return (
    <div className="verify-banner glass" role="region" aria-label="Confirm your email">
      <p>Confirm your email to link a card. We sent a link to {me.user.email}.</p>
      <button type="button" className="btn btn-quiet btn-small" onClick={resend} disabled={sent}>{sent ? 'Email sent' : 'Send the link again'}</button>
    </div>
  );
}

function Shell() {
  const { me } = useSession();
  const { pathname } = useLocation();
  if (me === undefined) return <p className="route-loading" role="status">Loading your account</p>;
  if (pathname.startsWith('/app/verify')) return <Verify />;
  if (!me) {
    if (pathname.startsWith('/app/sign-up')) return <SignUp />;
    if (pathname.startsWith('/app/sign-in')) return <SignIn />;
    return <Navigate to="/app/sign-in" replace />;
  }
  if (pathname.startsWith('/app/sign-')) return <Navigate to="/app" replace />;
  return (
    <div className="app">
      <div className="field" aria-hidden="true"><i /><i /><i /><i /></div>
      <a className="skip-link" href="#app-main">Skip to content</a>
      <header className="app-top">
        <Link to="/app" className="app-logo" aria-label={`${BRAND.name}, home`}><Logo size={26} /></Link>
        <nav className="app-nav" aria-label="App">
          <ul role="list">
            {TABS.map((t) => (
              <li key={t.to}>
                <NavLink to={t.to} end={t.end} className="tab" data-tab={t.label}><Icon name={t.icon} /><span>{t.label}</span></NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="app-main" className="app-main">
        <VerifyBanner />
        <Routes>
          <Route index element={<Home />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="reward/:id" element={<RewardDetail />} />
          <Route path="brands" element={<Brands />} />
          <Route path="cards" element={<Cards />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
        <footer className="app-foot"><LegalLinks /></footer>
      </main>
      <Toasts />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <SessionProvider>
      <Shell />
    </SessionProvider>
  );
}
