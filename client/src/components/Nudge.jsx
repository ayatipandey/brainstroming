import { Mark } from './Logo.jsx';

// A notification as it arrives on the phone.
export default function Nudge({ title, body, meta = 'now', className = '', children }) {
  return (
    <div className={`nudge ${className}`}>
      <div className="nudge-head">
        <span className="nudge-app"><Mark size={18} /> Perk Predict</span>
        <span className="nudge-meta">{meta}</span>
      </div>
      <p className="nudge-title">{title}</p>
      {body && <p className="nudge-body">{body}</p>}
      {children}
    </div>
  );
}
