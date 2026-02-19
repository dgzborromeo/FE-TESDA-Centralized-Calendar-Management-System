import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { events as eventsApi } from '../api';
import EventModal from '../components/EventModal';
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

function getDayColors(events, ymd) {
  const set = new Set();
  for (const e of events) {
    if (!isWithinRange(ymd, e.date, e.end_date || e.date)) continue;
    set.add(e.color || '#3b82f6');
  }
  return Array.from(set).slice(0, 3);
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
  if (!summary || !String(summary).trim()) return 'None';
  const acronyms = String(summary)
    .split(',')
    .map((s) => acronymFromParticipantName(s))
    .filter(Boolean);
  if (!acronyms.length) return 'None';
  return Array.from(new Set(acronyms)).join(', ');
}

/** True if event is today and current time is between start_time and end_time (not yet finished). */
function isEventOngoing(e, todayYmd, nowMins) {
  if (!e?.date || e.date !== todayYmd) return false;
  const startMins = timeToMinutes(e.start_time);
  const endMins = timeToMinutes(e.end_time);
  return nowMins >= startMins && nowMins < endMins;
}

export default function Dashboard() {
  const UPCOMING_PAGE_SIZE = 3;
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [miniMonthEvents, setMiniMonthEvents] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [miniMonthDate, setMiniMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0);
  });

  useEffect(() => {
    const now = new Date();
    const today = toLocalYMD(now);
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 30);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 30);

    Promise.all([
      eventsApi.list({ start: toLocalYMD(rangeStart), end: toLocalYMD(rangeEnd) }),
    ])
      .then(([list]) => {
        setEvents(list);
        setTodayCount(list.filter((e) => isWithinRange(today, e.date, e.end_date || e.date)).length);

        const next7 = new Date(now);
        next7.setDate(next7.getDate() + 7);
        const next7YMD = toLocalYMD(next7);
        setWeekCount(
          list.filter((e) => {
            const start = e.date;
            const end = e.end_date || e.date;
            return end >= today && start <= next7YMD;
          }).length
        );

        const next30 = new Date(now);
        next30.setDate(next30.getDate() + 30);
        const next30YMD = toLocalYMD(next30);
        setMonthCount(
          list.filter((e) => {
            const start = e.date;
            const end = e.end_date || e.date;
            return end >= today && start <= next30YMD;
          }).length
        );
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
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 30);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 30);
    eventsApi
      .list({ start: toLocalYMD(rangeStart), end: toLocalYMD(rangeEnd) })
      .then(setEvents)
      .finally(() => setLoading(false));
  };

  const now = new Date();
  const today = toLocalYMD(now);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const overviewDateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const next7 = new Date(now);
  next7.setDate(next7.getDate() + 7);
  const next7Ymd = toLocalYMD(next7);

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
              <Link to="/events/new" className="dashboard-btn dashboard-btn-primary">+ Create Event</Link>
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
                      Participants: {formatParticipantsAcronymList(e.participants_summary)}
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
          <button
            type="button"
            className="dashboard-mini-calendar-btn"
            onClick={() => navigate(`/calendar?date=${monthInfo.focusDate}`)}
            title="Open full calendar"
          >
            <div className="dashboard-mini-grid">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((w) => (
                <span key={w} className="dashboard-mini-weekday">{w}</span>
              ))}
              {monthInfo.cells.map((cell, idx) => (
                <div key={`${cell?.ymd || 'blank'}-${idx}`} className={`dashboard-mini-cell ${!cell ? 'is-empty' : ''}`}>
                  {cell ? (
                    <>
                      <span className="dashboard-mini-day">{cell.day}</span>
                      <div className="dashboard-mini-colors">
                        {cell.colors.map((c, cIdx) => (
                          <span key={`${cell.ymd}-${cIdx}`} className="dashboard-mini-color" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </button>
        </section>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <span className="dashboard-card-label">Today</span>
          <span className="dashboard-card-value">{todayCount}</span>
          <span className="dashboard-card-sublabel">Events/Meetings</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-label">This week</span>
          <span className="dashboard-card-value">{weekCount}</span>
          <span className="dashboard-card-sublabel">Events/Meetings</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-label">This month</span>
          <span className="dashboard-card-value">{monthCount}</span>
          <span className="dashboard-card-sublabel">Events/Meetings</span>
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
    </div>
  );
}
