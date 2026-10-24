import { useEffect, useRef, useState } from 'react';
import { motionReduced } from '../lib/prefs.jsx';
import { Monogram } from './Logo.jsx';

// A points coin. A flat drawing shows first and stays when motion is reduced
// or WebGL is missing; otherwise a lazily loaded 3D coin takes over and
// turns with scroll, pointer and device tilt. It renders only while moving.
export default function Coin() {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (motionReduced()) return undefined;
    let handle = null;
    let cancelled = false;
    const start = async () => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
        if (!gl) return;
        const { createCoin } = await import('../webgl/coin.js');
        if (cancelled) return;
        handle = createCoin(canvas.current, wrap.current);
        setLive(true);
      } catch {
        // Keep the flat coin.
      }
    };
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
    idle(start);
    return () => { cancelled = true; handle?.destroy(); };
  }, []);

  return (
    <div ref={wrap} className={`coin ${live ? 'is-live' : ''}`} aria-hidden="true">
      <div className="coin-flat"><Monogram size={88} ring /></div>
      <canvas ref={canvas} className="coin-canvas" />
    </div>
  );
}
