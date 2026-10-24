// "Why this offer" list. Amounts are the score changes behind each reason.
export default function Reasons({ reasons, title = 'Why this offer', compact = false, headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  return (
    <div className={`reasons ${compact ? 'reasons-compact' : ''}`}>
      {title && <H className="reasons-title">{title}</H>}
      <ul role="list">
        {reasons.map((r, i) => (
          <li key={i} className={`reason reason-${r.effect}`}>
            <span className="reason-text">{r.text}</span>
            {r.amount && <span className="reason-amount">{r.amount}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
