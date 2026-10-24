// A labelled input with its hint and error wired up for screen readers.
export default function Field({ id, label, hint, error, type = 'text', ...rest }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field-row">
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} name={id} type={type} className="input" aria-invalid={!!error} aria-describedby={describedBy} {...rest} />
      {hint && <p id={`${id}-hint`} className="hint">{hint}</p>}
      {error && <p id={`${id}-err`} className="field-error">{error}</p>}
    </div>
  );
}
