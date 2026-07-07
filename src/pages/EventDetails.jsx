import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { events as eventsApi, resolveAttachmentUrl } from '../api';
import { parseTentativeDescription } from '../utils/tentativeSchedule';
import { getRegionalDirectorsForEvent } from '../utils/regionalDirectorsParticipants';
import { parseRegionalDirectorsLabel } from '../utils/regionalDirectorsLabel';
import { SkeletonEventDetails } from '../components/SkeletonLoader';
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
  const hasBackendParticipants = Array.isArray(event?.attendees) && event.attendees.length > 0;
  const dbRdParticipants = parseRegionalDirectorsLabel(event?.regional_directors_label);
  const dbPdParticipants = parseRegionalDirectorsLabel(event?.provincial_directors_label);
  const dbEdParticipants = parseRegionalDirectorsLabel(event?.executive_directors_label);
  const localRegionalDirectorParticipants = getRegionalDirectorsForEvent(event?.id) || [];
  const dbParticipantLines = [...dbRdParticipants, ...dbPdParticipants, ...dbEdParticipants];
  const participantLines = hasBackendParticipants
    ? event.attendees.map((a) => a.name)
    : event?.participants && String(event.participants).trim() && !String(event.participants).trim().startsWith('[')
      ? String(event.participants).trim().split(',').map(s => s.trim()).filter(Boolean)
      : dbParticipantLines.length
        ? dbParticipantLines
        : localRegionalDirectorParticipants.length
          ? localRegionalDirectorParticipants
          : ['No participants'];

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

  if (loading) return <SkeletonEventDetails />;
  if (error) return <div className="event-details-page">{error}</div>;
  if (!event) return <div className="event-details-page">Event not found.</div>;

  return (
    <div className="event-details-page">
      {/* ── Hero Header ───────────────────────────────────────────────── */}
      <div className="event-details-head">
        <div className="event-details-head-left">
          <div className="event-details-head-meta">
            <span className={`event-details-pill ${status === 'cancelled' ? 'event-details-pill-cancelled' : meta.isTentative ? 'event-details-pill-tentative' : 'event-details-pill-active'}`}>
              {status === 'cancelled' ? 'Cancelled' : meta.isTentative ? 'Tentative' : 'Active'}
            </span>
            <span className="event-details-head-type">{event.type || 'Event'}</span>
          </div>
          <h1>{event.title}</h1>
          <div className="event-details-head-datetime">
            <span className="event-details-head-date">
              📅 {formatDateRange(event.date, event.end_date || event.date)}
            </span>
            {event.start_time && (
              <span className="event-details-head-time">
                🕐 {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="event-details-head-actions">
          <Link to="/calendar" className="event-details-link">← Back to Calendar</Link>
        </div>
      </div>

      {/* ── Content Grid ──────────────────────────────────────────────── */}
      <div className="event-details-content">

        {/* Left column */}
        <div className="event-details-main">

          <section className="event-details-card event-details-card--info">
            <h2>Event Information</h2>
            {(meta.plainDescription || event.description) && (
              <p className="event-details-description">{meta.plainDescription || event.description}</p>
            )}
            <div className="event-details-grid">
              <div className="event-details-grid-item">
                <span>Date</span>
                <strong>{formatDateRange(event.date, event.end_date || event.date)}</strong>
              </div>
              <div className="event-details-grid-item">
                <span>Time</span>
                <strong>{formatTime(event.start_time)} – {formatTime(event.end_time)}</strong>
              </div>
              <div className="event-details-grid-item">
                <span>Location</span>
                <strong>{event.location || 'TBA'}</strong>
              </div>
              <div className="event-details-grid-item">
                <span>Host</span>
                <strong>{event.creator_name || 'Unknown'}</strong>
              </div>
              <div className="event-details-grid-item">
                <span>Meeting Type</span>
                <strong>{event.type || 'N/A'}</strong>
              </div>
              <div className="event-details-grid-item">
                <span>Status</span>
                <strong>
                  <span className={`event-details-pill ${status === 'cancelled' ? 'event-details-pill-cancelled' : 'event-details-pill-active'}`}>
                    {status === 'cancelled' ? 'Cancelled' : 'Active'}
                  </span>
                </strong>
              </div>
            </div>

            <div className="event-details-participants-block">
              <div className="event-details-participants-label">Participants</div>
              <div className="event-details-participants-list">
                {participantLines.map((name, idx) => (
                  <span key={idx} className="event-details-participant-tag">{name}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="event-details-card event-details-card--postdoc">
            <h2>{requiredPostDoc}</h2>
            {postDocs.length === 0 ? (
              <p className="event-details-empty">No uploaded file yet.</p>
            ) : (
              <ul className="event-details-file-list">
                {postDocs.map((a) => (
                  <li key={a.id} className="event-details-file-item">
                    <span className="event-details-file-icon">PDF</span>
                    <a href={resolveAttachmentUrl(a.url)} target="_blank" rel="noreferrer">{a.original_name}</a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="event-details-card event-details-card--history">
            <h2>Activity Timeline</h2>
            {historyItems.length === 0 ? (
              <p className="event-details-empty">No history records yet.</p>
            ) : (
              <div className="event-details-timeline">
                {historyItems.map((h, idx) => (
                  <div key={`${h.when}-${idx}`} className="event-details-timeline-item">
                    <div className="event-details-timeline-dot" />
                    <div className="event-details-timeline-body">
                      <span className="event-details-timeline-time">{formatDateTime(h.when)}</span>
                      <span className="event-details-timeline-text">{h.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="event-details-sidebar">
          <section className="event-details-card event-details-card--attendance">
            <h2>Attendance</h2>
            {acceptedAttendance.length === 0 ? (
              <p className="event-details-empty">No confirmed attendance yet.</p>
            ) : (
              <ul className="event-details-list">
                {acceptedAttendance.map((r) => (
                  <li key={`${r.office_user_id}`}>
                    <span className="event-details-list-name">{r.office_name || 'Office'}</span>
                    {r.representative_name && <span className="event-details-list-sub">{r.representative_name}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="event-details-card event-details-card--responses">
            <h2>Responses</h2>
            {!Array.isArray(event.rsvps) || event.rsvps.length === 0 ? (
              <p className="event-details-empty">No responses yet.</p>
            ) : (
              <ul className="event-details-list">
                {event.rsvps.map((r) => (
                  <li key={`${r.office_user_id}-resp`}>
                    <span className="event-details-list-name">{r.office_name || 'Office'}</span>
                    <span className={`event-details-pill event-details-pill-${String(r.status || 'pending').toLowerCase()}`}>
                      {String(r.status || 'pending').toUpperCase()}
                    </span>
                    {r.representative_name && <span className="event-details-list-sub">Rep: {r.representative_name}</span>}
                    {r.decline_reason && <span className="event-details-list-sub">Reason: {r.decline_reason}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}


