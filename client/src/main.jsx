import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrefsProvider } from './lib/prefs.jsx';
import Landing from './pages/Landing.jsx';
import './styles/base.css';

const Signup = lazy(() => import('./pages/Signup.jsx'));
const AppRoutes = lazy(() => import('./app/AppRoutes.jsx'));

function Loading() {
  return <p className="route-loading" role="status">Loading</p>;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrefsProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/app/*" element={<AppRoutes />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </PrefsProvider>
  </StrictMode>,
);
