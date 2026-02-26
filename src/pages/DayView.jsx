import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { events as eventsApi } from '../api';
import EventModal from '../components/EventModal';
import './DayView.css';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 6); // 6 AM to 6 PM

const OFFICE_COLORS = {
  'ROMO': { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  'PLO': { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  'QSO': { bg: '#fef9c3', text: '#a16207', border: '#fef08a' },
  'PIO': { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' },
  'SMO': { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
  'PO': { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  'AS': { bg: '#fae8ff', text: '#86198f', border: '#f5d0fe' },
  'ICTO': { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
  'CLGEO': { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' },
  'EBETO': { bg: '#fff1f2', text: '#9f1239', border: '#ffe4e6' },
  'FMS': { bg: '#ecfdf5', text: '#047857', border: '#d1fae5' },
  'CO': { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' },
};

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
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateYmd]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const getOfficeStyle = (name) => {
    const key = String(name || '').toUpperCase();
    return OFFICE_COLORS[key] || { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
  };

  const formatHour = (h) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="day-view-container">
      <header className="day-view-header">
        <div className="day-view-back">
          {/* <Link to="/dashboard" className="day-view-link">← Dashboard</Link>
          <span className="day-view-sep">·</span> */}
          <Link to={`/calendar?date=${dateYmd}`} className="day-view-link">← Back</Link>
        </div>
        <h1 className="day-view-title">
          {new Date(dateYmd).toLocaleDateString('en-US', { dateStyle: 'full' })}
        </h1>
      </header>

      {loading ? (
        <div className="day-view-loading">Loading schedule...</div>
      ) : (
        <div className="calendar-grid-wrapper">
          {/* Column ng Oras */}
          <div className="time-labels-column">
            {HOURS.map(hour => (
              <div key={hour} className="time-label">
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Mismong Grid ng Events */}
          <div className="events-grid">
            {/* LAYER 1: Background horizontal lines - Naka-absolute para hindi umagaw ng column space */}
            <div className="grid-background">
              {HOURS.map(hour => (
                <div key={`line-${hour}`} className="grid-hour-line"></div>
              ))}
            </div>

            {/* LAYER 2: Actual Events - Dito lang dapat ang grid-auto-flow: column */}
            <div className="events-layer">
              {events.map(e => {
                const startH = parseInt(e.start_time?.split(':')[0]);
                const endH = parseInt(e.end_time?.split(':')[0]);
                const rowStart = startH - 6 + 1;
                const rowEnd = endH - 6 + 1;

                if (isNaN(rowStart) || isNaN(rowEnd)) return null;

                const style = getOfficeStyle(e.creator_name || e.office);
                const duration = endH - startH;

                return (
              <button 
                key={e.id} 
                className={`event-card-span ${String(e.status).toLowerCase() === 'cancelled' ? 'cancelled' : ''}`}
                onClick={() => setSelectedEvent(e.id)}
                style={{ 
                  gridRow: `${rowStart} / ${rowEnd}`,
                  borderLeftColor: style.text,
                }}
              >
                <div className="card-header">
                  <span className="office-tag" style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}>
                    {e.creator_name || e.office || 'TESDA'}
                  </span>
                  {duration > 1 && <span className="duration-pill">{duration} hrs</span>}
                </div>

                <div className="card-body">
                  <h3 className="event-title">{e.title}</h3>
                  
                  {/* Nilipat ang Location dito sa taas ng Participants */}
                  {e.location && (
                    <div className="event-loc-inline">
                      📍 {e.location}
                    </div>
                  )}

                  <div className="event-detail-item">
                    <span className="detail-label">Participants:</span>
                    <span className="detail-value">{e.participants || 'To Follow'}</span>
                  </div>
                </div>
              </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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