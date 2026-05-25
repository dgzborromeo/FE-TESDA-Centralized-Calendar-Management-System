import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { events as eventsApi } from '../api';
import { getRegionalDirectorsForEvent } from '../utils/regionalDirectorsParticipants';
import { parseRegionalDirectorsLabel } from '../utils/regionalDirectorsLabel';
import EventModal from '../components/EventModal';
import { parseTentativeDescription } from '../utils/tentativeSchedule';
import LoginRequiredModal from '../components/LoginRequiredModal';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import './Dashboard.css';

function toLocalYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(d) {
  // Expecting YYYY-MM-DD from API
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

function isWithinRange(targetYmd, startYmd, endYmd) {
  if (!targetYmd || !startYmd) return false;
  const end = endYmd || startYmd;
  return targetYmd >= startYmd && targetYmd <= end;
}

/** Monday (weekday) of the week containing d, YMD. */
function getWeekMondayYMD(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  const daysFromMonday = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - daysFromMonday);
  return toLocalYMD(x);
}

/** Friday (weekday) of the week containing d, YMD. */
function getWeekFridayYMD(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  const daysFromMonday = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - daysFromMonday + 4);
  return toLocalYMD(x);
}

/** First day of month of d, YMD. */
function getMonthStartYMD(d) {
  return toLocalYMD(new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0));
}

/** Last day of month of d, YMD. */
function getMonthEndYMD(d) {
  return toLocalYMD(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12, 0, 0));
}

/** True if event has already ended (by date and time). */
function isEventDone(e, todayYmd, nowMins) {
  const endDate = e.end_date || e.date;
  if (endDate < todayYmd) return true;
  if (endDate > todayYmd) return false;
  return timeToMinutes(e.end_time) <= nowMins;
}

function getDayColors(events, ymd) {
  const set = new Set();
  for (const e of events) {
    if (!isWithinRange(ymd, e.date, e.end_date || e.date)) continue;
    set.add(e.color || '#3b82f6');
  }
  return Array.from(set).slice(0, 3);
}

function isWeekendYMD(ymd) {
  if (!ymd || String(ymd).length < 10) return false;
  const d = new Date(`${String(ymd).slice(0, 10)}T12:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function formatDateRange(e) {
  const endDate = e.end_date || e.date;
  if (!endDate || endDate === e.date) return formatDate(e.date);
  return `${formatDate(e.date)} - ${formatDate(endDate)}`;
}

function formatRescheduledDateRange(e) {
  const start = e.rescheduled_to_date || '';
  const end = e.rescheduled_to_end_date || start;
  if (!start) return '';
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function acronymFromParticipantName(rawName) {
  const name = String(rawName || '').trim();
  if (!name) return '';
  const paren = name.match(/\(([^()]+)\)\s*$/);
  if (paren?.[1]) return String(paren[1]).trim().toUpperCase();

  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return '';
  if (words.length === 1 && words[0].length <= 10) return words[0].toUpperCase();
  return words
    .slice(0, 8)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function formatParticipantsAcronymList(summary) {
  if (!summary || !String(summary).trim()) return '';
  const acronyms = String(summary)
    .split(',')
    .map((s) => acronymFromParticipantName(s))
    .filter(Boolean);
  if (!acronyms.length) return '';
  return Array.from(new Set(acronyms)).join(', ');
}

function getDashboardParticipantsLabel(e) {
  const fromSummary = formatParticipantsAcronymList(e.participants_summary);
  if (fromSummary) return fromSummary;
  const rdNames = parseRegionalDirectorsLabel(e.regional_directors_label);
  const pdNames = parseRegionalDirectorsLabel(e.provincial_directors_label);
  const edNames = parseRegionalDirectorsLabel(e.executive_directors_label);
  const rdFallback = rdNames.length ? rdNames : (getRegionalDirectorsForEvent(e.id) || []);
  const allNames = [...rdFallback, ...pdNames, ...edNames];
  if (!allNames.length) return 'None';
  const allLabels = [];
  if (rdFallback.some((n) => String(n).toLowerCase() === 'all rds')) allLabels.push('All RDs');
  else rdFallback.forEach((n) => allLabels.push(acronymFromParticipantName(n)));
  if (pdNames.some((n) => String(n).toLowerCase() === 'all pds')) allLabels.push('All PDs');
  else pdNames.forEach((n) => allLabels.push(acronymFromParticipantName(n)));
  if (edNames.some((n) => String(n).toLowerCase() === 'all eds')) allLabels.push('All EDs');
  else edNames.forEach((n) => allLabels.push(acronymFromParticipantName(n)));
  const filtered = allLabels.filter(Boolean);
  return filtered.length ? Array.from(new Set(filtered)).join(', ') : 'None';
}

/** True if event is today and current time is between start_time and end_time (not yet finished). */
function isEventOngoing(e, todayYmd, nowMins) {
  if (!e?.date) return false;

  const start = e.date;
  const end = e.end_date || e.date;

  // If today is within the event date range
  const withinDateRange = todayYmd >= start && todayYmd <= end;

  if (!withinDateRange) return false;

  // If multi-day event (today is not last day), automatic ongoing
  if (todayYmd !== end) return true;

  // If last day, check time
  const endMins = timeToMinutes(e.end_time);
  return nowMins < endMins;
}
// Ilagay bago ang `export default function Dashboard() {`
function getEventParticipants(e) {
  if (!e.participants) return 'None';
  const raw = String(e.participants).trim();

  // New format: JSON array of {name, ...} objects
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(p => p.name || p).filter(Boolean).join(', ');
      }
    } catch (_) { /* fall through */ }
  }

  // Legacy: plain comma-separated string
  return raw || 'None';
}

export default function Dashboard() {
  const UPCOMING_PAGE_SIZE = 2;
  const TODAY_PAGE_SIZE = 2;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [miniMonthEvents, setMiniMonthEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(
    () => !!location.state?.showLoginModal
  );
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [todayPage, setTodayPage] = useState(0);
  const [miniMonthDate, setMiniMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0);
  });
  const [activeFilter, setActiveFilter] = useState('today'); // 'today', 'week', 'month', 'completion'

  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 12, 0, 0);
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 30);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 30);
    const start = rangeStart <= monthStart ? toLocalYMD(rangeStart) : toLocalYMD(monthStart);
    const end = rangeEnd >= monthEnd ? toLocalYMD(rangeEnd) : toLocalYMD(monthEnd);

    Promise.all([
      eventsApi.list({ start, end }),
    ])
      .then(([list]) => {
        setEvents(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const year = miniMonthDate.getFullYear();
    const month = miniMonthDate.getMonth();
    const start = toLocalYMD(new Date(year, month, 1, 12, 0, 0));
    const end = toLocalYMD(new Date(year, month + 1, 0, 12, 0, 0));
    eventsApi
      .list({ start, end })
      .then(setMiniMonthEvents)
      .catch(() => setMiniMonthEvents([]));
  }, [miniMonthDate]);

  const refresh = () => {
    setLoading(true);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 12, 0, 0);
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 30);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 30);
    const start = rangeStart <= monthStart ? toLocalYMD(rangeStart) : toLocalYMD(monthStart);
    const end = rangeEnd >= monthEnd ? toLocalYMD(rangeEnd) : toLocalYMD(monthEnd);
    eventsApi
      .list({ start, end })
      .then((list) => {
        setEvents(list);
      })
      .finally(() => setLoading(false));
  };

  // Current reference time for summary + upcoming sections
  const now = new Date();
  const today = toLocalYMD(now);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const weekMondayYmd = getWeekMondayYMD(now);
  const weekFridayYmd = getWeekFridayYMD(now);
  const monthStartYmd = getMonthStartYMD(now);
  const monthEndYmd = getMonthEndYMD(now);

  const next7 = new Date(now);
  next7.setDate(next7.getDate() + 7);
  const next7Ymd = toLocalYMD(next7);

  const cardCounts = useMemo(() => {
    const isInToday = (e) => isWithinRange(today, e.date, e.end_date || e.date);
    const isInWeek = (e) => {
      const start = e.date;
      const end = e.end_date || e.date;
      return end >= weekMondayYmd && start <= weekFridayYmd;
    };
    const isInMonth = (e) => {
      const start = e.date;
      const end = e.end_date || e.date;
      return end >= monthStartYmd && start <= monthEndYmd;
    };
    const inToday = events.filter(isInToday);
    const inWeek = events.filter(isInWeek);
    const inMonth = events.filter(isInMonth);
    const todayDone = inToday.filter((e) => isEventDone(e, today, nowMins)).length;
    const weekDone = inWeek.filter((e) => isEventDone(e, today, nowMins)).length;
    const monthDone = inMonth.filter((e) => isEventDone(e, today, nowMins)).length;
    return {
      todayCount: inToday.length,
      weekCount: inWeek.length,
      monthCount: inMonth.length,
      todayDoneCount: todayDone,
      weekDoneCount: weekDone,
      monthDoneCount: monthDone,
    };
  }, [events, today, nowMins, weekMondayYmd, weekFridayYmd, monthStartYmd, monthEndYmd]);

  const classifyStatus = (e) => {
    const status = String(e.status || 'active').toLowerCase();
    const { isTentative } = parseTentativeDescription(e.description);
    const isCancelled = status === 'cancelled';
    const isRescheduled = isCancelled && Number(e.rescheduled_to_event_id) > 0;
    if (isRescheduled) return 'rescheduled';
    if (isCancelled) return 'cancelled';
    if (isTentative) return 'tentative';
    return 'final';
  };

  const weekBreakdown = useMemo(() => {
    const counts = { tentative: 0, final: 0, cancelled: 0, rescheduled: 0, done: 0 };
    events.forEach((e) => {
      const end = e.end_date || e.date;
      if (end < weekMondayYmd || e.date > weekFridayYmd) return;
      const key = classifyStatus(e);
      if (key === 'cancelled' || key === 'rescheduled') counts[key] += 1;
      else if (isEventDone(e, today, nowMins)) counts.done += 1;
      else counts[key] += 1;
    });
    return counts;
  }, [events, today, nowMins, weekMondayYmd, weekFridayYmd]);

  const monthBreakdown = useMemo(() => {
    const counts = { tentative: 0, final: 0, cancelled: 0, rescheduled: 0, done: 0 };
    events.forEach((e) => {
      const end = e.end_date || e.date;
      if (end < monthStartYmd || e.date > monthEndYmd) return;
      const key = classifyStatus(e);
      if (key === 'cancelled' || key === 'rescheduled') counts[key] += 1;
      else if (isEventDone(e, today, nowMins)) counts.done += 1;
      else counts[key] += 1;
    });
    return counts;
  }, [events, today, nowMins, monthStartYmd, monthEndYmd]);

  const todayBreakdown = useMemo(() => {
    const counts = { tentative: 0, final: 0, cancelled: 0, rescheduled: 0, done: 0 };
    events.forEach((e) => {
      if (!isWithinRange(today, e.date, e.end_date || e.date)) return;
      const key = classifyStatus(e);
      if (key === 'cancelled' || key === 'rescheduled') counts[key] += 1;
      else if (isEventDone(e, today, nowMins)) counts.done += 1;
      else counts[key] += 1;
    });
    return counts;
  }, [events, today, nowMins]);
  const overviewDateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const upcomingEvents = events
    .filter((e) => {
      const endDate = e.end_date || e.date;
      const endMins = timeToMinutes(e.end_time);
      const isStillToday = endDate === today && endMins > nowMins;
      const isFutureDate = endDate > today;
      const startsWithinNext7 = e.date <= next7Ymd;
      // Exclude ongoing events — already shown in Today's Schedule
      const isOngoing = String(e.status || 'active').toLowerCase() !== 'cancelled' && isEventOngoing(e, today, nowMins);
      return startsWithinNext7 && (isStillToday || isFutureDate) && !isOngoing;
    })
    .sort((a, b) => (a.date + (a.start_time || '')).localeCompare(b.date + (b.start_time || '')))
    ;
  const upcomingPageCount = Math.max(1, Math.ceil(upcomingEvents.length / UPCOMING_PAGE_SIZE));
  const pagedUpcomingEvents = upcomingEvents.slice(
    upcomingPage * UPCOMING_PAGE_SIZE,
    (upcomingPage + 1) * UPCOMING_PAGE_SIZE
  );

  useEffect(() => {
    setUpcomingPage((prev) => Math.min(prev, Math.max(0, upcomingPageCount - 1)));
  }, [upcomingPageCount]);
  const monthInfo = useMemo(() => {
    const year = miniMonthDate.getFullYear();
    const month = miniMonthDate.getMonth();
    const first = new Date(year, month, 1, 12, 0, 0);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = first.getDay(); // 0=Sun
    const monthTitle = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const focusDate = toLocalYMD(first);
    const cells = [];
    for (let i = 0; i < startWeekday; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      const ymd = toLocalYMD(new Date(year, month, d, 12, 0, 0));
      cells.push({
        day: d,
        ymd,
        colors: getDayColors(miniMonthEvents, ymd),
      });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return { monthTitle, cells, focusDate };
  }, [miniMonthDate, miniMonthEvents]);

  const shiftMiniMonth = (delta) => {
    setMiniMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1, 12, 0, 0));
  };

  const resetMiniMonth = () => {
    const d = new Date();
    setMiniMonthDate(new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0));
  };

  // Today's events — sorted by start time, split into ongoing / upcoming / done
  const todayEvents = useMemo(() => {
    return events
      .filter((e) => isWithinRange(today, e.date, e.end_date || e.date))
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }, [events, today]);

  const todayOngoing = todayEvents.filter(
    (e) => String(e.status || 'active').toLowerCase() !== 'cancelled' && isEventOngoing(e, today, nowMins)
  );
  const todayUpcoming = todayEvents.filter(
    (e) => String(e.status || 'active').toLowerCase() !== 'cancelled' &&
      !isEventOngoing(e, today, nowMins) &&
      !isEventDone(e, today, nowMins)
  );
  const todayDone = todayEvents.filter(
    (e) => String(e.status || 'active').toLowerCase() !== 'cancelled' && isEventDone(e, today, nowMins)
  );
  const todayCancelled = todayEvents.filter(
    (e) => String(e.status || 'active').toLowerCase() === 'cancelled'
  );

  // Flatten all today events into one paged list: ongoing first, then upcoming, done, cancelled
  const todayAllFlat = [...todayOngoing, ...todayUpcoming, ...todayDone, ...todayCancelled];
  const todayPageCount = Math.max(1, Math.ceil(todayAllFlat.length / TODAY_PAGE_SIZE));
  const pagedTodayEvents = todayAllFlat.slice(
    todayPage * TODAY_PAGE_SIZE,
    (todayPage + 1) * TODAY_PAGE_SIZE
  );

  useEffect(() => {
    setTodayPage((prev) => Math.min(prev, Math.max(0, todayPageCount - 1)));
  }, [todayPageCount]);

  const [liveClock, setLiveClock] = useState(() => {
    const n = new Date();
    return n.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const [conflictCount, setConflictCount] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    eventsApi.conflicts().then((d) => setConflictCount(Number(d?.count || 0))).catch(() => {});
  }, []);

  if (loading) return <SkeletonDashboard />;

  return (
    <div className="dashboard">
      <section className="dashboard-panel dashboard-panel-overview">
        <div className="dashboard-overview-top">
          <div className="dashboard-overview-titleblock">
            <div className="dashboard-overview-kicker">
              <span className="dashboard-overview-kicker-dot" />
              ONE CENTRALIZED CALENDAR SYSTEM · CY 2026
            </div>
            <h1 className="dashboard-title">
              {(() => {
                const hour = new Date().getHours();
                const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
                if (!user?.name) return 'COROPOTI Activity Dashboard';
                return `${greeting}, ${user.name.trim()}.`;
              })()}
            </h1>
            <p className="dashboard-subtitle">
              {user
                ? "Here's your COROPOTI activity overview for today."
                : "Centralized calendar of programs, activities, and plans for CY 2026."
              }
            </p>
          </div>
          <div className="dashboard-overview-side">
            {/* Clock + date + conflict badge */}
            <div className="dashboard-overview-clock">
              <span className="dashboard-overview-clock-time">{liveClock}</span>
              <span className="dashboard-overview-clock-date">{overviewDateLabel}</span>
              {conflictCount > 0 && (
                <span className="dashboard-overview-conflict-badge">
                  ⚠ {conflictCount} conflict{conflictCount > 1 ? 's' : ''} detected
                </span>
              )}
            </div>
            <div className="dashboard-actions">
              {user && user.role !== 'viewer' && (
                <Link to="/simple-event-form" state={{ backTo: '/dashboard' }} className="dashboard-btn dashboard-btn-primary">
                  + Add Schedule
                </Link>
              )}
              {!user && (
                <button className="dashboard-btn dashboard-btn-primary" onClick={() => setShowLoginModal(true)}>
                  + Add Schedule
                </button>
              )}
              <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="dashboard-cards">
        <button 
          type="button"
          className={`dashboard-card dashboard-card-clickable ${activeFilter === 'today' ? 'dashboard-card-active' : ''}`}
          onClick={() => setActiveFilter('today')}
        >
          <div className="dashboard-card-inner">
            <span className="dashboard-card-icon dashboard-card-icon-today" aria-hidden>
              {/* Filled calendar with today highlight */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="18" rx="3" fill="#fef08a" stroke="#d97706" strokeWidth="1.5"/>
                <rect x="2" y="4" width="20" height="6" rx="3" fill="#f59e0b"/>
                <rect x="2" y="8" width="20" height="2" fill="#f59e0b"/>
                <line x1="7" y1="2" x2="7" y2="6" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
                <line x1="17" y1="2" x2="17" y2="6" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
                <rect x="9" y="13" width="6" height="6" rx="1.5" fill="#f59e0b"/>
              </svg>
            </span>
            <div className="dashboard-card-text">
              <span className="dashboard-card-value">{cardCounts.todayCount}</span>
              <span className="dashboard-card-label">Today</span>
              <div className="dashboard-card-breakdown">
                <span className="dashboard-card-breakdown-item item-done">✓ {todayBreakdown.done} done</span>
                {todayBreakdown.cancelled > 0 && <span className="dashboard-card-breakdown-item item-cancelled">✕ {todayBreakdown.cancelled} cancelled</span>}
              </div>
            </div>
          </div>
        </button>

        <div className="dashboard-card">
          <div className="dashboard-card-inner">
            <span className="dashboard-card-icon dashboard-card-icon-week" aria-hidden>
              {/* Week — 7 vertical bars like a mini bar chart */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1"  y="14" width="2.5" height="8"  rx="1.2" fill="#a78bfa"/>
                <rect x="4.5" y="10" width="2.5" height="12" rx="1.2" fill="#8b5cf6"/>
                <rect x="8"  y="12" width="2.5" height="10" rx="1.2" fill="#a78bfa"/>
                <rect x="11.5" y="7" width="2.5" height="15" rx="1.2" fill="#7c3aed"/>
                <rect x="15" y="9"  width="2.5" height="13" rx="1.2" fill="#8b5cf6"/>
                <rect x="18.5" y="5" width="2.5" height="17" rx="1.2" fill="#6d28d9"/>
                <rect x="22" y="11" width="2.5" height="11" rx="1.2" fill="#a78bfa"/>
              </svg>
            </span>
            <div className="dashboard-card-text">
              <span className="dashboard-card-value">{cardCounts.weekCount}</span>
              <span className="dashboard-card-label">This Week</span>
              <div className="dashboard-card-breakdown">
                <span className="dashboard-card-breakdown-item item-final">● {weekBreakdown.final} final</span>
                <span className="dashboard-card-breakdown-item item-tentative">● {weekBreakdown.tentative} tentative</span>
                <span className="dashboard-card-breakdown-item item-done">✓ {weekBreakdown.done} done</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-inner">
            <span className="dashboard-card-icon dashboard-card-icon-month" aria-hidden>
              {/* Month — filled calendar grid with colored dots */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="18" rx="3" fill="#ccfbf1" stroke="#0d9488" strokeWidth="1.5"/>
                <rect x="2" y="4" width="20" height="6" rx="3" fill="#14b8a6"/>
                <rect x="2" y="8" width="20" height="2" fill="#14b8a6"/>
                <line x1="7" y1="2" x2="7" y2="6" stroke="#0d9488" strokeWidth="2" strokeLinecap="round"/>
                <line x1="17" y1="2" x2="17" y2="6" stroke="#0d9488" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="7"  cy="15" r="1.5" fill="#0d9488"/>
                <circle cx="12" cy="15" r="1.5" fill="#14b8a6"/>
                <circle cx="17" cy="15" r="1.5" fill="#0d9488"/>
                <circle cx="7"  cy="19" r="1.5" fill="#14b8a6"/>
                <circle cx="12" cy="19" r="1.5" fill="#0d9488"/>
                <circle cx="17" cy="19" r="1.5" fill="#5eead4"/>
              </svg>
            </span>
            <div className="dashboard-card-text">
              <span className="dashboard-card-value">{cardCounts.monthCount}</span>
              <span className="dashboard-card-label">This Month</span>
              <div className="dashboard-card-breakdown">
                <span className="dashboard-card-breakdown-item item-final">● {monthBreakdown.final} final</span>
                <span className="dashboard-card-breakdown-item item-tentative">● {monthBreakdown.tentative} tentative</span>
                <span className="dashboard-card-breakdown-item item-done">✓ {monthBreakdown.done} done</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Completion Rate card ── */}
        {(() => {
          const monthTotal = cardCounts.monthCount;
          const monthDone  = monthBreakdown.done;
          const pct = monthTotal > 0 ? Math.round((monthDone / monthTotal) * 100) : 0;
          return (
            <div className="dashboard-card dashboard-card-completion">
              <div className="dashboard-card-inner">
                <span className="dashboard-card-icon dashboard-card-icon-completion" aria-hidden>
                  {/* Completion — filled trophy */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 21h8M12 17v4" stroke="#2255b0" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M5 3H3a2 2 0 000 4c0 2.5 1.5 4.5 3.5 5.5" stroke="#2255b0" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M19 3h2a2 2 0 010 4c0 2.5-1.5 4.5-3.5 5.5" stroke="#2255b0" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M5 3h14v9a7 7 0 01-14 0V3z" fill="#bfdbfe" stroke="#2255b0" strokeWidth="1.5"/>
                    <path d="M9 10l2 2 4-4" stroke="#2255b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div className="dashboard-card-text">
                  <span className="dashboard-card-value dashboard-card-value-completion">{pct}%</span>
                  <span className="dashboard-card-label">Monthly Completion</span>
                  <div className="dashboard-card-progress-wrap">
                    <div className="dashboard-card-progress-track">
                      <div className="dashboard-card-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="dashboard-card-progress-text">{monthDone}/{monthTotal}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── 2-col layout: [Today + Upcoming stacked left] | [Mini Calendar right] */}
      <div className="dashboard-panels">
        <div className="dashboard-panels-left">
      {/* ── Today's Events ─────────────────────────────────────────────── */}
      <section className="dashboard-today-section dashboard-panel">
        <div className="dashboard-today-header">
          <div className="dashboard-today-header-left">
            <span className="dashboard-today-pulse" aria-hidden="true" />
            <h2 className="dashboard-today-title">Today's Schedule</h2>
          </div>
          <div className="dashboard-today-header-right">
            <div className="dashboard-upcoming-pager">
              <button type="button" className="dashboard-upcoming-page-btn"
                onClick={() => setTodayPage((p) => Math.max(0, p - 1))}
                disabled={todayAllFlat.length === 0 || todayPage === 0}>Prev</button>
              <span className="dashboard-upcoming-page-label">
                {todayAllFlat.length === 0 ? '0 / 0' : `${todayPage + 1} / ${todayPageCount}`}
              </span>
              <button type="button" className="dashboard-upcoming-page-btn"
                onClick={() => setTodayPage((p) => Math.min(todayPageCount - 1, p + 1))}
                disabled={todayAllFlat.length === 0 || todayPage >= todayPageCount - 1}>Next</button>
            </div>
            <Link to={`/calendar/day/${today}`} className="dashboard-today-view-all">
              View Day →
            </Link>
          </div>
        </div>

        {todayAllFlat.length === 0 ? (
          <div className="dashboard-today-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>No events or meetings scheduled for today.</p>
          </div>
        ) : (
          <div className="dashboard-today-columns">
            {pagedTodayEvents.map((e) => {
              const isCancelled = String(e.status || 'active').toLowerCase() === 'cancelled';
              const isOngoing = !isCancelled && isEventOngoing(e, today, nowMins);
              const isDone = !isCancelled && !isOngoing && isEventDone(e, today, nowMins);
              const cardVariant = isCancelled ? 'cancelled' : isOngoing ? 'ongoing' : isDone ? 'done' : 'upcoming';
              const dotVariant = cardVariant;
              const statusLabel = isCancelled ? 'Cancelled' : isOngoing ? 'Ongoing' : isDone ? 'Done' : 'Upcoming';
              return (
                <button key={e.id} type="button"
                  className={`dashboard-today-card dashboard-today-card-${cardVariant}`}
                  onClick={() => setSelectedEvent(e.id)}>
                  <span className="dashboard-today-card-bar" style={{ backgroundColor: isCancelled ? '#ef4444' : e.color || '#2563eb' }} />
                  <span className="dashboard-today-card-inner">
                    <span className="dashboard-today-card-status-row">
                      <span className={`dashboard-today-dot dashboard-today-dot-${dotVariant}`} />
                      <span className="dashboard-today-card-status-label">{statusLabel}</span>
                    </span>
                    <span className="dashboard-today-card-time">{formatTime(e.start_time)} – {formatTime(e.end_time)}</span>
                    <span className="dashboard-today-card-title">{e.title}</span>
                    <span className="dashboard-today-card-meta">{e.location || 'TBA'}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

        <section className="dashboard-panel dashboard-panel-upcoming">
          <div className="dashboard-section-head">
            <h2>Upcoming Events/Meetings (Next 7 Days)</h2>
            <div className="dashboard-upcoming-pager">
              <button
                type="button"
                className="dashboard-upcoming-page-btn"
                onClick={() => setUpcomingPage((p) => Math.max(0, p - 1))}
                disabled={upcomingEvents.length === 0 || upcomingPage === 0}
              >
                Prev
              </button>
              <span className="dashboard-upcoming-page-label">
                {upcomingEvents.length === 0 ? '0 / 0' : `${upcomingPage + 1} / ${upcomingPageCount}`}
              </span>
              <button
                type="button"
                className="dashboard-upcoming-page-btn"
                onClick={() => setUpcomingPage((p) => Math.min(upcomingPageCount - 1, p + 1))}
                disabled={upcomingEvents.length === 0 || upcomingPage >= upcomingPageCount - 1}
              >
                Next
              </button>
            </div>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="dashboard-empty">No upcoming events.</p>
          ) : (
            <ul className="dashboard-upcoming-list">
              {pagedUpcomingEvents.map((e) => {
                const status = String(e.status || 'active').toLowerCase();
                const ongoing = status !== 'cancelled' && isEventOngoing(e, today, nowMins);
                const statusLabel = status === 'cancelled' ? 'Cancelled' : ongoing ? 'Ongoing' : 'Active';
                const statusClass = ongoing ? 'ongoing' : status;
                const eventDate = new Date(`${String(e.date).slice(0,10)}T12:00:00`);
                const monthShort = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                const dayNum = eventDate.getDate();
                return (
                  <li key={e.id}>
                    <button type="button" className="dashboard-upcoming-item" onClick={() => setSelectedEvent(e.id)}>
                      {/* Date box */}
                      <span className="dashboard-upcoming-datebox">
                        <span className="dashboard-upcoming-datebox-month">{monthShort}</span>
                        <span className="dashboard-upcoming-datebox-day">{dayNum}</span>
                      </span>
                      {/* Content */}
                      <span className="dashboard-upcoming-content">
                        <span className="dashboard-upcoming-content-top">
                          <span className={`dashboard-status-pill dashboard-status-${statusClass}`}>{statusLabel}</span>
                          <span className="dashboard-upcoming-title">{e.title}</span>
                          <span className="dashboard-upcoming-time">{formatTime(e.start_time)}</span>
                        </span>
                        <span className="dashboard-upcoming-meta">Host: {e.creator_name || 'Unknown'}</span>
                        <span className="dashboard-upcoming-meta">Participants: {getEventParticipants(e)}</span>
                        <span className="dashboard-upcoming-meta">Venue: {e.location || 'TBA'}</span>
                        {status === 'cancelled' && Number(e.rescheduled_to_event_id) > 0 && (
                          <span className="dashboard-upcoming-meta">
                            <span className="dashboard-status-pill dashboard-status-rescheduled">Rescheduled</span>{' '}
                            to: {formatRescheduledDateRange(e) || 'Date pending'}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        </div>{/* end dashboard-panels-left */}

        <section className="dashboard-panel dashboard-panel-mini-calendar">
          <div className="dashboard-mini-calendar-head">
            <h2>Monthly Overview</h2>
            <div className="dashboard-mini-calendar-controls">
              <button
                type="button"
                className="dashboard-mini-month-btn"
                onClick={() => shiftMiniMonth(-1)}
                aria-label="Previous month"
              >
                &#8249;
              </button>
              <span>{monthInfo.monthTitle}</span>
              <button
                type="button"
                className="dashboard-mini-month-btn"
                onClick={() => shiftMiniMonth(1)}
                aria-label="Next month"
              >
                &#8250;
              </button>
              <button
                type="button"
                className="dashboard-mini-today-btn"
                onClick={resetMiniMonth}
              >
                Today
              </button>
            </div>
          </div>
          <Link
            to={`/calendar?date=${monthInfo.focusDate}`}
            className="dashboard-mini-calendar-grid-wrap dashboard-mini-calendar-grid-link"
            aria-label="Open full calendar"
            title="Open full calendar"
          >
            <div className="dashboard-mini-grid">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((w) => (
                <span key={w} className="dashboard-mini-weekday">{w}</span>
              ))}
              {monthInfo.cells.map((cell, idx) => {
                const weekend = cell && isWeekendYMD(cell.ymd);
                const isToday = cell && cell.ymd === today;
                return (
                  <div
                    key={`${cell?.ymd || 'blank'}-${idx}`}
                    className={`dashboard-mini-cell ${!cell ? 'is-empty' : weekend ? 'is-weekend' : 'is-day'} ${isToday ? 'is-today' : ''}`}
                  >
                    {cell ? (
                      <div className={`dashboard-mini-cell-btn ${weekend ? 'dashboard-mini-cell-weekend' : ''}`}>
                        <span className="dashboard-mini-day">{cell.day}</span>
                        <div className="dashboard-mini-colors">
                          {cell.colors.map((c, cIdx) => (
                            <span key={`${cell.ymd}-${cIdx}`} className="dashboard-mini-color" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Link>
        </section>
      </div>

      {selectedEvent && (
        <EventModal
          eventId={selectedEvent}
          onClose={() => { setSelectedEvent(null); refresh(); }}
          onEdit={() => { setSelectedEvent(null); }}
          onDelete={refresh}
        />
      )}

      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          redirectTo={{ path: '/simple-event-form', state: { backTo: '/dashboard' } }}
        />
      )}
    </div>
  );
}
