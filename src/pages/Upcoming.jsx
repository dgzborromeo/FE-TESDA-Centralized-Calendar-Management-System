import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { events as eventsApi, users as usersApi } from '../api';
import EventModal from '../components/EventModal';
import './Dashboard.css';
import './Calendar.css';

function toLocalYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(d) {
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

function clusterShortLabel(name) {
  const raw = String(name || '').trim();
  if (!raw) return 'CLUSTER';
  const paren = raw.match(/\(([^()]+)\)\s*$/);
  if (paren?.[1]) return String(paren[1]).trim().toUpperCase();
  const words = raw.split(/\s+/).filter(Boolean);
  return words.slice(0, 6).map((w) => w[0]?.toUpperCase() || '').join('') || raw.slice(0, 8).toUpperCase();
}

function extractCodesFromName(name) {
  const out = new Set();
  const n = String(name || '').trim();
  if (!n) return [];
  const parenMatches = n.matchAll(/\(([^()]+)\)/g);
  for (const m of parenMatches) {
    const inner = String(m[1] || '').trim();
    if (!inner) continue;
    for (const token of inner.split(/[\/,]/)) {
      const t = token.trim().toUpperCase();
      if (t && t.length <= 16) out.add(t);
    }
  }
  const allCaps = n.match(/\b[A-Z]{2,10}\b/g) || [];
  for (const c of allCaps) out.add(c.toUpperCase());
  return Array.from(out);
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

function stopEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}

export default function Upcoming() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [clusterLegend, setClusterLegend] = useState([]);
  const [hostFilterOpen, setHostFilterOpen] = useState(false);
  const [hostModalTarget, setHostModalTarget] = useState(null);
  const hostFilterRef = useRef(null);

  const refresh = () => {
    setLoading(true);
    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 7);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 60);
    eventsApi
      .list({ start: toLocalYMD(rangeStart), end: toLocalYMD(rangeEnd) })
      .then((rows) => setEvents(Array.isArray(rows) ? rows : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    usersApi.legendClusters().then((rows) => setClusterLegend(Array.isArray(rows) ? rows : [])).catch(() => setClusterLegend([]));
    usersApi.list().then((rows) => setUsers(Array.isArray(rows) ? rows : [])).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!hostFilterRef.current) return;
      if (!hostFilterRef.current.contains(e.target)) setHostFilterOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const hostOptions = useMemo(() => {
    const usersByEmailLocal = new Map();
    for (const u of users || []) {
      const email = String(u?.email || '').toLowerCase();
      const local = email.includes('@') ? email.split('@')[0] : '';
      if (local) usersByEmailLocal.set(local, u);
    }

    return (clusterLegend || [])
      .map((cluster) => {
        const items = [];
        const clusterAccountId = Number(cluster?.account?.id) || null;
        if (Number.isFinite(clusterAccountId) && clusterAccountId > 0) {
          items.push({
            key: `${cluster.id}-cluster`,
            label: cluster.name,
            short: clusterShortLabel(cluster.name),
            color: cluster.color || '#94a3b8',
            accountId: clusterAccountId,
          });
        }

        for (const office of cluster.offices || []) {
          const codes = extractCodesFromName(office.name);
          let matchedUser = null;
          for (const code of codes) {
            const u = usersByEmailLocal.get(String(code || '').toLowerCase());
            if (u && !String(u.email || '').toLowerCase().startsWith('cluster.')) {
              matchedUser = u;
              break;
            }
          }
          if (!matchedUser) continue;
          items.push({
            key: `${cluster.id}-${office.name}`,
            label: office.name,
            short: clusterShortLabel(office.name),
            color: office.color || cluster.color || '#94a3b8',
            accountId: Number(matchedUser.id),
          });
        }

        return {
          clusterId: cluster.id,
          clusterName: cluster.name,
          items: items.filter((x) => Number.isFinite(x.accountId) && x.accountId > 0),
        };
      })
      .filter((g) => g.items.length > 0);
  }, [clusterLegend, users]);

  const searchLower = searchQuery.trim().toLowerCase();
  const now = new Date();
  const today = toLocalYMD(now);
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const upcoming = events
    .filter((e) => e.date > today || (e.date === today && timeToMinutes(e.end_time) > nowMins))
    .filter((e) => !searchLower || [e.title, e.location, e.description].some((v) => v && String(v).toLowerCase().includes(searchLower)))
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));

  const hostModalEvents = useMemo(() => {
    if (!hostModalTarget?.accountId) return [];
    const targetId = Number(hostModalTarget.accountId);
    return events
      .filter((e) => e.date > today || (e.date === today && timeToMinutes(e.end_time) > nowMins))
      .filter((e) => Number(e.created_by) === targetId)
      .sort((a, b) => (String(a.date || '') + String(a.start_time || '')).localeCompare(String(b.date || '') + String(b.start_time || '')));
  }, [events, hostModalTarget, today, nowMins]);

  if (loading) return <div className="dashboard-loading">Loading upcoming events...</div>;

  return (
    <div className="dashboard dashboard-page">
      <div className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <h1 className="dashboard-title">Upcoming Events/Meetings</h1>
          <p className="dashboard-subtitle">All upcoming schedules (including today if not finished)</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/dashboard" className="dashboard-btn">Back to Dashboard</Link>
          <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
        </div>
      </div>

      <div className="dashboard-search">
        <input
          type="search"
          placeholder="Search upcoming..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dashboard-search-input"
        />
        <div className="calendar-legend-host-filter" ref={hostFilterRef}>
          <button
            type="button"
            className={`calendar-legend-host-btn ${hostFilterOpen ? 'is-open' : ''}`}
            onPointerDown={stopEvent}
            onMouseDown={stopEvent}
            onClick={(e) => {
              stopEvent(e);
              setHostFilterOpen((v) => !v);
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              stopEvent(e);
              setHostFilterOpen((v) => !v);
            }}
            aria-expanded={hostFilterOpen}
            aria-label="Host filter: view events by host account"
          >
            <span className="calendar-legend-host-btn-text">Host Events</span>
            <span className="calendar-legend-host-btn-caret">▾</span>
          </button>
          {hostFilterOpen && (
            <>
              <button
                type="button"
                aria-label="Close host menu"
                className="calendar-legend-host-backdrop"
                onPointerDown={stopEvent}
                onMouseDown={stopEvent}
                onClick={(e) => {
                  stopEvent(e);
                  setHostFilterOpen(false);
                }}
              />
              <div
                className="calendar-legend-host-menu"
                onPointerDownCapture={stopEvent}
                onPointerDown={stopEvent}
                onMouseDownCapture={stopEvent}
                onMouseDown={stopEvent}
                onClick={(e) => e.stopPropagation()}
              >
                {hostOptions.length === 0 ? (
                  <div className="calendar-legend-host-empty">No host options found.</div>
                ) : hostOptions.map((group) => (
                  <div key={group.clusterId} className="calendar-legend-host-group">
                    <div className="calendar-legend-host-group-title" title={group.clusterName}>
                      {clusterShortLabel(group.clusterName)}
                    </div>
                    {group.items.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        className="calendar-legend-host-item"
                        onPointerDown={stopEvent}
                        onMouseDown={stopEvent}
                        onClick={(e) => {
                          stopEvent(e);
                          setHostFilterOpen(false);
                          setHostModalTarget(opt);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter' && e.key !== ' ') return;
                          stopEvent(e);
                          setHostFilterOpen(false);
                          setHostModalTarget(opt);
                        }}
                      >
                        <span className="calendar-legend-swatch" style={{ backgroundColor: opt.color }} />
                        <span className="calendar-legend-host-short" title={opt.label}>{opt.short}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-section-head">
        <h2>Upcoming</h2>
        <span className={`dashboard-count-pill ${upcoming.length ? 'active' : ''}`}>{upcoming.length}</span>
      </div>

      {upcoming.length === 0 ? (
        <p className="dashboard-empty">No upcoming events.</p>
      ) : (
        <ul className="dashboard-event-list">
          {upcoming.map((e) => (
            <li key={e.id} className="dashboard-event-item">
              <button type="button" className="dashboard-event-row" onClick={() => setSelectedEvent(e.id)}>
                <span className="dashboard-event-date">{formatDate(e.date)}</span>
                <span className="dashboard-event-time">{formatTime(e.start_time)} – {formatTime(e.end_time)}</span>
                <span className="dashboard-event-title-wrap">
                  <span className="dashboard-event-title">{e.title}</span>
                  {e.location ? <span className="dashboard-event-location">• {e.location}</span> : null}
                </span>
                <span className="dashboard-upcoming-meta">
                  <span className="dashboard-upcoming-meta-item">Host: {e.creator_name || 'Unknown'}</span>
                  <span className="dashboard-upcoming-meta-item">Participants: {formatParticipantsAcronymList(e.participants_summary)}</span>
                  <span className="dashboard-upcoming-meta-item">Venue: {e.location || 'TBA'}</span>
                </span>
                {e.conflict_count > 0 && (
                  <span className="dashboard-event-conflict" title="Has conflict">⚠</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedEvent && (
        <EventModal
          eventId={selectedEvent}
          onClose={() => { setSelectedEvent(null); refresh(); }}
          onEdit={() => { setSelectedEvent(null); }}
          onDelete={refresh}
        />
      )}

      {hostModalTarget && (
        <div className="calendar-host-modal-overlay" onClick={() => setHostModalTarget(null)}>
          <div className="calendar-host-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-host-modal-head">
              <h3>{hostModalTarget.label}</h3>
              <button type="button" className="calendar-host-modal-close" onClick={() => setHostModalTarget(null)}>×</button>
            </div>
            <p className="calendar-host-modal-subtitle">Hosted upcoming events</p>
            {hostModalEvents.length === 0 ? (
              <p className="calendar-host-modal-empty">No upcoming events found for this host.</p>
            ) : (
              <ul className="calendar-host-modal-list">
                {hostModalEvents.map((e) => (
                  <li key={e.id} className="calendar-host-modal-item">
                    <button type="button" onClick={() => { setHostModalTarget(null); setSelectedEvent(e.id); }}>
                      <span className="calendar-host-modal-title">{e.title}</span>
                      <span className="calendar-host-modal-meta">
                        {formatDate(e.date)} {formatTime(e.start_time)}–{formatTime(e.end_time)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

