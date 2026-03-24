import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import '../components/Header.css';
import './SimpleEventForm.css';
import { config as scheduleAPI } from '../api';
export default function SimpleEventForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  const backTo = location?.state?.backTo || '/dashboard';
  const attachmentInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [dateSchedules, setDateSchedules] = useState([]);
  const [dateSchedulesLoading, setDateSchedulesLoading] = useState(false);
  const [conflictMap, setConflictMap] = useState({});
  const [liveConflicts, setLiveConflicts] = useState([]);
  const [positions, setPositions] = useState([]);
  const [focalships, setFocalships] = useState([]);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [selectedFocal, setSelectedFocal] = useState('');
  const [selectedFocals, setSelectedFocals] = useState([]);
  const [showOthersInput, setShowOthersInput] = useState(false);
  const [clusters, setClusters] = useState([]);
const [offices, setOffices] = useState([]);
const [regions, setRegions] = useState([]);
const [provinces, setProvinces] = useState([]);
const [selectedRegionId, setSelectedRegionId] = useState(null); // Para sa Provincial Director logic
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [hoveredPosition, setHoveredPosition] = useState(null);
const [conflictError, setConflictError] = useState(null); // I-store dito ang JSON error
// Para sa UI logic ng cascading
const [subType, setSubType] = useState(null); // 'cluster', 'office', 'region', 'province'
const [tempRegions, setTempRegions] = useState([]);
const [newFocalName, setNewFocalName] = useState('');
  const [form, setForm] = useState({
    office: '',
    division: '',
    title: '',
    description: '',
    meetingType: 'face-to-face',
    startDate: '',
    endDate: '',
    startTime: '08:00',
    endTime: '17:00',
    location: '',
    zoomLink: '',
    participants: '',
    attachment: null,
  });
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [posRes, focalRes, clusterRes, officeRes, regionRes] = await Promise.all([
          scheduleAPI.getPositions(),
          scheduleAPI.getFocalships(),
          scheduleAPI.getClusters(), // Siguraduhin na may ganito sa API index.js
          scheduleAPI.getOffices(),
          scheduleAPI.getRegions()
        ]);
        setPositions(posRes || []);
        setFocalships(focalRes || []);
        setClusters(clusterRes || []);
      setOffices(officeRes || []);
      setRegions(regionRes || []);
      } catch (err) {
        console.error("Failed to fetch participant data", err);
      }
    };
    fetchData();
  }, []);

  // Fetch existing schedules whenever startDate changes
  useEffect(() => {
    if (!form.startDate) {
      setDateSchedules([]);
      return;
    }
    let cancelled = false;
    const fetchDateSchedules = async () => {
      setDateSchedulesLoading(true);
      try {
        const data = await scheduleAPI.getSchedules();
        console.log('[DateSchedules] raw response:', data);
        const all = Array.isArray(data) ? data : [];
        // Filter: start_date <= selected <= end_date (or start_date == selected if no end_date)
        const filtered = all.filter((s) => {
          const sd = String(s.start_date || '').slice(0, 10);
          const ed = String(s.end_date || s.start_date || '').slice(0, 10);
          return form.startDate >= sd && form.startDate <= ed;
        });
        console.log('[DateSchedules] filtered for', form.startDate, ':', filtered);
        if (!cancelled) setDateSchedules(filtered);
      } catch (err) {
        console.error('[DateSchedules] fetch error:', err);
        if (!cancelled) setDateSchedules([]);
      } finally {
        if (!cancelled) setDateSchedulesLoading(false);
      }
    };
    fetchDateSchedules();
    return () => { cancelled = true; };
  }, [form.startDate]);

  // Live conflict check via backend — triggers on participant/date/time change
  useEffect(() => {
    if (!selectedPositions.length || !form.startDate || !form.startTime || !form.endTime) {
      setLiveConflicts([]);
      setConflictMap({});
      return;
    }
    let cancelled = false;
    const payload = selectedPositions.map(p => ({
      designationId: parseInt(p.designationId ?? p.id, 10),
      targetId: p.targetId ? parseInt(p.targetId, 10) : null,
      targetType: p.targetType || null,
      isAll: !!p.isAll,
    })).filter(p => !isNaN(p.designationId));

    if (!payload.length) return;

    scheduleAPI.checkScheduleConflict({
      selectedPositions: payload,
      start_date: form.startDate,
      end_date: form.endDate || form.startDate,
      start_time: form.startTime,
      end_time: form.endTime,
    }).then(result => {
      if (cancelled) return;
      setLiveConflicts(result.messages || []);
      const map = {};
      (result.scheduleIds || []).forEach(id => { map[id] = 'time'; });
      setConflictMap(map);
    }).catch(() => {
      if (!cancelled) { setLiveConflicts([]); setConflictMap({}); }
    });
    return () => { cancelled = true; };
  }, [selectedPositions, form.startDate, form.endDate, form.startTime, form.endTime]);

  const updateParticipantsText = useCallback((selPos, selFocals) => {
    const posNames = selPos.map(p => p.name);
    const focalNames = selFocals.map(f => `Focal: ${f}`);
    const combined = [...posNames, ...focalNames];
    
    setForm(prev => ({
      ...prev,
      participants: combined.join(', ')
    }));
  }, []);
const getPosConfig = (posName) => {
  const pos = positions.find(p => p.name === posName);
  if (!pos || !pos.has_sub_menu) return null;
  return {
    type: pos.sub_menu_type,      // e.g., 'cluster', 'office'
    source: pos.sub_menu_source,  // e.g., 'clusters', 'offices'
    label: pos.sub_menu_type?.charAt(0).toUpperCase() + pos.sub_menu_type?.slice(1) + 's' // Auto label
  };
};

const handlePositionDropdownChange = (e) => {
  const val = e.target.value;
  setSubType(null);
  setSelectedRegionId(null);

  const config = getPosConfig(val);

  if (config) {
    setSubType(config.type);
    setHoveredPosition(val);
  } else {
    const posObj = positions.find(p => p.name === val);
    if (posObj && !selectedPositions.find(p => p.id === posObj.id)) {
      const updated = [...selectedPositions, posObj];
      setSelectedPositions(updated);
      updateParticipantsText(updated, selectedFocals);
    }
  }
};
const handleSubSelect = (subItem, type, parentPos) => {
  const labelMap = { 'district_ncr': 'Districts', 'prov_region': 'Provinces', 'cluster': 'Clusters', 'office': 'Offices', 'region': 'Regions' };
  const allLabel = `${parentPos} - All ${labelMap[type] || 'Participants'}`;

  if (selectedPositions.some(p => p.name === allLabel)) return;

  const posObj = positions.find(p => p.name === parentPos);
  if (!posObj) return;

  // ITEM NAME ONLY: Kunin lang yung dulo (e.g., "Manila" imbes na "NCR - Manila")
  // Ito ang magiging text sa badge: "Position - Item"
  const itemNameOnly = subItem.includes(' - ') ? subItem.split(' - ').pop() : subItem;
  const fullName = `${parentPos} - ${itemNameOnly}`;

  setSelectedPositions(prev => {
    const exists = prev.find(p => p.name === fullName);
    if (exists) return prev.filter(p => p.name !== fullName);

    const dataSources = { clusters, offices, regions, provinces };
    const sourceData = dataSources[posObj.sub_menu_source] || provinces;
    const actualItem = sourceData.find(item => (type === 'region' ? item.region : item.name) === itemNameOnly);

    const updated = [...prev, {
      id: `${type}-${actualItem?.id || Date.now()}`,
      name: fullName,
      designationId: posObj.id, 
      targetId: actualItem?.id,
      targetType: type.replace('_ncr', '').replace('_region', ''),
      isSub: true,
      isAll: false
    }];
    updateParticipantsText(updated, selectedFocals);
    return updated;
  });
};
const handleSelectAll = (items, type, parentPos) => {
  const labelMap = { 
    'district_ncr': 'Districts', 
    'prov_region': 'Provinces', 
    'cluster': 'Clusters', 
    'office': 'Offices', 
    'region': 'Regions',
    'district': 'Districts',
    'province': 'Provinces'
  };

  const displayLabel = labelMap[type] || 'Participants';
  const allLabel = `${parentPos} - All ${displayLabel}`;
  const posObj = positions.find(p => p.name === parentPos);

  // MATCHING LOGIC
  const currentViewFullNames = items.map(item => {
    // Siguraduhin na 'name' o 'region' lang ang kinukuha para tugma sa handleSubSelect badges
    const itemName = type === 'region' ? item.region : item.name;
    return `${parentPos} - ${itemName}`;
  });

  setSelectedPositions(prev => {
    const isAlreadyAll = prev.some(p => p.name === allLabel);
    
    if (isAlreadyAll) {
      const updated = prev.filter(p => p.name !== allLabel);
      updateParticipantsText(updated, selectedFocals);
      return updated;
    } else {
      // 1. Alisin ang individual badges na sakop ng "Select All" view na ito
      const filtered = prev.filter(p => !currentViewFullNames.includes(p.name));
      
      // 2. I-set ang tamang targetType para sa database (e.g., 'prov_region' -> 'province')
      let finalTargetType = type;
      if (type === 'prov_region') finalTargetType = 'province';
      if (type === 'district_ncr') finalTargetType = 'district';

      const allEntry = {
        id: `all-${type}-${Date.now()}`,
        name: allLabel,
        designationId: posObj?.id,
        targetType: finalTargetType, // Ito ang papasok sa target_type column sa DB
        isSub: true,
        isAll: true // Ito ang magiging is_all = 1
      };
      
      const updated = [...filtered, allEntry];
      updateParticipantsText(updated, selectedFocals);
      return updated;
    }
  });
};
// BAGONG FUNCTION: Para i-load ang provinces kapag na-hover ang region sa ilalim ng PD
const handleRegionHover = async (regionId) => {
  setSelectedRegionId(regionId);
  try {
    const res = await scheduleAPI.getProvinces(regionId);
    setProvinces(res || []);
  } catch (err) {
    console.error("Error fetching provinces", err);
  }
};

  const handleCheckboxChange = (pos) => {
    let updated;
    if (selectedPositions.find(p => p.id === pos.id)) {
      updated = selectedPositions.filter(p => p.id !== pos.id);
    } else {
      updated = [...selectedPositions, pos];
    }
    setSelectedPositions(updated);
    updateParticipantsText(updated, selectedFocal);
  };

const handleFocalDropdownChange = (e) => {
    const val = e.target.value;
    if (val === 'Others') {
        setShowOthersInput(true);
    } else {
        setShowOthersInput(false);
        if (val && !selectedFocals.includes(val)) {
            const updatedFocals = [...selectedFocals, val];
            setSelectedFocals(updatedFocals);
            updateParticipantsText(selectedPositions, updatedFocals);
        }
    }
    e.target.value = ""; // Reset dropdown
};

const handleAddCustomFocal = async () => {
    if (!newFocalName.trim()) return;
    
    try {
        setLoading(true);
        const savedFocal = await scheduleAPI.addFocalship({ name: newFocalName });
        setFocalships(prev => [...prev, savedFocal]);
        
        const updatedFocals = [...selectedFocals, savedFocal.name];
        setSelectedFocals(updatedFocals);
        updateParticipantsText(selectedPositions, updatedFocals);
        
        // Reset states
        setNewFocalName('');
        setShowOthersInput(false);
    } catch (err) {
        alert("Failed to add new focalship.");
    } finally {
        setLoading(false);
    }
};
const removeParticipant = (item, type) => {
    if (type === 'position') {
        const updated = selectedPositions.filter(p => p.name !== item);
        setSelectedPositions(updated);
        updateParticipantsText(updated, selectedFocals);
    } else {
        const updated = selectedFocals.filter(f => f !== item);
        setSelectedFocals(updated);
        updateParticipantsText(selectedPositions, updated);
    }
};

  const isZoomLink = (str) => {
    const s = (str || '').trim();
    if (!s) return false;
    return /zoom\.us\//i.test(s);
  };

  const toLocalYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

const isWeekendYMD = (ymd) => {
    if (!ymd) return false;
    // Pinalitan ang '-' ng '/' para iwas sa timezone shift ng JS Date
    const d = new Date(ymd.replace(/-/g, '/'));
    const day = d.getDay();
    return day === 0 || day === 6; // 0=Sun, 6=Sat
};

  const addBusinessDays = (date, businessDays) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    let remaining = Math.max(0, Number(businessDays) || 0);
    while (remaining > 0) {
      d.setDate(d.getDate() + 1);
      const day = d.getDay();
      const isWeekend = day === 0 || day === 6;
      if (!isWeekend) remaining -= 1;
    }
    return d;
  };

  const today = new Date();
  const minStartDateYmd = toLocalYMD(addBusinessDays(today, 10));

  const dateErrors = (() => {
    const errs = {};
    const start = form.startDate;
    const end = form.endDate;

    if (start) {
      if (isWeekendYMD(start)) errs.startDate = 'Weekends are not allowed. Please select a weekday (Mon–Fri).';
      else if (start < minStartDateYmd) errs.startDate = 'Minimum lead time is 10 working days (Mon–Fri). Please select a later date.';
    }
    if (end) {
      if (isWeekendYMD(end)) errs.endDate = 'Weekends are not allowed. Please select a weekday (Mon–Fri).';
      else if (start && end < start) errs.endDate = 'End Date must be the same as or after Start Date.';
    }
    return errs;
  })();

  const hasBlockingErrors = Boolean(dateErrors.startDate || dateErrors.endDate);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, attachment: file }));
  };

const handleContactChange = (e) => {
  let numbers = e.target.value.replace(/\D/g, '');

  // limit to 11 digits
  numbers = numbers.slice(0, 11);

  // format: 0912 345 6789
  let formatted = numbers;

  if (numbers.length > 4 && numbers.length <= 7) {
    formatted = numbers.slice(0, 4) + '-' + numbers.slice(4);
  } else if (numbers.length > 7) {
    formatted =
      numbers.slice(0, 4) +
      '-' +
      numbers.slice(4, 7) +
      '-' +
      numbers.slice(7);
  }

  setForm((prev) => ({
    ...prev,
    contactNumber: formatted,
  }));
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setConflictError(null);
    // Final Validations
    if (form.meetingType === 'virtual' && !isZoomLink(form.zoomLink)) {
      alert('Please enter a valid Zoom link.');
      return;
    }
    if (hasBlockingErrors) {
      alert('Please fix the date requirements before saving.');
      return;
    }

    setLoading(true);

    try {
      // Prepare FormData for Backend (Supports File Upload)
      const formData = new FormData();
      
      formData.append('host_name', form.office);
      formData.append('host_division', form.division);
      formData.append('event_title', form.title);
      formData.append('description', form.description);
      formData.append('start_date', form.startDate);
      formData.append('end_date', form.endDate);
      formData.append('start_time', form.startTime);
      formData.append('end_time', form.endTime);
      formData.append('participants', form.participants); // String version para sa display

      // IMPORTANT: Ito ang gagamitin ng backend para sa Conflict Checking
      // I-map natin ang selectedPositions para magtugma sa expected columns sa DB
// HANAPIN ITO SA IYONG CODE:
const participantDetails = selectedPositions.map(p => ({
  designationId: parseInt(p.designationId || p.id),
  targetId: p.isAll ? null : (p.targetId ? parseInt(p.targetId) : null),
  targetType: p.targetType || null,
  isAll: !!p.isAll // Force boolean
}));

// I-filter ang mga entries na walang valid designationId (NaN)
const finalPayload = participantDetails.filter(p => !isNaN(p.designationId));

formData.append('selectedPositions', JSON.stringify(finalPayload));
      // Meeting Type & Location Logic
      const typeMapping = { 'face-to-face': 'Face to Face', 'hybrid': 'Hybrid', 'virtual': 'Virtual/Zoom' };
      formData.append('type', typeMapping[form.meetingType]);

      let finalLocation = form.location;
      if (form.meetingType === 'virtual') finalLocation = `Zoom: ${form.zoomLink}`;
      if (form.meetingType === 'hybrid') finalLocation = `${form.location} | Zoom: ${form.zoomLink}`;
      formData.append('location', finalLocation);

      if (form.attachment) formData.append('attachment_file', form.attachment);

      // API CALL
      const response = await scheduleAPI.addSchedule(formData);

if (response) {
      setShowSuccessModal(true);
      
      // RESET FORM (Para hindi na kailangan mag-reload)
      setForm({
        office: '',
        division: '',
        email: '',
        contactPerson: '',
        contactNumner: '',
        title: '',
        description: '',
        meetingType: 'face-to-face',
        startDate: '',
        endDate: '',
        startTime: '08:00',
        endTime: '17:00',
        location: '',
        zoomLink: '',
        participants: '',
        attachment: null,
      });

      // Clear the file input manually (React state doesn't clear the file input's visual value easily)
      e.target.reset();
    }
    } catch (err) {
      console.error('Submission error:', err);

      // Dito na natin mahuhuli yung JSON mula sa api.js
      const errorData = err.response?.data;

      if (errorData && errorData.conflicts) {
        // Ipapakita nito ang pula na box sa UI
        setConflictError(errorData);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Kung hindi conflict (halimbawa: Wrong URL o Server Down), alert ang lalabas
        alert('Error: ' + (errorData?.error || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Guard: all hooks done — now safe to redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/dashboard" replace state={{ showLoginModal: true }} />;
  }

  return (
    <div className="simple-event-page">
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <Link to="/dashboard" className="header-logo simple-event-header-logo">
              <Logo className="header-logo-img" src="/tesda-logo.png" alt="TESDA" transparentBlack />
              <span className="header-logo-text">COROPOTI Centralized Schedule Management System</span>
            </Link>
          </div>
          {user && (
            <div className="sef-header-right">
              <div className="sef-user-badge">
                <div className="sef-user-avatar">
                  {String(user.name || user.email || '?')[0].toUpperCase()}
                </div>
                <div className="sef-user-info">
                  <span className="sef-user-name">{user.name || user.email}</span>
                  <span className="sef-user-role">{user.role === 'admin' ? 'Admin' : 'User'}</span>
                </div>
              </div>
              <button
                type="button"
                className="sef-logout-btn"
                onClick={() => { logout(); navigate('/dashboard'); }}
                title="Log out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="simple-event-main">
        <div className="simple-event-page-heading">
          <button
            type="button"
            className="simple-event-back-btn"
            onClick={() => navigate(backTo)}
            title="Back"
          >
            ←
          </button>
          <h1 className="simple-event-page-title">Event Form</h1>
        </div>
        <div className="simple-event-body">
          <div className="simple-event-left">
            {conflictError && (
              <div className="conflict-error-container" style={{
                background: '#fee2e2',
                border: '1px solid #ef4444',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '20px',
                marginTop: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: '#991b1b', margin: 0 }}>⚠️ {conflictError.error}</h3>
                  <button onClick={() => setConflictError(null)} style={{ cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.2rem' }}>×</button>
                </div>
                <p style={{ color: '#b91c1c', margin: '10px 0' }}>{conflictError.message}</p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d' }}>
                  {conflictError.conflicts.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
        <form className="simple-event-form" onSubmit={handleSubmit}>
          <section className="simple-event-section">
            <h2 className="simple-event-section-title">Activities Details</h2>
            <div className="simple-event-grid">
              <div className="simple-event-field simple-event-field-full">
                <label className="simple-event-label" htmlFor="title">
                  Event Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  className="simple-event-input"
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="simple-event-field simple-event-field-full">
                <label className="simple-event-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="simple-event-textarea"
                  placeholder="Add a short description of the activity"
                  rows={3}
                />
              </div>

              <div className={`simple-event-type-location-row simple-event-type-location-${form.meetingType}`}>
                <div className="simple-event-field">
                  <label className="simple-event-label" htmlFor="meetingType">Meeting Type</label>
                  <select id="meetingType" name="meetingType" value={form.meetingType} onChange={handleChange} className="simple-event-input">
                    <option value="face-to-face">Face to Face</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="virtual">Virtual/Zoom</option>
                  </select>
                </div>
                <div className="simple-event-field">
                  <label className="simple-event-label" htmlFor="location">
                    {form.meetingType === 'virtual' ? 'Zoom Link' : 'Location'}
                  </label>
                  {form.meetingType === 'virtual' ? (
                    <>
                      <input id="location" name="zoomLink" type="url" value={form.zoomLink} onChange={handleChange} className="simple-event-input" placeholder="https://zoom.us/j/123456789" required />
                      {form.zoomLink && !isZoomLink(form.zoomLink) && (
                        <span className="simple-event-hint simple-event-hint-error">Please enter a valid Zoom link</span>
                      )}
                    </>
                  ) : (
                    <input id="location" name="location" type="text" value={form.location} onChange={handleChange} className="simple-event-input" placeholder="e.g. TESDA Auditorium, Room 101" required />
                  )}
                </div>
                {form.meetingType === 'hybrid' && (
                  <div className="simple-event-field">
                    <label className="simple-event-label" htmlFor="zoomLink">Zoom Link</label>
                    <input id="zoomLink" name="zoomLink" type="url" value={form.zoomLink} onChange={handleChange} className="simple-event-input" placeholder="https://zoom.us/j/123456789" required />
                  </div>
                )}
              </div>
              <div className="simple-event-field-pair simple-event-field-full">
                <div className="simple-event-field">
                  <label className="simple-event-label" htmlFor="startDate">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={handleChange}
                    className="simple-event-input"
                    min={minStartDateYmd}
                    required
                  />
                  {dateErrors.startDate && (
                    <span className="simple-event-hint simple-event-hint-error">{dateErrors.startDate}</span>
                  )}
                </div>
                <div className="simple-event-field">
                  <label className="simple-event-label" htmlFor="endDate">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={handleChange}
                    className="simple-event-input"
                    min={form.startDate || minStartDateYmd}
                    required
                  />
                  {dateErrors.endDate && (
                    <span className="simple-event-hint simple-event-hint-error">{dateErrors.endDate}</span>
                  )}
                </div>
              </div>

              {/* Time row */}
              <div className="simple-event-field-pair simple-event-field-full">
                <div className="simple-event-field">
                  <label className="simple-event-label" htmlFor="startTime">
                    Start Time
                  </label>
                  <select
                    id="startTime"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                    className="simple-event-input"
                    required
                  >
                    {Array.from({ length: 18 * 4 }, (_, i) => {
                      const totalMins = 6 * 60 + i * 15;
                      const h = Math.floor(totalMins / 60);
                      const m = totalMins % 60;
                      const hh = String(h).padStart(2, '0');
                      const mm = String(m).padStart(2, '0');
                      const val = `${hh}:${mm}`;
                      const hour = h % 12 || 12;
                      const ampm = h < 12 ? 'AM' : 'PM';
                      return <option key={val} value={val}>{`${hour}:${mm} ${ampm}`}</option>;
                    })}
                  </select>
                </div>
                <div className="simple-event-field">
                  <label className="simple-event-label" htmlFor="endTime">
                    End Time
                  </label>
                  <select
                    id="endTime"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleChange}
                    className="simple-event-input"
                    required
                  >
                    {Array.from({ length: 18 * 4 }, (_, i) => {
                      const totalMins = 6 * 60 + i * 15;
                      const h = Math.floor(totalMins / 60);
                      const m = totalMins % 60;
                      const hh = String(h).padStart(2, '0');
                      const mm = String(m).padStart(2, '0');
                      const val = `${hh}:${mm}`;
                      const hour = h % 12 || 12;
                      const ampm = h < 12 ? 'AM' : 'PM';
                      return <option key={val} value={val}>{`${hour}:${mm} ${ampm}`}</option>;
                    })}
                  </select>
                </div>
              </div>

            </div>
          </section>
          <section className="simple-event-section">
            <h2 className="simple-event-section-title">Participants</h2>

            {liveConflicts.length > 0 && (
              <div className="sef-live-conflict-box">
                <div className="sef-live-conflict-header">
                  <span className="sef-live-conflict-icon">⚠</span>
                  <strong>Schedule Conflict Detected ({liveConflicts.length})</strong>
                </div>
                <ul className="sef-live-conflict-list">
                  {liveConflicts.map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
              </div>
            )}

  <div className="participants-container">
    
<div className="participants-inline-row">
  {/* Positions Group */}
{/* Heads Group with Custom Dropdown */}
      <div className="input-group-inline" style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
        <label className="simple-event-label">Heads</label>
        
        {/* Custom Trigger - Pinagmumukhang Select Input */}
        <div 
          className="custom-dropdown-trigger" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {hoveredPosition || "-- Select Participant --"}
          <span className="arrow">{isMenuOpen ? '▲' : '▼'}</span>
        </div>

        {/* Ang Cascading Menu sa Gilid */}
        {isMenuOpen && (
          <div className="main-menu-container">
            {/* Unang Listahan (Main Positions) */}
<ul className="dropdown-list-main">
{positions.map((p) => {
  const hasSubMenu = p.has_sub_menu; // Direct from DB column
  
  return (
    <li 
      key={p.id} 
      className={hoveredPosition === p.name ? 'active-li' : ''}
      onMouseEnter={() => {
        setHoveredPosition(p.name);
        if (hasSubMenu) {
          setSubType(p.sub_menu_type);
          // Special cases handle
          if (p.sub_menu_type === 'district_ncr') handleRegionHover(2);
          else if (p.sub_menu_type !== 'prov_region') setSelectedRegionId(null);
        } else {
          setSubType(null);
        }
      }}
      onClick={() => {
        if (!hasSubMenu) {
          handlePositionDropdownChange({ target: { value: p.name } });
          setIsMenuOpen(false);
          setHoveredPosition(null);
        }
      }}
    >
      {p.name}
      {hasSubMenu && <span className="chevron-right">▶</span>}
    </li>
  );
})}
</ul>

            {/* Pangalawang Listahan (Lilitaw sa tabi pag nag-hover sa may sub-type) */}
            {subType && (
              <ul className="dropdown-list-sub">
{/* Render clusters, offices, or regions dynamically */}
{['cluster', 'office', 'region'].includes(subType) && (
  <ul className="dropdown-list-sub">
    <li className="select-all-item">
      <label className="checkbox-label">
        <input 
  type="checkbox" 
  onChange={() => {
    const config = getPosConfig(hoveredPosition);
    const items = { 
      'cluster': clusters, 
      'office': offices, 
      'region': regions,
      'district_ncr': provinces,
      'prov_region': provinces 
    }[subType];
    handleSelectAll(items, subType, hoveredPosition);
  }}
  checked={selectedPositions.some(p => {
    const labelMap = { 'district_ncr': 'Districts', 'prov_region': 'Provinces', 'cluster': 'Clusters', 'office': 'Offices', 'region': 'Regions' };
    return p.name === `${hoveredPosition} - All ${labelMap[subType] || 'Participants'}`;
  })}
/>
<span className="item-text">
  All {
    subType === 'district_ncr' ? 'Districts' : 
    subType === 'prov_region' ? 'Provinces' : 
    (subType.charAt(0).toUpperCase() + subType.slice(1) + 's')
  }
</span>
      </label>
    </li>
    <div className="scrollable-sub-list">
      {( { clusters, offices, regions }[getPosConfig(hoveredPosition)?.source] || [])
        .filter(item => item.id !== 1)
        .map(item => {
          const itemName = subType === 'region' ? item.region : item.name;
          const fullName = `${hoveredPosition} - ${itemName}`;
          const currentConfig = getPosConfig(hoveredPosition);
          const isChecked = selectedPositions.some(p => p.name === fullName || p.name === `${hoveredPosition} - All ${currentConfig?.label}`);
          
          return (
            <li key={item.id} className="checkbox-item">
              <label className="checkbox-label" onClick={() => handleSubSelect(itemName, subType, hoveredPosition)}>
                <input type="checkbox" checked={isChecked} readOnly />
                <span className="item-text">{itemName}</span>
              </label>
            </li>
          );
      })}
    </div>
  </ul>
)}
{subType === 'prov_region' && (
  <div className="scrollable-sub-list" style={{ borderLeft: '1px solid #eee', minWidth: '180px' }}>
    {regions.filter(r => r.id !== 1 && r.id !== 2).map(r => (
      <li 
        key={r.id} 
        onMouseEnter={() => handleRegionHover(r.id)}
        className={selectedRegionId === r.id ? 'active-li' : ''}
        style={{ padding: '10px 15px', display: 'flex', justifyContent: 'space-between', cursor: 'default' }}
      >
        {r.region} <span className="chevron-right">▶</span>
      </li>
    ))}
  </div>
)}

{subType === 'district_ncr' && (
  <ul className="dropdown-list-sub">
    <li className="select-all-item">
      <label className="checkbox-label">
        <input 
          type="checkbox" 
          onChange={() => handleSelectAll(provinces, 'district', hoveredPosition)}
          checked={selectedPositions.some(p => p.name === `${hoveredPosition} - All Districts`)}
        />
        <span className="item-text">All Districts</span>
      </label>
    </li>
    <div className="scrollable-sub-list">
{provinces.map(pr => {
  const fullName = `${hoveredPosition} - ${pr.name}`; // Tinanggal ang "National Capital Region" sa name
  // Dito tinitingnan kung dapat bang naka-check ang box (kung yung individual name o yung "All Districts" ay selected)
  const isChecked = selectedPositions.some(p => p.name === fullName || p.name === `${hoveredPosition} - All Districts`);
  
  return (
    <li key={pr.id} className="checkbox-item">
      <label className="checkbox-label" onClick={() => handleSubSelect(pr.name, 'district_ncr', hoveredPosition)}>
        <input type="checkbox" checked={isChecked} readOnly />
        <span className="item-text">{pr.name}</span>
      </label>
    </li>
  );
})}
    </div>
  </ul>
)}
              </ul>
            )}
{subType === 'prov_region' && selectedRegionId && (
  <ul className="dropdown-list-sub">
    <li className="select-all-item">
      <label className="checkbox-label">
        <input 
          type="checkbox" 
          onChange={() => {
            // TANGGALIN ang regName mapping dito para mag-match sa individual badges
            handleSelectAll(provinces, 'prov_region', hoveredPosition);
          }}
          checked={selectedPositions.some(p => p.name === `${hoveredPosition} - All Provinces`)}
        />
        <span className="item-text">All Provinces</span>
      </label>
    </li>
    <div className="scrollable-sub-list">
      {provinces.map(pr => {
        // Ang fullName dito ay "Position - Province" (wala nang Region name)
        const fullName = `${hoveredPosition} - ${pr.name}`; 
        const isChecked = selectedPositions.some(p => p.name === fullName || p.name === `${hoveredPosition} - All Provinces`);
        
        return (
          <li key={pr.id} className="checkbox-item">
            <label className="checkbox-label" onClick={() => handleSubSelect(pr.name, 'prov_region', hoveredPosition)}>
              <input type="checkbox" checked={isChecked} readOnly />
              <span className="item-text">{pr.name}</span>
            </label>
          </li>
        );
      })}
    </div>
  </ul>
)}
          </div>
        )}
      </div>{/* end Heads input-group-inline */}

  {/* Focals Group */}
  <div className="input-group-inline">
    <label className="simple-event-label">Focals</label>
    <select 
      className="simple-event-input modern-select" 
      onChange={handleFocalDropdownChange}
      defaultValue=""
    >
      <option value="" disabled>-- Select Participant--</option>
      {focalships.map(f => (
        <option key={f.id} value={f.name}>{f.name}</option>
      ))}
      <option value="Others" className="option-others">+ Others (New)</option>
    </select>

    {/* Others Field - appears below the Focals select */}
    {showOthersInput && (
      <div className="modern-inline-group others-animate">
        <input 
          type="text"
          className="simple-event-input compact-input"
          placeholder="Enter focal..."
          value={newFocalName}
          onChange={(e) => setNewFocalName(e.target.value)}
          autoFocus
        />
        <button type="button" className="badge-type" onClick={handleAddCustomFocal}>Add</button>
        <button type="button" className="btn-cancel-inline" onClick={() => setShowOthersInput(false)}>&times;</button>
      </div>
    )}
  </div>
        </div>{/* end .participants-inline-row */}
  <label className="simple-event-label">Final Participants List (Review)</label>
    {/* Unified Badge List (Always Sorted: Positions first) */}
    <div className="unified-badges-list">
      {/* First: Positions */}
      {selectedPositions.map((p) => (
        <span key={`pos-${p.id}`} className="participant-badge badge-position">
          <span className="badge-type">Position</span>
          {p.name}
          <button type="button" onClick={() => removeParticipant(p.name, 'position')} className="remove-badge-btn">&times;</button>
        </span>
      ))}

      {/* Second: Focals */}
      {selectedFocals.map((f, idx) => (
        <span key={`foc-${idx}`} className="participant-badge badge-focal">
          <span className="badge-type">Focal</span>
          {f}
          <button type="button" onClick={() => removeParticipant(f, 'focal')} className="remove-badge-btn">&times;</button>
        </span>
      ))}
    </div>
</div>{/* end .participants-container */}
</section>

          <section className="simple-event-section">
            <h2 className="simple-event-section-title">Program References</h2>
            <div className="simple-event-grid">
              <div className="simple-event-field simple-event-field-full">
                <label className="simple-event-label" htmlFor="attachment">
                  Program References (e.g., TESDA Order, Notice of Meeting, Terms of Reference)
                </label>
                <div className="simple-file-picker">
                  <input
                    ref={attachmentInputRef}
                    id="attachment"
                    name="attachment"
                    type="file"
                    onChange={handleFileChange}
                    className="simple-file-picker-input"
                  />
                  <label className="simple-file-picker-button" htmlFor="attachment">
                    Choose file
                  </label>
                  <span className="simple-file-picker-name" title={form.attachment?.name || ''}>
                    {form.attachment?.name || 'No file chosen'}
                  </span>
                  {form.attachment ? (
                    <button
                      type="button"
                      className="simple-file-picker-clear"
                      onClick={() => {
                        if (attachmentInputRef.current) attachmentInputRef.current.value = '';
                        setForm((prev) => ({ ...prev, attachment: null }));
                      }}
                      aria-label="Remove selected file"
                      title="Remove selected file"
                      disabled={loading}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
          <div className="simple-event-actions">
          <button
            type="submit"
            className="simple-event-submit"
            disabled={loading || (form.meetingType === 'virtual' && !isZoomLink(form.zoomLink)) || hasBlockingErrors}
          >
            {loading ? 'Saving...' : 'Save Event'}
          </button>
          </div>
        </form>
          </div>{/* end .simple-event-left */}

          <aside className="simple-event-right-panel">
            <div className="sef-panel-header">
              <h3 className="sef-panel-title">
                {form.startDate
                  ? `Schedules on ${new Date(form.startDate + 'T12:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}`
                  : 'Schedules on Selected Date'}
              </h3>
              {form.startDate && !dateSchedulesLoading && (
                <span className="sef-panel-count">{dateSchedules.length}</span>
              )}
            </div>

            {!form.startDate && (
              <p className="sef-panel-empty">Pick a start date to see existing schedules on that day.</p>
            )}

            {form.startDate && dateSchedulesLoading && (
              <p className="sef-panel-empty">Loading...</p>
            )}

            {form.startDate && !dateSchedulesLoading && dateSchedules.length === 0 && (
              <p className="sef-panel-empty">No schedules found on this date.</p>
            )}

            {form.startDate && !dateSchedulesLoading && dateSchedules.length > 0 && (() => {
              const fmt = (t) => {
                if (!t) return '';
                const [h, m] = String(t).slice(0, 5).split(':');
                const hr = parseInt(h, 10);
                return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`;
              };
              return (
                <>
                  {Object.values(conflictMap).some(v => v === 'time') && (
                    <div className="sef-conflict-summary sef-conflict-summary--time">
                      <span className="sef-conflict-summary-icon">⚠</span>
                      <div>
                        <strong>Time conflict detected on this date</strong>
                        <p>Highlighted events below have conflicting participants.</p>
                      </div>
                    </div>
                  )}

                  <ul className="sef-panel-list">
                    {dateSchedules.map((ev) => {
                      const conflict = conflictMap[ev.id];
                      const isConflict = conflict === 'time';
                      const isWarn = conflict === 'date';
                      return (
                        <li key={`${ev.id}-${conflict ?? 'none'}`} className={`sef-card${isConflict ? ' sef-card--conflict' : isWarn ? ' sef-card--warn' : ''}`}>
                          <div className="sef-card-top">
                            <span className="sef-card-title">{ev.event_title || '(No title)'}</span>
                            {isConflict && <span className="sef-card-badge sef-card-badge--conflict">⚠ Conflict</span>}
                            {isWarn    && <span className="sef-card-badge sef-card-badge--warn">↔ Overlap</span>}
                          </div>
                          {(ev.start_time || ev.end_time) && (
                            <div className="sef-card-time">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              {fmt(ev.start_time)}{ev.end_time ? ` – ${fmt(ev.end_time)}` : ''}
                            </div>
                          )}
                          <div className="sef-card-footer">
                            {ev.host_name && <span className="sef-card-host">{ev.host_name}</span>}
                            {ev.status && (
                              <span className={`sef-card-status sef-status-${String(ev.status).toLowerCase()}`}>{ev.status}</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              );
            })()}
          </aside>
        </div>{/* end .simple-event-body */}
      </main>

      {showSuccessModal && (
        <div className="sef-success-overlay">
          <div className="sef-success-modal">
            <div className="sef-success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
            </div>
            <h2 className="sef-success-title">Submitted!</h2>
            <p className="sef-success-message">
              Your schedule has been successfully submitted for validation. It will be reflected on the calendar upon approval.
            </p>
            <button
              className="sef-success-btn"
              onClick={() => { setShowSuccessModal(false); navigate('/dashboard'); }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

