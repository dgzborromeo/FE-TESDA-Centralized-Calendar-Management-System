import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { events as eventsApi } from '../api';
import EventModal from '../components/EventModal';
import { parseTentativeDescription } from '../utils/tentativeSchedule';
import './DayView.css';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM

const OFFICE_COLORS = {
  'ROMO':  { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  'PLO':   { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' },
  'QSO':   { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
  'PIO':   { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
  'SMO':   { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' },
  'PO':    { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  'AS':    { bg: '#cffafe', text: '#0e7490', border: '#67e8f9' },
  'ICTO':  { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  'CLGEO': { bg: '#fef9c3', text: '#a16207', border: '#fde047' },
  'EBETO': { bg: '#ffe4e6', text: '#be123c', border: '#fda4af' },
  'FMS':   { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4' },
  'CO':    { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
};

const DEFAULT_COLOR = { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };

function getOfficeStyle(name) {
  const key = String(name || '').toUpperCase();
  const match = Object.keys(OFFICE_COLORS).find(k => key.includes(k));
  return OFFICE_COLORS[match] || DEFAULT_COLOR;
}

function getAbbreviation(name) {
  const n = String(name || '').trim();
  const m = n.match(/\(([^)]+)\)/);
  if (m) return m[1].toUpperCase().slice(0, 6);
  return n.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 4) || '?';
}

function formatFullTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function formatHour(h) {
  return `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
}

function renderParticipants(data) {
  if (!data) return 'TBA';
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (Array.isArray(parsed)) return parsed.map(p => p.name || p).join(', ') || 'TBA';
  } catch (_) {}
  return String(data);
}

function getModeLabel(e) {
  const loc = String(e.location || '').toLowerCase();
  if (loc.includes('zoom') || e.type === 'zoom') return { label: 'Virtual / Zoom', cls: 'zoom' };
  if (loc.includes('zoom') && loc.includes('|')) return { label: 'Hybrid', cls: 'hybrid' };
  return { label: 'Face to Face', cls: 'meeting' };
}

export default function DayView() {
  const { date: dateParam } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const dateYmd = dateParam?.slice(0, 10) || new Date().toISOString().split('T')[0];

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const list = await eventsApi.list({ start: dateYmd, end: dateYmd });
      setEvents(list || []);
    } catch (err) {
      console.error('DayView fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateYmd]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const eventsByHour = useMemo(() => {
    const map = {};
    HOURS.forEach(h => { map[h] = []; });
    events.forEach(e => {
      const hour = parseInt((e.start_time || '08:00').split(':')[0]);
      const slot = HOURS.includes(hour) ? hour : HOURS[0];
      map[slot].push(e);
    });
    return map;
  }, [events]);

  const totalEvents = events.length;

  return (
    <div className="day-view-container">
      <div className="day-view-inner">
      <header className="day-view-header">
        <div className="day-view-back">
          <Link to={`/calendar?date=${dateYmd}`} className="day-view-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Calendar
          </Link>
        </div>
        <div className="day-view-header-center">
          <h1 className="day-view-title">
            {new Date(dateYmd + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h1>
          {!loading && (
            <div className="day-view-event-count">
              {totalEvents === 0 ? 'No events scheduled' : `${totalEvents} event${totalEvents !== 1 ? 's' : ''} scheduled`}
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div className="day-view-loading">
          <div className="day-view-loading-bar" />
          Loading schedule...
        </div>
      ) : totalEvents === 0 ? (
        <div className="day-view-empty">
          <div className="day-view-empty-icon">📅</div>
          <strong>No events on this day</strong>
          <span>Nothing scheduled yet.</span>
        </div>
      ) : (
        <div className="timeline-list">
          {HOURS.map(hour => {
            const hourEvents = eventsByHour[hour] || [];
            return (
              <div key={hour} className="hour-section">
                {/* Hour label */}
                <div className="hour-label-col">
                  <span className="hour-text">{formatHour(hour)}</span>
                </div>

                {/* Track line + dot */}
                <div className="hour-track-col">
                  <div className="hour-dot" />
                  <div className="hour-line-track" />
                </div>

                {/* Events */}
                <div className="hour-events-col">
                  {hourEvents.length === 0 ? (
                    <div className="hour-events-empty" />
                  ) : (
                    hourEvents.map((e, idx) => {
                      const style = getOfficeStyle(e.creator_name);
                      const abbr = getAbbreviation(e.creator_name);
                      const mode = getModeLabel(e);
                      const tentative = parseTentativeDescription(e.description || '');
                      const participants = renderParticipants(e.participants);

                      return (
                        <div
                          key={e.id}
                          className="dv-event-card"
                          style={{ '--dv-card-color': e.color || style.border, animationDelay: `${0.05 + idx * 0.06}s` }}
                          onClick={() => setSelectedEvent(e.id)}
                        >
                          {/* Top row: title + time */}
                          <div className="dv-card-top">
                            <span className="dv-card-title">{e.title}</span>
                            <span className="dv-card-time">
                              {formatFullTime(e.start_time)} – {formatFullTime(e.end_time)}
                            </span>
                          </div>

                          {/* Meta row */}
                          <div className="dv-card-meta">
                            {/* Host badge */}
                            <span
                              className="dv-host-badge"
                              style={{
                                background: e.color ? `${e.color}22` : style.bg,
                                color: e.color || style.text,
                                borderColor: e.color ? `${e.color}55` : style.border
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              {abbr}
                            </span>

                            {/* Mode */}
                            <span className={`dv-mode-badge ${mode.cls}`}>
                              {mode.cls === 'zoom' ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                              ) : (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>
                              )}
                              {mode.label}
                            </span>

                            {/* Location */}
                            {e.location && (
                              <span className="dv-meta-item">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                                {e.location}
                              </span>
                            )}

                            {/* Tentative badge */}
                            {tentative.isTentative && (
                              <span className="dv-tentative-badge">Tentative</span>
                            )}
                          </div>

                          {/* Participants */}
                          {participants && participants !== 'TBA' && (
                            <div className="dv-card-participants">
                              <span className="dv-participants-label">Participants:</span>
                              {participants}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      </div>{/* end day-view-inner */}

      {selectedEvent && (
        <EventModal
          eventId={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={fetchEvents}
          onDelete={fetchEvents}
        />
      )}
    </div>
  );
}
