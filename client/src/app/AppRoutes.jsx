import { useEffect, useRef } from 'react';
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import NudgeLayer from './NudgeLayer.jsx';
import Wallet from './screens/Wallet.jsx';
import Brands from './screens/Brands.jsx';
import Cards from './screens/Cards.jsx';
import OfferDetail from './screens/OfferDetail.jsx';
import Activity from './screens/Activity.jsx';
import Settings from './screens/Settings.jsx';
import Demo from './screens/Demo.jsx';
import '../styles/app.css';

const TABS = [
  { to: '/app', label: 'Wallet', icon: 'wallet', end: true },
  { to: '/app/brands', label: 'My brands', icon: 'heart' },
  { to: '/app/cards', label: 'Cards', icon: 'card' },
  { to: '/app/activity', label: 'Activity', icon: 'activity' },
  { to: '/app/settings', label: 'Settings', icon: 'settings' },
];

/** A screen with one h1 that takes focus when the screen opens. */
export function Screen({ title, children, lead, back, className = '' }) {
  const h = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => { h.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => { document.title = `${title}, Perk Predict`; }, [title]);
  return (
    <div className={`screen ${className}`}>
      {back && <Link to={back.to} className="back"><Icon name="back" /> {back.label}</Link>}
      <h1 ref={h} tabIndex={-1} className="screen-title">{title}</h1>
      {lead && <p className="screen-lead">{lead}</p>}
      {children}
    </div>
  );
}

function Shell() {
  const { state } = useStore();
  return (
    <div className="app" data-accent={state.settings.accent}>
      <a className="skip-link" href="#app-main">Skip to content</a>
      <header className="app-top">
        <Link to="/" className="app-logo" aria-label="Perk Predict, back to the landing page"><Logo size={24} /></Link>
        <span className="app-proto">Prototype, demo data</span>
        <Link to="/app/demo" className="app-demo-link"><Icon name="demo" size={22} /> Demo panel</Link>
      </header>
      <nav className="app-nav" aria-label="App">
        <ul role="list">
          {TABS.map((t) => (
            <li key={t.to}>
              <NavLink to={t.to} end={t.end} className="tab">
                <Icon name={t.icon} />
                <span>{t.label}</span>
              </NavLink>
            </li>
          ))}
          <li className="tab-desktop-only">
            <NavLink to="/app/demo" className="tab"><Icon name="demo" /><span>Demo panel</span></NavLink>
          </li>
        </ul>
      </nav>
      <main id="app-main" className="app-main">
        <Routes>
          <Route index element={<Wallet />} />
          <Route path="brands" element={<Brands />} />
          <Route path="cards" element={<Cards />} />
          <Route path="offer/:id" element={<OfferDetail />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<Settings />} />
          <Route path="demo" element={<Demo />} />
          <Route path="*" element={<Wallet />} />
        </Routes>
      </main>
      <NudgeLayer />
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
