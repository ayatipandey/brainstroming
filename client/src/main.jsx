import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrefsProvider } from './lib/prefs.jsx';
import SiteLayout from './site/SiteLayout.jsx';
import Home from './site/Home.jsx';
import './styles/base.css';

const How = lazy(() => import('./site/How.jsx'));
const Tiers = lazy(() => import('./site/Tiers.jsx'));
const Faq = lazy(() => import('./site/Faq.jsx'));
const Legal = lazy(() => import('./site/Legal.jsx'));
const Credits = lazy(() => import('./site/Credits.jsx'));
const AppRoutes = lazy(() => import('./app/AppRoutes.jsx'));
// Team-only simulator: compiled out of production builds unless ENABLE_DEV_TOOLS=1.
const Simulator = __DEV_TOOLS__ ? lazy(() => import('./dev/Simulator.jsx')) : null;

const Loading = () => <p className="route-loading" role="status">Loading</p>;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrefsProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/how-it-works" element={<How />} />
              <Route path="/tiers" element={<Tiers />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/legal/:doc" element={<Legal />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="*" element={<Home />} />
            </Route>
            <Route path="/app/*" element={<AppRoutes />} />
            {Simulator && <Route path="/dev/simulator" element={<Simulator />} />}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </PrefsProvider>
  </StrictMode>,
);
