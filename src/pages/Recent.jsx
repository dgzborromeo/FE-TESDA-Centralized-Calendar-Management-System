import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { events as eventsApi } from '../api';
import EventModal from '../components/EventModal';
import './Dashboard.css';

function toLocalYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

function timeToMinutes(t) {
  if (!t) return 0;
  const parts = String(t).split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  return h * 60 + m;
}

export default function Recent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = () => {
    setLoading(true);
    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 60);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 7);
    eventsApi
      .list({ start: toLocalYMD(rangeStart), end: toLocalYMD(rangeEnd) })
      .then((rows) => setEvents(Array.isArray(rows) ? rows : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const searchLower = searchQuery.trim().toLowerCase();
  const now = new Date();
  const today = toLocalYMD(now);
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const recent = events
    .filter((e) => e.date < today || (e.date === today && timeToMinutes(e.end_time) <= nowMins))
    .filter((e) => !searchLower || [e.title, e.location, e.description].some((v) => v && String(v).toLowerCase().includes(searchLower)))
    .sort((a, b) => (b.date + (b.start_time || '')).localeCompare(a.date + (a.start_time || '')));

  if (loading) return <div className="dashboard-loading">Loading recent events...</div>;

  return (
    <div className="dashboard dashboard-page">
      <div className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <h1 className="dashboard-title">Recent Events/Meetings</h1>
          <p className="dashboard-subtitle">Events that already ended</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/dashboard" className="dashboard-btn">Back to Dashboard</Link>
          <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
        </div>
      </div>

      <div className="dashboard-search">
        <input
          type="search"
          placeholder="Search recent..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dashboard-search-input"
        />
      </div>

      <div className="dashboard-section-head">
        <h2>Recent</h2>
        <span className={`dashboard-count-pill ${recent.length ? 'active' : ''}`}>{recent.length}</span>
      </div>

      {recent.length === 0 ? (
        <p className="dashboard-empty">No recent events.</p>
      ) : (
        <ul className="dashboard-event-list">
          {recent.map((e) => (
            <li key={e.id} className="dashboard-event-item">
              <button type="button" className="dashboard-event-row" onClick={() => setSelectedEvent(e.id)}>
                <span className="dashboard-event-date">{formatDate(e.date)}</span>
                <span className="dashboard-event-time">{formatTime(e.start_time)} – {formatTime(e.end_time)}</span>
                <span className="dashboard-event-title-wrap">
                  <span className="dashboard-event-title">{e.title}</span>
                  {e.location ? <span className="dashboard-event-location">• {e.location}</span> : null}
                </span>
                {e.conflict_count > 0 && (
                  <span className="dashboard-event-conflict" title="Has conflict">⚠</span>
                )}
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

