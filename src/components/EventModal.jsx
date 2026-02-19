import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { events as eventsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAppDialog } from './AppDialogProvider';
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
  const dialog = useAppDialog();
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
  const [cancelMode, setCancelMode] = useState('cancel');
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleEndDate, setRescheduleEndDate] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [postDocFile, setPostDocFile] = useState(null);
  const [postDocUploading, setPostDocUploading] = useState(false);
  const [nowTick, setNowTick] = useState(0);

  // Update status periodically so it changes from Active -> Ongoing -> Done in real-time
  useEffect(() => {
    const interval = setInterval(() => setNowTick((x) => x + 1), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    eventsApi.get(eventId)
      .then((e) => {
        setEvent(e);
        // Reset inputs each time we open a modal
        setRepName('');
        setDeclineReason('');
        setCancelMode('cancel');
        setCancelReason('');
        setRescheduleDate('');
        setRescheduleEndDate('');
        setPostDocFile(null);
      })
      .catch(() => onClose())
      .finally(() => setLoading(false));
    // Intentionally only refetch when the selected event changes.
    // Including onClose here can cause repeated refetches when parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

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
      await dialog.alert(e.message);
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const ok = await dialog.confirm('Delete this event?', {
      title: 'Confirm Delete',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      tone: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await eventsApi.delete(eventId);
      onDelete?.();
      onClose();
    } catch (e) {
      await dialog.alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    onClose();
    navigate(`/events/${eventId}/edit`);
    onEdit?.();
  };

  const handleCancelOrReschedule = async () => {
    if (!isAdmin) return;
    const mode = cancelMode === 'reschedule' ? 'reschedule' : 'cancel';
    if (mode === 'reschedule' && !rescheduleDate) {
      await dialog.alert('Please select a new date for reschedule.', { title: 'Incomplete Form' });
      return;
    }
    const confirmMsg = mode === 'reschedule'
      ? 'Cancel this event and create a rescheduled linked event?'
      : 'Cancel this event?';
    const ok = await dialog.confirm(confirmMsg, {
      title: mode === 'reschedule' ? 'Confirm Cancel + Reschedule' : 'Confirm Cancel',
      confirmText: mode === 'reschedule' ? 'Proceed' : 'Cancel Event',
      cancelText: 'Back',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      setCancelSubmitting(true);
      await eventsApi.cancel(eventId, {
        mode,
        reason: cancelReason.trim() || undefined,
        new_date: mode === 'reschedule' ? rescheduleDate : undefined,
        new_end_date: mode === 'reschedule' ? (rescheduleEndDate || undefined) : undefined,
      });
      await refreshEvent();
      onDelete?.();
      if (mode === 'reschedule') {
        await dialog.alert('Event cancelled and rescheduled successfully.', { title: 'Success' });
      } else {
        await dialog.alert('Event cancelled successfully.', { title: 'Success' });
      }
    } catch (e) {
      await dialog.alert(e.message, { title: 'Action Failed' });
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleUploadPostDocument = async () => {
    if (!postDocFile) return;
    try {
      setPostDocUploading(true);
      await eventsApi.uploadPostDocument(eventId, postDocFile);
      setPostDocFile(null);
      await refreshEvent();
      onDelete?.();
    } catch (e) {
      await dialog.alert(e.message || 'Failed to upload document.', { title: 'Upload Failed' });
    } finally {
      setPostDocUploading(false);
    }
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
  const startAt = new Date(`${eventDate}T${normalizeTime(event.start_time)}`);
  const endAt = new Date(`${eventEndDate}T${normalizeTime(event.end_time)}`);
  const now = new Date();
  
  // Calculate event status based on current time
  const isCancelled = String(event.status || 'active').toLowerCase() === 'cancelled';
  let eventStatus = 'active'; // default: upcoming
  let statusLabel = 'Active';
  let statusClass = 'modal-status-active';
  
  if (isCancelled) {
    eventStatus = 'cancelled';
    statusLabel = 'Cancelled';
    statusClass = 'modal-status-cancelled';
  } else if (Number.isFinite(startAt.getTime()) && Number.isFinite(endAt.getTime())) {
    if (now >= endAt) {
      // Event has finished
      eventStatus = 'done';
      statusLabel = 'Done';
      statusClass = 'modal-status-done';
    } else if (now >= startAt && now < endAt) {
      // Event is currently happening
      eventStatus = 'ongoing';
      statusLabel = 'Ongoing';
      statusClass = 'modal-status-ongoing';
    } else {
      // Event is upcoming
      eventStatus = 'active';
      statusLabel = 'Active';
      statusClass = 'modal-status-active';
    }
  }
  
  const isDone = eventStatus === 'done';
  const canEdit = !(isRomo || isPo || isSmo || isCo || isIcto || isAs || isPlo || isPio || isQso || isFms || isClgeo || isEbeto) && (isAdmin || isCreator) && !isDone && !isCancelled;
  const canAdminCancel = isAdmin && !isCancelled;
  const requiredPostDocLabel = event.required_post_document || (event.type === 'event' ? 'After Activity Report (AAR)' : 'Minutes of the Meeting');
  const postDocs = Array.isArray(event.attachments) ? event.attachments.filter((a) => Boolean(a.is_post_document)) : [];
  const regularAttachments = Array.isArray(event.attachments) ? event.attachments.filter((a) => !a.is_post_document) : [];
  const postDocRequired = Boolean(event.post_document_required || isDone);
  const isHost = Number(event.created_by) === Number(user?.id);
  const needsPostDoc = !isCancelled && postDocRequired;
  const missingPostDoc = needsPostDoc && postDocs.length === 0;
  const myRsvp = event.rsvps?.find((r) => Number(r.office_user_id) === Number(user?.id)) || null;
  const rsvpLocked = Number.isFinite(startAt.getTime()) ? new Date() >= startAt : false;
  const prettyStatus = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
  const tentativeMeta = parseTentativeDescription(event.description || '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-event" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event.title}</h2>
          <div className="modal-header-actions">
            <button
              type="button"
              className="modal-open-tab"
              onClick={() => window.open(`/events/${eventId}/details`, '_blank', 'noopener,noreferrer')}
              title="Open full event details in new tab"
              aria-label="Open full event details in new tab"
            >
              ↗
            </button>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>
        <div className="modal-body">
          {event.description ? (
            <div className="modal-row modal-description">
              <span className="modal-label">Description</span>
              <p>{tentativeMeta.plainDescription || event.description}</p>
            </div>
          ) : null}
          <div className="modal-inline-grid">
            <div className="modal-row">
              <span className="modal-label">Date</span>
              <span>{formatDateRange(eventDate, eventEndDate)}</span>
            </div>
            <div className="modal-row">
              <span className="modal-label">Time</span>
              <span>{formatTime(event.start_time)} – {formatTime(event.end_time)}</span>
            </div>
          </div>
          <div className="modal-inline-grid modal-inline-grid-three">
            <div className="modal-row">
              <span className="modal-label">Host</span>
              <span>{event.creator_name || 'Unknown'}</span>
            </div>
            <div className="modal-row">
              <span className="modal-label">Status</span>
              <span className={`modal-status-pill ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
            <div className="modal-row">
              <span className="modal-label">Type</span>
              <span className="modal-type">{event.type}</span>
            </div>
          </div>
          {isCancelled && event.cancel_reason ? (
            <div className="modal-row">
              <span className="modal-label">Cancel Reason</span>
              <span>{event.cancel_reason}</span>
            </div>
          ) : null}
          {event.rescheduled_to_event ? (
            <div className="modal-row">
              <span className="modal-label">Rescheduled To</span>
              <span>
                {event.rescheduled_to_event.title} ({formatDateRange(event.rescheduled_to_event.date, event.rescheduled_to_event.end_date || event.rescheduled_to_event.date)})
              </span>
            </div>
          ) : null}
          {event.rescheduled_from_event ? (
            <div className="modal-row">
              <span className="modal-label">Rescheduled From</span>
              <span>
                {event.rescheduled_from_event.title} ({formatDateRange(event.rescheduled_from_event.date, event.rescheduled_from_event.end_date || event.rescheduled_from_event.date)})
              </span>
            </div>
          ) : null}
          {tentativeMeta.isTentative && (
            <div className="modal-row">
              <span className="modal-label">Schedule</span>
              <span>
                Tentative{tentativeMeta.note ? ` (${tentativeMeta.note})` : ''}
              </span>
            </div>
          )}
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

          {regularAttachments.length > 0 && (
            <div className="modal-row modal-attachments">
              <span className="modal-label">Attachment</span>
              <ul className="modal-attachments-list">
                {regularAttachments.map((a) => (
                  <li key={a.id} className="modal-attachment-item">
                    <a href={a.url} target="_blank" rel="noreferrer" className="modal-attachment-link">
                      {a.original_name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {needsPostDoc && (
            <div className="modal-row modal-attachments">
              <span className="modal-label">{requiredPostDocLabel}</span>
              {postDocs.length === 0 ? (
                <p className="modal-postdoc-empty">
                  {isHost
                    ? `Required after this ${event.type || 'event'} is done. Please upload ${requiredPostDocLabel}.`
                    : `Pending host submission: ${requiredPostDocLabel}.`}
                </p>
              ) : (
                <ul className="modal-attachments-list">
                  {postDocs.map((a) => (
                    <li key={a.id} className="modal-attachment-item">
                      <a href={a.url} target="_blank" rel="noreferrer" className="modal-attachment-link">
                        {a.original_name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {isHost && isDone && (
                <div className="modal-postdoc-upload">
                  <input
                    type="file"
                    onChange={(e) => setPostDocFile(e.target.files?.[0] || null)}
                    disabled={postDocUploading}
                  />
                  <button
                    type="button"
                    className="modal-btn modal-btn-edit"
                    onClick={handleUploadPostDocument}
                    disabled={postDocUploading || !postDocFile}
                    title={missingPostDoc ? 'Upload required post-event document.' : 'Upload another file/version.'}
                  >
                    {postDocUploading ? 'Uploading...' : `Upload ${requiredPostDocLabel}`}
                  </button>
                </div>
              )}
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
          {canAdminCancel && (
            <div className="modal-row modal-cancel-admin">
              <span className="modal-label">Admin Action</span>
              <div className="modal-cancel-body">
                <div className="modal-cancel-mode">
                  <label className="modal-cancel-option">
                    <input
                      type="radio"
                      name="cancelMode"
                      value="cancel"
                      checked={cancelMode === 'cancel'}
                      onChange={(e) => setCancelMode(e.target.value)}
                      disabled={cancelSubmitting}
                    />
                    Cancel only
                  </label>
                  <label className="modal-cancel-option">
                    <input
                      type="radio"
                      name="cancelMode"
                      value="reschedule"
                      checked={cancelMode === 'reschedule'}
                      onChange={(e) => setCancelMode(e.target.value)}
                      disabled={cancelSubmitting}
                    />
                    Cancel and reschedule
                  </label>
                </div>
                <label className="modal-cancel-field">
                  Reason (optional)
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="modal-textarea"
                    disabled={cancelSubmitting}
                    placeholder="Why this event is cancelled/rescheduled"
                  />
                </label>
                {cancelMode === 'reschedule' ? (
                  <div className="modal-cancel-date-grid">
                    <label className="modal-cancel-field">
                      New start date <span className="required">*</span>
                      <input
                        type="date"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="modal-input"
                        disabled={cancelSubmitting}
                      />
                    </label>
                    <label className="modal-cancel-field">
                      New end date (optional)
                      <input
                        type="date"
                        value={rescheduleEndDate}
                        min={rescheduleDate || undefined}
                        onChange={(e) => setRescheduleEndDate(e.target.value)}
                        className="modal-input"
                        disabled={cancelSubmitting}
                      />
                    </label>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="modal-btn modal-btn-delete"
                  onClick={handleCancelOrReschedule}
                  disabled={cancelSubmitting}
                >
                  {cancelSubmitting
                    ? 'Saving...'
                    : (cancelMode === 'reschedule' ? 'Cancel + Reschedule' : 'Cancel Event')}
                </button>
              </div>
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
