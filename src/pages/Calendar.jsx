import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { events as eventsApi, users as usersApi } from '../api';
import EventModal from '../components/EventModal';
import { useAuth } from '../context/AuthContext';
import { parseTentativeDescription } from '../utils/tentativeSchedule';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './Calendar.css';

const EVENT_COLORS = { meeting: '#3b82f6', zoom: '#8b5cf6', event: '#f59e0b' };
const HOLIDAY_COLOR = '#334155';

function lastMondayOfAugust(year) {
  // National Heroes Day (PH): last Monday of August
  const d = new Date(year, 7, 31, 12, 0, 0); // Aug 31
  const day = d.getDay(); // 0 Sun ... 1 Mon ... 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return toLocalDateString(d);
}

function phHolidaysForYear(year) {
  // Basic PH holidays (fixed-date + National Heroes Day). This can be extended later.
  return [
    { date: `${year}-01-01`, name: "New Year's Day" },
    { date: `${year}-04-09`, name: 'Araw ng Kagitingan' },
    { date: `${year}-05-01`, name: 'Labor Day' },
    { date: `${year}-06-12`, name: 'Independence Day' },
    { date: lastMondayOfAugust(year), name: 'National Heroes Day' },
    { date: `${year}-11-30`, name: 'Bonifacio Day' },
    { date: `${year}-12-25`, name: 'Christmas Day' },
    { date: `${year}-12-30`, name: 'Rizal Day' },
  ];
}

function holidayEventsForRange(startDate, endDateExclusive) {
  const endInclusive = new Date(endDateExclusive);
  endInclusive.setDate(endInclusive.getDate() - 1);
  const startYMD = toLocalDateString(startDate);
  const endYMD = toLocalDateString(endInclusive);
  const years = new Set([startDate.getFullYear(), endInclusive.getFullYear()]);

  const out = [];
  for (const y of years) {
    for (const h of phHolidaysForYear(y)) {
      if (h.date < startYMD || h.date > endYMD) continue;
      out.push({
        id: `holiday-${h.date}-${h.name}`.replace(/\s+/g, '-').toLowerCase(),
        title: h.name,
        start: `${h.date}T00:00:00`,
        end: `${h.date}T23:59:59`,
        allDay: true,
        backgroundColor: HOLIDAY_COLOR,
        borderColor: HOLIDAY_COLOR,
        textColor: '#fff',
        editable: false,
        startEditable: false,
        durationEditable: false,
        classNames: ['fc-event-holiday'],
        extendedProps: {
          isHoliday: true,
          tooltip: `${h.name}\nHoliday`,
        },
      });
    }
  }
  return out;
}

function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeDateValue(v) {
  if (!v) return '';
  // MySQL DATE can arrive as Date object or as ISO string.
  if (v instanceof Date) return toLocalDateString(v);
  if (typeof v === 'string') {
    // common: "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss.sssZ"
    if (v.length >= 10) return v.slice(0, 10);
    const d = new Date(v);
    if (!isNaN(d.getTime())) return toLocalDateString(d);
  }
  // fallback: try Date parse
  const d = new Date(v);
  if (!isNaN(d.getTime())) return toLocalDateString(d);
  return '';
}

function normalizeTime(t) {
  if (!t) return '00:00:00';
  if (t.length === 5) return `${t}:00`;
  return t;
}

function addDaysYMD(ymd, days) {
  const d = new Date(`${String(ymd).slice(0, 10)}T12:00:00`);
  if (!Number.isFinite(d.getTime())) return String(ymd).slice(0, 10);
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

function formatTimeShort(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}

function getDateFromPoint(clientX, clientY) {
  if (typeof document === 'undefined') return null;
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;
  const dayEl = el.closest?.('.fc-daygrid-day, .fc-timegrid-col, .fc-timegrid-slot, [data-date]');
  const date = dayEl?.getAttribute?.('data-date');
  return date && date.length >= 10 ? date.slice(0, 10) : null;
}

function getDateFromRects(containerEl, clientX, clientY) {
  if (!containerEl) return null;
  const candidates = containerEl.querySelectorAll(
    '.fc-daygrid-day[data-date], .fc-timegrid-col[data-date], [data-date]'
  );
  for (const el of candidates) {
    const date = el.getAttribute('data-date');
    if (!date) continue;
    const r = el.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      return date.slice(0, 10);
    }
  }
  return null;
}

function isWeekendYMD(ymd) {
  if (!ymd || ymd.length < 10) return false;
  const d = new Date(`${ymd.slice(0, 10)}T12:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function clusterShortLabel(name) {
  const raw = String(name || '').trim();
  if (!raw) return 'CLUSTER';
  const paren = raw.match(/\(([^()]+)\)\s*$/);
  if (paren?.[1]) return String(paren[1]).trim().toUpperCase();
  const words = raw.split(/\s+/).filter(Boolean);
  return words.slice(0, 6).map((w) => w[0]?.toUpperCase() || '').join('') || raw.slice(0, 8).toUpperCase();
}

function textColorForBackground(hexColor) {
  const hex = String(hexColor || '').replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '#ffffff';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#0f172a' : '#ffffff';
}

function stopEvent(e) {
  e.preventDefault();
  e.stopPropagation();
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

export default function Calendar() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const isReadOnlyOffice = isRomo || isPo || isSmo || isCo || isIcto || isAs || isPlo || isPio || isQso || isFms || isClgeo || isEbeto;
  const calendarRef = useRef(null);
  const containerRef = useRef(null);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastDropAtRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [holidayEvents, setHolidayEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [clusterLegend, setClusterLegend] = useState([]);
  const [legendLoading, setLegendLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [hostFilterOpen, setHostFilterOpen] = useState(false);
  const [hostModalTarget, setHostModalTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [openLegendClusterId, setOpenLegendClusterId] = useState(null);
  const [nowTick, setNowTick] = useState(0);
  const [pendingMove, setPendingMove] = useState(null);
  const [moveReason, setMoveReason] = useState('');
  const [moveSubmitting, setMoveSubmitting] = useState(false);

  const activeRangeRef = useRef({ start: null, end: null });
  const hostFilterRef = useRef(null);

  // Keep FullCalendar's internal hit-detection in sync with actual layout.
  // This fixes "click/drag goes to adjacent day" when the page/layout changes after render.
  useEffect(() => {
    const api = calendarRef.current?.getApi?.();
    if (!api) return;

    const tick = () => {
      try {
        api.updateSize();
      } catch {
        // ignore
      }
    };

    const raf = requestAnimationFrame(tick);
    const t = setTimeout(tick, 250);

    let ro = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => tick());
      ro.observe(containerRef.current);
    }

    window.addEventListener('resize', tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener('resize', tick);
      if (ro) ro.disconnect();
    };
  }, []);

  // Re-render periodically so "Done" status updates when events end.
  useEffect(() => {
    const t = setInterval(() => setNowTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // Track pointer globally so drag-drop can use the real cursor position.
  useEffect(() => {
    const move = (e) => {
      if (!e) return;
      if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
      }
    };
    window.addEventListener('pointermove', move, true);
    window.addEventListener('mousemove', move, true);
    return () => {
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('mousemove', move, true);
    };
  }, []);

  // Bypass FullCalendar's internal hit-test by handling empty-cell clicks ourselves.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onClickCapture = (e) => {
      // Prevent "click-to-create" from firing after a drag-drop (mouseup can trigger click)
      if (isDraggingRef.current) return;
      if (Date.now() - lastDropAtRef.current < 400) return;

      const target = e.target;
      // Only handle clicks that actually happen inside the FullCalendar grid area.
      if (!target?.closest?.('.fc')) return;
      // Don't hijack event clicks / "+more" links
      if (target?.closest?.('.fc-event, .fc-more-link, .fc-daygrid-more-link')) return;
      const d = getDateFromRects(el, e.clientX, e.clientY) || getDateFromPoint(e.clientX, e.clientY);
      if (!d) return;
      if (isWeekendYMD(d)) {
        alert('Weekends are locked. Please select a weekday.');
        return;
      }
      if (d < toLocalDateString(new Date())) {
        alert('This date is already done. It is view-only.');
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      navigate(`/events/new?date=${d}`);
    };

    el.addEventListener('click', onClickCapture, true);
    return () => el.removeEventListener('click', onClickCapture, true);
  }, [navigate]);

  const dateParam = searchParams.get('date');
  const queryParam = searchParams.get('q') || '';

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (!dateParam) return;
    const d = new Date(`${dateParam}T12:00:00`);
    if (!isNaN(d.getTime())) {
      // If the calendar is mounted, jump to the date; otherwise initialDate handles it.
      const api = calendarRef.current?.getApi?.();
      if (api) api.gotoDate(d);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('date');
    setSearchParams(next, { replace: true });
  }, [dateParam, searchParams, setSearchParams]);

  const fetchEventsForRange = async (rangeStart, rangeEndExclusive) => {
    // FullCalendar's `end` is exclusive; backend expects inclusive.
    const inclusiveEnd = new Date(rangeEndExclusive);
    inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);

    const params = {
      start: toLocalDateString(rangeStart),
      end: toLocalDateString(inclusiveEnd),
    };
    if (searchQuery.trim()) params.q = searchQuery.trim();
    const rows = await eventsApi.list(params);
    setEvents(rows);
  };

  const fetchLegend = async () => {
    setLegendLoading(true);
    try {
      const rows = await usersApi.legendClusters();
      setClusterLegend(Array.isArray(rows) ? rows : []);
    } catch (e) {
      // non-fatal
      console.error(e);
      setClusterLegend([]);
    } finally {
      setLegendLoading(false);
    }
  };

  useEffect(() => {
    fetchLegend();
    usersApi.list().then((rows) => setUsers(Array.isArray(rows) ? rows : [])).catch(() => setUsers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshData = async () => {
    const { start, end } = activeRangeRef.current;
    if (start && end) {
      await fetchEventsForRange(start, end);
    }
  };

  const toggleLegendCluster = (clusterId) => {
    setOpenLegendClusterId((prev) => (prev === clusterId ? null : clusterId));
  };

  const cancelPendingMove = () => {
    setPendingMove(null);
    setMoveReason('');
    setMoveSubmitting(false);
  };

  const confirmPendingMove = async () => {
    if (!pendingMove) return;
    const reason = moveReason.trim();
    if (!reason) return;
    try {
      setMoveSubmitting(true);
      await eventsApi.update(pendingMove.id, {
        date: pendingMove.date,
        start_time: pendingMove.start_time,
        end_time: pendingMove.end_time,
        move_reason: reason,
      });
      await refreshData();
      cancelPendingMove();
    } catch (e) {
      alert(e.message || 'Failed to reschedule.');
      setMoveSubmitting(false);
    }
  };

  // Re-fetch when search changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      refreshData().catch(() => {});
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

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

  function isEventDone(e) {
    const date = normalizeDateValue(e?.date);
    const endDate = normalizeDateValue(e?.end_date) || date;
    const endRaw = normalizeTime(e?.end_time);
    if (!date || !endDate || !endRaw) return false;
    const endAt = new Date(`${endDate}T${endRaw}`);
    if (!Number.isFinite(endAt.getTime())) return false;
    return new Date() >= endAt;
  }

  const fcEvents = useMemo(() => {
    return events
      .filter((e) => {
        const typeOk = !filterType ? true : e.type === filterType;
        return typeOk;
      })
      .map((e) => {
        const tentativeMeta = parseTentativeDescription(e.description || '');
        const date = normalizeDateValue(e.date);
        const endDate = normalizeDateValue(e.end_date) || date;
        const isMultiDay = Boolean(endDate && date && endDate > date);
        const start = isMultiDay ? date : `${date}T${normalizeTime(e.start_time)}`;
        const end = isMultiDay ? addDaysYMD(endDate, 1) : `${date}T${normalizeTime(e.end_time)}`;
        const backgroundColor = e.color || EVENT_COLORS[e.type] || '#3b82f6';
        const host = e.creator_name || 'Unknown';
        const done = isEventDone(e);
        const dateRangeText = isMultiDay ? `${date} to ${endDate}` : date;
        const hasAttachment = Number(e.attachment_count || 0) > 0;
        const tooltip = `${e.title} - ${dateRangeText} ${formatTimeShort(e.start_time)}–${formatTimeShort(e.end_time)}\nHost: ${host}${tentativeMeta.isTentative ? `\nSchedule: Tentative${tentativeMeta.note ? ` (${tentativeMeta.note})` : ''}` : ''}${hasAttachment ? '\nAttachment: Yes' : ''}${done ? '\nStatus: Done' : ''}`;
        const start_time_raw = normalizeTime(e.start_time);
        const end_time_raw = normalizeTime(e.end_time);
        const canEditThis = !isReadOnlyOffice && (isAdmin || Number(e.created_by) === Number(user?.id));
        return {
          id: String(e.id),
          title: e.title,
          start,
          end,
          backgroundColor,
          borderColor: backgroundColor,
          textColor: '#fff',
          allDay: isMultiDay,
          startEditable: canEditThis && !isMultiDay && !done,
          durationEditable: canEditThis && !isMultiDay && !done,
          classNames: done ? ['fc-event-done'] : [],
          extendedProps: {
            conflict_count: e.conflict_count || 0,
            type: e.type,
            tooltip,
            done,
            has_attachment: hasAttachment,
            is_tentative: tentativeMeta.isTentative,
            tentative_note: tentativeMeta.note || '',
            is_multi_day: isMultiDay,
            end_date: endDate,
            start_time_raw,
            end_time_raw,
            created_by: e.created_by,
            creator_name: e.creator_name,
          },
        };
      });
  }, [events, filterType, isAdmin, isReadOnlyOffice, user?.id, nowTick]);

  const hostModalEvents = useMemo(() => {
    if (!hostModalTarget?.accountId) return [];
    return (events || [])
      .filter((e) => Number(e.created_by) === Number(hostModalTarget.accountId))
      .sort((a, b) => (String(a.date || '') + String(a.start_time || '')).localeCompare(String(b.date || '') + String(b.start_time || '')));
  }, [events, hostModalTarget]);

  if (loading) {
    // we'll flip `loading` off once the first `datesSet` fetch completes
  }

  return (
    <div className="calendar-page">
      <div className="calendar-toolbar">
        <h1 className="calendar-title">Calendar</h1>
      </div>

      <div className="calendar-content">
        <div
          ref={containerRef}
          className={`calendar-main calendar-main-fullcalendar ${hostFilterOpen ? 'host-menu-open' : ''}`}
        >
          <section className="calendar-legend calendar-legend-top">
            <div className="calendar-legend-top-head">
              <h3>Legend</h3>
              <div className="calendar-legend-top-actions">
                <div className="calendar-legend-filter">
                  <label htmlFor="calendar-type-filter">Type:</label>
                  <select
                    id="calendar-type-filter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="meeting">Meeting</option>
                    <option value="zoom">Zoom</option>
                    <option value="event">Event</option>
                  </select>
                </div>
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
                <Link to="/events/new" className="calendar-legend-add">+ Add Schedule</Link>
                <button
                  type="button"
                  className="calendar-legend-toggle"
                  onClick={() => setLegendCollapsed((v) => !v)}
                  aria-expanded={!legendCollapsed}
                >
                  {legendCollapsed ? 'Show Legend' : 'Hide Legend'}
                </button>
              </div>
            </div>
            {!legendCollapsed && (
              <>
                {legendLoading ? (
                  <p className="calendar-legend-empty">Loading…</p>
                ) : clusterLegend.length === 0 ? (
                  <p className="calendar-legend-empty">No clusters found</p>
                ) : (
                  <div
                    className="calendar-cluster-list"
                    style={{ gridTemplateColumns: `repeat(${Math.max(clusterLegend.length, 1)}, minmax(0, 1fr))` }}
                  >
                    {clusterLegend.map((cluster, idx) => (
                      <div
                        key={cluster.id}
                        className={`calendar-cluster-item ${openLegendClusterId === cluster.id ? 'is-open' : ''} ${idx >= clusterLegend.length - 2 ? 'dropdown-right' : ''}`}
                      >
                        <button
                          type="button"
                          className="calendar-cluster-summary"
                          style={{
                            backgroundColor: cluster.color || '#94a3b8',
                            color: textColorForBackground(cluster.color || '#94a3b8'),
                          }}
                          onClick={() => toggleLegendCluster(cluster.id)}
                          aria-expanded={openLegendClusterId === cluster.id}
                        >
                          <span className="calendar-cluster-summary-main">
                            <span className="calendar-cluster-name-short" title={cluster.name}>
                              {clusterShortLabel(cluster.name)}
                            </span>
                          </span>
                          <span className="calendar-cluster-chevron">▾</span>
                        </button>
                        {openLegendClusterId === cluster.id && (
                          <div className="calendar-cluster-dropdown">
                            <div className="calendar-cluster-dropdown-title">
                              <span className="calendar-legend-swatch" style={{ backgroundColor: cluster.color || '#94a3b8' }} />
                              <span>{cluster.name}</span>
                            </div>
                            <ul className="calendar-cluster-offices">
                              {(cluster.offices || []).map((office) => (
                                <li key={office.name} className="calendar-cluster-office-item">
                                  <div className="calendar-legend-item">
                                    <span className="calendar-legend-swatch" style={{ backgroundColor: office.color || cluster.color || '#94a3b8' }} />
                                    <span className="calendar-legend-name">{office.name}</span>
                                  </div>
                                  {Array.isArray(office.divisions) && office.divisions.length > 0 ? (
                                    <ul className="calendar-cluster-divisions">
                                      {office.divisions.map((division) => (
                                        <li key={division} className="calendar-cluster-division-item">
                                          {division}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            timeZone="local"
            initialView="dayGridMonth"
            initialDate={dateParam ? new Date(`${dateParam}T12:00:00`) : undefined}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            buttonText={{
              today: 'Today',
            }}
            views={{
              dayGridMonth: { buttonText: 'Month', titleFormat: { year: 'numeric', month: 'long' } },
              timeGridWeek: { buttonText: 'Week', titleFormat: { year: 'numeric', month: 'long' } },
              timeGridDay: { buttonText: 'Day', titleFormat: { year: 'numeric', month: 'long' } },
            }}
            // Don't show previous/next month days in the month grid,
            // so events only appear in their actual month when you navigate.
            showNonCurrentDates={false}
            height="auto"
            editable={!isReadOnlyOffice}
            selectable
            dayMaxEventRows={5}
            eventDisplay="block"
            displayEventTime={false}
            events={[...holidayEvents, ...fcEvents]}
            datesSet={async (arg) => {
              try {
                setLoading(true);
                setError('');
                activeRangeRef.current = { start: arg.start, end: arg.end };
                setHolidayEvents(holidayEventsForRange(arg.start, arg.end));
                await fetchEventsForRange(arg.start, arg.end);
              } catch (e) {
                console.error(e);
                const msg = e?.message || 'Failed to load events.';
                setError(msg);
                setEvents([]);
              } finally {
                setLoading(false);
              }
            }}
            // handled by container click-capture (more accurate on some Windows setups)
            dateClick={() => {}}
            eventClick={(info) => {
              info.jsEvent.preventDefault();
              if (info.event.extendedProps?.isHoliday) {
                alert(info.event.title);
                return;
              }
              setSelectedEvent(info.event.id);
            }}
            eventDragStart={(arg) => {
              if (isReadOnlyOffice) return;
              const ev = arg?.jsEvent;
              if (ev) lastPointerRef.current = { x: ev.clientX, y: ev.clientY };
              isDraggingRef.current = true;
            }}
            eventDragStop={(arg) => {
              if (isReadOnlyOffice) return;
              const ev = arg?.jsEvent;
              if (ev) lastPointerRef.current = { x: ev.clientX, y: ev.clientY };
              // Clear on next tick so any trailing click won't trigger create
              setTimeout(() => { isDraggingRef.current = false; }, 0);
            }}
            eventDrop={async (info) => {
              if (isReadOnlyOffice) {
                info.revert();
                return;
              }
              try {
                const createdBy = info.event.extendedProps?.created_by;
                const canEditThis = isAdmin || Number(createdBy) === Number(user?.id);
                if (!canEditThis) {
                  info.revert();
                  return;
                }
                const done = Boolean(info.event.extendedProps?.done);
                if (done) {
                  alert('This event is already done and is view-only.');
                  info.revert();
                  return;
                }
                lastDropAtRef.current = Date.now();
                // Correct the date using the real pointer position (fixes adjacent-cell drops)
                const { x, y } = lastPointerRef.current || { x: 0, y: 0 };
                const intendedDate = x || y
                  ? (getDateFromRects(containerRef.current, x, y) || getDateFromPoint(x, y))
                  : null;

                const start = info.event.start;
                const end = info.event.end || start;
                const fcDate = toLocalDateString(start);
                const date = intendedDate || fcDate;
                if (isWeekendYMD(date)) {
                  alert('Weekends are locked. Please drop on a weekday.');
                  info.revert();
                  return;
                }

                // Prefer backend-stored times to avoid timezone quirks
                const start_time = info.event.extendedProps?.start_time_raw
                  || `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}:00`;
                const end_time = info.event.extendedProps?.end_time_raw
                  || `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}:00`;

                // If FullCalendar dropped to the wrong day, revert the visual move and apply the correct one.
                if (intendedDate && intendedDate !== fcDate) {
                  info.revert();
                }
                if (isAdmin) {
                  // For admins, always confirm and ask reason before saving move.
                  info.revert();
                  setMoveReason('');
                  setPendingMove({
                    id: info.event.id,
                    title: info.event.title,
                    date,
                    start_time,
                    end_time,
                  });
                  return;
                }

                await eventsApi.update(info.event.id, { date, start_time, end_time });
                await refreshData();
              } catch (e) {
                alert(e.message || 'Failed to reschedule.');
                info.revert();
              }
            }}
            eventResize={async (info) => {
              if (isReadOnlyOffice) {
                info.revert();
                return;
              }
              try {
                const createdBy = info.event.extendedProps?.created_by;
                const canEditThis = isAdmin || Number(createdBy) === Number(user?.id);
                if (!canEditThis) {
                  info.revert();
                  return;
                }
                const done = Boolean(info.event.extendedProps?.done);
                if (done) {
                  alert('This event is already done and is view-only.');
                  info.revert();
                  return;
                }
                const start = info.event.start;
                const end = info.event.end || start;
                const date = toLocalDateString(start);
                if (isWeekendYMD(date)) {
                  alert('Weekends are locked. Please use a weekday.');
                  info.revert();
                  return;
                }
                const start_time = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}:00`;
                const end_time = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}:00`;
                await eventsApi.update(info.event.id, { date, start_time, end_time });
                await refreshData();
              } catch (e) {
                alert(e.message || 'Failed to resize.');
                info.revert();
              }
            }}
            eventContent={(arg) => {
              const conflict = (arg.event.extendedProps?.conflict_count || 0) > 0;
              const tooltip = arg.event.extendedProps?.tooltip || arg.event.title;
              const done = Boolean(arg.event.extendedProps?.done);
              const hasAttachment = Boolean(arg.event.extendedProps?.has_attachment);
              const isTentative = Boolean(arg.event.extendedProps?.is_tentative);
              const isHoliday = Boolean(arg.event.extendedProps?.isHoliday);
              return (
                <div className={`fc-event-title-wrap ${conflict ? 'fc-event-conflict' : ''}`} title={tooltip}>
                  {isHoliday && <span className="fc-event-holiday-badge">Holiday</span>}
                  {done && <span className="fc-event-done-badge">Done</span>}
                  {isTentative && <span className="fc-event-tentative-badge">T</span>}
                  {hasAttachment && <span className="fc-event-attachment-badge" title="Has attachment">●</span>}
                  {conflict && <span className="fc-event-conflict-dot">● </span>}
                  <span className="fc-event-title-text">{arg.event.title}</span>
                </div>
              );
            }}
            windowResize={() => {
              const api = calendarRef.current?.getApi?.();
              if (api) api.updateSize();
            }}
          />
          {loading && <div className="calendar-loading">Loading calendar...</div>}
          {error && (
            <div className="calendar-loading" style={{ position: 'static', padding: '1rem', color: 'var(--danger, #dc2626)' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <EventModal
          eventId={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => setSelectedEvent(null)}
          onDelete={() => { refreshData(); setSelectedEvent(null); }}
        />
      )}

      {hostModalTarget && (
        <div className="calendar-host-modal-overlay" onClick={() => setHostModalTarget(null)}>
          <div className="calendar-host-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-host-modal-head">
              <h3>{hostModalTarget.label}</h3>
              <button type="button" className="calendar-host-modal-close" onClick={() => setHostModalTarget(null)}>×</button>
            </div>
            <p className="calendar-host-modal-subtitle">Hosted events in current loaded range</p>
            {hostModalEvents.length === 0 ? (
              <p className="calendar-host-modal-empty">No events found for this host.</p>
            ) : (
              <ul className="calendar-host-modal-list">
                {hostModalEvents.map((e) => (
                  <li key={e.id} className="calendar-host-modal-item">
                    <button type="button" onClick={() => { setHostModalTarget(null); setSelectedEvent(e.id); }}>
                      <span className="calendar-host-modal-title">{e.title}</span>
                      <span className="calendar-host-modal-meta">
                        {normalizeDateValue(e.date)} {formatTimeShort(e.start_time)}–{formatTimeShort(e.end_time)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {pendingMove && (
        <div className="calendar-move-modal-overlay" onClick={cancelPendingMove}>
          <div className="calendar-move-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Move Event</h3>
            <p className="calendar-move-modal-text">
              You are moving <strong>{pendingMove.title}</strong> to <strong>{pendingMove.date}</strong>{' '}
              ({formatTimeShort(pendingMove.start_time)} - {formatTimeShort(pendingMove.end_time)}).
            </p>
            <label className="calendar-move-modal-label">
              Reason for moving <span className="required">*</span>
              <textarea
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
                placeholder="Enter reason"
                rows={3}
                disabled={moveSubmitting}
              />
            </label>
            <div className="calendar-move-modal-actions">
              <button type="button" className="calendar-move-cancel" onClick={cancelPendingMove} disabled={moveSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                className="calendar-move-confirm"
                onClick={confirmPendingMove}
                disabled={moveSubmitting || !moveReason.trim()}
              >
                {moveSubmitting ? 'Saving...' : 'Confirm Move'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
