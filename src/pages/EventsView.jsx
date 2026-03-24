import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { events as eventsApi, users as usersApi } from '../api';
import { getRegionalDirectorsForEvent } from '../utils/regionalDirectorsParticipants';
import { parseRegionalDirectorsLabel } from '../utils/regionalDirectorsLabel';
import EventModal from '../components/EventModal';
import { parseTentativeDescription } from '../utils/tentativeSchedule';
import './Dashboard.css';
import './Calendar.css';

// ── helpers ──────────────────────────────────────────────────────────────────

function toLocalYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTime(t) {
  if (!t) return '';
  const parts = String(t).split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parts[1] || '00';
  const am = h < 12;
  return `${h % 12 || 12}:${m} ${am ? 'AM' : 'PM'}`;
}

function formatDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateFull(d) {
  const ymd = String(d || '').slice(0, 10);
  if (!ymd) return '';
  return new Date(`${ymd}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatDateRange(startDate, endDate) {
  const start = String(startDate || '').slice(0, 10);
  const end = String(endDate || '').slice(0, 10);
  if (!start) return '';
  if (!end || end === start) return formatDateFull(start);
  return `${formatDateFull(start)} - ${formatDateFull(end)}`;
}

function timeToMinutes(t) {
  if (!t) return 0;
  const parts = String(t).split(':');
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
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
  if (!summaryStr || String(summaryStr).trim() === '') return '';
  const names = String(summaryStr).split(',').map((n) => n.trim()).filter(Boolean);
  return names.map(acronymFromParticipantName).join(', ');
}

function getParticipantsLabel(e) {
  const fromSummary = formatParticipantsAcronymList(e.participants_summary);
  if (fromSummary) return fromSummary;
  const rdNames = parseRegionalDirectorsLabel(e.regional_directors_label);
  const pdNames = parseRegionalDirectorsLabel(e.provincial_directors_label);
  const edNames = parseRegionalDirectorsLabel(e.executive_directors_label);
  const rdFallback = rdNames.length ? rdNames : (getRegionalDirectorsForEvent(e.id) || []);
  const allNames = [...rdFallback, ...pdNames, ...edNames];
  if (!allNames.length) return 'TBA';
  const allLabels = [];
  if (rdFallback.some((n) => String(n).toLowerCase() === 'all rds')) allLabels.push('All RDs');
  else rdFallback.forEach((n) => allLabels.push(acronymFromParticipantName(n)));
  if (pdNames.some((n) => String(n).toLowerCase() === 'all pds')) allLabels.push('All PDs');
  else pdNames.forEach((n) => allLabels.push(acronymFromParticipantName(n)));
  if (edNames.some((n) => String(n).toLowerCase() === 'all eds')) allLabels.push('All EDs');
  else edNames.forEach((n) => allLabels.push(acronymFromParticipantName(n)));
  const filtered = allLabels.filter(Boolean);
  return filtered.length ? Array.from(new Set(filtered)).join(', ') : 'TBA';
}

function stopEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}

function currentYear() {
  return new Date().getFullYear();
}

// ── main component ────────────────────────────────────────────────────────────

const TABS = ['Upcoming', 'Recent', 'By Year'];

export default function EventsView() {
  const [activeTab, setActiveTab] = useState('Upcoming');

  // shared state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // upcoming state
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [clusterLegend, setClusterLegend] = useState([]);
  const [hostFilterOpen, setHostFilterOpen] = useState(false);
  const [hostModalTarget, setHostModalTarget] = useState(null);
  const hostFilterRef = useRef(null);

  // recent state
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  // by-year state
  const [year, setYear] = useState(currentYear());
  const [yearEvents, setYearEvents] = useState([]);
  const [yearLoading, setYearLoading] = useState(false);

  const yearOptions = useMemo(() => {
    const now = currentYear();
    const out = [];
    for (let y = now + 1; y >= now - 7; y -= 1) out.push(y);
    return out;
  }, []);

  // ── data fetching ──────────────────────────────────────────────────────────

  const refreshUpcoming = () => {
    setUpcomingLoading(true);
    const now = new Date();
    const rangeStart = new Date(now); rangeStart.setDate(rangeStart.getDate() - 7);
    const rangeEnd = new Date(now); rangeEnd.setDate(rangeEnd.getDate() + 60);
    eventsApi
      .list({ start: toLocalYMD(rangeStart), end: toLocalYMD(rangeEnd) })
      .then((rows) => setUpcomingEvents(Array.isArray(rows) ? rows : []))
      .catch(() => setUpcomingEvents([]))
      .finally(() => setUpcomingLoading(false));
  };

  const refreshRecent = () => {
    setRecentLoading(true);
    const now = new Date();
    const rangeStart = new Date(now); rangeStart.setDate(rangeStart.getDate() - 60);
    const rangeEnd = new Date(now); rangeEnd.setDate(rangeEnd.getDate() + 7);
    eventsApi
      .list({ start: toLocalYMD(rangeStart), end: toLocalYMD(rangeEnd) })
      .then((rows) => setRecentEvents(Array.isArray(rows) ? rows : []))
      .catch(() => setRecentEvents([]))
      .finally(() => setRecentLoading(false));
  };

  const refreshYear = (targetYear) => {
    setYearLoading(true);
    eventsApi
      .list({ start: `${targetYear}-01-01`, end: `${targetYear}-12-31` })
      .then((rows) => setYearEvents(Array.isArray(rows) ? rows : []))
      .catch(() => setYearEvents([]))
      .finally(() => setYearLoading(false));
  };

  // load upcoming + shared data on mount
  useEffect(() => {
    refreshUpcoming();
    usersApi.legendClusters().then((rows) => setClusterLegend(Array.isArray(rows) ? rows : [])).catch(() => setClusterLegend([]));
    usersApi.list().then((rows) => setUsers(Array.isArray(rows) ? rows : [])).catch(() => setUsers([]));
  }, []);

  // lazy-load other tabs on first visit
  useEffect(() => {
    if (activeTab === 'Recent' && recentEvents.length === 0 && !recentLoading) refreshRecent();
    if (activeTab === 'By Year' && yearEvents.length === 0 && !yearLoading) refreshYear(year);
    setSearchQuery('');
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'By Year') refreshYear(year);
  }, [year]);

  // close host filter on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!hostFilterRef.current) return;
      if (!hostFilterRef.current.contains(e.target)) setHostFilterOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // ── derived data ───────────────────────────────────────────────────────────

  const now = new Date();
  const today = toLocalYMD(now);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const searchLower = searchQuery.trim().toLowerCase();

  const upcoming = upcomingEvents
    .filter((e) => e.date > today || (e.date === today && timeToMinutes(e.end_time) > nowMins))
    .filter((e) => !searchLower || [e.title, e.location, e.description].some((v) => v && String(v).toLowerCase().includes(searchLower)))
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));

  const recent = recentEvents
    .filter((e) => e.date < today || (e.date === today && timeToMinutes(e.end_time) <= nowMins))
    .filter((e) => !searchLower || [e.title, e.location, e.description].some((v) => v && String(v).toLowerCase().includes(searchLower)))
    .sort((a, b) => (b.date + (b.start_time || '')).localeCompare(a.date + (a.start_time || '')));

  const byYear = yearEvents
    .filter((e) => {
      if (!searchLower) return true;
      return [e.title, e.location, e.description, e.creator_name, e.participants_summary, e.type]
        .filter(Boolean).join(' ').toLowerCase().includes(searchLower);
    })
    .sort((a, b) => (String(a.date || '') + String(a.start_time || '')).localeCompare(String(b.date || '') + String(b.start_time || '')));

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
          items.push({ key: `${cluster.id}-cluster`, label: cluster.name, short: clusterShortLabel(cluster.name), color: cluster.color || '#94a3b8', accountId: clusterAccountId });
        }
        for (const office of cluster.offices || []) {
          const codes = extractCodesFromName(office.name);
          let matchedUser = null;
          for (const code of codes) {
            const u = usersByEmailLocal.get(String(code || '').toLowerCase());
            if (u && !String(u.email || '').toLowerCase().startsWith('cluster.')) { matchedUser = u; break; }
          }
          if (!matchedUser) continue;
          items.push({ key: `${cluster.id}-${office.name}`, label: office.name, short: clusterShortLabel(office.name), color: office.color || cluster.color || '#94a3b8', accountId: Number(matchedUser.id) });
        }
        return { clusterId: cluster.id, clusterName: cluster.name, items: items.filter((x) => Number.isFinite(x.accountId) && x.accountId > 0) };
      })
      .filter((g) => g.items.length > 0);
  }, [clusterLegend, users]);

  const hostModalEvents = useMemo(() => {
    if (!hostModalTarget?.accountId) return [];
    const targetId = Number(hostModalTarget.accountId);
    return upcomingEvents
      .filter((e) => e.date > today || (e.date === today && timeToMinutes(e.end_time) > nowMins))
      .filter((e) => Number(e.created_by) === targetId)
      .sort((a, b) => (String(a.date || '') + String(a.start_time || '')).localeCompare(String(b.date || '') + String(b.start_time || '')));
  }, [upcomingEvents, hostModalTarget, today, nowMins]);

  // ── render helpers ─────────────────────────────────────────────────────────

  const isLoading = (activeTab === 'Upcoming' && upcomingLoading)
    || (activeTab === 'Recent' && recentLoading)
    || (activeTab === 'By Year' && yearLoading);

  const activeCount = activeTab === 'Upcoming' ? upcoming.length : activeTab === 'Recent' ? recent.length : byYear.length;

  const tabLabel = activeTab === 'Upcoming' ? 'Upcoming Events/Meetings'
    : activeTab === 'Recent' ? 'Recent Events/Meetings'
    : `${year} Events/Meetings`;

  const tabSubtitle = activeTab === 'Upcoming' ? 'All upcoming schedules (including today if not finished)'
    : activeTab === 'Recent' ? 'Events that already ended'
    : 'All registered events for the selected year';

  return (
    <div className="dashboard dashboard-page">
      {/* topbar */}
      <div className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <h1 className="dashboard-title">{tabLabel}</h1>
          <p className="dashboard-subtitle">{tabSubtitle}</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/dashboard" className="dashboard-btn">Back to Dashboard</Link>
          <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
        </div>
      </div>

      {/* tab bar */}
      <div className="events-view-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`events-view-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* search row */}
      <div className="dashboard-search">
        {activeTab === 'By Year' && (
          <div className="dashboard-year-control">
            <label htmlFor="year-events-select">Year:</label>
            <select
              id="year-events-select"
              className="dashboard-year-select"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
        <input
          type="search"
          placeholder={`Search ${activeTab.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dashboard-search-input"
        />
        {activeTab === 'Upcoming' && (
          <div className="calendar-legend-host-filter" ref={hostFilterRef}>
            <button
              type="button"
              className={`calendar-legend-host-btn ${hostFilterOpen ? 'is-open' : ''}`}
              onPointerDown={stopEvent}
              onMouseDown={stopEvent}
              onClick={(e) => { stopEvent(e); setHostFilterOpen((v) => !v); }}
              onKeyDown={(e) => { if (e.key !== 'Enter' && e.key !== ' ') return; stopEvent(e); setHostFilterOpen((v) => !v); }}
              aria-expanded={hostFilterOpen}
              aria-label="Host filter: view events by host account"
            >
              <span className="calendar-legend-host-btn-text">Host Events</span>
              <span className="calendar-legend-host-btn-caret">▾</span>
            </button>
            {hostFilterOpen && (
              <>
                <button type="button" aria-label="Close host menu" className="calendar-legend-host-backdrop"
                  onPointerDown={stopEvent} onMouseDown={stopEvent}
                  onClick={(e) => { stopEvent(e); setHostFilterOpen(false); }}
                />
                <div className="calendar-legend-host-menu"
                  onPointerDownCapture={stopEvent} onPointerDown={stopEvent}
                  onMouseDownCapture={stopEvent} onMouseDown={stopEvent}
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
                        <button key={opt.key} type="button" className="calendar-legend-host-item"
                          onPointerDown={stopEvent} onMouseDown={stopEvent}
                          onClick={(e) => { stopEvent(e); setHostFilterOpen(false); setHostModalTarget(opt); }}
                          onKeyDown={(e) => { if (e.key !== 'Enter' && e.key !== ' ') return; stopEvent(e); setHostFilterOpen(false); setHostModalTarget(opt); }}
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
        )}
      </div>

      {/* section head */}
      <div className="dashboard-section-head">
        <h2>{activeTab === 'By Year' ? `${year} Events` : activeTab}</h2>
        <span className={`dashboard-count-pill ${activeCount ? 'active' : ''}`}>{activeCount}</span>
      </div>

      {/* list */}
      {isLoading ? (
        <div className="dashboard-loading">Loading...</div>
      ) : activeCount === 0 ? (
        <p className="dashboard-empty">No events found.</p>
      ) : (
        <ul className="dashboard-event-list">
          {(activeTab === 'Upcoming' ? upcoming : activeTab === 'Recent' ? recent : byYear).map((e) => {
            const tentative = parseTentativeDescription(e.description || '');
            return (
              <li key={e.id} className="dashboard-event-item">
                <button type="button" className="dashboard-event-row" onClick={() => setSelectedEvent(e.id)}>
                  <span className="dashboard-event-date">
                    {activeTab === 'By Year' ? formatDateRange(e.date, e.end_date) : formatDate(e.date)}
                  </span>
                  <span className="dashboard-event-time">{formatTime(e.start_time)} – {formatTime(e.end_time)}</span>
                  <span className="dashboard-event-title-wrap">
                    <span className="dashboard-event-title">{e.title}</span>
                    {activeTab === 'Recent' && e.location ? <span className="dashboard-event-location">• {e.location}</span> : null}
                  </span>
                  {activeTab !== 'Recent' && (
                    <>
                      <span className="dashboard-upcoming-meta">Host: {e.creator_name || 'Unknown'}</span>
                      <span className="dashboard-upcoming-meta">Participants: {getParticipantsLabel(e)}</span>
                      <span className="dashboard-upcoming-meta">Venue: {e.location || 'TBA'}</span>
                      {tentative.isTentative && (
                        <span className="dashboard-upcoming-meta">
                          Schedule: Tentative{tentative.note ? ` (${tentative.note})` : ''}
                        </span>
                      )}
                    </>
                  )}
                  {e.conflict_count > 0 && <span className="dashboard-event-conflict" title="Has conflict">⚠</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* event modal */}
      {selectedEvent && (
        <EventModal
          eventId={selectedEvent}
          onClose={() => {
            setSelectedEvent(null);
            if (activeTab === 'Upcoming') refreshUpcoming();
            else if (activeTab === 'Recent') refreshRecent();
            else refreshYear(year);
          }}
          onEdit={() => setSelectedEvent(null)}
          onDelete={() => {
            if (activeTab === 'Upcoming') refreshUpcoming();
            else if (activeTab === 'Recent') refreshRecent();
            else refreshYear(year);
          }}
        />
      )}

      {/* host modal (upcoming only) */}
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
