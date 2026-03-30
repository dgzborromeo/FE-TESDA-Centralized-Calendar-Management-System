import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { events as eventsApi, users as usersApi, config as configApi } from '../api';
import EventModal from '../components/EventModal';
import { useAppDialog } from '../components/AppDialogProvider';
import { useAuth } from '../context/AuthContext';
import { parseTentativeDescription } from '../utils/tentativeSchedule';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './Calendar.css';
import ParticipantsCalendarView from '../components/ParticipantsCalendarView';
import LoginRequiredModal from '../components/LoginRequiredModal';

// Calendar color palette (aligned with design brief)
// Deep Navy    #1F3A5F - primary / headers
// Steel Blue   #4F6D8A - secondary
// Charcoal     #2E2E2E - text
// Cool Gray    #9AA5B1 - labels / grid
// Orange 40%   #F28E2B @ 0.4 alpha - alerts / highlights
// Teal         #3F8F8C - positive metrics
const EVENT_COLORS = {
  'face-to-face': '#1F3A5F', // deep navy
  hybrid: '#3F8F8C', // teal
  virtual: '#F28E2B', // orange highlight
};
const HOLIDAY_COLOR = '#4F6D8A';

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

function formatEventDateLong(dateYmd, endDateYmd, startTime, endTime) {
  if (!dateYmd) return '';
  const d = new Date(`${String(dateYmd).slice(0, 10)}T12:00:00`);
  const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const start = formatTimeShort(startTime);
  const end = formatTimeShort(endTime);
  if (start && end && start !== end) return `${dayStr} • ${start} - ${end}`;
  return start ? `${dayStr} • ${start}` : dayStr;
}

function getEventTypeLabel(type) {
  if (!type) return 'Event';
  const s = String(type).toLowerCase();
  if (s === 'face-to-face' || s === 'meeting' || s === 'event') return 'Face to Face';
  if (s === 'hybrid') return 'Hybrid';
  if (s === 'virtual' || s === 'zoom') return 'Virtual/Zoom';
  return type;
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

function getMultiDayProgressMeta(eventLike, now = new Date()) {
  const ext = eventLike?.extendedProps || {};
  if (!ext?.is_multi_day) return null;

  const startDate = normalizeDateValue(ext.start_date || eventLike?.start);
  const endDate = normalizeDateValue(ext.end_date);
  if (!startDate || !endDate) return null;

  const startAt = new Date(`${startDate}T00:00:00`);
  const endAt = new Date(`${endDate}T23:59:59`);
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt < startAt) {
    return null;
  }

  const totalMs = Math.max(1, endAt.getTime() - startAt.getTime());
  const elapsedMs = now.getTime() - startAt.getTime();
  const percent = Math.max(0, Math.min(100, Math.round((elapsedMs / totalMs) * 100)));

  const startNoon = new Date(`${startDate}T12:00:00`);
  const endNoon = new Date(`${endDate}T12:00:00`);
  const totalDays = Math.max(1, Math.round((endNoon.getTime() - startNoon.getTime()) / 86400000) + 1);
  const todayYmd = toLocalDateString(now);
  const todayNoon = new Date(`${todayYmd}T12:00:00`);

  let dayLabel = `Day 1 of ${totalDays}`;
  if (now < startAt) {
    const daysUntilStart = Math.max(
      0,
      Math.round((startNoon.getTime() - todayNoon.getTime()) / 86400000)
    );
    dayLabel = daysUntilStart <= 0
      ? 'Starts today'
      : `Starts in ${daysUntilStart} day${daysUntilStart > 1 ? 's' : ''}`;
  } else if (now > endAt) {
    dayLabel = `Completed (${totalDays}/${totalDays} days)`;
  } else {
    const dayNumber = Math.max(
      1,
      Math.min(totalDays, Math.round((todayNoon.getTime() - startNoon.getTime()) / 86400000) + 1)
    );
    dayLabel = `Day ${dayNumber} of ${totalDays}`;
  }

  return { percent, dayLabel };
}

function getEventStartReminder(eventLike, now = new Date()) {
  const ext = eventLike?.extendedProps || {};
  if (ext?.isHoliday) return '';

  const startDate = normalizeDateValue(ext.start_date || eventLike?.start);
  if (!startDate) return '';

  const startTimeRaw = normalizeTime(ext.start_time_raw || '00:00:00');
  const startAt = new Date(`${startDate}T${startTimeRaw}`);
  if (!Number.isFinite(startAt.getTime()) || now >= startAt) return '';

  const todayYmd = toLocalDateString(now);
  const todayNoon = new Date(`${todayYmd}T12:00:00`);
  const startNoon = new Date(`${startDate}T12:00:00`);
  const daysUntilStart = Math.max(
    0,
    Math.round((startNoon.getTime() - todayNoon.getTime()) / 86400000)
  );

  if (daysUntilStart <= 0) return 'Starts today';
  return `Starts in ${daysUntilStart} day${daysUntilStart > 1 ? 's' : ''}`;
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

const PARTICIPANT_LEGEND_ITEMS = [
  // DG red
  { key: 'osec', label: 'DG', color: '#ef4444' },
  // DDGs pink
  { key: 'ddgs', label: 'DDGs', color: '#ec4899' },
  // EDs cyan
  { key: 'eds', label: 'EDs', color: '#06b6d4' },
  // RDs orange
  { key: 'rds', label: 'RDs', color: '#f97316' },
  // PDs/DDs purple
  { key: 'pds_dds', label: 'PDs/DDs', color: '#a855f7' },
  // AEDs light blue
  { key: 'aeds', label: 'AEDs', color: '#93c5fd' },
  // ADMIN green
  { key: 'admin', label: 'ADMIN', color: '#22c55e' },
  // CHIEF blue
  { key: 'chief', label: 'CHIEF', color: '#3b82f6' },
  // FOCALS yellow
  { key: 'focals', label: 'FOCALS', color: '#eab308' },
];

function inferParticipantKeys(participantsArr, hasOsecParticipant) {
  const parts = Array.isArray(participantsArr) ? participantsArr : [];
  const out = new Set();

  if (hasOsecParticipant) out.add('osec');

  for (const p of parts) {
    if (!p) continue;
    const rawName =
      typeof p === 'string'
        ? p
        : p.label || p.name || p.category_name || p.focal_name || '';
    const name = String(rawName || '').toLowerCase();
    if (!name) continue;

    // Director General / OSEC
    if (name.includes('director general') && !name.includes('deputy') && !name.includes('assistant')) out.add('osec');
    if (name.includes('osec')) out.add('osec');

    // Deputy Director General
    if (name.includes('deputy director general') || name.includes('ddg')) out.add('ddgs');

    // Executive Director
    if (name.includes('executive director')) out.add('eds');

    // Regional Director
    if (name.includes('regional director')) out.add('rds');

    // Provincial Director / District Director
    if (name.includes('provincial director') || name.includes('district director')) out.add('pds_dds');

    // Assistant Executive Director
    if (name.includes('assistant executive director') || name.includes('aed')) out.add('aeds');

    // Admin Officer / Administrative
    if (name.includes('admin')) out.add('admin');

    // Chief
    if (name.includes('chief')) out.add('chief');

    // Focal
    if (name.includes('focal')) out.add('focals');
  }

  // If any selected participant is a focal source object, tag as focals
  if (parts.some((p) => p && typeof p === 'object' && String(p.source || '').toLowerCase() === 'focal')) {
    out.add('focals');
  }

  return Array.from(out);
}

function participantMetaForEvent(participantsArr, hasOsecParticipant) {
  const keys = inferParticipantKeys(participantsArr, hasOsecParticipant);
  const byKey = new Map(PARTICIPANT_LEGEND_ITEMS.map((i) => [i.key, i]));
  const primaryKey = keys[0] || '';
  const primary = primaryKey ? byKey.get(primaryKey) : null;
  return {
    keys,
    primaryKey,
    label: primary?.label || (keys.length ? String(keys[0]).toUpperCase() : 'No participant'),
    color: primary?.color || '#94a3b8',
  };
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
  const dialog = useAppDialog();
  const isPublicView = !user;
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
  const isReadOnlyOffice =
    isRomo || isPo || isSmo || isCo || isIcto || isAs || isPlo || isPio || isQso || isFms || isClgeo || isEbeto;
  // Treat only not-logged-in users as view-only; any signed-in account can create events.
  const isViewerLike = !user;
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [eventHover, setEventHover] = useState(null);
  const eventHoverLeaveRef = useRef(null);
  const hoverRafRef = useRef(null);
  const [filterType, setFilterType] = useState('');
  const [hostModalTarget, setHostModalTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('offices');
  const [activeParticipantKey, setActiveParticipantKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [openLegendClusterId, setOpenLegendClusterId] = useState(null);
  const [hostLegendFilter, setHostLegendFilter] = useState(null); // { kind:'cluster'|'office', clusterId, officeName, label, accountIds:Set<number> }
  const [nowTick, setNowTick] = useState(0);
  const [pendingMove, setPendingMove] = useState(null);
  const [moveReason, setMoveReason] = useState('');
  const [moveSubmitting, setMoveSubmitting] = useState(false);
  const [isSidePanelHidden, setIsSidePanelHidden] = useState(false);

  const activeRangeRef = useRef({ start: null, end: null });
    // Idagdag ito sa tabi ng iba pang useState
const [categories, setCategories] = useState([]);
const [filterParticipant, setFilterParticipant] = useState('');
const [filterHost, setFilterHost] = useState('');

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

    const onClickCapture = async (e) => {
      // Public / viewer-like accounts are view-only: do not open create-event form on day click.
      if (isViewerLike) return;

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
        await dialog.alert('Weekends are locked. Please select a weekday.', { title: 'Date Not Allowed' });
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (isViewerLike) {
        setShowLoginModal(true);
        return;
      }
      navigate('/simple-event-form', { state: { backTo: '/calendar' } });
    };

    el.addEventListener('click', onClickCapture, true);
    return () => el.removeEventListener('click', onClickCapture, true);
  }, [navigate, dialog, isViewerLike]);

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
    // Categories are only needed for the (currently hidden) participant filter UI.
    // Avoid calling a missing endpoint and spamming the console with 404s.
    setCategories([]);
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
      await dialog.alert(e.message || 'Failed to reschedule.', { title: 'Action Failed' });
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

const hostOptions = useMemo(() => {
  if (!users.length || !clusterLegend.length) return [];

  // 1. Pre-process users into a fast-lookup map by email prefix (code)
  const userMapByCode = new Map();
  users.forEach(u => {
    const email = (u.email || '').toLowerCase();
    const code = email.split('@')[0];
    if (code && !code.startsWith('cluster.')) {
      userMapByCode.set(code, u);
    }
  });

  // 2. Map clusters and offices
  return clusterLegend.map((cluster) => {
    const items = [];
    
    // Cluster Account
    const clusterAccountId = Number(cluster?.account?.id);
    if (clusterAccountId > 0) {
      items.push({
        key: `${cluster.id}-cluster`,
        label: cluster.name,
        short: clusterShortLabel(cluster.name),
        color: cluster.color || '#94a3b8',
        accountId: clusterAccountId,
      });
    }

    // Office Accounts
    (cluster.offices || []).forEach(office => {
      const codes = extractCodesFromName(office.name);
      for (const code of codes) {
        const matchedUser = userMapByCode.get(code.toLowerCase());
        if (matchedUser) {
          items.push({
            key: `${cluster.id}-${office.name}`,
            label: office.name,
            short: clusterShortLabel(office.name),
            color: office.color || cluster.color || '#94a3b8',
            accountId: Number(matchedUser.id),
          });
          break; // Stop after first match
        }
      }
    });

    // Special case: OSEC cluster — add osec@tesda.gov.ph user if exists
    if (cluster.id === 'osec') {
      const osecUser = userMapByCode.get('osec');
      if (osecUser && !items.find(i => i.accountId === Number(osecUser.id))) {
        items.push({
          key: `${cluster.id}-OSEC`,
          label: 'Office of the Secretary (OSEC)',
          short: 'OSEC',
          color: cluster.color || '#ef4444',
          accountId: Number(osecUser.id),
        });
      }
    }

    return {
      clusterId: cluster.id,
      clusterName: cluster.name,
      items,
    };
  }).filter(g => g.items.length > 0);
}, [clusterLegend, users]);


  const hostClusterOptionMap = useMemo(() => {
    const out = new Map();
    for (const group of hostOptions) {
      const clusterKey = `${group.clusterId}-cluster`;
      const clusterOpt = group.items.find((i) => i.key === clusterKey) || null;
      if (clusterOpt) out.set(group.clusterId, clusterOpt);
    }
    return out;
  }, [hostOptions]);

  const hostOfficeOptionMap = useMemo(() => {
    const out = new Map();
    for (const group of hostOptions) {
      const clusterKey = `${group.clusterId}-cluster`;
      for (const item of group.items) {
        if (item.key === clusterKey) continue;
        out.set(`${group.clusterId}::${item.label}`, item);
      }
    }
    return out;
  }, [hostOptions]);

  const hostAccountIdsByCluster = useMemo(() => {
    const out = new Map();
    for (const group of hostOptions) {
      const ids = new Set(
        (group.items || [])
          .map((i) => Number(i?.accountId))
          .filter((n) => Number.isFinite(n) && n > 0)
      );
      if (ids.size) out.set(group.clusterId, ids);
    }
    return out;
  }, [hostOptions]);

  const hostClusterNameById = useMemo(() => {
    const out = new Map();
    for (const group of hostOptions) out.set(group.clusterId, group.clusterName);
    return out;
  }, [hostOptions]);

  const clearHostLegendFilter = () => setHostLegendFilter(null);

  const toggleHostLegendFilterCluster = async (clusterId) => {
    const ids = hostAccountIdsByCluster.get(clusterId) || null;
    if (!ids || ids.size === 0) {
      await dialog.alert('No host accounts found for this cluster.', { title: 'Unavailable' });
      return;
    }
    const label = hostClusterNameById.get(clusterId) || 'Cluster';
    setHostLegendFilter((prev) => {
      if (prev?.kind === 'cluster' && prev?.clusterId === clusterId) return null;
      return { kind: 'cluster', clusterId, officeName: '', label, accountIds: ids };
    });
    setOpenLegendClusterId(null);
  };

  const toggleHostLegendFilterOffice = async (clusterId, officeName) => {
    const officeOpt = hostOfficeOptionMap.get(`${clusterId}::${officeName}`) || null;
    const id = Number(officeOpt?.accountId);
    if (!Number.isFinite(id) || id <= 0) {
      await dialog.alert('No host account found for this office.', { title: 'Unavailable' });
      return;
    }
    setHostLegendFilter((prev) => {
      if (prev?.kind === 'office' && prev?.clusterId === clusterId && prev?.officeName === officeName) return null;
      return {
        kind: 'office',
        clusterId,
        officeName,
        label: officeName,
        accountIds: new Set([id]),
      };
    });
    setOpenLegendClusterId(null);
  };

  // Backwards compatibility (if anything still uses it): treat it as office filter by accountId
  const openHostEventsTarget = async (target) => {
    const id = Number(target?.accountId);
    if (!Number.isFinite(id) || id <= 0) {
      await dialog.alert('No host account found for this selection.', { title: 'Unavailable' });
      return;
    }
    setHostLegendFilter((prev) => {
      if (prev?.kind === 'office' && prev?.accountIds?.has?.(id) && prev?.accountIds?.size === 1) return null;
      return { kind: 'office', clusterId: null, officeName: target?.label || '', label: target?.label || 'Host', accountIds: new Set([id]) };
    });
  };

  function isEventDone(e) {
    const date = normalizeDateValue(e?.date);
    const endDate = normalizeDateValue(e?.end_date) || date;
    const endRaw = normalizeTime(e?.end_time);
    if (!date || !endDate || !endRaw) return false;
    const endAt = new Date(`${endDate}T${endRaw}`);
    if (!Number.isFinite(endAt.getTime())) return false;
    return new Date() >= endAt;
  }

function hostAcronymFromName(fullName) {
  const raw = String(fullName || '').trim();
  if (!raw) return '';
  const parenthetical = raw.match(/\(([^()]+)\)$/);
  if (parenthetical?.[1]) return String(parenthetical[1]).trim().toUpperCase();
  const words = raw.split(/\s+/).filter(Boolean);
  return (
    words
      .slice(0, 6)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || raw.slice(0, 8).toUpperCase()
  );
}

function softenColor(hexColor, factor = 0.16) {
  const hex = String(hexColor || '').replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '#ffffff';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const mix = (c) => Math.round(255 - (255 - c) * factor);
  const nr = mix(r).toString(16).padStart(2, '0');
  const ng = mix(g).toString(16).padStart(2, '0');
  const nb = mix(b).toString(16).padStart(2, '0');
  return `#${nr}${ng}${nb}`;
}
const parsedEvents = useMemo(() => {
  return events.map(e => {
    let participantsArr = [];
    const raw = String(e.participants || '').trim();
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) participantsArr = parsed;
      } catch { participantsArr = []; }
    } else if (raw) {
      // Plain text — comma-separated (from promoted schedules)
      participantsArr = raw.split(',').map(s => s.trim()).filter(Boolean);
    }
    return { ...e, _parsedParticipants: participantsArr };
  });
}, [events]);

const sortedHostDropdownOptions = useMemo(() => {
  return users
    .filter(u => u.name && !u.name.toLowerCase().includes('cluster'))
    .map(u => {
      const match = u.name.match(/\(([^)]+)\)/);
      return { 
        id: u.id, 
        shortName: match ? match[1] : u.name 
      };
    })
    .sort((a, b) => a.shortName.localeCompare(b.shortName));
}, [users]);

 const fcEvents = useMemo(() => {
return parsedEvents
    .filter((e) => {
      const typeOk = !filterType ? true : e.type === filterType;
      
      // I-check kung typeOk muna bago mag-filter ng participant
      if (!typeOk) return false;

      // Participants tab quick filter (legend)
      if (activeTab === 'participants' && activeParticipantKey) {
        const meta = participantMetaForEvent(e._parsedParticipants || [], Boolean(e.has_osec_participant));
        if (!meta.keys.includes(activeParticipantKey)) return false;
      }

      // Filter by Participant
      if (filterParticipant) {
        const targetId = Number(filterParticipant);
        // Siguraduhin na ang _parsedParticipants ay array para hindi mag-crash
        const participants = e._parsedParticipants || [];
        const hasMatch = participants.some(p => 
          (p.source === 'category' && Number(p.id) === targetId) || 
          (p.source === 'focal' && Number(p.parent_id) === targetId)
        );
        if (!hasMatch) return false;
      }
      // --- ADD THIS: Filter by Host ---
      if (filterHost) {
        if (Number(e.created_by) !== Number(filterHost)) return false;
      }

      // Filter by Host via legend click (cluster/office)
      if (hostLegendFilter?.accountIds?.size) {
        const hostId = Number(e.created_by);
        if (!hostLegendFilter.accountIds.has(hostId)) return false;
      }

      return true;
      })
      .map((e) => {
        const tentativeMeta = parseTentativeDescription(e.description || '');
        const date = normalizeDateValue(e.date);
        const endDate = normalizeDateValue(e.end_date) || date;
        const isMultiDay = Boolean(endDate && date && endDate > date);
        const start = isMultiDay ? date : `${date}T${normalizeTime(e.start_time)}`;
        const end = isMultiDay ? addDaysYMD(endDate, 1) : `${date}T${normalizeTime(e.end_time)}`;
        const host = e.creator_name || 'Unknown';
        const hostColor = e.color || EVENT_COLORS[e.type] || '#1f3a5f';
        // Match the reference "clean card" look: light background + subtle border.
        // Status is indicated via badges (Completed / [TENTATIVE]) and text colors.
        const isTentativeStatus = tentativeMeta.isTentative;
        const backgroundColor = isTentativeStatus ? 'rgba(250, 204, 21, 0.14)' : '#ffffff';
        // Keep border neutral; we color only the left stripe via `eventDidMount`.
        const borderColor = '#cbd5e1';
        const done = isEventDone(e);
        const cancelled = String(e.status || 'active').toLowerCase() === 'cancelled';
        const postDocCount = Number(e.post_document_count || 0);
        const hostNeedsPostDoc = done && !cancelled && Number(e.created_by) === Number(user?.id) && postDocCount === 0;
        const dateRangeText = isMultiDay ? `${date} to ${endDate}` : date;
        const hasAttachment = Number(e.attachment_count || 0) > 0;
        const participantMeta = participantMetaForEvent(e._parsedParticipants || [], Boolean(e.has_osec_participant));
        const typeLabel = getEventTypeLabel(e.type);
        const tooltip = `${e.title} - ${dateRangeText} ${formatTimeShort(e.start_time)}–${formatTimeShort(e.end_time)}\nType: ${typeLabel}\nHost: ${host}${e.has_osec_participant ? '\nParticipant: DG' : ''}${tentativeMeta.isTentative ? `\nSchedule: Tentative${tentativeMeta.note ? ` (${tentativeMeta.note})` : ''}` : ''}${hasAttachment ? '\nAttachment: Yes' : ''}${done ? '\nStatus: Done' : ''}${cancelled ? '\nStatus: Cancelled' : ''}${hostNeedsPostDoc ? '\nRequired: Upload AAR/Minutes' : ''}`;
        const start_time_raw = normalizeTime(e.start_time);
        const end_time_raw = normalizeTime(e.end_time);
        const canEditThis = !isReadOnlyOffice && (isAdmin || Number(e.created_by) === Number(user?.id));
        return {
          id: String(e.id),
          title: e.title,
          start,
          end,
          backgroundColor: cancelled ? 'rgba(127, 29, 29, 0.9)' : backgroundColor,
          borderColor: cancelled ? 'rgba(127, 29, 29, 0.98)' : borderColor,
          textColor: '#2e2e2e',
          allDay: isMultiDay,
          startEditable: activeTab !== 'participants' && canEditThis && !isMultiDay && !done && !cancelled,
          durationEditable: activeTab !== 'participants' && canEditThis && !isMultiDay && !done && !cancelled,
          classNames: [
            ...(done ? ['fc-event-done'] : []),
            ...(cancelled ? ['fc-event-cancelled'] : []),
            ...(tentativeMeta.isTentative ? ['fc-event-tentative'] : []),
          ],
          extendedProps: {
            conflict_count: e.conflict_count || 0,
            type: e.type,
            tooltip,
            done,
            cancelled,
            post_document_count: postDocCount,
            host_needs_postdoc: hostNeedsPostDoc,
            has_attachment: hasAttachment,
            has_osec_participant: Boolean(e.has_osec_participant),
            participant_key: participantMeta.primaryKey,
            participant_label: participantMeta.label,
            participant_color: participantMeta.color,
            participant_keys: participantMeta.keys,
            is_tentative: tentativeMeta.isTentative,
            tentative_note: tentativeMeta.note || '',
            is_multi_day: isMultiDay,
            start_date: date,
            end_date: endDate,
            start_time_raw,
            end_time_raw,
            created_by: e.created_by,
            creator_name: e.creator_name,
            host_color: hostColor,
            host_acronym: hostAcronymFromName(host),
            location: e.location || '',
            description: (parseTentativeDescription(e.description || '').plainDescription || e.description || '').slice(0, 300),
            date_formatted: formatEventDateLong(date, endDate, e.start_time, e.end_time),
            type_label: getEventTypeLabel(e.type),
          },
        };
      });
 }, [parsedEvents, filterType, filterHost, hostLegendFilter, filterParticipant, activeTab, activeParticipantKey, isAdmin, isReadOnlyOffice, user?.id, nowTick]);

  const hasSidebarFilter = useMemo(
    () => Boolean(hostLegendFilter?.accountIds?.size || (activeTab === 'participants' && activeParticipantKey)),
    [hostLegendFilter, activeTab, activeParticipantKey]
  );

  const sidebarEvents = hasSidebarFilter ? fcEvents.slice(0, 50) : [];

  useEffect(() => {
    if (!hasSidebarFilter) {
      setIsSidePanelHidden(false);
    }
  }, [hasSidebarFilter]);

  const hostModalEvents = useMemo(() => {
    if (!hostModalTarget?.accountId) return [];
    return (events || [])
      .filter((e) => Number(e.created_by) === Number(hostModalTarget.accountId))
      .sort((a, b) => (String(a.date || '') + String(a.start_time || '')).localeCompare(String(b.date || '') + String(b.start_time || '')));
  }, [events, hostModalTarget]);

  const syncToolbarTabs = () => {
    const root = containerRef.current;
    if (!root) return;
    const officesBtn = root.querySelector?.('.fc-officesTab-button');
    const participantsBtn = root.querySelector?.('.fc-participantsTab-button');
    if (officesBtn) officesBtn.classList.toggle('is-active', activeTab === 'offices');
    if (participantsBtn) participantsBtn.classList.toggle('is-active', activeTab === 'participants');
    const group = officesBtn?.closest?.('.fc-button-group') || participantsBtn?.closest?.('.fc-button-group') || null;
    if (group) group.classList.add('fc-calendar-tabs');
  };

  useEffect(() => {
    syncToolbarTabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (loading) {
    // we'll flip `loading` off once the first `datesSet` fetch completes
  }

  return (
    <div className="calendar-page">
      <div className="calendar-content">
        <div
          ref={containerRef}
          className="calendar-main calendar-main-fullcalendar"
        >
          <section className="calendar-legend calendar-legend-top">
            <div className="calendar-legend-top-head">
              <h3>Legend</h3>
              <div className="calendar-legend-top-actions">
                <div className="calendar-legend-filter">
                  {/* Host & Participant filters temporarily disabled
                  <label htmlFor="calendar-host-filter">Host:</label>
                  <select
                    id="calendar-host-filter"
                    value={filterHost}
                    onChange={(e) => setFilterHost(e.target.value)}
                  >
                    <option value="">All Hosts</option>
                    {sortedHostDropdownOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.shortName}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="calendar-participant-filter">Participant:</label>
                  <select
                    id="calendar-participant-filter"
                    value={filterParticipant}
                    onChange={(e) => setFilterParticipant(e.target.value)}
                  >
                    <option value="">All Participants</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.category_name || cat.name}
                      </option>
                    ))}
                  </select>
                  */}
                </div>
                {activeTab === 'offices' && hostLegendFilter?.accountIds?.size ? (
                  <>
                    <button
                      type="button"
                      className="calendar-legend-active-host-filter"
                      onClick={clearHostLegendFilter}
                      title="Clear host filter"
                    >
                      Filtered: {hostLegendFilter.label} <span aria-hidden>×</span>
                    </button>
                    <button
                      type="button"
                      className="calendar-cluster-reset-btn"
                      onClick={() => {
                        clearHostLegendFilter();
                        setHostModalTarget(null);
                      }}
                      title="Reset calendar filter"
                      aria-label="Reset calendar filter"
                    >
                      Reset
                    </button>
                  </>
                ) : null}
                {activeTab === 'participants' && activeParticipantKey ? (() => {
                  const activeLegend = PARTICIPANT_LEGEND_ITEMS.find((i) => i.key === activeParticipantKey);
                  return (
                    <>
                      <button
                        type="button"
                        className="calendar-legend-active-host-filter"
                        onClick={() => setActiveParticipantKey('')}
                        title="Clear participant filter"
                      >
                        {activeLegend && (
                          <span
                            className="calendar-legend-active-dot"
                            style={{ backgroundColor: activeLegend.color }}
                          />
                        )}
                        <span className="calendar-legend-active-label">
                          {activeLegend?.label || activeParticipantKey}
                        </span>
                        <span aria-hidden>×</span>
                      </button>
                      <button
                        type="button"
                        className="calendar-cluster-reset-btn"
                        onClick={() => setActiveParticipantKey('')}
                        title="Reset participant filter"
                        aria-label="Reset participant filter"
                      >
                        Reset
                      </button>
                    </>
                  );
                })() : null}

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
                {activeTab === 'participants' ? (
                  <div className="calendar-participant-legend">
                    {PARTICIPANT_LEGEND_ITEMS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`calendar-legend-item calendar-legend-item-btn ${
                          activeParticipantKey === item.key ? 'is-active' : ''
                        }`}
                        style={{ '--participant-color': item.color }}
                        onClick={() =>
                          setActiveParticipantKey((prev) => (prev === item.key ? '' : item.key))
                        }
                        title={item.label}
                      >
                        <span
                          className="calendar-legend-swatch"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="calendar-legend-name">{item.label}</span>
                      </button>
                    ))}
                  </div>
                ) : legendLoading ? (
                  <p className="calendar-legend-empty">Loading…</p>
                ) : clusterLegend.length === 0 ? (
                  <p className="calendar-legend-empty">No clusters found</p>
                ) : (
                  <div
                    className="calendar-cluster-list"
                    style={{ gridTemplateColumns: `repeat(${Math.max(clusterLegend.length + 1, 1)}, minmax(0, 1fr))` }}
                  >
                    {clusterLegend.map((cluster, idx) => (
                      <div
                        key={cluster.id}
                        className={`calendar-cluster-item ${openLegendClusterId === cluster.id ? 'is-open' : ''} ${idx >= clusterLegend.length - 2 ? 'dropdown-right' : ''}`}
                      >
                        <button
                          type="button"
                          className={`calendar-cluster-summary ${
                            hostLegendFilter?.accountIds?.size && (
                              (hostLegendFilter?.kind === 'cluster' && hostLegendFilter?.clusterId === cluster.id) ||
                              (hostLegendFilter?.kind === 'office' && hostLegendFilter?.clusterId === cluster.id)
                            ) ? 'is-filtered' : ''
                          }`}
                          style={{ '--cluster-color': cluster.color || '#94a3b8' }}
                          onClick={() => {
                            toggleLegendCluster(cluster.id);
                          }}
                          aria-expanded={openLegendClusterId === cluster.id}
                          aria-label={`Toggle offices under ${cluster.name}`}
                          title={`Show offices under ${cluster.name}`}
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
                            {(() => {
                              const clusterOpt = hostClusterOptionMap.get(cluster.id) || null;
                              if (!clusterOpt) {
                                return (
                                  <div className="calendar-cluster-dropdown-title">
                                    <span className="calendar-legend-swatch" style={{ backgroundColor: cluster.color || '#94a3b8' }} />
                                    <span>{cluster.name}</span>
                                  </div>
                                );
                              }
                              return (
                                <button
                                  type="button"
                                  className="calendar-cluster-dropdown-title calendar-cluster-dropdown-title-btn"
                                  onClick={() => { void toggleHostLegendFilterCluster(cluster.id); }}
                                  title={`Filter hosted events: ${cluster.name}`}
                                >
                                  <span className="calendar-legend-swatch" style={{ backgroundColor: cluster.color || '#94a3b8' }} />
                                  <span>{cluster.name}</span>
                                  <span className="calendar-host-link-badge calendar-host-link-badge-office">Host</span>
                                </button>
                              );
                            })()}
                            <ul className="calendar-cluster-offices">
                              {(cluster.offices || []).map((office) => (
                                <li key={office.name} className="calendar-cluster-office-item">
                                  {(() => {
                                    const officeOpt = hostOfficeOptionMap.get(`${cluster.id}::${office.name}`) || null;
                                    if (!officeOpt) {
                                      return (
                                        <div className="calendar-legend-item">
                                          <span className="calendar-legend-swatch" style={{ backgroundColor: office.color || cluster.color || '#94a3b8' }} />
                                          <span className="calendar-legend-name">{office.name}</span>
                                        </div>
                                      );
                                    }
                                    return (
                                      <button
                                        type="button"
                                        className={`calendar-legend-item calendar-legend-item-btn ${
                                          hostLegendFilter?.kind === 'office' && hostLegendFilter?.officeName === office.name
                                            ? 'is-active'
                                            : ''
                                        }`}
                                        onClick={() => { void toggleHostLegendFilterOffice(cluster.id, office.name); }}
                                        title={`Filter hosted events: ${office.name}`}
                                      >
                                        <span className="calendar-legend-swatch" style={{ backgroundColor: office.color || cluster.color || '#94a3b8' }} />
                                        <span className="calendar-legend-name">{office.name}</span>
                                      </button>
                                    );
                                  })()}
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
                    {/* REGIONS LEGEND */}
                    <div
                      className={`calendar-cluster-item dropdown-right ${openLegendClusterId === 'regions' ? 'is-open' : ''}`}
                    >
                      <button
                        type="button"
                        className="calendar-cluster-summary"
                        style={{ '--cluster-color': '#facc15' }}
                        onClick={() =>
                          setOpenLegendClusterId(openLegendClusterId === 'regions' ? null : 'regions')
                        }
                      >
                        <span className="calendar-cluster-summary-main">
                          <span className="calendar-cluster-name-short">
                            REGIONS
                          </span>
                        </span>
                        <span className="calendar-cluster-chevron">▾</span>
                      </button>

                      {openLegendClusterId === 'regions' && (
    <div className="calendar-cluster-dropdown">
      <div className="calendar-cluster-dropdown-title">
        <span
          className="calendar-legend-swatch"
          style={{ backgroundColor: "#facc15" }}
        />
        <span>TESDA Regions</span>
      </div>

      <ul className="calendar-cluster-offices">
        {[
          { name: "NCR", email: "ncr@tesda.gov.ph", clickable: true },
          { name: "CAR", email: null, clickable: false },
          { name: "Region I", email: null, clickable: false },
          { name: "Region II", email: null, clickable: false },
          { name: "Region III", email: null, clickable: false },
          { name: "Region IV-A", email: null, clickable: false },
          { name: "Region IV-B", email: null, clickable: false },
          { name: "Region V", email: null, clickable: false },
          { name: "Region VI", email: null, clickable: false },
          { name: "Region VII", email: null, clickable: false },
          { name: "Region VIII", email: null, clickable: false },
          { name: "Region IX", email: null, clickable: false },
          { name: "Region X", email: null, clickable: false },
          { name: "Region XI", email: null, clickable: false },
          { name: "Region XII", email: null, clickable: false },
          { name: "Region XIII", email: null, clickable: false },
          { name: "BARMM", email: null, clickable: false }
        ].map((region) => {
          // NCR is clickable
          if (region.name === "NCR") {
            const ncrUser = users.find(u => String(u?.email || '').toLowerCase() === 'ncr@tesda.gov.ph');
            if (ncrUser) {
              return (
                <li key={region.name} className="calendar-cluster-office-item">
                  <button
                    type="button"
                    className="calendar-legend-item calendar-legend-item-btn"
                    onClick={() => {
                      setOpenLegendClusterId(null);
                      void openHostEventsTarget({
                        key: 'regions-ncr',
                        label: 'National Capital Region (NCR)',
                        short: 'NCR',
                        color: '#facc15',
                        accountId: Number(ncrUser.id)
                      });
                    }}
                    title="View hosted events: NCR"
                  >
                    <span
                      className="calendar-legend-swatch"
                      style={{ backgroundColor: "#facc15" }}
                    />
                    <span className="calendar-legend-name">{region.name}</span>
                  </button>
                </li>
              );
            }
          }
          
          // Other regions - not clickable yet
          return (
            <li key={region.name} className="calendar-cluster-office-item">
              <div className="calendar-legend-item">
                <span
                  className="calendar-legend-swatch"
                  style={{ backgroundColor: "#facc15" }}
                />
                <span className="calendar-legend-name">{region.name}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  )}
</div>
                  </div>
                )}
              </>
            )}
          </section>
          <div className="calendar-view-body">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            timeZone="local"
            initialView="dayGridMonth"
            initialDate={dateParam ? new Date(`${dateParam}T12:00:00`) : undefined}
            customButtons={{
              officesTab: {
                text: 'Offices',
                click: () => setActiveTab('offices'),
              },
              participantsTab: {
                text: 'Participants',
                click: () => setActiveTab('participants'),
              },
              addSchedule: {
                text: '+ Add Schedule',
                click: () => {
                  if (isViewerLike) {
                    setShowLoginModal(true);
                  } else {
                    navigate('/simple-event-form', { state: { backTo: '/calendar' } });
                  }
                },
              },
            }}
            dayHeaderContent={(arg) => {
              const d = arg?.date instanceof Date ? arg.date : new Date(arg?.date);
              const day = d.getDay(); // 0=Sun, 6=Sat
              const isWeekend = day === 0 || day === 6;
              const label = d.toLocaleDateString('en-US', { weekday: isWeekend ? 'short' : 'long' });
              return <span>{label}</span>;
            }}
            headerToolbar={{
              left: 'prev,next today officesTab,participantsTab',
              center: 'title',
              right: 'addSchedule dayGridMonth,timeGridWeek,timeGridDay',
            }}
            viewDidMount={() => {
              syncToolbarTabs();
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
            editable={activeTab !== 'participants' && !isReadOnlyOffice && !isViewerLike}
            selectable={activeTab !== 'participants' && !isViewerLike}
            dayMaxEventRows={5}
            eventDisplay="block"
            displayEventTime={true}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            events={[...holidayEvents, ...fcEvents]}
            datesSet={async (arg) => {
              try { syncToolbarTabs(); } catch { /* ignore */ }
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
            // Clicking a day:
            // - signed-in users: go to create event for that day
            // - public (not signed-in): view-only DayView
            dateClick={async (info) => {
              const ymd = String(info.dateStr || '').slice(0, 10);
              if (!ymd) return;
              if (isWeekendYMD(ymd)) {
                await dialog.alert('Weekends are locked. Please select a weekday.', { title: 'Date Not Allowed' });
                return;
              }
                      if (!isViewerLike) {
                navigate('/simple-event-form', { state: { backTo: '/calendar' } });
                return;
              }
              setShowLoginModal(true);
              return;
            }}
            eventClick={async (info) => {
              info.jsEvent.preventDefault();
              if (info.event.extendedProps?.isHoliday) {
                await dialog.alert(info.event.title, { title: 'Holiday' });
                return;
              }
              setSelectedEvent(info.event.id);
            }}
            eventDidMount={(arg) => {
              if (arg.event.extendedProps?.isHoliday) return;
              const el = arg.el;
              // Match reference: only the LEFT stripe uses host color (not the whole border).
              try {
                const ext = arg.event.extendedProps || {};
                const cancelled = Boolean(ext.cancelled);
                const hostColor = ext.host_color || '#1f3a5f';
                el.style.setProperty('--host-stripe-color', cancelled ? 'rgba(127, 29, 29, 0.98)' : hostColor);
              } catch {
                // ignore
              }
              const clearLeave = () => {
                if (eventHoverLeaveRef.current) clearTimeout(eventHoverLeaveRef.current);
                eventHoverLeaveRef.current = setTimeout(() => setEventHover(null), 180);
              };
              const onEnter = (ev) => {
                if (eventHoverLeaveRef.current) {
                  clearTimeout(eventHoverLeaveRef.current);
                  eventHoverLeaveRef.current = null;
                }
                const clientX = ev?.clientX ?? 0;
                const clientY = ev?.clientY ?? 0;
                setEventHover({
                  eventId: arg.event.id,
                  title: arg.event.title,
                  extendedProps: arg.event.extendedProps || {},
                  x: clientX,
                  y: clientY,
                });
              };
              const onMove = (ev) => {
                const clientX = ev?.clientX ?? 0;
                const clientY = ev?.clientY ?? 0;
                if (hoverRafRef.current) cancelAnimationFrame(hoverRafRef.current);
                hoverRafRef.current = requestAnimationFrame(() => {
                  setEventHover((prev) => {
                    if (!prev || String(prev.eventId) !== String(arg.event.id)) return prev;
                    return { ...prev, x: clientX, y: clientY };
                  });
                });
              };
              el.addEventListener('mouseenter', onEnter);
              el.addEventListener('mousemove', onMove);
              el.addEventListener('mouseleave', clearLeave);
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
                const cancelled = Boolean(info.event.extendedProps?.cancelled);
                if (done) {
                  await dialog.alert('This event is already done and is view-only.', { title: 'View-only Event' });
                  info.revert();
                  return;
                }
                if (cancelled) {
                  await dialog.alert('This event is already cancelled and is view-only.', { title: 'View-only Event' });
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
                  await dialog.alert('Weekends are locked. Please drop on a weekday.', { title: 'Date Not Allowed' });
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
                await dialog.alert(e.message || 'Failed to reschedule.', { title: 'Action Failed' });
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
                const cancelled = Boolean(info.event.extendedProps?.cancelled);
                if (done) {
                  await dialog.alert('This event is already done and is view-only.', { title: 'View-only Event' });
                  info.revert();
                  return;
                }
                if (cancelled) {
                  await dialog.alert('This event is already cancelled and is view-only.', { title: 'View-only Event' });
                  info.revert();
                  return;
                }
                const start = info.event.start;
                const end = info.event.end || start;
                const date = toLocalDateString(start);
                if (isWeekendYMD(date)) {
                  await dialog.alert('Weekends are locked. Please use a weekday.', { title: 'Date Not Allowed' });
                  info.revert();
                  return;
                }
                const start_time = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}:00`;
                const end_time = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}:00`;
                await eventsApi.update(info.event.id, { date, start_time, end_time });
                await refreshData();
              } catch (e) {
                await dialog.alert(e.message || 'Failed to resize.', { title: 'Action Failed' });
                info.revert();
              }
            }}
            eventContent={(arg) => {
              const conflict = (arg.event.extendedProps?.conflict_count || 0) > 0;
              const tooltip = arg.event.extendedProps?.tooltip || arg.event.title;
              const done = Boolean(arg.event.extendedProps?.done);
              const cancelled = Boolean(arg.event.extendedProps?.cancelled);
              const hostNeedsPostDoc = Boolean(arg.event.extendedProps?.host_needs_postdoc);
              const hasAttachment = Boolean(arg.event.extendedProps?.has_attachment);
              const hasOsecParticipant = Boolean(arg.event.extendedProps?.has_osec_participant);
              const isTentative = Boolean(arg.event.extendedProps?.is_tentative);
              const isHoliday = Boolean(arg.event.extendedProps?.isHoliday);
              const hostColor = arg.event.extendedProps?.host_color || '#1f3a5f';
              const hostAcronym = arg.event.extendedProps?.host_acronym || '';
              const participantColor = arg.event.extendedProps?.participant_color || '#94a3b8';
              const participantLabel = arg.event.extendedProps?.participant_label || 'No participant';
              const startRaw = arg.event.extendedProps?.start_time_raw || '';
              const endRaw = arg.event.extendedProps?.end_time_raw || '';
              const startLabel = formatTimeShort(startRaw);
              const endLabel = formatTimeShort(endRaw);
              const progressMeta = getMultiDayProgressMeta(arg.event);
              const startsInReminder = getEventStartReminder(arg.event);
              const progressColor = activeTab === 'participants' ? participantColor : hostColor;
              const showProgress = Boolean(progressMeta && !isHoliday && !cancelled);
              const showStartsInReminder = Boolean(startsInReminder && !showProgress && !cancelled);
              const timeLabel =
                startLabel && endLabel && startLabel !== endLabel
                  ? `${startLabel}–${endLabel}`
                  : startLabel || '';
              // Reference style: keep event text readable; grey out done events.
              const statusTextColor = cancelled ? '#ffffff' : done ? '#6b7280' : '#0f172a';
              // Final icon only for active, non-tentative, non-done events
              const isFinal = !isTentative && !cancelled && !done;

              if (activeTab === 'participants' && !isHoliday) {
                const keys = Array.isArray(arg.event.extendedProps?.participant_keys)
                  ? arg.event.extendedProps.participant_keys
                  : (arg.event.extendedProps?.participant_key ? [arg.event.extendedProps.participant_key] : []);
                const legendByKey = new Map(PARTICIPANT_LEGEND_ITEMS.map((i) => [i.key, i]));
                const chips = keys
                  .map((k) => legendByKey.get(k))
                  .filter(Boolean);
                const shown = chips.slice(0, 3);
                const extra = Math.max(0, chips.length - shown.length);
                return (
                  <div>
                    {timeLabel && (
                      <div className="fc-event-time-row">
                        <span className="fc-event-time" style={{ color: statusTextColor }}>
                          {timeLabel}
                        </span>
                        {done && <span className="fc-event-done-badge">Done</span>}
                      </div>
                    )}
                    {showProgress && (
                      <div className={`fc-event-progress ${done ? 'is-done' : ''}`} title={`Progress: ${progressMeta.percent}%`}>
                        <div className="fc-event-progress-track">
                          <span
                            className="fc-event-progress-fill"
                            style={{ width: `${progressMeta.percent}%`, backgroundColor: progressColor }}
                          />
                        </div>
                        <span className="fc-event-progress-text" style={{ color: statusTextColor }}>
                          {progressMeta.dayLabel} · {progressMeta.percent}%
                        </span>
                      </div>
                    )}
                    {showStartsInReminder && (
                      <div className="fc-event-starts-in" style={{ color: statusTextColor }}>
                        {startsInReminder}
                      </div>
                    )}
                    <div className={`fc-event-title-wrap fc-event-title-wrap--participants ${conflict ? 'fc-event-conflict' : ''}`}>
                      <div className="fc-event-participant-chips">
                        {shown.length ? (
                          shown.map((p) => (
                            <span key={p.key} className="fc-event-host-stripe-pill">
                              <span className="fc-event-host-stripe-bar" style={{ backgroundColor: p.color }} />
                              <span className="fc-event-host-stripe-code" style={{ color: statusTextColor }}>
                                {p.label}
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="fc-event-host-stripe-pill">
                            <span className="fc-event-host-stripe-bar" style={{ backgroundColor: participantColor }} />
                            <span className="fc-event-host-stripe-code" style={{ color: statusTextColor }}>
                              {participantLabel}
                            </span>
                          </span>
                        )}
                        {extra > 0 && (
                          <span className="fc-event-participant-more" style={{ color: statusTextColor }}>
                            +{extra}
                          </span>
                        )}
                      </div>
                      {/* completed badge moved to time row */}
                      {cancelled && <span className="fc-event-cancelled-badge">Canceled</span>}
                      {isTentative && <span className="fc-event-tentative-badge">[TENTATIVE]</span>}
                      {hasAttachment && <span className="fc-event-attachment-badge" title="Has attachment">●</span>}
                      {hostNeedsPostDoc && <span className="fc-event-postdoc-required">REQ</span>}
                      {conflict && <span className="fc-event-conflict-dot">● </span>}
                    </div>
                  </div>
                );
              }

              return (
                <div>
                  {timeLabel && (
                    <div className="fc-event-time-row">
                      <span className="fc-event-time" style={{ color: statusTextColor }}>
                        {timeLabel}
                      </span>
                      {done && <span className="fc-event-done-badge">Done</span>}
                    </div>
                  )}
                  {showProgress && (
                    <div className={`fc-event-progress ${done ? 'is-done' : ''}`} title={`Progress: ${progressMeta.percent}%`}>
                      <div className="fc-event-progress-track">
                        <span
                          className="fc-event-progress-fill"
                          style={{ width: `${progressMeta.percent}%`, backgroundColor: progressColor }}
                        />
                      </div>
                      <span className="fc-event-progress-text" style={{ color: statusTextColor }}>
                        {progressMeta.dayLabel} · {progressMeta.percent}%
                      </span>
                    </div>
                  )}
                  {showStartsInReminder && (
                    <div className="fc-event-starts-in" style={{ color: statusTextColor }}>
                      {startsInReminder}
                    </div>
                  )}
                  <div className={`fc-event-title-wrap ${conflict ? 'fc-event-conflict' : ''}`}>
                    {hostAcronym && (
                      <span className="fc-event-host-stripe-pill">
                        <span
                          className="fc-event-host-stripe-bar"
                          style={{ backgroundColor: hostColor }}
                        />
                        <span
                          className="fc-event-host-stripe-code"
                          style={{ color: statusTextColor }}
                        >
                          {hostAcronym}
                        </span>
                      </span>
                    )}
                    {isHoliday && <span className="fc-event-holiday-badge">Holiday</span>}
                    {/* completed badge moved to time row */}
                    {hostNeedsPostDoc && <span className="fc-event-postdoc-required">REQ</span>}
                    {cancelled && <span className="fc-event-cancelled-badge">Canceled</span>}
                    {isTentative && <span className="fc-event-tentative-badge">[TENTATIVE]</span>}
                    {hasAttachment && <span className="fc-event-attachment-badge" title="Has attachment">●</span>}
                    {hasOsecParticipant && (
                      <span className="fc-event-osec-bookmark" title="DG participant">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12" aria-hidden="true">
                          <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                        </svg>
                      </span>
                    )}
                    {conflict && <span className="fc-event-conflict-dot">● </span>}
                    <span className="fc-event-title-text" style={{ color: statusTextColor }}>
                      {arg.event.title}
                    </span>
                    {isFinal && <span className="fc-event-final-icon" title="Final schedule">✓</span>}
                  </div>
                </div>
              );
            }}
            windowResize={() => {
              const api = calendarRef.current?.getApi?.();
              if (api) api.updateSize();
            }}
          />
          {eventHover && (
            <div
              className="calendar-event-hover-card"
              style={{
                left: Math.min(
                  Math.max(8, (eventHover.x || 0) + 12),
                  typeof window !== 'undefined' ? window.innerWidth - 340 : (eventHover.x || 0)
                ),
                top: Math.min(
                  Math.max(8, (eventHover.y || 0) + 14),
                  typeof window !== 'undefined' ? window.innerHeight - 220 : (eventHover.y || 0)
                ),
              }}
              onMouseEnter={() => {
                if (eventHoverLeaveRef.current) {
                  clearTimeout(eventHoverLeaveRef.current);
                  eventHoverLeaveRef.current = null;
                }
              }}
              onMouseLeave={() => {
                eventHoverLeaveRef.current = setTimeout(() => setEventHover(null), 150);
              }}
            >
              <h4 className="calendar-event-hover-card-title">{eventHover.title}</h4>
              <div className="calendar-event-hover-card-tags">
                <span
                  className={`calendar-event-hover-card-tag ${
                    eventHover.extendedProps?.is_tentative ? 'tag-tentative' : 'tag-final'
                  }`}
                >
                  {eventHover.extendedProps?.is_tentative ? 'Tentative' : 'Final'}
                </span>
                <span className={`calendar-event-hover-card-tag ${eventHover.extendedProps?.done ? 'tag-done' : eventHover.extendedProps?.cancelled ? 'tag-cancelled' : 'tag-confirmed'}`}>
                  {eventHover.extendedProps?.cancelled ? 'Cancelled' : eventHover.extendedProps?.done ? 'Done' : 'Confirmed'}
                </span>
              </div>
              {eventHover.extendedProps?.date_formatted && (
                <div className="calendar-event-hover-card-row">
                  <span className="calendar-event-hover-card-icon" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </span>
                  <span>{eventHover.extendedProps.date_formatted}</span>
                </div>
              )}
              <div className="calendar-event-hover-card-row">
                <span className="calendar-event-hover-card-icon" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                </span>
                <span>{eventHover.extendedProps?.type_label ?? getEventTypeLabel(eventHover.extendedProps?.type) ?? 'Event'}</span>
              </div>
              <div className="calendar-event-hover-card-row">
                <span className="calendar-event-hover-card-icon" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <span>{eventHover.extendedProps?.location || 'TBA'}</span>
              </div>
              {eventHover.extendedProps?.description && (
                <>
                  <hr className="calendar-event-hover-card-sep" />
                  <p className="calendar-event-hover-card-desc">{eventHover.extendedProps.description}</p>
                </>
              )}
            </div>
          )}
        </div>
          {loading && <div className="calendar-loading">Loading calendar...</div>}
          {error && (
            <div className="calendar-loading" style={{ position: 'static', padding: '1rem', color: 'var(--danger, #dc2626)' }}>
              {error}
            </div>
          )}
        </div>
        {hasSidebarFilter && (
          <button
            type="button"
            className={`calendar-side-toggle ${isSidePanelHidden ? 'is-collapsed' : ''}`}
            onClick={() => setIsSidePanelHidden((v) => !v)}
            title={isSidePanelHidden ? 'Show filtered events list' : 'Hide filtered events list'}
            aria-label={isSidePanelHidden ? 'Show filtered events list' : 'Hide filtered events list'}
          >
            {isSidePanelHidden ? '◀' : '▶'}
          </button>
        )}
        {hasSidebarFilter && !isSidePanelHidden && (() => {
          const tentativeCount = sidebarEvents.filter((ev) => ev.extendedProps?.is_tentative).length;
          const doneCount = sidebarEvents.filter((ev) => ev.extendedProps?.done).length;
          return (
          <aside className="calendar-side-panel">
            <h4 className="calendar-side-title">
              {activeTab === 'participants' && activeParticipantKey
                ? `Filtered: ${PARTICIPANT_LEGEND_ITEMS.find((i) => i.key === activeParticipantKey)?.label || activeParticipantKey}`
                : 'Filtered by host'}{' '}
              <span className="calendar-side-count">({sidebarEvents.length})</span>
              {tentativeCount > 0 && (
                <span className="calendar-side-count calendar-side-count-tentative"> · {tentativeCount} tentative</span>
              )}
              {doneCount > 0 && (
                <span className="calendar-side-count calendar-side-count-done"> · {doneCount} done</span>
              )}
            </h4>
            {fcEvents.length > sidebarEvents.length && sidebarEvents.length > 0 && (
              <p className="calendar-side-subtitle">Showing first {sidebarEvents.length} events in current view</p>
            )}
            <ul className="calendar-side-list">
            {[...sidebarEvents]
             .sort((a, b) => new Date(b.start) - new Date(a.start))
              .map((ev) => {
                const ext = ev.extendedProps || {};
                const isTentative = Boolean(ext.is_tentative);
                const isDone = Boolean(ext.done);
                const dateLabel = ext.date_formatted || (typeof ev.start === 'string' ? ev.start.slice(0, 10) : '');
                const startLabel = formatTimeShort(ext.start_time_raw || '');
                const endLabel = formatTimeShort(ext.end_time_raw || '');
                const timeLabel = startLabel && endLabel && startLabel !== endLabel ? `${startLabel}–${endLabel}` : startLabel || '';
                const isParticipantsView = activeTab === 'participants';
                const activeLegend = activeTab === 'participants' && activeParticipantKey
                  ? PARTICIPANT_LEGEND_ITEMS.find((i) => i.key === activeParticipantKey)
                  : null;
                const chipLabel = isParticipantsView
                  ? (activeLegend?.label ?? ext.participant_label ?? '')
                  : hostAcronymFromName(ext.creator_name || '');
                const chipColor = isParticipantsView
                  ? (activeLegend?.color ?? ext.participant_color ?? '#4b5563')
                  : (ext.host_color || '#1f3a5f');
                const stripeColor = !isDone && !isTentative ? chipColor : undefined;
                return (
                  <li
                    key={ev.id}
                    className={`calendar-side-item ${isTentative ? 'calendar-side-item--tentative' : ''} ${isDone ? 'calendar-side-item--done' : ''}`}
                    style={stripeColor ? { '--calendar-side-stripe-color': stripeColor } : undefined}
                    onClick={() => setSelectedEvent(ev.id)}
                  >
                    <div className="calendar-side-meta">
                    <span className="calendar-side-date">{dateLabel}</span>
                    {timeLabel && <span className="calendar-side-time">{timeLabel}</span>}
                    <span className="calendar-side-badges">
                      {isTentative && <span className="calendar-side-tentative-badge">Tentative</span>}
                      {isDone && <span className="calendar-side-done-badge">Done</span>}
                    </span>
                  </div>
                  <div className="calendar-side-main">
                    <span className="calendar-side-chip">
                      <span className="calendar-side-chip-dot" style={{ backgroundColor: chipColor }} />
                      <span className="calendar-side-chip-label">{chipLabel}</span>
                    </span>
                    <span className="calendar-side-title-text">{ev.title}</span>
                  </div>
                </li>
              );
          })}
              {sidebarEvents.length === 0 && (
                <li className="calendar-side-empty">No events match this filter.</li>
              )}
            </ul>
          </aside>
          );
        })()}
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

      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          redirectTo={{ path: '/simple-event-form', state: { backTo: '/calendar' } }}
        />
      )}
    </div>
  );
}
