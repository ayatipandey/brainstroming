import { BRAND } from '@shared/brand.config.js';
import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import ConfigWarning from '../components/ConfigWarning.jsx';
import '../styles/site.css';

const PAGES = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/tiers', label: 'Tiers' },
  { to: '/faq', label: 'FAQ' },
];

export function NextPage({ to, label, title }) {
  return (
    <Link to={to} className="next-page">
      <span className="visually-hidden">{label} page: </span>
      <span className="next-page-title">{title} <Icon name="next" size={48} className="next-page-icon" /></span>
    </Link>
  );
}

export default function SiteLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector('.site main h1')?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="site">
      <div className="field" aria-hidden="true"><i /><i /><i /><i /></div>
      <ConfigWarning />
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-logo" aria-label={`${BRAND.name}, home`}><Logo /></Link>
          <nav aria-label="Site" className="nav-links">
            <ul role="list">
              {PAGES.map((p) => <li key={p.to}><NavLink to={p.to}>{p.label}</NavLink></li>)}
            </ul>
          </nav>
          <div className="nav-cta">
            <Link to="/app/sign-in" className="text-link nav-signin">Sign in</Link>
            <Link to="/app/sign-up" className="btn btn-primary btn-small">Create account</Link>
          </div>
        </div>
        <nav aria-label="Site, small screens" className="nav-mobile">
          <ul role="list">
            {PAGES.map((p) => <li key={p.to}><NavLink to={p.to}>{p.label}</NavLink></li>)}
          </ul>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="footer on-sheet">
        <p className="footer-name" aria-hidden="true">{BRAND.name}</p>
        <div className="footer-meta">
          <div>
            <p className="footer-lead">{BRAND.name}. {BRAND.tagline}.</p>
            <p>{BRAND.legalEntity || '[missing: legal entity]'}<br />{BRAND.address || '[missing: address]'}<br />{BRAND.registration || '[missing: registration]'}</p>
            <p>{BRAND.contactEmail ? <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a> : '[missing: contact email]'}</p>
          </div>
          <div>
            <p>Built for the FIS Innovation Challenge. Store names and offers shown during the pilot are placeholders until each merchant confirms them. No brand has endorsed this app.</p>
          </div>
          <ul role="list" className="footer-links">
            <li><Link to="/">Home</Link></li>
            {PAGES.map((p) => <li key={p.to}><Link to={p.to}>{p.label}</Link></li>)}
            <li><Link to="/legal/privacy">Privacy policy</Link></li>
            <li><Link to="/legal/terms">Terms and conditions</Link></li>
            <li><Link to="/legal/cookies">Cookies policy</Link></li>
            <li><Link to="/legal/refunds">Refund policy</Link></li>
            <li><Link to="/credits">Credits</Link></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
