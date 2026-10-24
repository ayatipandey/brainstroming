import { Screen } from '../AppRoutes.jsx';
import { useStore } from '../store.jsx';
import Icon from '../../components/Icon.jsx';

const ICON = { pay: 'card', use: 'qr', tier: 'star', card: 'bank' };

function when(iso) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString() ? `Today, ${time}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

export default function Activity() {
  const { state } = useStore();
  return (
    <Screen title="Activity">
      <p className="lead">Payments, rewards you used, points you earned, and tiers you reached.</p>
      <ol className="feed" role="list">
        {state.activity.map((e) => (
          <li key={e.id} className="feed-item">
            <span className="feed-icon"><Icon name={ICON[e.kind] || 'info'} /></span>
            <div>
              <p className="feed-title">{e.title}</p>
              <p className="feed-detail">{e.detail}</p>
              <p className="feed-when"><time dateTime={e.at}>{when(e.at)}</time></p>
            </div>
            {e.points ? <span className="feed-points">+{e.points.toLocaleString()}</span> : null}
          </li>
        ))}
      </ol>
    </Screen>
  );
}
