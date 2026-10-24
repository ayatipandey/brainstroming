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
const AppRoutes = lazy(() => import('./app/AppRoutes.jsx'));

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
            </Route>
            <Route path="/app/*" element={<AppRoutes />} />
            <Route path="*" element={<SiteLayout />}>
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </PrefsProvider>
  </StrictMode>,
);
