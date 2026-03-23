import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { events as eventsApi } from '../api';
import { getRegionalDirectorsForEvent } from '../utils/regionalDirectorsParticipants';
import { parseRegionalDirectorsLabel } from '../utils/regionalDirectorsLabel';
import EventModal from '../components/EventModal';
import { parseTentativeDescription } from '../utils/tentativeSchedule';
import LoginRequiredModal from '../components/LoginRequiredModal';
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

  try {
    const parsed = typeof e.participants === 'string' ? JSON.parse(e.participants) : e.participants;
    if (!Array.isArray(parsed) || !parsed.length) return 'None';

    return parsed.map(p => p.name).join(', ');
  } catch (err) {
    console.error('Error parsing participants:', err);
    return 'None';
  }
}

export default function Dashboard() {
  const UPCOMING_PAGE_SIZE = 3;
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
  const [miniMonthDate, setMiniMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0);
  });

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
      return startsWithinNext7 && (isStillToday || isFutureDate);
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

  if (loading) return <div className="dashboard-loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <section className="dashboard-panel dashboard-panel-overview">
        <div className="dashboard-overview-top">
          <div className="dashboard-overview-titleblock">
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">
              Overview of COROPOTI Programs, Activities and Plans for CY 2026
            </p>
          </div>
          <div className="dashboard-overview-side">
            <div className="dashboard-overview-meta">
              <span className="dashboard-overview-chip">{overviewDateLabel}</span>
            </div>
            <div className="dashboard-actions">
              {user && user.role !== 'viewer' && (
                <Link
                  to="/simple-event-form"
                  state={{ backTo: '/dashboard' }}
                  className="dashboard-btn dashboard-btn-primary"
                >
                  + Add Schedule
                </Link>
              )}
              {!user && (
                <button
                  className="dashboard-btn dashboard-btn-primary"
                  onClick={() => setShowLoginModal(true)}
                >
                  + Add Schedule
                </button>
              )}
              <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-panels">
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
              {pagedUpcomingEvents.map((e) => (
                <li key={e.id}>
                  <button type="button" className="dashboard-upcoming-item" onClick={() => setSelectedEvent(e.id)}>
                    {(() => {
                      const status = String(e.status || 'active').toLowerCase();
                      const ongoing = status !== 'cancelled' && isEventOngoing(e, today, nowMins);
                      const statusLabel = status === 'cancelled' ? 'Cancelled' : ongoing ? 'Ongoing' : 'Active';
                      const statusClass = ongoing ? 'ongoing' : status;
                      return (
                        <span className="dashboard-upcoming-status-line">
                          <span className={`dashboard-status-pill dashboard-status-${statusClass}`}>
                            {statusLabel}
                          </span>
                        </span>
                      );
                    })()}
                    <span className="dashboard-upcoming-date">{formatDateRange(e)}</span>
                    <span className="dashboard-upcoming-time">{formatTime(e.start_time)} - {formatTime(e.end_time)}</span>
                    <span className="dashboard-upcoming-title">{e.title}</span>
                    {String(e.status || 'active').toLowerCase() === 'cancelled' && Number(e.rescheduled_to_event_id) > 0 ? (
                      <span className="dashboard-upcoming-meta dashboard-upcoming-meta-status">
                        <span className="dashboard-status-pill dashboard-status-rescheduled">Rescheduled</span>{' '}
                        Rescheduled to: {formatRescheduledDateRange(e) || 'Date pending'}
                      </span>
                    ) : null}
                    <span className="dashboard-upcoming-meta">Host: {e.creator_name || 'Unknown'}</span>
                    <span className="dashboard-upcoming-meta">
                      Participants: {getEventParticipants(e)}
                    </span>
                    <span className="dashboard-upcoming-meta">Venue: {e.location || 'TBA'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-panel dashboard-panel-mini-calendar">
          <div className="dashboard-mini-calendar-head">
            <h2>View Calendar</h2>
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

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <span className="dashboard-card-icon dashboard-card-icon-today" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>
          <span className="dashboard-card-label">Today</span>
          <span className="dashboard-card-value">{cardCounts.todayCount}</span>
          <span className="dashboard-card-sublabel">
            Events/Meetings · Done: {todayBreakdown.done}
          </span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-icon dashboard-card-icon-week" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>
          </span>
          <span className="dashboard-card-label">This week</span>
          <span className="dashboard-card-value">{cardCounts.weekCount}</span>
          <span className="dashboard-card-sublabel">
            Mon–Fri · Tentative: {weekBreakdown.tentative} · Final: {weekBreakdown.final} · Done: {weekBreakdown.done} · Cancelled: {weekBreakdown.cancelled} · Rescheduled: {weekBreakdown.rescheduled}
          </span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-icon dashboard-card-icon-month" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </span>
          <span className="dashboard-card-label">This month</span>
          <span className="dashboard-card-value">{cardCounts.monthCount}</span>
          <span className="dashboard-card-sublabel">
            Full month · Tentative: {monthBreakdown.tentative} · Final: {monthBreakdown.final} · Done: {monthBreakdown.done} · Cancelled: {monthBreakdown.cancelled} · Rescheduled: {monthBreakdown.rescheduled}
          </span>
        </div>
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
