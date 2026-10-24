import { BRAND } from '@shared/brand.config.js';
import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
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
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-logo" aria-label={`${BRAND.name}, home`}><Logo /></Link>
          <nav aria-label="Site" className="nav-links">
            <ul role="list">
              {PAGES.map((p) => <li key={p.to}><NavLink to={p.to}>{p.label}</NavLink></li>)}
            </ul>
          </nav>
          <Link to="/app" className="btn btn-primary btn-small nav-cta">Sign in</Link>
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
      <footer className="footer on-claret">
        <p className="footer-name" aria-hidden="true">{BRAND.name}</p>
        <div className="footer-meta">
          <p className="footer-lead">A predictive loyalty prototype, built for the FIS Innovation Challenge.</p>
          <p>Every person, store, bank, balance and reward is demo data. No real payments are made and no card numbers are used.</p>
          <ul role="list" className="footer-links">
            <li><Link to="/">Home</Link></li>
            {PAGES.map((p) => <li key={p.to}><Link to={p.to}>{p.label}</Link></li>)}
            <li><Link to="/app">Sign in</Link></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
