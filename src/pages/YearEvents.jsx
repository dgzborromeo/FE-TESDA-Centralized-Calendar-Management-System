import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { events as eventsApi } from '../api';
import EventModal from '../components/EventModal';
import { parseTentativeDescription } from '../utils/tentativeSchedule';
import './Dashboard.css';

function formatTime(t) {
  if (!t) return '';
  const parts = String(t).split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parts[1] || '00';
  const am = h < 12;
  return `${h % 12 || 12}:${m} ${am ? 'AM' : 'PM'}`;
}

function formatDate(d) {
  const ymd = String(d || '').slice(0, 10);
  if (!ymd) return '';
  return new Date(`${ymd}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateRange(startDate, endDate) {
  const start = String(startDate || '').slice(0, 10);
  const end = String(endDate || '').slice(0, 10);
  if (!start) return '';
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function acronymFromParticipantName(fullName) {
  const raw = String(fullName || '').trim();
  if (!raw) return '';
  const parenthetical = raw.match(/\(([^()]+)\)$/);
  if (parenthetical?.[1]) return String(parenthetical[1]).trim().toUpperCase();
  const words = raw.split(/\s+/).filter(Boolean);
  return words.slice(0, 6).map((w) => w[0]?.toUpperCase() || '').join('') || raw.slice(0, 8).toUpperCase();
}

function formatParticipantsAcronymList(summaryStr) {
  if (!summaryStr || String(summaryStr).trim() === '') return 'TBA';
  const names = String(summaryStr).split(',').map((n) => n.trim()).filter(Boolean);
  if (names.length === 0) return 'TBA';
  return names.map(acronymFromParticipantName).join(', ');
}

function currentYear() {
  return new Date().getFullYear();
}

export default function YearEvents() {
  const [year, setYear] = useState(currentYear());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const yearOptions = useMemo(() => {
    const now = currentYear();
    const out = [];
    for (let y = now + 1; y >= now - 7; y -= 1) out.push(y);
    return out;
  }, []);

  const refresh = (targetYear) => {
    setLoading(true);
    eventsApi
      .list({ start: `${targetYear}-01-01`, end: `${targetYear}-12-31` })
      .then((rows) => setEvents(Array.isArray(rows) ? rows : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh(year);
  }, [year]);

  const searchLower = searchQuery.trim().toLowerCase();
  const filtered = events
    .filter((e) => {
      if (!searchLower) return true;
      const haystack = [
        e.title,
        e.location,
        e.description,
        e.creator_name,
        e.participants_summary,
        e.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchLower);
    })
    .sort((a, b) => (String(a.date || '') + String(a.start_time || '')).localeCompare(String(b.date || '') + String(b.start_time || '')));

  if (loading) return <div className="dashboard-loading">Loading events for {year}...</div>;

  return (
    <div className="dashboard dashboard-page">
      <div className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <h1 className="dashboard-title">All Events by Year</h1>
          <p className="dashboard-subtitle">Shows all registered events for the selected year, including done and upcoming schedules</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/dashboard" className="dashboard-btn">Back to Dashboard</Link>
          <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
        </div>
      </div>

      <div className="dashboard-search">
        <div className="dashboard-year-control">
          <label htmlFor="year-events-select">Year:</label>
          <select
            id="year-events-select"
            className="dashboard-year-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <input
          type="search"
          placeholder="Search events in selected year..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dashboard-search-input"
        />
      </div>

      <div className="dashboard-section-head">
        <h2>{year} Events</h2>
        <span className={`dashboard-count-pill ${filtered.length ? 'active' : ''}`}>{filtered.length}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="dashboard-empty">No events found for {year}.</p>
      ) : (
        <ul className="dashboard-event-list">
          {filtered.map((e) => (
            <li key={e.id} className="dashboard-event-item">
              <button type="button" className="dashboard-event-row" onClick={() => setSelectedEvent(e.id)}>
                {(() => {
                  const tentative = parseTentativeDescription(e.description || '');
                  return (
                    <>
                <span className="dashboard-event-date">{formatDateRange(e.date, e.end_date)}</span>
                <span className="dashboard-event-time">{formatTime(e.start_time)} - {formatTime(e.end_time)}</span>
                <span className="dashboard-event-title-wrap">
                  <span className="dashboard-event-title">{e.title}</span>
                  {e.location ? <span className="dashboard-event-location">- {e.location}</span> : null}
                </span>
                <span className="dashboard-upcoming-meta">
                  <span className="dashboard-upcoming-meta-item">Host: {e.creator_name || 'Unknown'}</span>
                  <span className="dashboard-upcoming-meta-item">Participants: {formatParticipantsAcronymList(e.participants_summary)}</span>
                  <span className="dashboard-upcoming-meta-item">Venue: {e.location || 'TBA'}</span>
                  {tentative.isTentative ? (
                    <span className="dashboard-upcoming-meta-item">
                      Schedule: Tentative{tentative.note ? ` (${tentative.note})` : ''}
                    </span>
                  ) : null}
                </span>
                    </>
                  );
                })()}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedEvent && (
        <EventModal
          eventId={selectedEvent}
          onClose={() => {
            setSelectedEvent(null);
            refresh(year);
          }}
          onEdit={() => setSelectedEvent(null)}
          onDelete={() => refresh(year)}
        />
      )}
    </div>
  );
}
