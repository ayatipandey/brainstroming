import { forwardRef } from 'react';

const DAYS = 14;
const GAP = 4; // degrees between day segments

function arc(cx, cy, r, a0, a1) {
  const rad = (a) => ((a - 90) * Math.PI) / 180;
  const x0 = cx + r * Math.cos(rad(a0));
  const y0 = cy + r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy + r * Math.sin(rad(a1));
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/**
 * The 14-day expiry clock. Each segment is one day; yellow segments are the
 * days left before the points expire. Yellow appears nowhere else.
 */
const ExpiryClock = forwardRef(function ExpiryClock(
  { daysLeft, points, size = 240, tone = 'field', showLabel = true, className = '' },
  ref,
) {
  const d = Math.max(0, Math.min(DAYS, daysLeft));
  const whole = Math.ceil(d - 1e-6);
  const seg = 360 / DAYS;
  const r = 100;
  const track = tone === 'field' ? 'var(--field-2)' : 'var(--paper-2)';
  const days = Math.round(d);
  const label = `${points != null ? `${points.toLocaleString()} points expire` : 'Points expire'} in ${days} ${days === 1 ? 'day' : 'days'}`;

  return (
    <figure ref={ref} className={`clock clock-${tone} ${className}`} style={{ width: size, maxWidth: '100%' }}>
      <svg viewBox="0 0 240 240" role="img" aria-label={label}>
        {Array.from({ length: DAYS }, (_, i) => {
          const a0 = i * seg + GAP / 2;
          const a1 = (i + 1) * seg - GAP / 2;
          const fill = i < whole ? Math.min(1, d - i) : 0;
          return (
            <g key={i}>
              <path d={arc(120, 120, r, a0, a1)} stroke={track} strokeWidth="22" fill="none" />
              {fill > 0 && (
                <path d={arc(120, 120, r, a0, a0 + (a1 - a0) * fill)} stroke="var(--yellow)" strokeWidth="22" fill="none" />
              )}
            </g>
          );
        })}
      </svg>
      {showLabel && (
        <figcaption className="clock-label" aria-hidden="true">
          <span className="clock-days">{days}</span>
          <span className="clock-unit">{days === 1 ? 'day left' : 'days left'}</span>
        </figcaption>
      )}
    </figure>
  );
});

export default ExpiryClock;
