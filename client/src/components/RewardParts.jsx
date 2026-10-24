import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { merchantById, categoryOf, validUntil, money, TIERS } from '@shared/catalog.js';
import Icon, { categoryIcon } from './Icon.jsx';
import ExpiryClock from './ExpiryClock.jsx';
import BrandMark from './BrandMark.jsx';

// Parts shared by the app and the site's phone. On the site they render
// with demo data inside an inert phone frame.

const dateOf = (r) => (r.validUntil
  ? new Date(`${r.validUntil}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  : validUntil(r.days));

export function keyTerms(r) {
  const parts = [`Ends ${dateOf(r)}`];
  parts.push(r.minSpend ? `minimum spend ${money(r.minSpend)}` : 'no minimum spend');
  parts.push('once');
  return `${r.cost != null ? `${r.cost.toLocaleString()} points. ` : ''}${parts.join(', ')}.`;
}

export function StarButton({ reward, starred, onStar, size = 24 }) {
  return (
    <button
      type="button"
      className={`star ${starred ? 'is-on' : ''}`}
      aria-pressed={starred}
      aria-label={`Star ${reward.title}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStar?.(reward.id); }}
    >
      <Icon name="star" size={size} filled={starred} />
    </button>
  );
}

export function RewardRow({ reward, starred, onStar, to, locked = false, used = false }) {
  const m = merchantById(reward.merchantId);
  const cat = categoryOf(reward);
  const tierName = TIERS.find((t) => t.id === reward.tier).name;
  const body = (
    <>
      <span className="rr-icon">{locked ? <Icon name="lock" /> : <BrandMark merchantId={reward.merchantId} size={52} />}</span>
      <span className="rr-main">
        <span className="rr-title">{reward.title}</span>
        <span className="rr-merchant">{m.name}</span>
        <span className="rr-terms">{locked ? `Unlocks at ${tierName}.` : used ? 'Used.' : keyTerms(reward)}</span>
        {!locked && !used && reward.affordable === false && reward.need > 0 && <span className="rr-need">Needs {reward.need.toLocaleString()} more points</span>}
      </span>
    </>
  );
  return (
    <li className={`rr ${locked ? 'is-locked' : ''} ${used ? 'is-used' : ''}`}>
      {to && !locked ? <Link to={to} className="rr-link">{body}</Link> : <div className="rr-link">{body}</div>}
      {!locked && !used && <StarButton reward={reward} starred={starred} onStar={onStar} />}
    </li>
  );
}

export function TopPick({ item, starred, onStar, to }) {
  const r = item.reward;
  const m = merchantById(r.merchantId);
  return (
    <article className="top on-claret" aria-labelledby={`top-${r.id}`}>
      <div className="top-head">
        <p className="top-merchant">{m.name}</p>
        <StarButton reward={r} starred={starred} onStar={onStar} size={26} />
      </div>
      <div className="top-body">
        <div>
          <h3 id={`top-${r.id}`} className="top-title">{r.title}</h3>
          {item.why.length > 0 && <p className="top-why">{item.why.join('. ')}.</p>}
        </div>
        <ExpiryClock daysLeft={Math.min(r.days, 14)} size={128} ariaLabel={`Ends in ${r.days} days`} tone="field" />
      </div>
      <p className="top-terms">{keyTerms(r)}</p>
      {to ? <Link to={to} className="btn btn-primary"><Icon name="qr" /> Show code</Link> : <span className="btn btn-primary"><Icon name="qr" /> Show code</span>}
    </article>
  );
}

export function TierBar({ points, tier, next, progress }) {
  return (
    <div className="tierbar">
      <div className="tierbar-row">
        <p className="tierbar-tier"><span className={`tier-chip tier-${tier.id}`} aria-hidden="true" />{tier.name}</p>
        <p className="tierbar-points"><strong>{points.toLocaleString()}</strong> points</p>
      </div>
      <div className="tierbar-track" aria-hidden="true"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
      <p className="tierbar-next">{next ? `${(next.min - points).toLocaleString()} points to ${next.name}` : 'Top tier reached'}</p>
    </div>
  );
}

export function Qr({ text, size = 220 }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let live = true;
    QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#22161bff', light: '#ffffffff' } })
      .then((s) => live && setSvg(s));
    return () => { live = false; };
  }, [text]);
  return (
    <div className="qr" style={{ width: size, height: size }} role="img" aria-label="QR code for this reward. The same code is written below." dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

export const codeFor = (reward, name = 'demo') => {
  let h = 0;
  for (const ch of `${reward.id}:${name}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const s = h.toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  return `PP-${s.slice(0, 3)}-${s.slice(3)}`;
};
