import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { events as eventsApi, invitations as invitationsApi } from '../api';
import EventModal from '../components/EventModal';
import './Dashboard.css';

function toLocalYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(d) {
  // Expecting YYYY-MM-DD from API
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

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [conflictCount, setConflictCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    const now = new Date();
    const today = toLocalYMD(now);
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 30);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 30);

    Promise.all([
      eventsApi.list({ start: toLocalYMD(rangeStart), end: toLocalYMD(rangeEnd) }),
      eventsApi.conflicts(),
      invitationsApi.list().catch(() => []),
    ])
      .then(([list, conf, invites]) => {
        setEvents(list);
        setConflictCount(conf.count || 0);
        setInvitations(invites || []);
        setTodayCount(list.filter((e) => e.date === today).length);

        const next7 = new Date(now);
        next7.setDate(next7.getDate() + 7);
        const next7YMD = toLocalYMD(next7);
        setWeekCount(list.filter((e) => e.date >= today && e.date <= next7YMD).length);

        const next30 = new Date(now);
        next30.setDate(next30.getDate() + 30);
        const next30YMD = toLocalYMD(next30);
        setMonthCount(list.filter((e) => e.date >= today && e.date <= next30YMD).length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Update "ongoing" section every minute
  useEffect(() => {
    const t = setInterval(() => setNowTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const refresh = () => {
    setLoading(true);
    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 30);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 30);
    eventsApi
      .list({ start: toLocalYMD(rangeStart), end: toLocalYMD(rangeEnd) })
      .then(setEvents)
      .finally(() => setLoading(false));
    eventsApi.conflicts().then((r) => setConflictCount(r.count || 0));
    invitationsApi.list().then((inv) => setInvitations(inv || [])).catch(() => setInvitations([]));
  };

  const searchLower = searchQuery.trim().toLowerCase();
  const now = new Date();
  const today = toLocalYMD(now);
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const ongoingEvents = events
    .filter((e) => e.date === today)
    .filter((e) => {
      const start = timeToMinutes(e.start_time);
      const end = timeToMinutes(e.end_time);
      return start <= nowMins && nowMins < end;
    })
    .filter((e) => !searchLower || [e.title, e.location, e.description].some((v) => v && String(v).toLowerCase().includes(searchLower)))
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  const recentEvents = events
    .filter((e) => e.date < today || (e.date === today && timeToMinutes(e.end_time) <= nowMins))
    .filter((e) => !searchLower || [e.title, e.location, e.description].some((v) => v && String(v).toLowerCase().includes(searchLower)))
    .sort((a, b) => (b.date + (b.start_time || '')).localeCompare(a.date + (a.start_time || '')))
    ;

  const next7Days = events
    .filter((e) => e.date > today || (e.date === today && timeToMinutes(e.end_time) > nowMins))
    .filter((e) => !searchLower || [e.title, e.location, e.description].some((v) => v && String(v).toLowerCase().includes(searchLower)))
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))
    ;

  if (loading) return <div className="dashboard-loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Overview of events, meetings, conflicts, and invitations</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/events/new" className="dashboard-btn dashboard-btn-primary">+ Create Event</Link>
          <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
        </div>
      </div>
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <span className="dashboard-card-label">Today</span>
          <span className="dashboard-card-value">{todayCount}</span>
          <span className="dashboard-card-sublabel">Events/Meetings</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-label">This week</span>
          <span className="dashboard-card-value">{weekCount}</span>
          <span className="dashboard-card-sublabel">Events/Meetings</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-label">This month</span>
          <span className="dashboard-card-value">{monthCount}</span>
          <span className="dashboard-card-sublabel">Events/Meetings</span>
        </div> 
        <div className="dashboard-card dashboard-card-warning">
          <span className="dashboard-card-label">Conflicts</span>
          <span className="dashboard-card-value">{conflictCount}</span>
          <span className="dashboard-card-sublabel">Overlapping</span>
        </div>
      </div>
      <div className="dashboard-search">
        <input
          type="search"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dashboard-search-input"
        />
      </div>

      <section className="dashboard-invitations">
        <div className="dashboard-section-head">
          <h2>Invitations</h2>
          <span className={`dashboard-count-pill ${invitations.length ? 'active' : ''}`}>{invitations.length}</span>
        </div>
        {invitations.length === 0 ? (
          <p className="dashboard-empty">No pending invitations.</p>
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
      </section>

      <div className="dashboard-grids">
        <section className="dashboard-recent">
          <h2>Ongoing Events/Meetings</h2>
          {ongoingEvents.length === 0 ? (
            <p className="dashboard-empty">No ongoing events right now.</p>
          ) : (
            <ul className="dashboard-event-list">
              {ongoingEvents.map((e) => (
                <li key={e.id} className="dashboard-event-item">
                  <button type="button" className="dashboard-event-row" onClick={() => setSelectedEvent(e.id)}>
                    <span className="dashboard-event-date">{formatDate(e.date)}</span>
                    <span className="dashboard-event-time">{formatTime(e.start_time)} – {formatTime(e.end_time)}</span>
                    <span className="dashboard-event-title-wrap">
                      <span className="dashboard-event-title">{e.title}</span>
                      {e.location ? <span className="dashboard-event-location">• {e.location}</span> : null}
                    </span>
                    <span className="dashboard-event-ongoing" title="Ongoing">●</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-recent">
          <h2>Upcoming Events/Meetings (Next 7 Days)</h2>
          {next7Days.length === 0 ? (
            <p className="dashboard-empty">No upcoming events. <Link to="/events/new">Create one</Link>.</p>
          ) : (
            <ul className="dashboard-event-list">
              {next7Days.map((e) => (
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
        </section>
      </div>

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
