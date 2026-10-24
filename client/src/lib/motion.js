import { useEffect } from 'react';
import { motionReduced } from './prefs.jsx';

// Lazily start a WebGL effect once its element is near the viewport.
// Returns nothing; the loader's return value is destroyed on unmount.
export function useLazyEffect(ref, loader, deps = []) {
  useEffect(() => {
    const el = ref.current;
    if (!el || motionReduced()) return undefined;
    if (!('IntersectionObserver' in window)) return undefined;
    let handle = null;
    let cancelled = false;
    const io = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      try {
        handle = await loader(el);
        if (cancelled) handle?.destroy?.();
      } catch {
        // No WebGL: the element keeps its CSS look.
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); handle?.destroy?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
