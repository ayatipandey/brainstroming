export default function Toggle({ label, hint, checked, onChange, id }) {
  return (
    <label className="toggle" htmlFor={id}>
      <span className="toggle-text">
        <span className="toggle-label">{label}</span>
        {hint && <span className="toggle-hint">{hint}</span>}
      </span>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-ui" aria-hidden="true"><i /></span>
    </label>
  );
}
