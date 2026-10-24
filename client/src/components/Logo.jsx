import { BRAND } from '@shared/brand.config.js';

// Original mark: a deep teal disc, an FIS-green arc that stops short of a
// full turn, and a warm dot waiting in the gap. No letters, so it survives a
// rename. Geometry is shared with public/brand/*.svg (scripts/brand-assets.mjs).
export const MARK = {
  arc: 'M24 9.5a14.5 14.5 0 1 1-12.56 7.25',
  dot: { cx: 15.6, cy: 11.2, r: 3.1 },
};

export function Monogram({ size = 32, ring = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="mark">
      <circle cx="24" cy="24" r="24" fill="#012834" />
      {ring && <circle cx="24" cy="24" r="21.5" fill="none" stroke="#4bcd3e" strokeOpacity="0.35" strokeWidth="1.5" />}
      <path d={MARK.arc} fill="none" stroke="#4bcd3e" strokeWidth="5" strokeLinecap="round" />
      <circle {...MARK.dot} fill="#f2a679" />
    </svg>
  );
}

export default function Logo({ size = 30 }) {
  return (
    <span className="logo">
      <Monogram size={size} />
      <span className="logo-word">{BRAND.name}</span>
    </span>
  );
}
