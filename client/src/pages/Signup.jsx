import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import '../styles/app.css';

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const heading = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    document.title = 'Create account, Perk Predict';
    heading.current?.focus();
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter the name you want the app to greet you by.');
      nameRef.current?.focus();
      return;
    }
    try { localStorage.setItem('pp-account-name', name.trim()); } catch { /* storage unavailable */ }
    navigate('/app');
  };

  return (
    <div className="signup">
      <aside className="signup-side on-field" data-surface="field">
        <Link to="/" className="nav-logo" aria-label="Perk Predict, home"><span style={{ color: 'var(--on-field)' }}><Logo /></span></Link>
        <p className="signup-side-title" aria-hidden="true">Rewards that find you</p>
        <p>A prototype for the FIS Innovation Challenge. Accounts live only in this browser.</p>
      </aside>
      <main className="signup-main">
        <h1 ref={heading} tabIndex={-1}>Create your account</h1>
        <p className="screen-lead">Two fields, no password. The prototype keeps your name in this browser only.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="name" className="field-label">Your first name</label>
          <input ref={nameRef} id="name" type="text" autoComplete="given-name" value={name} onChange={(e) => { setName(e.target.value); setError(''); }}
            aria-invalid={!!error} aria-describedby={error ? 'name-error' : undefined} />
          {error && <p id="name-error" className="error" role="alert">{error}</p>}
          <label htmlFor="email" className="field-label" style={{ marginTop: 16 }}>Email, optional</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby="email-hint" />
          <p id="email-hint" className="fine">Not stored or sent anywhere in the prototype.</p>
          <div className="flow-actions">
            <button type="submit" className="btn btn-primary">Create account</button>
            <Link to="/app/demo" className="text-link">Skip and try the demo</Link>
          </div>
        </form>
        <ul className="signup-promise" role="list">
          <li><Icon name="lock" /> No card numbers or passwords, anywhere.</li>
          <li><Icon name="pin" /> Location is off until you turn it on, and only used while the app is open.</li>
          <li><Icon name="calendar" /> No birthday, ever.</li>
        </ul>
      </main>
    </div>
  );
}
