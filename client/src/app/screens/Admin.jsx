import { useEffect, useState } from 'react';
import { Screen } from '../AppRoutes.jsx';
import { useSession } from '../session.jsx';
import { api } from '../api.js';

export default function Admin() {
  const { me, toast } = useSession();
  const [rows, setRows] = useState(null);
  const load = () => api('/admin/offers').then(setRows).catch((e) => toast('Could not load offers', e.message));
  useEffect(() => { if (me.user.isAdmin) load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!me.user.isAdmin) return <Screen title="Not available"><p className="lead">This page is for administrators.</p></Screen>;

  const setStatus = async (o, status) => {
    if (status === 'confirmed' && !window.confirm(`Mark "${o.title}" at ${o.merchant} as confirmed? Only do this with the merchant's written confirmation.`)) return;
    await api(`/admin/offers/${o.id}`, { method: 'PATCH', body: { status } }).catch((e) => toast('Could not save', e.message));
    load();
  };

  return (
    <Screen title="Offer administration" back={{ to: '/app/settings', label: 'Settings' }}>
      <p className="lead">Placeholder offers are hidden from customers in production. Mark an offer confirmed only when the merchant has confirmed it in writing.</p>
      {!rows ? <p role="status">Loading</p> : (
        <div className="table-wrap glass" tabIndex={0} role="region" aria-label="Offers">
          <table className="admin-table">
            <thead><tr><th scope="col">Offer</th><th scope="col">Merchant</th><th scope="col">Tier</th><th scope="col">Points</th><th scope="col">Status</th><th scope="col">Note</th><th scope="col">Change</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <th scope="row">{o.title}</th><td>{o.merchant}</td><td>{o.tier}</td><td>{o.cost}</td>
                  <td><span className={`status status-${o.status}`}>{o.status === 'placeholder' ? 'Placeholder, needs merchant confirmation' : 'Confirmed'}</span></td>
                  <td>{o.sourceNote}</td>
                  <td>{o.status === 'placeholder'
                    ? <button type="button" className="btn btn-quiet btn-small" onClick={() => setStatus(o, 'confirmed')}>Mark {o.title} confirmed</button>
                    : <button type="button" className="btn btn-quiet btn-small" onClick={() => setStatus(o, 'placeholder')}>Mark {o.title} as placeholder</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Screen>
  );
}
