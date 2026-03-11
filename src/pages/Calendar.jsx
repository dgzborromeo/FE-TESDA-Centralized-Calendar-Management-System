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

const EVENT_COLORS = { 'face-to-face': '#3b82f6', 'hybrid': '#8b5cf6', 'virtual': '#f59e0b' };
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

const PARTICIPANT_LEGEND_ITEMS = [
  // OSEC red
  { key: 'osec', label: 'OSEC', color: '#ef4444' },
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
  // Focals yellow
  { key: 'focals', label: 'Focals', color: '#eab308' },
];

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
  const [filterType, setFilterType] = useState('');
  const [hostModalTarget, setHostModalTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('offices');
  const [activeParticipantKey, setActiveParticipantKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [openLegendClusterId, setOpenLegendClusterId] = useState(null);
  const [nowTick, setNowTick] = useState(0);
  const [pendingMove, setPendingMove] = useState(null);
  const [moveReason, setMoveReason] = useState('');
  const [moveSubmitting, setMoveSubmitting] = useState(false);
  const [eventHover, setEventHover] = useState(null);
  const eventHoverLeaveRef = useRef(null);
  const activeRangeRef = useRef({ start: null, end: null });
    // Idagdag ito sa tabi ng iba pang useState
const [categories, setCategories] = useState([]);
const [filterParticipant, setFilterParticipant] = useState('');
const [filterHost, setFilterHost] = useState('');
const [hostLegendFilter, setHostLegendFilter] = useState(null);
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
      navigate(`/events/new?date=${d}`);
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
    // PALITAN ITO: mula eventsApi -> configApi
  configApi.getCategories()
    .then((rows) => setCategories(Array.isArray(rows) ? rows : []))
    .catch((err) => console.error("Error loading categories:", err));
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

    return {
      clusterId: cluster.id,
      clusterName: cluster.name,
      items,
    };
  }).filter(g => g.items.length > 0);
}, [clusterLegend, users]);
const hostAccountIdsByCluster = useMemo(() => {
  const map = new Map();
  hostOptions.forEach(group => {
    // Kunin lahat ng accountId (ng cluster mismo + lahat ng offices nito)
    const ids = new Set(group.items.map(i => i.accountId).filter(id => !!id));
    map.set(group.clusterId, ids);
  });
  return map;
}, [hostOptions]);

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

  const openHostEventsTarget = async (target) => {
    if (!target || !Number.isFinite(Number(target.accountId))) {
      await dialog.alert('No host account found for this selection.', { title: 'Unavailable' });
      return;
    }
    setHostModalTarget(target);
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
const parsedEvents = useMemo(() => {
  return events.map(e => {
    let participantsArr = [];
    try {
      participantsArr = typeof e.participants === 'string' 
        ? JSON.parse(e.participants || '[]') 
        : (e.participants || []);
    } catch (err) {
      participantsArr = [];
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
const [activeLegendFilter, setActiveLegendFilter] = useState(null);
   const fcEvents = useMemo(() => {
return parsedEvents
    .filter((e) => {
      const typeOk = !filterType ? true : e.type === filterType;
      
      // I-check kung typeOk muna bago mag-filter ng participant
      if (!typeOk) return false;

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
      if (hostLegendFilter?.accountIds?.size) {
      const hostId = Number(e.created_by);
      if (!hostLegendFilter.accountIds.has(hostId)) return false;
    }
    if (activeLegendFilter) {
      const eventCreatorId = Number(e.created_by);
      if (!activeLegendFilter.accountIds.has(eventCreatorId)) return false;
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
        const baseColor = e.color || EVENT_COLORS[e.type] || '#3b82f6';
        // Even for tentative events, keep the background based on the host/office color;
        // only the [TENTATIVE] badge itself is gray.
        const backgroundColor = baseColor;
        const borderColor = baseColor;
        const host = e.creator_name || 'Unknown';
        const done = isEventDone(e);
        const cancelled = String(e.status || 'active').toLowerCase() === 'cancelled';
        const postDocCount = Number(e.post_document_count || 0);
        const hostNeedsPostDoc = done && !cancelled && Number(e.created_by) === Number(user?.id) && postDocCount === 0;
        const dateRangeText = isMultiDay ? `${date} to ${endDate}` : date;
        const hasAttachment = Number(e.attachment_count || 0) > 0;
        const tooltip = `${e.title} - ${dateRangeText} ${formatTimeShort(e.start_time)}–${formatTimeShort(e.end_time)}\nHost: ${host}${e.has_osec_participant ? '\nParticipant: OSEC' : ''}${tentativeMeta.isTentative ? `\nSchedule: Tentative${tentativeMeta.note ? ` (${tentativeMeta.note})` : ''}` : ''}${hasAttachment ? '\nAttachment: Yes' : ''}${done ? '\nStatus: Done' : ''}${cancelled ? '\nStatus: Cancelled' : ''}${hostNeedsPostDoc ? '\nRequired: Upload AAR/Minutes' : ''}`;
        const start_time_raw = normalizeTime(e.start_time);
        const end_time_raw = normalizeTime(e.end_time);
        const canEditThis = !isReadOnlyOffice && (isAdmin || Number(e.created_by) === Number(user?.id));
        return {
          id: String(e.id),
          title: e.title,
          start,
          end,
          backgroundColor,
          borderColor,
          textColor: '#fff',
          allDay: isMultiDay,
          startEditable: canEditThis && !isMultiDay && !done && !cancelled,
          durationEditable: canEditThis && !isMultiDay && !done && !cancelled,
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
 }, [parsedEvents, filterType,filterHost, hostLegendFilter, activeLegendFilter, filterParticipant, isAdmin, isReadOnlyOffice, user?.id, nowTick]);
const toggleHostLegendFilterCluster = (clusterId) => {
  const ids = hostAccountIdsByCluster.get(clusterId);
  if (!ids) return;

  setHostLegendFilter((prev) => {
    // Kapag kinlik ulit ang parehong cluster, i-reset (unfilter)
    if (prev?.kind === 'cluster' && prev?.clusterId === clusterId) return null;
    return { kind: 'cluster', clusterId, accountIds: ids };
  });
};

const toggleHostLegendFilterOffice = (clusterId, officeName) => {
  const officeOpt = hostOfficeOptionMap.get(`${clusterId}::${officeName}`);
  const id = Number(officeOpt?.accountId);
  if (!id) return;

  setHostLegendFilter((prev) => {
    if (prev?.kind === 'office' && prev?.officeName === officeName) return null;
    return { kind: 'office', clusterId, officeName, accountIds: new Set([id]) };
  });
};
  const hostModalEvents = useMemo(() => {
    if (!hostModalTarget?.accountId) return [];
    return (events || [])
      .filter((e) => Number(e.created_by) === Number(hostModalTarget.accountId))
      .sort((a, b) => (String(a.date || '') + String(a.start_time || '')).localeCompare(String(b.date || '') + String(b.start_time || '')));
  }, [events, hostModalTarget]);

  if (loading) {
    // we'll flip `loading` off once the first `datesSet` fetch completes
  }
const handleClusterClick = (cluster) => {
  // 1. I-toggle yung dropdown (yung dati mong logic)
  toggleLegendCluster(cluster.id);

  // 2. I-apply ang filter para sa LAHAT ng offices sa cluster na ito
  const allIdsInCluster = hostAccountIdsByCluster.get(cluster.id);
  
  setActiveLegendFilter(prev => {
    // Kung active na itong cluster, i-off (reset)
    if (prev?.type === 'cluster' && prev?.id === cluster.id) return null;
    return { type: 'cluster', id: cluster.id, accountIds: allIdsInCluster };
  });
};

const handleOfficeClick = (office, clusterId) => {
  setActiveLegendFilter(prev => {
    const officeId = Number(office.accountId);
    // Kung active na itong office, i-off
    if (prev?.type === 'office' && prev?.id === officeId) return null;
    return { type: 'office', id: officeId, accountIds: new Set([officeId]) };
  });
};
  return (
    <div className="calendar-page">
      <div className="calendar-content">
        <div
          ref={containerRef}
          className="calendar-main calendar-main-fullcalendar"
        >
          <div className="calendar-tabs" role="tablist" aria-label="Calendar view mode">
            <button
              type="button"
              role="tab"
              className={`calendar-tab ${activeTab === 'offices' ? 'is-active' : ''}`}
              aria-selected={activeTab === 'offices'}
              onClick={() => setActiveTab('offices')}
            >
              Offices
            </button>
            <button
              type="button"
              role="tab"
              className={`calendar-tab ${activeTab === 'participants' ? 'is-active' : ''}`}
              aria-selected={activeTab === 'participants'}
              onClick={() => setActiveTab('participants')}
            >
              Participants
            </button>
          </div>
          <section className="calendar-legend calendar-legend-top">
            <div className="calendar-legend-top-head">
              <h3>Legend</h3>
              <div className="calendar-legend-top-actions">
                <div className="calendar-legend-filter">
                  {/* <label htmlFor="calendar-type-filter">Type:</label>
                  <select
                    id="calendar-type-filter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="face-to-face">Face to Face</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="virtual">Virtual/Zoom</option>
                  </select> */}
                 {/* Participants Filter (Dapat naka-map na sa 'categories' state) */}
<label htmlFor="calendar-host-filter">Host:</label>
<select
  id="calendar-host-filter"
  value={filterHost}
  onChange={(e) => setFilterHost(e.target.value)}
>
  <option value="">All Hosts</option>
  {sortedHostDropdownOptions.map(u => (
    <option key={u.id} value={u.id}>
      {u.shortName}
    </option>
  ))}
</select>
<label htmlFor="calendar-participant-filter">Participant:</label>
<select
  id="calendar-participant-filter"
  value={filterParticipant} // Ngayon defined na ito
  onChange={(e) => setFilterParticipant(e.target.value)}
>
  <option value="">All Participants</option>
  {categories.map(cat => (
    <option key={cat.id} value={cat.id}>
      {cat.category_name || cat.name}
    </option>
  ))}
</select>
{/* {(filterType || filterParticipant || filterHost) && (
  <button 
    type="button"
    onClick={() => { 
      setFilterType(''); 
      setFilterParticipant(''); 
      setFilterHost(''); 
    }}
    className="text-xs text-red-500 hover:underline ml-2"
  >
    Reset
  </button>
)} */}
</div>
                {!isViewerLike && (
                  <Link to="/events/new" className="calendar-legend-add">+ Add Schedule</Link>
                )}
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
                        style={{
                          backgroundColor: item.color,
                          color: textColorForBackground(item.color),
                        }}
                        onClick={() =>
                          setActiveParticipantKey((prev) => (prev === item.key ? '' : item.key))
                        }
                        title={item.label}
                      >
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
{clusterLegend.map((cluster, idx) => {
  // Check kung ang cluster na ito ang active filter
  const isClusterFiltering = hostLegendFilter?.kind === 'cluster' && hostLegendFilter?.clusterId === cluster.id;

  return (
    <div
      key={cluster.id}
      className={`calendar-cluster-item 
        ${openLegendClusterId === cluster.id ? 'is-open' : ''} 
        ${idx >= clusterLegend.length - 2 ? 'dropdown-right' : ''}`}
    >
      {/* MAIN BUTTON: Bukas/Sara lang ng dropdown */}
      <button
        type="button"
        className="calendar-cluster-summary"
        style={{
          backgroundColor: cluster.color || '#94a3b8',
          color: textColorForBackground(cluster.color || '#94a3b8'),
          // Indicator kung may active filter sa loob ng cluster na ito
          boxShadow: isClusterFiltering ? '0 0 0 3px #000 inset' : 'none'
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
          {(() => {
            const clusterOpt = hostClusterOptionMap.get(cluster.id) || null;
            
            // CLUSTER HEADER: Dito ang filter/reset trigger
            return (
              <button
                type="button"
                className={`calendar-cluster-dropdown-title calendar-cluster-dropdown-title-btn 
                  ${isClusterFiltering ? 'active-filter' : ''}`}
                onClick={() => toggleHostLegendFilterCluster(cluster.id)}
              >
                <span 
                  className="calendar-legend-swatch" 
                  style={{ 
                    backgroundColor: cluster.color || '#94a3b8',
                    boxShadow: isClusterFiltering ? '0 0 0 2px black' : 'none' 
                  }} 
                />
                <span style={{ fontWeight: isClusterFiltering ? 'bold' : 'normal' }}>
                  {cluster.name}
                </span>

                {isClusterFiltering ? (
                  <span className="calendar-host-link-badge calendar-host-link-badge-office" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                    Reset Filter ✕
                  </span>
                ) : (
                  <span className="calendar-host-link-badge calendar-host-link-badge-office">
                    Filter All
                  </span>
                )}
              </button>
            );
          })()}

          <ul className="calendar-cluster-offices">
            {(cluster.offices || []).map((office) => {
              const officeOpt = hostOfficeOptionMap.get(`${cluster.id}::${office.name}`) || null;
              const isOfficeFiltering = hostLegendFilter?.kind === 'office' && hostLegendFilter?.officeName === office.name;

              return (
                <li key={office.name} className="calendar-cluster-office-item">
                  {!officeOpt ? (
                    <div className="calendar-legend-item">
                      <span className="calendar-legend-swatch" style={{ backgroundColor: office.color || cluster.color || '#94a3b8' }} />
                      <span className="calendar-legend-name">{office.name}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`office-item ${isOfficeFiltering ? 'active' : ''}`}
                      onClick={() => toggleHostLegendFilterOffice(cluster.id, office.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'none',
                        border: 'none',
                        width: '100%',
                        textAlign: 'left',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        gap: '8px'
                      }}
                    >
                      {/* ETO YUNG COLOR SWATCH NA RECTANGLE */}
                      <span 
                        className="calendar-legend-swatch" 
                        style={{ 
                          backgroundColor: office.color || cluster.color || '#94a3b8',
                          flexShrink: 0 
                        }} 
                      />
                      <span className="calendar-legend-name" style={{ fontWeight: isOfficeFiltering ? 'bold' : 'normal' }}>
                        {office.name} {isOfficeFiltering && '✓'}
                      </span>
                    </button>
                  )}

                  {/* Divisions */}
                  {Array.isArray(office.divisions) && office.divisions.length > 0 && (
                    <ul className="calendar-cluster-divisions">
                      {office.divisions.map((division) => (
                        <li key={division} className="calendar-cluster-division-item">
                          {division}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
})}
                    {/* REGIONS LEGEND */}
<div
  className={`calendar-cluster-item dropdown-right ${openLegendClusterId === 'regions' ? 'is-open' : ''}`}
>
  <button
    type="button"
    className="calendar-cluster-summary"
    style={{
      backgroundColor: "#facc15",
      color: "#1f2937"
    }}
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
          {activeTab === 'offices' ? (
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
            editable={!isReadOnlyOffice && !isViewerLike}
            selectable={!isViewerLike}
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
                navigate(`/events/new?date=${ymd}`);
                return;
              }
              navigate(`/calendar/day/${ymd}`);
            }}
            eventClick={async (info) => {
              info.jsEvent.preventDefault();
              if (info.event.extendedProps?.isHoliday) {
                await dialog.alert(info.event.title, { title: 'Holiday' });
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
              // Final icon only for active, non-tentative, non-done events
              const isFinal = !isTentative && !cancelled && !done;
              return (
                <div className={`fc-event-title-wrap ${conflict ? 'fc-event-conflict' : ''}`} title={tooltip}>
                  {isHoliday && <span className="fc-event-holiday-badge">Holiday</span>}
                  {done && <span className="fc-event-done-badge">Done</span>}
                  {hostNeedsPostDoc && <span className="fc-event-postdoc-required">REQ</span>}
                  {cancelled && <span className="fc-event-cancelled-badge">Canceled</span>}
                  {isTentative && <span className="fc-event-tentative-badge">[TENTATIVE]</span>}
                  {hasAttachment && <span className="fc-event-attachment-badge" title="Has attachment">●</span>}
                  {hasOsecParticipant && (
                    <span className="fc-event-osec-bookmark" title="OSEC participant">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12" aria-hidden="true">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                      </svg>
                    </span>
                  )}
                  {conflict && <span className="fc-event-conflict-dot">● </span>}
                  <span className="fc-event-title-text">{arg.event.title}</span>
                  {isFinal && <span className="fc-event-final-icon" title="Final schedule">✓</span>}
                </div>
              );
            }}
            windowResize={() => {
              const api = calendarRef.current?.getApi?.();
              if (api) api.updateSize();
            }}
          />
          ) : (
    /* KAPAG PARTICIPANTS: Ipakita ang bagong View */
    <ParticipantsCalendarView 
      events={fcEvents} // Ipinasa natin yung filtered events
      user={user}
      filterParticipant={filterParticipant}
      filterHost={filterHost}
      onEventClick={(event) => setSelectedEvent(event)}
    />
  )}
</div>
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
