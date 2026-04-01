import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { events as eventsApi, users as usersApi } from '../api';
import { dayFlags as dayFlagsApi } from '../api';
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
  // 1. JSON array from SimpleEventForm — display the name values as-is
  if (e.participants && String(e.participants).trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(e.participants);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(p => String(p.name || p).trim()).filter(Boolean).join(', ') || 'TBA';
      }
    } catch (_) { /* fall through */ }
  }

  // 2. Plain text — stored as-is from resolveParticipantLabels (promoted from ListOfActivity)
  if (e.participants && String(e.participants).trim()) {
    return String(e.participants).trim();
  }

  // 3. Legacy label fields
  const rdNames = parseRegionalDirectorsLabel(e.regional_directors_label);
  const pdNames = parseRegionalDirectorsLabel(e.provincial_directors_label);
  const edNames = parseRegionalDirectorsLabel(e.executive_directors_label);
  const rdFallback = rdNames.length ? rdNames : (getRegionalDirectorsForEvent(e.id) || []);
  const allNames = [...rdFallback, ...pdNames, ...edNames];
  if (allNames.length) {
    const allLabels = [];
    if (rdFallback.some((n) => String(n).toLowerCase() === 'all rds')) allLabels.push('All RDs');
    else rdFallback.forEach((n) => allLabels.push(acronymFromParticipantName(n)));
    if (pdNames.some((n) => String(n).toLowerCase() === 'all pds')) allLabels.push('All PDs');
    else pdNames.forEach((n) => allLabels.push(acronymFromParticipantName(n)));
    if (edNames.some((n) => String(n).toLowerCase() === 'all eds')) allLabels.push('All EDs');
    else edNames.forEach((n) => allLabels.push(acronymFromParticipantName(n)));
    const filtered = allLabels.filter(Boolean);
    if (filtered.length) return Array.from(new Set(filtered)).join(', ');
  }

  // 4. participants_summary fallback
  const fromSummary = formatParticipantsAcronymList(e.participants_summary);
  if (fromSummary) return fromSummary;

  return 'TBA';
}

function stopEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}

function currentYear() {
  return new Date().getFullYear();
}

// ── QuarterView component ─────────────────────────────────────────────────────

const QUARTER_MONTHS = {
  Q1: [0, 1, 2],   // Jan Feb Mar
  Q2: [3, 4, 5],   // Apr May Jun
  Q3: [6, 7, 8],   // Jul Aug Sep
  Q4: [9, 10, 11], // Oct Nov Dec
};

const FLAG_META_QV = {
  suspended: { icon: '🚫', label: 'Suspended', cls: 'suspended' },
  wfh:       { icon: '🏠', label: 'Work From Home', cls: 'wfh' },
};

function QuarterView({ quarter, activeList, dayFlagsMap, onEventClick }) {
  const months = QUARTER_MONTHS[quarter] || [];

  // group events by YYYY-MM-DD
  const eventsByDay = useMemo(() => {
    const map = {};
    for (const e of activeList) {
      const ymd = String(e.date || '').slice(0, 10);
      if (!ymd) continue;
      if (!map[ymd]) map[ymd] = [];
      map[ymd].push(e);
    }
    return map;
  }, [activeList]);

  // derive year from the events (or current year)
  const year = useMemo(() => {
    const dates = activeList.map(e => String(e.date || '').slice(0, 4)).filter(Boolean);
    if (dates.length) return parseInt(dates[0], 10);
    return new Date().getFullYear();
  }, [activeList]);

  const quarterLabel = {
    Q1: 'Q1 — January to March',
    Q2: 'Q2 — April to June',
    Q3: 'Q3 — July to September',
    Q4: 'Q4 — October to December',
  }[quarter] || quarter;

  return (
    <div className="ev-quarter-view">
      <div className="ev-quarter-header">
        <span className="ev-quarter-title">{quarterLabel} · {year}</span>
        <span className="ev-quarter-count">{activeList.length} event{activeList.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="ev-quarter-grid">
        {months.map((monthIdx) => {
          const monthDate = new Date(year, monthIdx, 1);
          const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'long' });
          const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

          // collect all days in this month that have events or flags
          const rows = [];
          for (let d = 1; d <= daysInMonth; d++) {
            const ymd = `${year}-${String(monthIdx + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const dayEvents = eventsByDay[ymd] || [];
            const flag = dayFlagsMap[ymd];
            if (dayEvents.length > 0 || flag) {
              rows.push({ ymd, dayEvents, flag });
            }
          }

          return (
            <div key={monthIdx} className="ev-quarter-month">
              <div className="ev-quarter-month-header">
                <span className="ev-quarter-month-name">{monthLabel}</span>
                <span className="ev-quarter-month-count">{rows.reduce((s, r) => s + r.dayEvents.length, 0)}</span>
              </div>
              <div className="ev-quarter-month-body">
                {rows.length === 0 && (
                  <p className="ev-quarter-empty">No events</p>
                )}
                {rows.map(({ ymd, dayEvents, flag }) => {
                  const dayDate = new Date(ymd + 'T12:00:00');
                  const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
                  const flagMeta = flag ? (FLAG_META_QV[flag.type] || FLAG_META_QV.suspended) : null;
                  return (
                    <div key={ymd} className="ev-quarter-day">
                      <div className="ev-quarter-day-header">
                        <span className="ev-quarter-day-label">{dayLabel}</span>
                        {flagMeta && (
                          <span className={`ev-quarter-flag ev-quarter-flag--${flagMeta.cls}`}>
                            {flagMeta.icon} {flagMeta.label}
                          </span>
                        )}
                      </div>
                      {dayEvents.map((e) => {
                        const tentative = parseTentativeDescription(e.description || '');
                        return (
                          <button
                            key={e.id}
                            type="button"
                            className="ev-quarter-event"
                            onClick={() => onEventClick(e.id)}
                          >
                            <span className="ev-quarter-event-time">
                              {formatTime(e.start_time)}
                            </span>
                            <div className="ev-quarter-event-body">
                              <span className="ev-quarter-event-title">{e.title}</span>
                              <span className="ev-quarter-event-host">👤 {e.creator_name || 'Unknown'}</span>
                            </div>
                            {tentative.isTentative && (
                              <span className="ev-quarter-event-badge ev-quarter-event-badge--tentative">Tentative</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

const TABS = ['Recent', 'Upcoming', 'By Year'];

export default function EventsView() {
  const [activeTab, setActiveTab] = useState('Recent');

  // shared state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // filter states
  const [filterOffice, setFilterOffice] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterQuarter, setFilterQuarter] = useState('');

  // upcoming state
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingFetched, setUpcomingFetched] = useState(false);
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

  // day flags
  const [dayFlagsMap, setDayFlagsMap] = useState({}); // ymd → flag object

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
    const rangeEnd = new Date(now.getFullYear(), 11, 31); // Dec 31 of current year
    eventsApi
      .list({ start: toLocalYMD(rangeStart), end: toLocalYMD(rangeEnd) })
      .then((rows) => setUpcomingEvents(Array.isArray(rows) ? rows : []))
      .catch(() => setUpcomingEvents([]))
      .finally(() => { setUpcomingLoading(false); setUpcomingFetched(true); });
  };

  const refreshRecent = () => {
    setRecentLoading(true);
    const now = new Date();
    // Fetch from start of current year to cover all past events
    const rangeStart = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
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

  // load recent + shared data on mount (Recent is default tab)
  useEffect(() => {
    refreshRecent();
    usersApi.legendClusters().then((rows) => setClusterLegend(Array.isArray(rows) ? rows : [])).catch(() => setClusterLegend([]));
    usersApi.list().then((rows) => setUsers(Array.isArray(rows) ? rows : [])).catch(() => setUsers([]));
    // load day flags for current year and adjacent years
    const yr = currentYear();
    Promise.all([dayFlagsApi.list(yr - 1), dayFlagsApi.list(yr), dayFlagsApi.list(yr + 1)])
      .then((results) => {
        const map = {};
        for (const flag of results.flat()) {
          // Use only the YYYY-MM-DD part to avoid timezone shift
          const ymd = String(flag.date || '').slice(0, 10);
          if (ymd) map[ymd] = { ...flag, date: ymd };
        }
        setDayFlagsMap(map);
      })
      .catch(() => {});
  }, []);

  // lazy-load other tabs on first visit
  useEffect(() => {
    if (activeTab === 'Upcoming' && !upcomingFetched && !upcomingLoading) refreshUpcoming();
    if (activeTab === 'By Year') refreshYear(year);
    setSearchQuery('');
    setFilterOffice('');
    setFilterMonth('');
    setFilterQuarter('');
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'By Year') refreshYear(year);
    // reload flags for the selected year
    dayFlagsApi.list(year).then(data => {
      const map = {};
      for (const f of (Array.isArray(data) ? data : [])) {
        const ymd = String(f.date || '').slice(0, 10);
        if (ymd) map[ymd] = { ...f, date: ymd };
      }
      setDayFlagsMap(prev => ({ ...prev, ...map }));
    }).catch(() => {});
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

  // Shared extra filters
  const applyFilters = (e) => {
    if (filterOffice && String(e.creator_name || '').toLowerCase() !== filterOffice.toLowerCase()) return false;
    if (filterMonth) {
      const m = String(e.date || '').slice(5, 7);
      if (m !== filterMonth) return false;
    }
    if (filterQuarter) {
      const month = parseInt(String(e.date || '').slice(5, 7), 10);
      const q = filterQuarter === 'Q1' ? [1,2,3] : filterQuarter === 'Q2' ? [4,5,6] : filterQuarter === 'Q3' ? [7,8,9] : [10,11,12];
      if (!q.includes(month)) return false;
    }
    return true;
  };

  const upcoming = upcomingEvents
    .filter((e) => e.date > today || (e.date === today && timeToMinutes(e.end_time) > nowMins))
    .filter((e) => !searchLower || [e.title, e.location, e.description].some((v) => v && String(v).toLowerCase().includes(searchLower)))
    .filter(applyFilters)
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));

  const recent = recentEvents
    .filter((e) => e.date < today || (e.date === today && timeToMinutes(e.end_time) <= nowMins))
    .filter((e) => !searchLower || [e.title, e.location, e.description].some((v) => v && String(v).toLowerCase().includes(searchLower)))
    .filter(applyFilters)
    .sort((a, b) => (b.date + (b.start_time || '')).localeCompare(a.date + (a.start_time || '')));

  const byYear = yearEvents
    .filter((e) => {
      if (!searchLower) return true;
      return [e.title, e.location, e.description, e.creator_name, e.participants_summary, e.type]
        .filter(Boolean).join(' ').toLowerCase().includes(searchLower);
    })
    .filter(applyFilters)
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

  const activeList = activeTab === 'Upcoming' ? upcoming : activeTab === 'Recent' ? recent : byYear;

  // Build unique office list — exclude cluster accounts and admin/romo
  const officeOptions = useMemo(() => {
    const names = new Set(
      users
        .filter(u => {
          const email = String(u.email || '').toLowerCase();
          return !email.startsWith('cluster.') && u.role !== 'admin';
        })
        .map(u => u.name)
        .filter(Boolean)
    );
    return Array.from(names).sort();
  }, [users]);
  // ── group events by day, filling empty days in range ─────────────────────
  const groupedDays = useMemo(() => {
    if (activeList.length === 0) return [];

    const dates = activeList.map((e) => String(e.date || '').slice(0, 10)).filter(Boolean);
    const minDate = dates.reduce((a, b) => (a < b ? a : b));
    const maxDate = dates.reduce((a, b) => (a > b ? a : b));

    const map = new Map();
    const coveredDates = new Set();

    for (const e of activeList) {
      const start = String(e.date || '').slice(0, 10);
      const end = String(e.end_date || e.date || '').slice(0, 10);
      if (!start) continue;
      if (!map.has(start)) map.set(start, []);
      map.get(start).push(e);
      const cur = new Date(start + 'T12:00:00');
      const endD = new Date((end || start) + 'T12:00:00');
      while (cur <= endD) { coveredDates.add(toLocalYMD(cur)); cur.setDate(cur.getDate() + 1); }
    }

    const rows = [];
    const cur = new Date(minDate + 'T12:00:00');
    const end = new Date(maxDate + 'T12:00:00');
    let emptyStreak = [];

    const flushEmpty = () => {
      if (emptyStreak.length === 0) return;
      rows.push({ type: 'empty-gap', ymds: [...emptyStreak] });
      emptyStreak = [];
    };

    while (cur <= end) {
      const ymd = toLocalYMD(cur);
      const flag = dayFlagsMap[ymd];

      if (map.has(ymd)) {
        flushEmpty();
        if (flag) rows.push({ type: 'day-flag', ymd, flag });
        rows.push({ type: 'events', ymd, events: map.get(ymd) });
      } else if (coveredDates.has(ymd)) {
        flushEmpty();
        if (flag) rows.push({ type: 'day-flag', ymd, flag });
      } else if (flag) {
        flushEmpty();
        rows.push({ type: 'day-flag', ymd, flag });
      } else {
        emptyStreak.push(ymd);
      }
      cur.setDate(cur.getDate() + 1);
    }
    flushEmpty();
    return rows;
  }, [activeList, dayFlagsMap]);

  const activeCount = activeList.length;
  // (pagination removed — all days shown grouped)

  // ── month navigation ───────────────────────────────────────────────────────
  // Derive available months from the active list
  const availableMonths = useMemo(() => {
    const set = new Set();
    for (const e of activeList) {
      const ym = String(e.date || '').slice(0, 7);
      if (ym) set.add(ym);
    }
    // also include months that have day flags within the range
    for (const ymd of Object.keys(dayFlagsMap)) {
      const ym = ymd.slice(0, 7);
      if (ym) set.add(ym);
    }
    return Array.from(set).sort();
  }, [activeList, dayFlagsMap]);

  // Default to current month, or nearest available
  const defaultMonth = useMemo(() => {
    const now = toLocalYMD(new Date()).slice(0, 7);
    if (availableMonths.includes(now)) return now;
    // pick closest
    return availableMonths.find(m => m >= now) || availableMonths[availableMonths.length - 1] || now;
  }, [availableMonths]);

  const [visibleMonth, setVisibleMonth] = useState('');
  const effectiveMonth = visibleMonth || defaultMonth;

  // Reset visibleMonth when tab or year changes
  useEffect(() => { setVisibleMonth(''); }, [activeTab, year]);

  const visibleMonthIdx = availableMonths.indexOf(effectiveMonth);
  const hasPrev = visibleMonthIdx > 0;
  const hasNext = visibleMonthIdx < availableMonths.length - 1;

  // Filter groupedDays to only the visible month
  const visibleRows = useMemo(() => {
    return groupedDays.filter(row => {
      const ymd = row.type === 'empty-gap' ? row.ymds[0] : row.ymd;
      return String(ymd || '').slice(0, 7) === effectiveMonth;
    });
  }, [groupedDays, effectiveMonth]);

  const visibleMonthLabel = effectiveMonth
    ? new Date(effectiveMonth + '-01T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const tabLabel = activeTab === 'Upcoming' ? 'Upcoming Events/Meetings'
    : activeTab === 'Recent' ? 'Recent Events/Meetings'
    : `${year} Events/Meetings`;

  const tabSubtitle = activeTab === 'Upcoming' ? 'All upcoming schedules (including today if not finished)'
    : activeTab === 'Recent' ? 'Events that already ended'
    : 'All registered events for the selected year';

  return (
    <div className="dashboard dashboard-page events-view-page">
      {/* topbar — styled like dashboard-panel-overview */}
      <section className="dashboard-panel dashboard-panel-overview ev-hero-panel">
        <div className="dashboard-overview-top">
          <div className="dashboard-overview-titleblock">
            <h1 className="dashboard-title">{tabLabel}</h1>
            <p className="dashboard-subtitle">
              Overview of COROPOTI Programs, Activities and Plans for CY 2026
            </p>
          </div>
          <div className="dashboard-overview-side">
            <div className="dashboard-actions">
              <Link to="/dashboard" className="dashboard-btn">Back to Dashboard</Link>
              <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
            </div>
          </div>
        </div>
      </section>

      {/* tabs + search + filters — all in one row */}
      <div className="ev-search-tabs-row">
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

        <input
          type="search"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="dashboard-search-input ev-search-inline"
        />

        <div className="ev-toolbar-right">
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

          <select
            className="ev-filter-select"
            value={filterOffice}
            onChange={(e) => { setFilterOffice(e.target.value); setPage(1); }}
          >
            <option value="">All Offices</option>
            {officeOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select
            className="ev-filter-select"
            value={filterMonth}
            onChange={(e) => { setFilterMonth(e.target.value); setFilterQuarter(''); setPage(1); }}
          >
            <option value="">All Months</option>
            {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
              <option key={m} value={m}>
                {new Date(2000, i).toLocaleString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>

          <select
            className="ev-filter-select"
            value={filterQuarter}
            onChange={(e) => { setFilterQuarter(e.target.value); setFilterMonth(''); setPage(1); }}
          >
            <option value="">All Quarters</option>
            <option value="Q1">Q1 — Jan–Mar</option>
            <option value="Q2">Q2 — Apr–Jun</option>
            <option value="Q3">Q3 — Jul–Sep</option>
            <option value="Q4">Q4 — Oct–Dec</option>
          </select>

          {(filterOffice || filterMonth || filterQuarter) && (
            <button
              className="ev-filter-clear"
              onClick={() => { setFilterOffice(''); setFilterMonth(''); setFilterQuarter(''); setPage(1); }}
              title="Clear filters"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* section head — count pill only */}
      <div className="dashboard-section-head">
        <span className={`dashboard-count-pill ${activeCount ? 'active' : ''}`}>{activeCount} event{activeCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Quarter overview — shown when a quarter filter is active */}
      {filterQuarter && !isLoading && (
        <QuarterView
          quarter={filterQuarter}
          activeList={activeList}
          dayFlagsMap={dayFlagsMap}
          onEventClick={(id) => setSelectedEvent(id)}
        />
      )}

      {/* list — hidden when quarter view is active */}
      {!filterQuarter && (
      <>
      {isLoading ? (
        <div className="dashboard-loading">Loading...</div>
      ) : activeCount === 0 ? (
        <p className="dashboard-empty">No events found.</p>
      ) : (
        <>
          <ul className="ev-card-list">
            {groupedDays.map((row) => {
              if (row.type === 'empty-gap') {
                const { ymds } = row;
                const first = new Date(ymds[0] + 'T12:00:00');
                const last = new Date(ymds[ymds.length - 1] + 'T12:00:00');
                const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const label = ymds.length === 1
                  ? fmt(first)
                  : `${fmt(first)} – ${fmt(last)}`;
                const count = ymds.length;
                return (
                  <li key={ymds[0]} className="ev-empty-gap">
                    <span className="ev-empty-gap__line" />
                    <span className="ev-empty-gap__label">{label}</span>
                    <span className="ev-empty-gap__count">{count} day{count !== 1 ? 's' : ''} · no scheduled activity</span>
                    <span className="ev-empty-gap__line" />
                  </li>
                );
              }

              if (row.type === 'day-flag') {
                const { ymd, flag } = row;
                const FLAG_META = {
                  suspended: { icon: '🚫', label: 'Suspended', cls: 'suspended' },
                  wfh:       { icon: '🏠', label: 'Work From Home', cls: 'wfh' },
                };
                const meta = FLAG_META[flag.type] || FLAG_META.suspended;
                const dateLabel = new Date(ymd + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <li key={`flag-${ymd}`} className={`ev-day-flag ev-day-flag--${meta.cls}`}>
                    <span className="ev-day-flag__icon">{meta.icon}</span>
                    <span className="ev-day-flag__date">{dateLabel}</span>
                    {flag.time && (
                      <span className="ev-day-flag__time">
                        {flag.time.slice(0,5)}{flag.time_end ? ` – ${flag.time_end.slice(0,5)}` : ''}
                      </span>
                    )}
                    <span className="ev-day-flag__badge">{meta.label}</span>
                    {flag.memo_subject && <span className="ev-day-flag__note">{flag.memo_subject}</span>}
                    {flag.memo_number && <span className="ev-day-flag__note">{flag.memo_number}</span>}
                  </li>
                );
              }

              // row.type === 'events'
              return row.events.map((e) => {
                const tentative = parseTentativeDescription(e.description || '');
                const isPast = activeTab === 'Recent';
                return (
                  <li key={e.id}>
                    <button type="button" className={`ev-card ${isPast ? 'ev-card--past' : 'ev-card--upcoming'}`} onClick={() => setSelectedEvent(e.id)}>
                      <div className="ev-card__date">
                        <span className="ev-card__month">
                          {new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="ev-card__day">
                          {new Date(e.date + 'T12:00:00').getDate()}
                        </span>
                        <span className="ev-card__dow">
                          {new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>

                      <div className="ev-card__body">
                        <div className="ev-card__top">
                          <span className="ev-card__title">{e.title}</span>
                          {e.conflict_count > 0 && <span className="ev-card__conflict" title="Has conflict">⚠</span>}
                          {tentative.isTentative && <span className="ev-card__badge ev-card__badge--tentative">Tentative</span>}
                        </div>

                        <div className="ev-card__meta-row">
                          <span className="ev-card__time">
                            🕐 {formatTime(e.start_time)}{e.end_time ? ` – ${formatTime(e.end_time)}` : ''}
                          </span>
                          {e.location && <span className="ev-card__loc">📍 {e.location}</span>}
                        </div>

                        <div className="ev-card__meta-row">
                          <span className="ev-card__info">👤 {e.creator_name || 'Unknown'}</span>
                          <span className="ev-card__info">👥 {getParticipantsLabel(e)}</span>
                        </div>

                        {activeTab === 'By Year' && e.end_date && e.end_date !== e.date && (
                          <div className="ev-card__meta-row">
                            <span className="ev-card__info">📅 Until {formatDateFull(e.end_date)}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              });
            })}
          </ul>

          {/* pagination removed — all days shown in grouped view */}
        </>
      )}
      </>
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
