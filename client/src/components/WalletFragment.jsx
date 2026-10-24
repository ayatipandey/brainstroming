import ExpiryClock from './ExpiryClock.jsx';
import Icon, { categoryIcon } from './Icon.jsx';

// The wallet screen as it appears inside the landing page phone. Same parts
// as the app's Wallet, set with demo data.
export default function WalletFragment({ days = 3, expiring = 300, balance = 2350, nudge = true }) {
  return (
    <div className="wf">
      <div className="wf-hero">
        <div className="wf-hero-top">
          <span className="wf-hello">Hi, Maya</span>
          <span className="wf-balance"><strong>{balance.toLocaleString()}</strong> points</span>
        </div>
        <ExpiryClock daysLeft={days} points={expiring} size={150} />
        <p className="wf-expiring"><strong>{expiring} points</strong> expire in {days} days</p>
        <span className="wf-cta">Use them first</span>
      </div>
      {nudge && (
        <div className="wf-section">
          <p className="wf-label">Right now</p>
          <div className="wf-offer">
            <span className="wf-offer-icon"><Icon name="coffee" size={22} /></span>
            <span>
              <strong>Any coffee, on your points</strong>
              <span className="wf-offer-sub">Campus Coffee, 2 doors away</span>
            </span>
            <span className="wf-offer-pts">300</span>
          </div>
        </div>
      )}
      <div className="wf-section">
        <p className="wf-label">Your brands</p>
        {[['coffee', 'Coffee', 'Campus Coffee'], ['books', 'Books', 'Chapter House Books'], ['groceries', 'Groceries', 'Pick a brand']].map(([k, c, b]) => (
          <div key={k} className="wf-brand">
            <Icon name={categoryIcon[k]} size={20} />
            <span className="wf-brand-cat">{c}</span>
            <span className={`wf-brand-name ${b === 'Pick a brand' ? 'is-empty' : ''}`}>{b}</span>
          </div>
        ))}
      </div>
      <nav className="wf-tabbar">
        {['wallet', 'heart', 'card', 'activity', 'settings'].map((n, i) => (
          <span key={n} className={i === 0 ? 'is-on' : ''}><Icon name={n} size={22} /></span>
        ))}
      </nav>
    </div>
  );
}
