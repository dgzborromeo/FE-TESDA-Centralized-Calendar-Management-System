import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { events as eventsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { parseTentativeDescription } from '../utils/tentativeSchedule';
import './EventModal.css';

function formatTime(t) {
  if (!t) return '';
  const parts = t.split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const am = h < 12;
  return `${h % 12 || 12}:${m} ${am ? 'AM' : 'PM'}`;
}

function formatDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateRange(startDate, endDate) {
  const start = String(startDate || '').slice(0, 10);
  const end = String(endDate || startDate || '').slice(0, 10);
  if (!start) return '';
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function normalizeTime(t) {
  if (!t) return '';
  return t.length === 5 ? `${t}:00` : t;
}

export default function EventModal({ eventId, onClose, onEdit, onDelete }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isRomo = (user?.email || '').toLowerCase() === 'romo@tesda.gov.ph';
  const isPo = (user?.email || '').toLowerCase() === 'po@tesda.gov.ph';
  const isSmo = (user?.email || '').toLowerCase() === 'smo@tesda.gov.ph';
  const isCo = (user?.email || '').toLowerCase() === 'co@tesda.gov.ph';
  const isIcto = (user?.email || '').toLowerCase() === 'icto@tesda.gov.ph';
  const isAs = (user?.email || '').toLowerCase() === 'as@tesda.gov.ph';
  const isPlo = (user?.email || '').toLowerCase() === 'plo@tesda.gov.ph';
  const isPio = (user?.email || '').toLowerCase() === 'pio@tesda.gov.ph';
  const isQso = (user?.email || '').toLowerCase() === 'qso@tesda.gov.ph';
  const isFms = (user?.email || '').toLowerCase() === 'fms@tesda.gov.ph';
  const isClgeo = (user?.email || '').toLowerCase() === 'clgeo@tesda.gov.ph';
  const isEbeto = (user?.email || '').toLowerCase() === 'ebeto@tesda.gov.ph';
  const isAdmin = user?.role === 'admin';
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [repName, setRepName] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    eventsApi.get(eventId)
      .then((e) => {
        setEvent(e);
        // Reset inputs each time we open a modal
        setRepName('');
        setDeclineReason('');
      })
      .catch(() => onClose())
      .finally(() => setLoading(false));
  }, [eventId, onClose]);

  const refreshEvent = async () => {
    const e = await eventsApi.get(eventId);
    setEvent(e);
  };

  const submitRsvp = async (status) => {
    if (!eventId) return;
    try {
      setRsvpSubmitting(true);
      await eventsApi.rsvp(eventId, {
        status,
        representative_name: status === 'accepted' ? repName : undefined,
        decline_reason: status === 'declined' ? declineReason : undefined,
      });
      await refreshEvent();
    } catch (e) {
      alert(e.message);
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return;
    setDeleting(true);
    try {
      await eventsApi.delete(eventId);
      onDelete?.();
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    onClose();
    navigate(`/events/${eventId}/edit`);
    onEdit?.();
  };

  if (loading || !event) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-loading">Loading...</div>
        </div>
      </div>
    );
  }

  const isCreator = Number(event.created_by) === Number(user?.id);
  const eventDate = String(event.date || '').slice(0, 10);
  const eventEndDate = String(event.end_date || event.date || '').slice(0, 10);
  const endAt = new Date(`${eventEndDate}T${normalizeTime(event.end_time)}`);
  const isDone = Number.isFinite(endAt.getTime()) ? new Date() >= endAt : false;
  const canEdit = !(isRomo || isPo || isSmo || isCo || isIcto || isAs || isPlo || isPio || isQso || isFms || isClgeo || isEbeto) && (isAdmin || isCreator) && !isDone;
  const myRsvp = event.rsvps?.find((r) => Number(r.office_user_id) === Number(user?.id)) || null;
  const startAt = new Date(`${eventDate}T${normalizeTime(event.start_time)}`);
  const rsvpLocked = Number.isFinite(startAt.getTime()) ? new Date() >= startAt : false;
  const prettyStatus = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
  const tentativeMeta = parseTentativeDescription(event.description || '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-event" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event.title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {tentativeMeta.isTentative && (
            <div className="modal-row">
              <span className="modal-label">Schedule</span>
              <span>
                Tentative{tentativeMeta.note ? ` (${tentativeMeta.note})` : ''}
              </span>
            </div>
          )}
          <div className="modal-row">
            <span className="modal-label">Date</span>
            <span>{formatDateRange(eventDate, eventEndDate)}</span>
          </div>
          <div className="modal-row">
            <span className="modal-label">Time</span>
            <span>{formatTime(event.start_time)} – {formatTime(event.end_time)}</span>
          </div>
          <div className="modal-row">
            <span className="modal-label">Type</span>
            <span className="modal-type">{event.type}</span>
          </div>
          <div className="modal-row">
            <span className="modal-label">Host</span>
            <span>{event.creator_name || 'Unknown'}</span>
          </div>
          {event.location && (
            <div className="modal-row">
              <span className="modal-label">Location</span>
              <span>{event.location}</span>
            </div>
          )}
          {event.attendees?.length > 0 && (
            <div className="modal-row">
              <span className="modal-label">Participants</span>
              <span>{event.attendees.map((a) => a.name).join(', ')}</span>
            </div>
          )}

          {Array.isArray(event.rsvps) && event.rsvps.length > 0 && (
            <div className="modal-row modal-rsvps">
              <span className="modal-label">Responses</span>
              <ul className="modal-rsvp-list">
                {event.rsvps.map((r) => (
                  <li key={`${r.office_user_id}`} className="modal-rsvp-item">
                    <span className="modal-rsvp-office">{r.office_name || 'Unknown office'}</span>
                    <span className={`modal-rsvp-badge modal-rsvp-${r.status}`}>{prettyStatus(r.status)}</span>
                    {r.status === 'accepted' && r.representative_name ? (
                      <span className="modal-rsvp-detail">Representative: {r.representative_name}</span>
                    ) : null}
                    {r.status === 'declined' && r.decline_reason ? (
                      <span className="modal-rsvp-detail">Reason: {r.decline_reason}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {myRsvp && (
            <div className="modal-row modal-my-rsvp">
              <span className="modal-label">Your Response</span>
              <div className="modal-my-rsvp-inner">
                <div className="modal-my-rsvp-status">
                  Status: <span className={`modal-rsvp-badge modal-rsvp-${myRsvp.status}`}>{prettyStatus(myRsvp.status)}</span>
                  {rsvpLocked ? <span className="modal-rsvp-locked">Response locked (event started)</span> : null}
                </div>

                {myRsvp.status === 'pending' && !rsvpLocked && (
                  <div className="modal-rsvp-actions">
                    <div className="modal-rsvp-action">
                      <label className="modal-rsvp-action-label">
                        Representative name
                        <input
                          value={repName}
                          onChange={(e) => setRepName(e.target.value)}
                          placeholder="Enter representative"
                          className="modal-input"
                          disabled={rsvpSubmitting}
                        />
                      </label>
                      <button
                        type="button"
                        className="modal-btn modal-btn-edit"
                        onClick={() => submitRsvp('accepted')}
                        disabled={rsvpSubmitting || !repName.trim()}
                      >
                        {rsvpSubmitting ? 'Submitting...' : 'Accept'}
                      </button>
                    </div>

                    <div className="modal-rsvp-action">
                      <label className="modal-rsvp-action-label">
                        Decline reason
                        <textarea
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          placeholder="Why can’t you attend?"
                          className="modal-textarea"
                          rows={3}
                          disabled={rsvpSubmitting}
                        />
                      </label>
                      <button
                        type="button"
                        className="modal-btn modal-btn-delete"
                        onClick={() => submitRsvp('declined')}
                        disabled={rsvpSubmitting || !declineReason.trim()}
                      >
                        {rsvpSubmitting ? 'Submitting...' : 'Decline'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {event.description && (
            <div className="modal-row modal-description">
              <span className="modal-label">Description</span>
              <p>{tentativeMeta.plainDescription || event.description}</p>
            </div>
          )}
          {Array.isArray(event.attachments) && event.attachments.length > 0 && (
            <div className="modal-row modal-attachments">
              <span className="modal-label">Attachment</span>
              <ul className="modal-attachments-list">
                {event.attachments.map((a) => (
                  <li key={a.id} className="modal-attachment-item">
                    <a href={a.url} target="_blank" rel="noreferrer" className="modal-attachment-link">
                      {a.original_name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {event.conflicts?.length > 0 && (
            <div className="modal-conflicts">
              <span className="modal-label">⚠ Conflicts</span>
              <ul>
                {event.conflicts.map((c) => (
                  <li key={c.id}>{c.title} ({formatTime(c.start_time)} – {formatTime(c.end_time)})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {canEdit && (
            <>
              <button type="button" className="modal-btn modal-btn-edit" onClick={handleEdit}>Edit</button>
              <button type="button" className="modal-btn modal-btn-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
          <button type="button" className="modal-btn modal-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
