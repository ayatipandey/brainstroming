import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Accessibility preferences shared by the landing page and the app.
// Applied as data attributes on <html> so CSS and motion code can read them.

const KEY = 'pp-prefs';
const PrefsContext = createContext(null);

function load() {
  try {
    return { text: 'normal', contrast: 'normal', motion: 'auto', ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { text: 'normal', contrast: 'normal', motion: 'auto' };
  }
}

const systemReduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(load);
  const [system, setSystem] = useState(systemReduced);

  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setSystem(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const reduced = prefs.motion === 'reduce' || (prefs.motion === 'auto' && system);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.text = prefs.text;
    root.dataset.contrast = prefs.contrast;
    root.dataset.motion = reduced ? 'reduce' : 'full';
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ }
  }, [prefs, reduced]);

  const value = useMemo(() => ({
    prefs,
    reduced,
    set: (patch) => setPrefs((p) => ({ ...p, ...patch })),
  }), [prefs, reduced]);

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export const usePrefs = () => useContext(PrefsContext);

// Non-React readers (motion helpers).
export const motionReduced = () => document.documentElement.dataset.motion === 'reduce';
