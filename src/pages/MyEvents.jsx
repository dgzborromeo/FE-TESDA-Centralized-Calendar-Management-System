import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { events as eventsApi } from '../api';
import { parseTentativeDescription } from '../utils/tentativeSchedule';
import EventModal from '../components/EventModal';
import { SkeletonEventList } from '../components/SkeletonLoader';
import './MyEvents.css';

function toLocalYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(ymd) {
  if (!ymd) return '';
  return new Date(`${String(ymd).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatDateRange(startDate, endDate) {
  const start = String(startDate || '').slice(0, 10);
  const end = String(endDate || '').slice(0, 10);
  if (!start) return '';
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatTime(t) {
  if (!t) return '';
  const parts = String(t).split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parts[1] || '00';
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

function timeToMinutes(t) {
  if (!t) return 0;
  const parts = String(t).split(':');
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
}

function classifyEvent(e) {
  const todayYmd = toLocalYMD(new Date());
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const endDate = String(e.end_date || e.date || '').slice(0, 10);

  if (String(e.status || '').toLowerCase() === 'cancelled') return 'cancelled';

  const { isTentative } = parseTentativeDescription(e.description);
  if (isTentative) return 'tentative';

  const isDone =
    endDate < todayYmd ||
    (endDate === todayYmd && timeToMinutes(e.end_time) <= nowMins);

  if (isDone) {
    const allDocsSubmitted =
      Number(e.post_document_count || 0) > 0 &&
      Number(e.attendance_count || 0) > 0 &&
      Number(e.photo_count || 0) > 0;
    return allDocsSubmitted ? 'completed' : 'pending_docs';
  }

  return 'final';
}

function getMissingReqs(e) {
  if (e._status !== 'pending_docs') return [];
  const missing = [];
  if (Number(e.post_document_count || 0) === 0) missing.push('AAR / Minutes');
  if (Number(e.attendance_count || 0) === 0) missing.push('Attendance Sheet');
  if (Number(e.photo_count || 0) === 0) missing.push('Event Photos');
  return missing;
}

function hasMissingReq(e) {
  return e._status === 'pending_docs';
}

const STATUS_TABS = ['All', 'Tentative', 'Final', 'Pending Docs', 'Completed', 'Cancelled'];

const STATUS_LABELS = {
  tentative: 'Tentative',
  final: 'Final',
  pending_docs: 'Pending Docs',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function MyEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    eventsApi.my()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Failed to load events.'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const classified = useMemo(() =>
    events.map((e) => ({ ...e, _status: classifyEvent(e) })),
    [events]
  );

  const filtered = useMemo(() => {
    let list = classified;
    if (activeTab !== 'All') {
      const key = activeTab === 'Pending Docs' ? 'pending_docs' : activeTab.toLowerCase();
      list = list.filter((e) => e._status === key);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) =>
        String(e.title || '').toLowerCase().includes(q) ||
        String(e.location || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [classified, activeTab, search]);

  const counts = useMemo(() => {
    const c = { All: classified.length, Tentative: 0, Final: 0, 'Pending Docs': 0, Completed: 0, Cancelled: 0 };
    for (const e of classified) {
      if (e._status === 'tentative') c.Tentative++;
      else if (e._status === 'final') c.Final++;
      else if (e._status === 'pending_docs') c['Pending Docs']++;
      else if (e._status === 'completed') c.Completed++;
      else if (e._status === 'cancelled') c.Cancelled++;
    }
    return c;
  }, [classified]);

  const missingReqCount = useMemo(() =>
    classified.filter((e) => e._status === 'pending_docs').length,
    [classified]
  );

  return (
    <>
      <div className="my-events-page">
      {/* Hero */}
      <div className="my-events-hero">
        <div className="my-events-hero-inner">
          <div className="my-events-hero-left">
            <h1 className="my-events-title">My Schedules</h1>
            <span className="my-events-subtitle">All schedules you created - track their status here</span>
          </div>
          <div className="my-events-hero-right">
            <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
            <Link to="/simple-event-form" state={{ backTo: '/my-events' }} className="dashboard-btn dashboard-btn-primary">+ Add Schedule</Link>            <div className="my-events-search-wrap">
              <svg className="my-events-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="search"
                className="my-events-search"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="my-events-summary">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`my-events-summary-chip chip-${tab === 'Pending Docs' ? 'pending_docs' : tab.toLowerCase()}${activeTab === tab ? ' chip-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <span className="my-events-chip-dot" />
            {tab}
            <span style={{ fontWeight: 600, opacity: 0.75 }}>{counts[tab] ?? 0}</span>
            {tab === 'Pending Docs' && missingReqCount > 0 && (
              <span className="my-events-chip-warn" title={`${missingReqCount} event(s) with pending submissions`}>!</span>
            )}
          </button>
        ))}
      </div>

      <div className="my-events-body">
        {loading && (
          <SkeletonEventList rows={5} />
        )}
        {error && <div className="my-events-error">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="my-events-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>{activeTab === 'All' ? 'No events found.' : `No ${activeTab.toLowerCase()} events found.`}</p>          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="my-events-list">
            {filtered.map((e) => (
              <div
                key={e.id}
                className={`my-events-card status-${e._status}${hasMissingReq(e) ? ' has-missing-req' : ''}`}
                style={{ borderLeftColor: e.color || '#3b82f6' }}
                onClick={() => setSelectedEvent(e.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(ev) => ev.key === 'Enter' && setSelectedEvent(e.id)}
              >
                <div className="my-events-card-top">
                  <span className={`my-events-status-badge badge-${e._status}`}>
                    {STATUS_LABELS[e._status] || e._status}
                  </span>
                  {e.is_posted ? (
                    <span className="my-events-posted-badge">Posted</span>
                  ) : (
                    <span className="my-events-draft-badge">Draft</span>
                  )}
                  <span className="my-events-type-badge">{e.type || 'event'}</span>
                  {hasMissingReq(e) && (
                    <span className="my-events-missing-req-badge">
                      &#9888; {getMissingReqs(e).length} pending submission(s)
                    </span>
                  )}
                </div>
                <div className="my-events-card-title">{e.title}</div>
                <div className="my-events-card-meta">
                  <span className="my-events-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {formatDateRange(e.date, e.end_date)}
                  </span>
                  <span className="my-events-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {formatTime(e.start_time)} - {formatTime(e.end_time)}
                  </span>
                  {e.location && (
                    <span className="my-events-meta-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {e.location}
                    </span>
                  )}
                </div>
                {e._status === 'tentative' && parseTentativeDescription(e.description).note && (
                  <div className="my-events-tentative-note">
                    Note: {parseTentativeDescription(e.description).note}
                  </div>
                )}
                {hasMissingReq(e) && (
                  <div className="my-events-missing-list">
                    <span className="my-events-missing-label">Pending submissions:</span>
                    {getMissingReqs(e).map((req) => (
                      <span key={req} className="my-events-missing-item">{req}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {selectedEvent && (
      <EventModal
        eventId={selectedEvent}
        onClose={() => { setSelectedEvent(null); eventsApi.my().then((data) => setEvents(Array.isArray(data) ? data : [])); }}
        onDelete={() => {
          setSelectedEvent(null);
          eventsApi.my().then((data) => setEvents(Array.isArray(data) ? data : []));
        }}
      />
    )}
    </>
  );
}
