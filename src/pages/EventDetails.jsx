import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { events as eventsApi } from '../api';
import { parseTentativeDescription } from '../utils/tentativeSchedule';
import './EventDetails.css';

function formatDate(d) {
  if (!d) return 'N/A';
  return new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateRange(startDate, endDate) {
  const start = String(startDate || '').slice(0, 10);
  const end = String(endDate || startDate || '').slice(0, 10);
  if (!start) return 'N/A';
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m || '00'} ${hour < 12 ? 'AM' : 'PM'}`;
}

function formatDateTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    eventsApi.get(id)
      .then((row) => setEvent(row))
      .catch((e) => setError(e?.message || 'Failed to load event details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const meta = parseTentativeDescription(event?.description || '');
  const status = String(event?.status || 'active').toLowerCase();
  const requiredPostDoc = event?.required_post_document || (event?.type === 'event' ? 'After Activity Report (AAR)' : 'Minutes of the Meeting');
  const postDocs = Array.isArray(event?.attachments) ? event.attachments.filter((a) => a.is_post_document) : [];
  const acceptedAttendance = Array.isArray(event?.rsvps)
    ? event.rsvps.filter((r) => String(r.status || '').toLowerCase() === 'accepted')
    : [];

  const historyItems = useMemo(() => {
    const out = [];
    if (event?.created_at) out.push({ when: event.created_at, text: 'Event created.' });
    if (event?.canceled_at) out.push({ when: event.canceled_at, text: `Event cancelled${event.cancel_reason ? `: ${event.cancel_reason}` : '.'}` });
    if (event?.rescheduled_from_event) out.push({ when: event.updated_at || event.created_at, text: `Rescheduled from: ${event.rescheduled_from_event.title}` });
    if (event?.rescheduled_to_event) out.push({ when: event.updated_at || event.created_at, text: `Rescheduled to: ${event.rescheduled_to_event.title}` });
    for (const a of postDocs) {
      if (a?.created_at) out.push({ when: a.created_at, text: `${requiredPostDoc} uploaded: ${a.original_name}` });
    }
    if (Array.isArray(event?.rsvps)) {
      for (const r of event.rsvps) {
        if (!r?.responded_at) continue;
        out.push({
          when: r.responded_at,
          text: `${r.office_name || 'Office'} response: ${String(r.status || '').toUpperCase()}${r.representative_name ? ` (${r.representative_name})` : ''}`,
        });
      }
    }
    return out
      .filter((x) => x.when)
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
  }, [event, postDocs, requiredPostDoc]);

  if (loading) return <div className="event-details-page">Loading event details...</div>;
  if (error) return <div className="event-details-page">{error}</div>;
  if (!event) return <div className="event-details-page">Event not found.</div>;

  return (
    <div className="event-details-page">
      <div className="event-details-head">
        <h1>{event.title}</h1>
        <div className="event-details-head-actions">
          <Link to="/calendar" className="event-details-link">Back to Calendar</Link>
        </div>
      </div>

      <section className="event-details-card">
        <h2>Event Information</h2>
        <p className="event-details-description">{meta.plainDescription || event.description || 'No description.'}</p>
        <div className="event-details-grid">
          <div><span>Date</span><strong>{formatDateRange(event.date, event.end_date || event.date)}</strong></div>
          <div><span>Time</span><strong>{formatTime(event.start_time)} - {formatTime(event.end_time)}</strong></div>
          <div><span>Host</span><strong>{event.creator_name || 'Unknown'}</strong></div>
          <div>
            <span>Status</span>
            <strong>
              <span className={`event-details-pill ${status === 'cancelled' ? 'event-details-pill-cancelled' : 'event-details-pill-active'}`}>
                {status === 'cancelled' ? 'Cancelled' : 'Active'}
              </span>
            </strong>
          </div>
          <div><span>Type</span><strong>{event.type || 'N/A'}</strong></div>
          <div><span>Location</span><strong>{event.location || 'TBA'}</strong></div>
        </div>
      </section>

      <section className="event-details-card">
        <h2>{requiredPostDoc}</h2>
        {postDocs.length === 0 ? (
          <p className="event-details-empty">No uploaded file yet.</p>
        ) : (
          <ul className="event-details-list">
            {postDocs.map((a) => (
              <li key={a.id}>
                <a href={a.url} target="_blank" rel="noreferrer">{a.original_name}</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="event-details-card">
        <h2>Attendance</h2>
        {acceptedAttendance.length === 0 ? (
          <p className="event-details-empty">No confirmed attendance yet.</p>
        ) : (
          <ul className="event-details-list">
            {acceptedAttendance.map((r) => (
              <li key={`${r.office_user_id}`}>
                {r.office_name || 'Office'}{r.representative_name ? ` - ${r.representative_name}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="event-details-card">
        <h2>Responses</h2>
        {!Array.isArray(event.rsvps) || event.rsvps.length === 0 ? (
          <p className="event-details-empty">No responses yet.</p>
        ) : (
          <ul className="event-details-list">
            {event.rsvps.map((r) => (
              <li key={`${r.office_user_id}-resp`}>
                <strong>{r.office_name || 'Office'}:</strong>{' '}
                <span
                  className={`event-details-pill ${
                    String(r.status || 'pending').toLowerCase() === 'accepted'
                      ? 'event-details-pill-accepted'
                      : String(r.status || 'pending').toLowerCase() === 'declined'
                        ? 'event-details-pill-declined'
                        : 'event-details-pill-pending'
                  }`}
                >
                  {String(r.status || 'pending').toUpperCase()}
                </span>
                {r.representative_name ? ` - Rep: ${r.representative_name}` : ''}
                {r.decline_reason ? ` - Reason: ${r.decline_reason}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="event-details-card">
        <h2>History</h2>
        {historyItems.length === 0 ? (
          <p className="event-details-empty">No history records yet.</p>
        ) : (
          <ul className="event-details-list">
            {historyItems.map((h, idx) => (
              <li key={`${h.when}-${idx}`}>
                <strong>{formatDateTime(h.when)}:</strong> {h.text}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

