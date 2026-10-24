import { merchantById } from '@shared/catalog.js';

// Original monograms for the pilot merchants (all fictional). Real brand
// logos would only be used under each brand's own usage terms; see CREDITS.md.
const STYLE = {
  coffee: { bg: '#5a3b2a', fg: '#f6e3c9' },
  food: { bg: '#b8432f', fg: '#fff2e8' },
  books: { bg: '#24456b', fg: '#e8eef7' },
  groceries: { bg: '#2f6b3a', fg: '#e9f6e6' },
};

export default function BrandMark({ merchantId, size = 48 }) {
  const m = merchantById(merchantId);
  if (!m) return null;
  const s = STYLE[m.category];
  const initials = m.name.split(' ').filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join('');
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={m.name} className="brandmark">
      <rect width="48" height="48" rx="14" fill={s.bg} />
      <text x="24" y="30.5" textAnchor="middle" fontFamily="inherit" fontWeight="800" fontSize="17" letterSpacing="-0.5" fill={s.fg}>{initials}</text>
    </svg>
  );
}
