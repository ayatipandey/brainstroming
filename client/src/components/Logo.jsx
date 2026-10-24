import { BRAND } from '@shared/brand.config.js';
export function Mark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="mark">
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="3.5" strokeDasharray="48 21" transform="rotate(-90 16 16)" />
      <circle cx="16" cy="16" r="3.5" fill="var(--brass)" />
    </svg>
  );
}

export default function Logo({ size = 28 }) {
  return (
    <span className="logo">
      <Mark size={size} />
      <span className="logo-word">{BRAND.name}</span>
    </span>
  );
}
