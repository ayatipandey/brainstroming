import { useEffect, useState } from 'react';
import { api } from '../app/api.js';
import '../styles/app.css';

// Team-only tool for live presentations: send card transactions through the
// real ingestion path, confirm emails, and grant admin. This route is not
// linked anywhere, exists only in dev builds (or ENABLE_DEV_TOOLS=1), and the
// server disables /api/dev in production.
export default function Simulator() {
  const [state, setState] = useState(null);
  const [form, setForm] = useState({ cardId: '', merchantId: 'campus-coffee', amount: '4.20', externalId: '' });
  const [out, setOut] = useState('');
  const load = () => api('/dev/state').then((s) => { setState(s); setForm((f) => ({ ...f, cardId: f.cardId || s.cards[0]?.id || '' })); }).catch((e) => setOut(e.message));
  useEffect(() => { document.title = 'Simulator (team only)'; load(); }, []);

  const send = async (e) => {
    e.preventDefault();
    try {
      const r = await api('/dev/transactions', { method: 'POST', body: { ...form, amount: Number(form.amount) } });
      setOut(r.duplicate ? 'Duplicate externalId: nothing changed.' : r.applied ? `Applied ${r.applied.title}. Discount $${(r.transaction.discount_cents / 100).toFixed(2)}, +${r.transaction.points_earned} points.` : `Recorded. No reward applied. +${r.transaction.points_earned} points.`);
      load();
    } catch (ex) { setOut(ex.message); }
  };

  if (!state) return <main className="dev"><h1>Simulator</h1><p role="status">{out || 'Loading'}</p></main>;
  return (
    <main className="dev">
      <h1>Transaction simulator (team only)</h1>
      <p>Sends a transaction through the same code as <code>POST /api/ingest/transactions</code>. Ingestion key for scripts: <code>{state.ingestKey}</code></p>
      <form onSubmit={send} className="dev-form">
        <label>Card <select value={form.cardId} onChange={(e) => setForm({ ...form, cardId: e.target.value })}>
          {state.cards.map((c) => <option key={c.id} value={c.id}>{c.email}: {c.bank} ending {c.last4} (auto-apply {c.auto_apply ? 'on' : 'off'})</option>)}
        </select></label>
        <label>Merchant <select value={form.merchantId} onChange={(e) => setForm({ ...form, merchantId: e.target.value })}>
          {state.merchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select></label>
        <label>Amount (USD) <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
        <label>External id (optional, to test idempotency) <input value={form.externalId} onChange={(e) => setForm({ ...form, externalId: e.target.value })} /></label>
        <button type="submit" className="btn btn-dark">Send transaction</button>
      </form>
      <p role="status" className="dev-out">{out}</p>
      <h2>Users</h2>
      <ul>{state.users.map((u) => (
        <li key={u.id}>{u.email} ({u.first_name}) {u.email_verified_at ? 'confirmed' : <button type="button" onClick={() => api('/dev/verify', { method: 'POST', body: { userId: u.id } }).then(load)}>Confirm {u.email}</button>} {u.is_admin ? 'admin' : <button type="button" onClick={() => api('/dev/admin', { method: 'POST', body: { email: u.email } }).then(load)}>Make {u.email} admin</button>}</li>
      ))}</ul>
      <h2>Recent email (dev outbox)</h2>
      {state.mail.map((m, i) => <pre key={i} className="dev-mail">{m}</pre>)}
    </main>
  );
}
