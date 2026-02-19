import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { events as eventsApi } from '../api';
import EventModal from '../components/EventModal';
import './DayView.css';

function toLocalYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateLong(ymd) {
  if (!ymd || ymd.length < 10) return '';
  return new Date(`${ymd.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${(m || '00').padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

function isWithinDay(ymd, eventDate, eventEndDate) {
  const end = eventEndDate || eventDate;
  return ymd >= (eventDate || '').slice(0, 10) && ymd <= (end || '').slice(0, 10);
}

export default function DayView() {
  const { date: dateParam } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const dateYmd = dateParam && dateParam.length >= 10 ? dateParam.slice(0, 10) : toLocalYMD(new Date());

  useEffect(() => {
    const start = dateYmd;
    const end = dateYmd;
    setLoading(true);
    eventsApi
      .list({ start, end })
      .then((list) => {
        const forDay = list.filter((e) => isWithinDay(dateYmd, e.date, e.end_date || e.date));
        forDay.sort((a, b) =>
          (String(a.date) + String(a.start_time || '')).localeCompare(String(b.date) + String(b.start_time || ''))
        );
        setEvents(forDay);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateYmd]);

  const dateLabel = formatDateLong(dateYmd);

  return (
    <div className="day-view">
      <div className="day-view-header">
        <div className="day-view-back">
          <Link to="/dashboard" className="day-view-link">← Dashboard</Link>
          <span className="day-view-sep">·</span>
          <Link to={`/calendar?date=${dateYmd}`} className="day-view-link">Full calendar</Link>
        </div>
        <h1 className="day-view-title">{dateLabel}</h1>
        <p className="day-view-subtitle">
          {events.length} {events.length === 1 ? 'event' : 'events'} on this day
        </p>
      </div>

      {loading ? (
        <div className="day-view-loading">Loading...</div>
      ) : events.length === 0 ? (
        <div className="day-view-empty">
          <p>No events scheduled for this day.</p>
          <Link to={`/events/new?date=${dateYmd}`} className="day-view-btn">Create event</Link>
        </div>
      ) : (
        <ul className="day-view-list">
          {events.map((e) => {
            const status = String(e.status || 'active').toLowerCase();
            const isCancelled = status === 'cancelled';
            return (
              <li key={e.id} className="day-view-item-wrap">
                <button
                  type="button"
                  className={`day-view-item ${isCancelled ? 'day-view-item-cancelled' : ''}`}
                  onClick={() => setSelectedEvent(e.id)}
                >
                  <span className="day-view-time">
                    {formatTime(e.start_time)} – {formatTime(e.end_time)}
                  </span>
                  <span className="day-view-item-title">{e.title}</span>
                  <span className="day-view-meta">
                    {e.creator_name || 'Unknown'} · {e.location || 'TBA'}
                  </span>
                  {isCancelled && <span className="day-view-badge day-view-badge-cancelled">Cancelled</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectedEvent && (
        <EventModal
          eventId={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => setSelectedEvent(null)}
          onDelete={() => {
            setSelectedEvent(null);
            eventsApi.list({ start: dateYmd, end: dateYmd }).then((list) => {
              const forDay = list.filter((e) => isWithinDay(dateYmd, e.date, e.end_date || e.date));
              forDay.sort((a, b) =>
                (String(a.date) + String(a.start_time || '')).localeCompare(String(b.date) + String(b.start_time || ''))
              );
              setEvents(forDay);
            });
          }}
        />
      )}
    </div>
  );
}
