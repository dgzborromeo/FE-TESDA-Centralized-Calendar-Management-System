import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { invitations as invitationsApi } from '../api';
import EventModal from '../components/EventModal';
import './Dashboard.css';

function formatDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const am = hour < 12;
  return `${hour % 12 || 12}:${m} ${am ? 'AM' : 'PM'}`;
}

export default function Invitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const refresh = () => {
    setLoading(true);
    invitationsApi
      .list()
      .then((rows) => setInvitations(Array.isArray(rows) ? rows : []))
      .catch(() => setInvitations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  if (loading) return <div className="dashboard-loading">Loading invitations...</div>;

  return (
    <div className="dashboard dashboard-page">
      <div className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <h1 className="dashboard-title">Invitations</h1>
          <p className="dashboard-subtitle">Pending invites that need your response</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/dashboard" className="dashboard-btn">Back to Dashboard</Link>
          <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
        </div>
      </div>

      <div className="dashboard-section-head">
        <h2>Pending Invitations</h2>
        <span className={`dashboard-count-pill ${invitations.length ? 'active' : ''}`}>{invitations.length}</span>
      </div>

      {invitations.length === 0 ? (
        <p className="dashboard-empty">No pending invitations</p>
      ) : (
        <ul className="dashboard-event-list">
          {invitations.map((inv) => (
            <li key={`${inv.event_id}`} className="dashboard-event-item">
              <button
                type="button"
                className="dashboard-event-row dashboard-invitation-row"
                onClick={() => setSelectedEvent(inv.event_id)}
              >
                <span className="dashboard-event-date">{formatDate(inv.date)}</span>
                <span className="dashboard-event-time">{formatTime(inv.start_time)} – {formatTime(inv.end_time)}</span>
                <span className="dashboard-event-title-wrap">
                  <span className="dashboard-event-title">{inv.title}</span>
                  {inv.location ? <span className="dashboard-event-location">• {inv.location}</span> : null}
                </span>
                <span className="dashboard-invite-from" title={`Host: ${inv.creator_name || ''}`}>
                  Host: {inv.creator_name || '—'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedEvent && (
        <EventModal
          eventId={selectedEvent}
          onClose={() => { setSelectedEvent(null); refresh(); }}
          onEdit={() => { setSelectedEvent(null); }}
          onDelete={refresh}
        />
      )}
    </div>
  );
}

