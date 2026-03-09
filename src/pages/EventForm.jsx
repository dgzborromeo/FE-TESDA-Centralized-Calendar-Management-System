  import { useRef, useState, useEffect, useMemo } from 'react';
  import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
  import { events as eventsApi, users as usersApi, config as configApi } from '../api';
  import { useAuth } from '../context/AuthContext';
  import { buildTentativeDescription, parseTentativeDescription } from '../utils/tentativeSchedule';
  import { clearRegionalDirectorsForEvent, saveRegionalDirectorsForEvent } from '../utils/regionalDirectorsParticipants';
  import { parseParticipantLabel } from '../utils/regionalDirectorsLabel';
  import './EventForm.css';

  const TYPES = ['meeting', 'zoom', 'event'];
  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const ROMO_COLOR = '#3b82f6';
  const PO_COLOR = '#ec4899';
  const SMO_COLOR = '#ef4444';
  const CO_COLOR = '#3b82f6';
  const ICTO_COLOR = '#06b6d4';
  const AS_COLOR = '#06b6d4';
  const PLO_COLOR = '#8b5cf6';
  const PIO_COLOR = '#ef4444';
  const QSO_COLOR = '#ec4899';
  const FMS_COLOR = '#22c55e';
  const CLGEO_COLOR = '#f59e0b';
  const EBETO_COLOR = '#8b5cf6';
  const OSEC_COLOR = '#ef4444';
  const OFFICE_COLOR_PALETTE = [
    '#3b82f6',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#14b8a6',
  ];

  const REGIONAL_DIRECTORS = [
  { id: 'rd-angelina-m-carreon-ncr', label: 'RD Angelina M. Carreon (NCR)' },
  { id: 'rd-ramon-evan-t-ruiz-region-i', label: 'RD Ramon Evan T. Ruiz (Region I)' },
  { id: 'rd-ashary-a-banto-region-ii', label: 'RD Ashary A. Banto (Region II)' },
  { id: 'rd-balmyrson-m-valdez-region-iii', label: 'RD Balmyrson M. Valdez (Region III)' },
  { id: 'rd-jovencio-m-ferrer-jr-region-iv-a', label: 'RD Jovencio M. Ferrer, Jr. (Region IV-A)' },
  { id: 'rd-baron-jose-l-lagran-region-iv-b', label: 'RD Baron Jose L. Lagran (Region IV-B)' },
  { id: 'rd-archie-a-grande-region-v', label: 'RD Archie A. Grande (Region V)' },
  { id: 'ard-esther-b-babalo-region-vi', label: 'ARD Esther B. Babalo (Region VI)' },
  { id: 'rd-gamaliel-b-vicente-jr-region-vii', label: 'RD Gamaliel B. Vicente, Jr. (Region VII)' },
  { id: 'rd-dan-m-navarro-region-viii', label: 'RD Dan M. Navarro (Region VIII)' },
  { id: 'rd-alan-t-bacatan-region-ix', label: 'RD Alan T. Bacatan (Region IX)' },
  { id: 'rd-rafael-y-abrogar-ii-region-x', label: 'RD Rafael Y. Abrogar, II (Region X)' },
  { id: 'rd-tarhata-s-mapandi-region-xi', label: 'RD Tarhata S. Mapandi (Region XI)' },
  { id: 'rd-remegias-g-timonio-region-xii', label: 'RD Remegias G. Timonio (Region XII)' },
  { id: 'rd-florencio-f-sunico-jr-caraga', label: 'RD Florencio F. Sunico, Jr. (CARAGA)' },
  { id: 'rd-nina-connie-g-dodd-nir', label: 'RD Nina Connie G. Dodd (NIR)' },
  ];

  const PROVINCIAL_DIRECTORS = [
    { id: 'pd-socorro-f-galanto-ilocos-norte', label: 'PD Socorro F. Galanto (Region I - PO-Ilocos Norte)' },
    { id: 'pd-marlon-p-daclis-la-union', label: 'PD Marlon P. Daclis (Region I - PO-La Union)' },
  ];

  const EXECUTIVE_DIRECTORS_CO = [
    { id: 'ed-charlyn-b-justimbaste-co-po', label: 'ED Charlyn B. Justimbaste (CO-PO)' },
    { id: 'ed-david-b-bungallon-co-romo', label: 'ED David B. Bungallon (CO-ROMO)' },
  ];

  function colorFromUserId(id) {
    const n = Number(id);
    if (!Number.isFinite(n)) return OFFICE_COLOR_PALETTE[0];
    return OFFICE_COLOR_PALETTE[Math.abs(n) % OFFICE_COLOR_PALETTE.length];
  }

  function assignedColorForUser(user) {
    const email = String(user?.email || '').toLowerCase();
    if (email === 'ncr@tesda.gov.ph') return '#facc15';
    if (email === 'cluster.osec@tesda.gov.ph') return OSEC_COLOR;
    if (email === 'cluster.oddg.pp@tesda.gov.ph') return PO_COLOR;
    if (email === 'cluster.oddg.ai@tesda.gov.ph') return AS_COLOR;
    if (email === 'cluster.oddg.sc@tesda.gov.ph') return CLGEO_COLOR;
    if (email === 'cluster.oddg.pl@tesda.gov.ph') return PLO_COLOR;
    if (email === 'cluster.oddg.fla@tesda.gov.ph') return FMS_COLOR;
    if (email === 'cluster.oddg.tesdo@tesda.gov.ph') return ROMO_COLOR;
    if (email === 'romo@tesda.gov.ph') return ROMO_COLOR;
    if (email === 'osec@tesda.gov.ph') return OSEC_COLOR;
    if (email === 'po@tesda.gov.ph') return PO_COLOR;
    if (email === 'smo@tesda.gov.ph') return SMO_COLOR;
    if (email === 'co@tesda.gov.ph') return CO_COLOR;
    if (email === 'icto@tesda.gov.ph') return ICTO_COLOR;
    if (email === 'as@tesda.gov.ph') return AS_COLOR;
    if (email === 'plo@tesda.gov.ph') return PLO_COLOR;
    if (email === 'pio@tesda.gov.ph') return PIO_COLOR;
    if (email === 'qso@tesda.gov.ph') return QSO_COLOR;
    if (email === 'fms@tesda.gov.ph') return FMS_COLOR;
    if (email === 'clgeo@tesda.gov.ph') return CLGEO_COLOR;
    if (email === 'ebeto@tesda.gov.ph') return EBETO_COLOR;
    return colorFromUserId(user?.id);
  }

  function toLocalDateString(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function normalizeTimeHHMM(t) {
    if (!t) return '';
    const s = String(t);
    // "HH:MM:SS" -> "HH:MM"
    if (s.length >= 5) return s.slice(0, 5);
    return s;
  }

  function timeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = String(t).split(':');
    return parseInt(h || '0', 10) * 60 + parseInt(m || '0', 10);
  }

  function formatTimeShort(t) {
    const hhmm = normalizeTimeHHMM(t);
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':');
    const hour = parseInt(h, 10);
    const am = hour < 12;
    return `${hour % 12 || 12}:${m} ${am ? 'AM' : 'PM'}`;
  }

  function isWeekendYMD(ymd) {
    if (!ymd || ymd.length < 10) return false;
    const d = new Date(`${ymd.slice(0, 10)}T12:00:00`);
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  function dateRangeYMD(startYmd, endYmd) {
    if (!startYmd || !endYmd) return [];
    const start = new Date(`${startYmd}T12:00:00`);
    const end = new Date(`${endYmd}T12:00:00`);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) return [];
    const out = [];
    const cur = new Date(start);
    while (cur <= end) {
      out.push(toLocalDateString(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }

  function extractCodesFromName(name) {
    const matches = String(name || '').match(/\(([^)]+)\)/g) || [];
    return matches
      .map((m) => m.replace(/[()]/g, '').trim())
      .flatMap((raw) => raw.split('/'))
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s && /^[A-Z0-9-]+$/.test(s));
  }

  export default function EventForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get('date');
    const isEdit = Boolean(id);
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
    const isReadOnlyOffice = isRomo || isPo || isSmo || isCo || isIcto || isAs || isPlo || isPio || isQso || isFms || isClgeo || isEbeto;
    const assignedAccountColor = assignedColorForUser(user);

    const forcedOfficeColor = assignedAccountColor;

    const forcedOfficeLabel = 'Assigned account color';
    const originalDateRef = useRef('');

    const [title, setTitle] = useState('');
    const [type, setType] = useState('meeting');
    const [date, setDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [isTentative, setIsTentative] = useState(false);
    const [tentativeNote, setTentativeNote] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [color, setColor] = useState(assignedAccountColor);
    const [attendeeIds, setAttendeeIds] = useState([]);
    const [users, setUsers] = useState([]);
    const [clusterLegend, setClusterLegend] = useState([]);
    const [openClusters, setOpenClusters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [regionalDirectorsOpen, setRegionalDirectorsOpen] = useState(false);
    const [selectedRegionalDirectors, setSelectedRegionalDirectors] = useState([]);
    const [provincialDirectorsOpen, setProvincialDirectorsOpen] = useState(false);
    const [selectedProvincialDirectors, setSelectedProvincialDirectors] = useState([]);
    const [executiveDirectorsOpen, setExecutiveDirectorsOpen] = useState(false);
    const [selectedExecutiveDirectors, setSelectedExecutiveDirectors] = useState([]);
      // Palitan ang mga dati mong selected states
const [categories, setCategories] = useState([]);
const [openCategoryIds, setOpenCategoryIds] = useState([]);
const [selectedFocalLabels, setSelectedFocalLabels] = useState([]); // Labels ang ise-save natin base sa existing logic mo
const [selectedParticipants, setSelectedParticipants] = useState([]);

    useEffect(() => {
      if (!isEdit) setColor(assignedAccountColor);
    }, [isEdit, assignedAccountColor]);

    useEffect(() => {
      if (isEdit && isReadOnlyOffice) {
        setError('This account cannot edit events.');
      }
    }, [isEdit, isReadOnlyOffice]);

    useEffect(() => {
      if (isEdit) return;
      if (dateParam) {
        setDate(dateParam);
        setEndDate((prev) => prev || dateParam);
      } else if (!date) {
        const today = toLocalDateString(new Date());
        setDate(today);
        setEndDate((prev) => prev || today);
      }
    }, [dateParam]);

useEffect(() => {
  const loadParticipants = async () => {
    try {
      const [allUsers, clusters, catData, focalData] = await Promise.all([
        usersApi.list(),
        usersApi.legendClusters().catch(() => []),
        configApi.getCategories(), // API mo
        configApi.getFocals(),      // API mo
      ]);

      setUsers(Array.isArray(allUsers) ? allUsers : []);
      setClusterLegend(Array.isArray(clusters) ? clusters : []);

      // I-combine ang Focals sa loob ng kanilang Categories
      const combined = catData.map(cat => ({
        ...cat,
        focals: focalData.filter(f => f.category_id === cat.id)
      }));
      setCategories(combined);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };
  loadParticipants();
}, []);

    useEffect(() => {
      if (!isEdit || !id) return;
      eventsApi.get(id).then((e) => {
        const tentative = parseTentativeDescription(e.description || '');
        setTitle(e.title);
        setType(e.type);
        setDate(e.date);
        setEndDate(e.date);
        originalDateRef.current = e.date;
        setStartTime(e.start_time.slice(0, 5));
        setEndTime(e.end_time.slice(0, 5));
        setLocation(e.location || '');
        setDescription(tentative.plainDescription || '');
        setIsTentative(tentative.isTentative);
        setTentativeNote(tentative.note || '');
        setAttachmentFile(null);
        setColor(e.color || COLORS[0]);
        setAttendeeIds((e.attendees || []).map((a) => a.user_id));
        const rdLabels = parseParticipantLabel(e.regional_directors_label);
        const pdLabels = parseParticipantLabel(e.provincial_directors_label);
        const edLabels = parseParticipantLabel(e.executive_directors_label);
        if (rdLabels.length) {
          const isAll = rdLabels.some((l) => String(l).toLowerCase() === 'all rds');
          setSelectedRegionalDirectors(
            isAll ? REGIONAL_DIRECTORS.map((r) => r.id) : REGIONAL_DIRECTORS.filter((r) => rdLabels.some((l) => l === r.label)).map((r) => r.id)
          );
        }
        if (pdLabels.length) {
          const isAll = pdLabels.some((l) => String(l).toLowerCase() === 'all pds');
          setSelectedProvincialDirectors(
            isAll ? PROVINCIAL_DIRECTORS.map((p) => p.id) : PROVINCIAL_DIRECTORS.filter((p) => pdLabels.some((l) => l === p.label)).map((p) => p.id)
          );
        }
        if (edLabels.length) {
          const isAll = edLabels.some((l) => String(l).toLowerCase() === 'all eds');
          setSelectedExecutiveDirectors(
            isAll ? EXECUTIVE_DIRECTORS_CO.map((x) => x.id) : EXECUTIVE_DIRECTORS_CO.filter((x) => edLabels.some((l) => l === x.label)).map((x) => x.id)
          );
        }
        // --- HETO ANG BAGONG LOGIC PARA SA RUMBLE PARTICIPANTS ---
        if (e.participants) {
          try {
            // I-parse ang JSON string galing DB pabalik sa Array of Objects
            const parsedParticipants = typeof e.participants === 'string' 
              ? JSON.parse(e.participants) 
              : e.participants;
              
            setSelectedParticipants(Array.isArray(parsedParticipants) ? parsedParticipants : []);
          } catch (err) {
            console.error("Error parsing participants JSON:", err);
            setSelectedParticipants([]);
          }
        } else {
          setSelectedParticipants([]);
        }
      }).catch(() => navigate('/dashboard'));
    }, [id, isEdit, navigate]);

    const validate = () => {
      const todayYmd = toLocalDateString(new Date());
      if (!title.trim()) {
        setError('Title is required.');
        return false;
      }
      if (!date) {
        setError('Date is required.');
        return false;
      }
      if (!isEdit) {
        if (!endDate) {
          setError('End date is required.');
          return false;
        }
        if (endDate < date) {
          setError('End date must be the same as or after start date.');
          return false;
        }
        const inFebruaryThisYear = (() => {
          const [y, m] = (date || '').split('-').map(Number);
          const year = new Date().getFullYear();
          return m === 2 && y === year;
        })();
        if (date < todayYmd && !inFebruaryThisYear) {
          setError('Past dates are view-only. Please select today or a future date.');
          return false;
        }
        const hasWeekend = dateRangeYMD(date, endDate).some((d) => isWeekendYMD(d));
        if (hasWeekend) {
          setError('Weekends are locked. Please use weekdays only in the selected date range.');
          return false;
        }
      } else if (isWeekendYMD(date) && date !== originalDateRef.current) {
        // Lock weekends (Sat/Sun) for edit moves
        setError('Weekends are locked. Please select a weekday.');
        return false;
      }
      if (!startTime || !endTime) {
        setError('Start and end time are required.');
        return false;
      }
      if (isTentative && !tentativeNote.trim()) {
        setError('Tentative schedule note is required (example: 1st week of June).');
        return false;
      }
      const start = new Date(`1970-01-01T${startTime}`);
      const end = new Date(`1970-01-01T${endTime}`);
      if (end <= start) {
        setError('End time must be after start time.');
        return false;
      }
      setError('');
      return true;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (isEdit && isReadOnlyOffice) return;
      if (!validate()) return;
      const focalParticipantsJSON = JSON.stringify(selectedFocalLabels);
      const selectedRegionalDirectorLabels = REGIONAL_DIRECTORS
        .filter((rd) => selectedRegionalDirectors.includes(rd.id))
        .map((rd) => rd.label);
      const selectedProvincialDirectorLabels = PROVINCIAL_DIRECTORS
        .filter((pd) => selectedProvincialDirectors.includes(pd.id))
        .map((pd) => pd.label);
      const selectedExecutiveDirectorLabels = EXECUTIVE_DIRECTORS_CO
        .filter((ed) => selectedExecutiveDirectors.includes(ed.id))
        .map((ed) => ed.label);
      const allRegionalDirectorsSelected =
        selectedRegionalDirectors.length === REGIONAL_DIRECTORS.length &&
        REGIONAL_DIRECTORS.length > 0;
      const allProvincialDirectorsSelected =
        selectedProvincialDirectors.length === PROVINCIAL_DIRECTORS.length &&
        PROVINCIAL_DIRECTORS.length > 0;
      const allExecutiveDirectorsSelected =
        selectedExecutiveDirectors.length === EXECUTIVE_DIRECTORS_CO.length &&
        EXECUTIVE_DIRECTORS_CO.length > 0;

      setLoading(true);
      setError('');

      const payload = {
        title: title.trim(),
        type,
        date,
        end_date: !isEdit ? endDate : undefined,
        start_time: startTime.length === 5 ? startTime + ':00' : startTime,
        end_time: endTime.length === 5 ? endTime + ':00' : endTime,
        location: location.trim() || undefined,
        participants: selectedParticipants.length > 0 ? JSON.stringify(selectedParticipants) : null,
        description: buildTentativeDescription(isTentative, tentativeNote, description),
        regional_directors_label: selectedRegionalDirectorLabels.length
          ? allRegionalDirectorsSelected
            ? 'All RDs'
            : selectedRegionalDirectorLabels.join(', ')
          : undefined,
        provincial_directors_label: selectedProvincialDirectorLabels.length
          ? allProvincialDirectorsSelected
            ? 'All PDs'
            : selectedProvincialDirectorLabels.join(', ')
          : undefined,
        executive_directors_label: selectedExecutiveDirectorLabels.length
          ? allExecutiveDirectorsSelected
            ? 'All EDs'
            : selectedExecutiveDirectorLabels.join(', ')
          : undefined,
        color: (isEdit ? color : assignedAccountColor) || undefined,
        attendee_ids: attendeeIds.length ? attendeeIds : undefined,
      };
      try {
        if (isEdit) {
          await eventsApi.update(id, payload);
          navigate(`/calendar?date=${date}`);
        } else {
          const fd = new FormData();
          Object.entries(payload).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            if (k === 'attendee_ids') fd.append(k, JSON.stringify(v));
            else fd.append(k, String(v));
          });
          if (attachmentFile) fd.append('attachment', attachmentFile);
          const res = await eventsApi.create(fd);
          const createdEventId =
            res?.event?.id || (Array.isArray(res?.events) ? res.events[0]?.id : undefined);
          if (createdEventId) {
            // Prefer DB storage via regional_directors_label; localStorage is only a fallback.
            clearRegionalDirectorsForEvent(createdEventId);
            if (selectedRegionalDirectorLabels.length) {
              const labelsToSave = allRegionalDirectorsSelected
                ? ['All RDs']
                : selectedRegionalDirectorLabels;
              saveRegionalDirectorsForEvent(createdEventId, labelsToSave);
            }
          }
          navigate(`/calendar?date=${endDate || date}`);
        }
      } catch (err) {
        setError(err.message || 'Failed to save event.');
      } finally {
        setLoading(false);
      }
    };

const handleCheckboxChange = (e, item, children = [], parentId = null) => {
  const isChecked = e.target.checked;

  if (isChecked) {
    // 1. Kunin ang parent item
    const newItems = [{
      ...item,
      parent_id: parentId // Magiging null kung category, may ID kung focal
    }];

    // 2. Kung may children (mga anak), idagdag din sila
    if (children && children.length > 0) {
      children.forEach(child => {
        // Siguraduhin na hindi duplicate ang id+source combo
        newItems.push({ 
          parent_id: item.id,
          id: child.id, 
          name: child.type, 
          source: 'focal' 
        });
      });
    }

    // I-set ang state gamit ang Set para iwas duplicates
    setSelectedParticipants(prev => {
      const combined = [...prev, ...newItems];
      // Filter para sa unique objects base sa id at source
      return combined.filter((v, i, a) => 
        a.findIndex(t => t.id === v.id && t.source === v.source) === i
      );
    });

  } else {
    // Kapag in-uncheck ang parent, alisin din ang lahat ng anak
    const idsToRemove = [item.id, ...children.map(c => c.id)];
    setSelectedParticipants(prev => 
      prev.filter(p => !idsToRemove.includes(p.id))
    );
  }
};

    const toggleAttendee = (uid) => {
      setAttendeeIds((prev) =>
        prev.includes(uid) ? prev.filter((i) => i !== uid) : [...prev, uid]
      );
    };

    const participantData = useMemo(() => {
      const usersByEmail = new Map(
        users
          .filter((u) => u?.id && u?.email)
          .map((u) => [String(u.email).toLowerCase(), u])
      );
      const clusteredIds = new Set();
      const clusters = (clusterLegend || []).map((cluster) => {
        const offices = (cluster.offices || []).map((office) => {
          const officeUsers = new Map();
          const codes = extractCodesFromName(office.name);
          for (const code of codes) {
            const local = code.toLowerCase();
            const byEmail = usersByEmail.get(`${local}@tesda.gov.ph`);
            if (byEmail && !String(byEmail.email || '').toLowerCase().startsWith('cluster.')) {
              officeUsers.set(byEmail.id, byEmail);
            }
            for (const u of users) {
              const uname = String(u?.name || '').toUpperCase();
              if (
                u?.id &&
                uname.includes(`(${code})`) &&
                !String(u?.email || '').toLowerCase().startsWith('cluster.')
              ) {
                officeUsers.set(u.id, u);
              }
            }
          }
          const officeUserList = Array.from(officeUsers.values());
          officeUserList.forEach((u) => clusteredIds.add(u.id));
          return {
            ...office,
            users: officeUserList,
          };
        });
        return {
          ...cluster,
          offices,
        };
      });

      const otherUsers = users.filter(
        (u) => u?.id && !clusteredIds.has(u.id) && !String(u.email || '').toLowerCase().startsWith('cluster.')
      );
      return { clusters, otherUsers };
    }, [users, clusterLegend]);

    const applySelectionForIds = (ids, checked) => {
      setAttendeeIds((prev) => {
        const set = new Set(prev);
        for (const id of ids) {
          if (checked) set.add(id);
          else set.delete(id);
        }
        return Array.from(set);
      });
    };

    const allRegionalDirectorsSelected =
      REGIONAL_DIRECTORS.length > 0 &&
      selectedRegionalDirectors.length === REGIONAL_DIRECTORS.length;

    const toggleRegionalDirector = (rdId) => {
      setSelectedRegionalDirectors((prev) =>
        prev.includes(rdId) ? prev.filter((id) => id !== rdId) : [...prev, rdId]
      );
    };

    const setAllRegionalDirectors = (checked) => {
      setSelectedRegionalDirectors(checked ? REGIONAL_DIRECTORS.map((rd) => rd.id) : []);
    };

    const allProvincialDirectorsSelected =
      PROVINCIAL_DIRECTORS.length > 0 &&
      selectedProvincialDirectors.length === PROVINCIAL_DIRECTORS.length;
    const toggleProvincialDirector = (pdId) => {
      setSelectedProvincialDirectors((prev) =>
        prev.includes(pdId) ? prev.filter((id) => id !== pdId) : [...prev, pdId]
      );
    };
    const setAllProvincialDirectors = (checked) => {
      setSelectedProvincialDirectors(checked ? PROVINCIAL_DIRECTORS.map((pd) => pd.id) : []);
    };

    const allExecutiveDirectorsSelected =
      EXECUTIVE_DIRECTORS_CO.length > 0 &&
      selectedExecutiveDirectors.length === EXECUTIVE_DIRECTORS_CO.length;
    const toggleExecutiveDirector = (edId) => {
      setSelectedExecutiveDirectors((prev) =>
        prev.includes(edId) ? prev.filter((id) => id !== edId) : [...prev, edId]
      );
    };
    const setAllExecutiveDirectors = (checked) => {
      setSelectedExecutiveDirectors(checked ? EXECUTIVE_DIRECTORS_CO.map((ed) => ed.id) : []);
    };

    const toggleClusterOpen = (clusterId) => {
      setOpenClusters((prev) =>
        prev.includes(clusterId) ? prev.filter((id) => id !== clusterId) : [...prev, clusterId]
      );
    };

    return (
      <div className="event-form-page">
        <div className="event-form-header">
          <h1>{isEdit ? 'Edit Event' : 'Create Event'}</h1>
          <button type="button" className="event-form-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          {error && <div className="event-form-error">{error}</div>}

          <label>
            Title <span className="required">*</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </label>

          <div className="event-form-row">
            <label>
              Type
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'meeting' ? 'Meeting' : t === 'zoom' ? 'Zoom' : 'Event'}
                  </option>
                ))}
              </select>
            </label>
            {!isReadOnlyOffice && isEdit ? (
              <label>
                Color
                <div className="event-form-colors">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`event-form-color ${color === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                      title={c}
                    />
                  ))}
                </div>
              </label>
            ) : (
              <label>
                Color
                <div className="event-form-colors">
                  <button
                    type="button"
                    className="event-form-color active"
                    style={{
                      backgroundColor: forcedOfficeColor || assignedAccountColor,
                    }}
                    title={forcedOfficeLabel}
                    disabled
                  />
                </div>
              </label>
            )}
          </div>

          <div className="event-form-row">
            <label>
              Start date <span className="required">*</span>
              <input
                type="date"
                value={date}
                min={!isEdit ? (() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = now.getMonth() + 1;
                  // Allow selecting any day in February of the current year, even later in February.
                  if (month >= 2) return `${year}-02-01`;
                  return toLocalDateString(now);
                })() : undefined}
                onChange={(e) => {
                  const nextStart = e.target.value;
                  setDate(nextStart);
                  if (!isEdit) {
                    setEndDate((prev) => (!prev || prev < nextStart ? nextStart : prev));
                  }
                }}
                required
              />
            </label>
            {!isEdit && (
              <label>
                End date <span className="required">*</span>
                <input
                  type="date"
                  value={endDate}
                  min={date || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </label>
            )}
            <label>
              Start time <span className="required">*</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </label>
            <label>
              End time <span className="required">*</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </label>
          </div>

          <label>
            Location / Room / Zoom Link
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional"
            />
          </label>

<label>
  Participants

<div className="event-form-attendees">
  {categories.map((cat) => {
    const isOpen = openCategoryIds.includes(cat.id);
    
    // Check kung ang mismong category ay nasa napili na
    const isCategoryChecked = selectedParticipants.some(
      (p) => p.id === cat.id && p.source === 'category'
    );

return (
  <div key={cat.id} className="event-form-cluster">
<div className="event-form-cluster-head" style={{ 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between', // Itutulak nito ang label sa left at button sa right
  width: '100%' 
}}>
  <label className="event-form-attendee event-form-cluster-label" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
    <input
      type="checkbox"
      checked={selectedParticipants.some(p => p.id === cat.id && p.source === 'category')}
      onChange={(e) => handleCheckboxChange(e, { 
        id: cat.id, 
        name: cat.category_name, 
        source: 'category' 
      }, cat.focals || [], null)}
    />
    <span style={{ marginLeft: '10px' }}>{cat.category_name}</span>
  </label>

  {cat.focals && cat.focals.length > 0 && (
    <button
      type="button"
      className="event-form-cluster-toggle"
      onClick={() => setOpenCategoryIds(prev => 
        prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
      )}
      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
    >
      {/* Pwede mo nang alisin yung empty span kung naka justify-content: space-between ang head */}
      <span></span>
      <span className="event-form-cluster-chevron">
        {isOpen ? '▼' : '▶'}
      </span>
    </button>
  )}
</div>

    {/* FOCALS LIST - LALABAS LANG KUNG OPEN AT MAY LAMAN TALAGA */}
    {isOpen && cat.focals && cat.focals.length > 0 && (
      <div className="event-form-cluster-offices">
        {cat.focals.map((focal) => {
          const isFocalChecked = selectedParticipants.some(
            (p) => p.id === focal.id && p.source === 'focal'
          );

          return (
            <label key={focal.id} className="event-form-attendee event-form-office-label">
              <input
                type="checkbox"
                checked={isFocalChecked}
                onChange={(e) => handleCheckboxChange(e, { 
                  id: focal.id, 
                  name: focal.type, 
                  source: 'focal' 
                }, [], cat.id)}
              />
              {focal.type}
            </label>
          );
        })}
      </div>
    )}
  </div>
);
  })}
</div>
 
              {/* <div className="event-form-attendees">
                {participantData.clusters.map((cluster) => {
                  const clusterIds = cluster.offices.flatMap((o) => (o.users || []).map((u) => u.id));
                  const clusterChecked =
                    clusterIds.length > 0 && clusterIds.every((id) => attendeeIds.includes(id));
                  const isOpen = openClusters.includes(cluster.id);
                  return (
                    <div key={cluster.id} className="event-form-cluster">
                      <div className="event-form-cluster-head">
                        <button
                          type="button"
                          className="event-form-cluster-toggle"
                          onClick={() => toggleClusterOpen(cluster.id)}
                          aria-expanded={isOpen}
                        >
                          <span>{cluster.name}</span>
                          <span className="event-form-cluster-chevron">
                            {isOpen ? '▼' : '▶'}
                          </span>
                        </button>
                        <label className="event-form-attendee event-form-cluster-label">
                          <input
                            type="checkbox"
                            checked={clusterChecked}
                            onChange={(e) => applySelectionForIds(clusterIds, e.target.checked)}
                            disabled={clusterIds.length === 0}
                          />
                          Select all
                        </label>
                      </div>
                      {isOpen && (
                        <div className="event-form-cluster-offices">
                          {cluster.offices.map((office) => {
                            const officeIds = (office.users || []).map((u) => u.id);
                            const officeChecked =
                              officeIds.length > 0 &&
                              officeIds.every((id) => attendeeIds.includes(id));
                            return (
                              <label
                                key={`${cluster.id}-${office.name}`}
                                className="event-form-attendee event-form-office-label"
                              >
                                <input
                                  type="checkbox"
                                  checked={officeChecked}
                                  onChange={(e) => applySelectionForIds(officeIds, e.target.checked)}
                                  disabled={officeIds.length === 0}
                                />
                                {office.name}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {participantData.otherUsers.length > 0 && (
                  <div className="event-form-cluster">
                    <div className="event-form-other-title">Other offices/accounts</div>
                    {participantData.otherUsers.map((u) => (
                      <label key={u.id} className="event-form-attendee event-form-office-label">
                        <input
                          type="checkbox"
                          checked={attendeeIds.includes(u.id)}
                          onChange={() => toggleAttendee(u.id)}
                        />
                        {u.name} ({u.email})
                      </label>
                    ))}
                  </div>
                )}
              </div> */}
      
          </label>

          <label>
            Description / Notes
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              rows={4}
            />
          </label>

          <div className="event-form-row">
            <label className="event-form-inline-check">
              <input
                type="checkbox"
                checked={isTentative}
                onChange={(e) => setIsTentative(e.target.checked)}
              />
              Tentative schedule only (no exact day yet)
            </label>
            {isTentative && (
              <label>
                Tentative schedule note <span className="required">*</span>
                <input
                  type="text"
                  value={tentativeNote}
                  onChange={(e) => setTentativeNote(e.target.value)}
                  placeholder="Example: 1st week of June"
                  required={isTentative}
                />
              </label>
            )}
          </div>

          {!isEdit && (
            <label>
              Attachment (optional)
              <input
                type="file"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
              />
            </label>
          )}

          <div className="event-form-actions">
            <button
              type="submit"
              className="event-form-submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
            <button type="button" className="event-form-cancel" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }
