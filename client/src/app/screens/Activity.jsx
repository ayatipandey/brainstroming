import { Screen } from '../AppRoutes.jsx';
import { useStore } from '../store.jsx';
import Icon from '../../components/Icon.jsx';
import { money } from '@shared/catalog.js';

const ICON = { nudge: 'spark', quiet: 'moon', redeem: 'check', payment: 'card', undo: 'undo', card: 'bank' };

function when(iso) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return sameDay ? `Today, ${time}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

export default function Activity() {
  const { state } = useStore();
  return (
    <Screen title="Activity" lead={`Everything the engine did, including the times it chose to stay quiet. Saved from expiring so far: ${money(state.saved)}.`}>
      {state.activity.length === 0 ? (
        <p className="empty">Nothing yet. Open the Demo panel to fire a nudge or simulate a payment.</p>
      ) : (
        <ol className="feed" role="list">
          {state.activity.map((e) => (
            <li key={e.id} className={`feed-item feed-${e.kind} ${e.undone ? 'is-undone' : ''}`}>
              <span className="feed-icon"><Icon name={ICON[e.kind] || 'info'} /></span>
              <div className="feed-main">
                <p className="feed-title">{e.title}{e.undone ? ' (undone)' : ''}</p>
                <p className="feed-detail">{e.detail}</p>
                <p className="feed-when"><time dateTime={e.at}>{when(e.at)}</time></p>
              </div>
              {e.points ? <span className="feed-points">{e.points.toLocaleString()} pts</span> : null}
            </li>
          ))}
        </ol>
      )}
    </Screen>
  );
}
