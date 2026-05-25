import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
const [selectedRegionIdForTTI, setSelectedRegionIdForTTI] = useState(null);
const [selectedProvinceIdForTTI, setSelectedProvinceIdForTTI] = useState(null);
const [tempProvincesForTTI, setTempProvincesForTTI] = useState([]);
const [tempTtis, setTempTtis] = useState([]);
const [selectedLocationData, setSelectedLocationData] = useState({
    id: null,
    table: null
});
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
        const [posRes, focalRes, clusterRes, officeRes, regionRes, allProvRes, allTtiRes] = await Promise.all([
          scheduleAPI.getPositions(),
          scheduleAPI.getFocalships(),
          scheduleAPI.getClusters(), // Siguraduhin na may ganito sa API index.js
          scheduleAPI.getOffices(),
          scheduleAPI.getRegions(),
          scheduleAPI.getAllProvinces(), // Dapat may endpoint ka na kumukuha ng lahat, hindi lang per region
          scheduleAPI.getTTIs()
        ]);
        setPositions(posRes || []);
        setFocalships(focalRes || []);
        setClusters(clusterRes || []);
      setOffices(officeRes || []);
      setRegions(regionRes || []);
      setProvinces(allProvRes || []); // I-load lahat para searchable
        setTempTtis(allTtiRes || []);   
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
    // 1. Check muna kung kumpleto ang basic info para sa API call
    const hasDateTime = form.startDate && form.startTime && form.endTime;
    const hasSubject = selectedPositions.length > 0 || selectedLocationData.id;

    if (!hasDateTime || !hasSubject) {
      setLiveConflicts([]);
      setConflictMap({});
      return;
    }

    let cancelled = false;

    // 2. Ihanda ang payload ng participants
    const payload = selectedPositions.map(p => ({
      designationId: parseInt(p.designationId ?? p.id, 10),
      targetId: p.targetId ? parseInt(p.targetId, 10) : null,
      targetType: p.targetType || null,
      isAll: !!p.isAll,
    })).filter(p => !isNaN(p.designationId));

    // --- DITO MO TINANGGAL YUNG "if (!payload.length) return;" ---
    // Ngayon, kahit empty ang payload, tutuloy siya sa API call para i-check ang Location ID.

    scheduleAPI.checkScheduleConflict({
      selectedPositions: payload, // Pwedeng empty array [] kung venue lang iche-check
      start_date: form.startDate,
      end_date: form.endDate || form.startDate,
      start_time: form.startTime,
      end_time: form.endTime,
      location_id: selectedLocationData.id,
      location_table: selectedLocationData.table
    }).then(result => {
      if (cancelled) return;
      setLiveConflicts(result.messages || []);
      const map = {};
      (result.scheduleIds || []).forEach(id => { map[id] = 'time'; });
      setConflictMap(map);
    }).catch(() => {
      if (!cancelled) { 
        setLiveConflicts([]); 
        setConflictMap({}); 
      }
    });
    
    return () => { cancelled = true; };
  }, [
    form.location, 
    selectedPositions, 
    selectedLocationData, 
    form.startDate, 
    form.endDate, 
    form.startTime, 
    form.endTime
  ]);

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
  const labelMap = { 
    'tti': 'TTIs', 'district_ncr': 'Districts', 'prov_region': 'Provinces',
    'cluster': 'Clusters', 'office': 'Offices', 'region': 'Regions'
  };
  
  const posObj = positions.find(p => p.name === parentPos);
  const allLabel = `${parentPos} - All ${labelMap[type]}`;
  const itemNameOnly = subItem.includes(' - ') ? subItem.split(' - ').pop() : subItem;
  const fullName = `${parentPos} - ${itemNameOnly}`;

  setSelectedPositions(prev => {
    const isAllActive = prev.some(p => p.name === allLabel);
    let updated;

    if (isAllActive) {
      // 💥 EXPLOSION LOGIC: 
      // 1. Kunin ang listahan ng lahat ng items sa category na ito
      let itemsToExplode = [];
      if (type === 'tti') itemsToExplode = tempTtis;
      else if (type === 'district_ncr' || type === 'prov_region') itemsToExplode = provinces;
      else itemsToExplode = { 'cluster': clusters, 'office': offices, 'region': regions }[type] || [];

      // 2. Gawin silang individual badges MALIBAN sa kinlick mo (uncheck)
      const individualBadges = itemsToExplode
        .filter(item => (type === 'region' ? item.region : item.name) !== itemNameOnly)
        .map(item => ({
          id: `${type}-${item.id}`,
          name: `${parentPos} - ${type === 'region' ? item.region : item.name}`,
          designationId: posObj?.id,
          targetId: item.id,
          targetType: type === 'prov_region' ? 'province' : (type === 'district_ncr' ? 'district' : type),
          isSub: true,
          isAll: false
        }));

      // 3. Alisin ang "All" badge at ipalit ang mga individuals
      updated = [...prev.filter(p => p.name !== allLabel), ...individualBadges];
    } else {
      // Normal Toggle Logic
      const exists = prev.find(p => p.name === fullName);
      if (exists) {
        updated = prev.filter(p => p.name !== fullName);
      } else {
        updated = [...prev, {
          id: `${type}-${Date.now()}`,
          name: fullName,
          designationId: posObj?.id,
          targetType: type === 'prov_region' ? 'province' : (type === 'district_ncr' ? 'district' : type),
          isSub: true,
          isAll: false
        }];
      }
    }
    updateParticipantsText(updated, selectedFocals);
    return updated;
  });
};
const handleSelectAll = (items, type, parentPos) => {
  const labelMap = { 
    'district_ncr': 'Districts', 'prov_region': 'Provinces', 'cluster': 'Clusters', 
    'office': 'Offices', 'region': 'Regions', 'district': 'Districts',
    'province': 'Provinces', 'tti' : 'TTIs'
  };

  const displayLabel = labelMap[type] || 'Participants';
  const allLabel = `${parentPos} - All ${displayLabel}`;
  const posObj = positions.find(p => p.name === parentPos);

  setSelectedPositions(prev => {
    const isAlreadyAll = prev.some(p => p.name === allLabel);
    
    if (isAlreadyAll) {
      // Kapag in-uncheck ang "Select All", empty na lahat sa category na yun
      const updated = prev.filter(p => p.name !== allLabel);
      updateParticipantsText(updated, selectedFocals);
      return updated;
    } else {
      // Pag kinlick ang "Select All", alisin muna ang mga individual items sa view na yun
      let searchTargetType = type === 'prov_region' ? 'province' : (type === 'district_ncr' ? 'district' : type);
      
      const filtered = prev.filter(p => 
        p.designationId !== posObj?.id || p.targetType !== searchTargetType
      );
      
      const allEntry = {
        id: `all-${type}-${Date.now()}`,
        name: allLabel,
        designationId: posObj?.id,
        targetType: searchTargetType,
        isSub: true,
        isAll: true 
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
const handleRegionHoverTTI = async (regionId) => {
  setSelectedRegionIdForTTI(regionId);
  setSelectedProvinceIdForTTI(null);
  setTempTtis([]);
  try {
    const res = await scheduleAPI.getProvinces(regionId);
    setTempProvincesForTTI(res || []);
  } catch (err) {
    console.error("Error fetching provinces for TTI", err);
  }
};

// Hover handler para sa Provinces (TTI Level)
const handleProvinceHoverTTI = async (provinceId) => {
  setSelectedProvinceIdForTTI(provinceId);
  try {
    const res = await scheduleAPI.getTTIsByProvince(provinceId);
    setTempTtis(res || []);
  } catch (err) {
    console.error("Error fetching TTIs", err);
  }
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
  const isAdmin = user?.role === 'admin';
  const minStartDateYmd = isAdmin ? toLocalYMD(today) : toLocalYMD(addBusinessDays(today, 10));

  const dateErrors = (() => {
    const errs = {};
    const start = form.startDate;
    const end = form.endDate;

    if (start) {
      if (isWeekendYMD(start)) errs.startDate = 'Weekends are not allowed. Please select a weekday (Mon–Fri).';
      else if (!isAdmin && start < minStartDateYmd) errs.startDate = 'Minimum lead time is 10 working days (Mon–Fri). Please select a later date.';
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

    // --- START OF VALIDATIONS ---
    if (form.meetingType === 'virtual' && !isZoomLink(form.zoomLink)) {
        alert('Please enter a valid Zoom link.');
        setLoading(false); // Added to stop spinner
        return;
    }
    if (hasBlockingErrors) {
        alert('Please fix the date requirements before saving.');
        setLoading(false); // Added to stop spinner
        return;
    }

    // NEW STRICT LOCATION CHECK (RO, PO, TI)
    const dbRequiredTables = ['regions', 'provinces', 'ttis'];
    if (form.meetingType !== 'virtual') {
        // Kapag RO, PO, o TI ang category pero walang piniling item sa dropdown (walang ID)
        if (dbRequiredTables.includes(selectedLocationData.table) && !selectedLocationData.id) {
            alert(`Please select a proper venue for ${selectedLocationData.table.toUpperCase()}. Choose on the list only.`);
            setLoading(false);
            return;
        }
    }
    // --- END OF VALIDATIONS ---

    try {
        const formData = new FormData();
        
        // Basic Info
        formData.append('host_name', form.office);
        formData.append('host_division', form.division);
        formData.append('event_title', form.title);
        formData.append('description', form.description);
        formData.append('start_date', form.startDate);
        formData.append('end_date', form.endDate || form.startDate); // Use start if end is empty
        formData.append('start_time', form.startTime);
        formData.append('end_time', form.endTime);
        formData.append('participants', form.participants);

        // LOCATION LOGIC (Dito inayos ang ENUM at IDs)
        const locationEnumMapping = {
            'offices': 'CO',
            'regions': 'RO',
            'provinces': 'PO',
            'ttis': 'TI'
        };

        let finalLocType = 'Others'; 
        if (selectedPositions.length === 0 && selectedFocals.length === 0) {
            alert('Please select at least one participant or focalship.');
            setLoading(false);
            return;
        }
        if (form.meetingType !== 'virtual' && selectedLocationData.table) {
            finalLocType = locationEnumMapping[selectedLocationData.table] || 'Others';
        }

        formData.append('location_type', finalLocType); 
        formData.append('location_table', selectedLocationData.table || '');
        
        // I-append ang ID kung meron (Optional for CO and Others)
        if (selectedLocationData.id) {
            formData.append('location_id', parseInt(selectedLocationData.id));
        }

        // PARTICIPANTS PAYLOAD (Conflict Checking)
        const participantDetails = selectedPositions.map(p => ({
            designationId: parseInt(p.designationId || p.id),
            targetId: p.isAll ? null : (p.targetId ? parseInt(p.targetId) : null),
            targetType: p.targetType || null,
            isAll: !!p.isAll 
        }));

        const finalPayload = participantDetails.filter(p => !isNaN(p.designationId));
        formData.append('selectedPositions', JSON.stringify(finalPayload));

        // MEETING TYPE LOGIC
        const typeMapping = { 
            'face-to-face': 'Face to Face', 
            'hybrid': 'Hybrid', 
            'virtual': 'Virtual/Zoom' 
        };
        formData.append('type', typeMapping[form.meetingType]);

        // FINAL LOCATION TEXT
        let finalLocation = form.location;
        if (form.meetingType === 'virtual') finalLocation = `Zoom: ${form.zoomLink}`;
        if (form.meetingType === 'hybrid') finalLocation = `${form.location} | Zoom: ${form.zoomLink}`;
        formData.append('location', finalLocation);

        if (form.attachment) formData.append('attachment_file', form.attachment);

        // API CALL
        const response = await scheduleAPI.addSchedule(formData);

        if (response) {
            setShowSuccessModal(true);
            
            // RESET FORM
            setForm({
                office: '',
                division: '',
                email: '',
                contactPerson: '',
                contactNumber: '', // Fixed typo from 'contactNumner'
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

            e.target.reset();
        }
    } catch (err) {
        console.error('Submission error:', err);
        const errorData = err.response?.data;

        if (errorData && errorData.conflicts) {
            setConflictError(errorData);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert('Error: ' + (errorData?.error || err.message));
        }
    } finally {
        setLoading(false);
    }
};

  // Guard: all hooks done — now safe to redirect if not logged in

const handleVenueSelection = (id, table, name) => {
    // Importante: i-save ang table kahit null ang id (para sa manual typing sa CO/Others)
    setSelectedLocationData({ id: id || null, table: table });
    setForm(prev => ({ ...prev, location: name }));
};

// Idagdag din ito para ma-clear ang conflict kapag naging Virtual ang meeting
useEffect(() => {
    if (form.meetingType === 'virtual') {
        setSelectedLocationData({ id: null, table: null });
    }
}, [form.meetingType]);

  if (!authLoading && !user) {
    return <Navigate to="/dashboard" replace state={{ showLoginModal: true }} />;
  }
  return (
    <div className="simple-event-page">
      <main className="simple-event-main">
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
            <div className="simple-event-section-header">
              <button
                type="button"
                className="sef-back-inline"
                onClick={() => navigate(backTo)}
                title="Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back
              </button>
              <h2 className="simple-event-section-title">Activities Details</h2>
            </div>
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
      <input 
        id="location" name="zoomLink" type="url" 
        value={form.zoomLink} onChange={handleChange} 
        className="simple-event-input" placeholder="https://zoom.us/j/123456789" required 
      />
      {form.zoomLink && !isZoomLink(form.zoomLink) && (
        <span className="simple-event-hint simple-event-hint-error">Please enter a valid Zoom link</span>
      )}
    </>
  ) : (
    <div className="location-cascading-group" style={{ display: 'flex', gap: '10px' }}>
      {/* 1. Location Type Selector */}
      <select 
        className="simple-event-input" 
        style={{ width: '120px' }}
        value={selectedLocationData.table || ''}
        onChange={(e) => {
          const table = e.target.value;
          setSelectedLocationData({ id: null, table: table });
          setForm(prev => ({ ...prev, location: '' })); // Reset name
        }}
        required
      >
        <option value="">-- Type --</option>
        <option value="offices">CO</option>
        <option value="regions">RO</option>
        <option value="provinces">PO</option>
        {/* <option value="ttis">TI</option> */}
        <option value="others">Others</option>
      </select>

      {/* 2. Specific Location Input/Search */}
      {selectedLocationData.table === 'offices' || selectedLocationData.table === 'others' ? (
        // Manual Input for CO and Others
        <input 
          type="text"
          className="simple-event-input"
          placeholder={selectedLocationData.table === 'offices' ? "Enter CO Office Name" : "Enter Specific Location"}
          value={form.location}
          onChange={(e) => handleVenueSelection(null, selectedLocationData.table, e.target.value)}
          required
        />
      ) : (
        // Searchable Dropdown using Datalist for RO, PO, TI
        <div style={{ flex: 1, position: 'relative' }}>
          <input 
            list="location-options"
            className="simple-event-input modern-select"
            placeholder={`Search/Select ${selectedLocationData.table?.slice(0, -1).toUpperCase()}...`}
            value={form.location}
            onChange={(e) => {
              const val = e.target.value;
              setForm(prev => ({ ...prev, location: val }));
              
              // Find the ID based on the name selected
              let found;
              if (selectedLocationData.table === 'regions') found = regions.find(r => r.region === val);
              if (selectedLocationData.table === 'provinces') found = provinces.find(p => p.name === val);
              // if (selectedLocationData.table === 'ttis') found = ttis.find(t => t.name === val);

              if (found) {
                handleVenueSelection(found.id, selectedLocationData.table, val);
              }
            }}
            required
          />
          <datalist id="location-options">
            {selectedLocationData.table === 'regions' && regions.map(r => <option key={r.id} value={r.region} />)}
            {selectedLocationData.table === 'provinces' && provinces.map(p => <option key={p.id} value={p.name} />)}
            {selectedLocationData.table === 'ttis' && ttis.map(t => <option key={t.id} value={t.name} />)}
          </datalist>
        </div>
      )}
    </div>
  )}
</div>
                {form.meetingType === 'hybrid' && (
                  <div className="simple-event-field">
                    <label className="simple-event-label" htmlFor="zoomLink">Zoom Link</label>
                    <input id="zoomLink" name="zoomLink" type="url" value={form.zoomLink} onChange={handleChange} className="simple-event-input" placeholder="https://zoom.us/j/123456789" required />
                  </div>
                )}
              </div>


            </div>
          </section>
                          {liveConflicts.some(msg => msg.toLowerCase().includes('venue') || msg.toLowerCase().includes('location')) && (
    <div className="sef-live-conflict-box venue-conflict-style" style={{ marginBottom: '15px' }}>
      <div className="sef-live-conflict-header">
        <span className="sef-live-conflict-icon">⚠</span>
        <strong>Venue Conflict Detected</strong>
      </div>
      <ul className="sef-live-conflict-list">
        {liveConflicts
          .filter(msg => msg.toLowerCase().includes('venue') || msg.toLowerCase().includes('location'))
          .map((msg, i) => <li key={i}>{msg}</li>)}
      </ul>
    </div>
  )}
          <section className="simple-event-section">
            <h2 className="simple-event-section-title">Participants</h2>

          {liveConflicts.some(msg => !msg.toLowerCase().includes('venue') && !msg.toLowerCase().includes('location')) && (
              <div className="sef-live-conflict-box">
                <div className="sef-live-conflict-header">
                  <span className="sef-live-conflict-icon">⚠</span>
                  <strong>Participant Schedule Conflict</strong>
                </div>
                <ul className="sef-live-conflict-list">
                  {/* I-filter para ang lumabas lang dito ay yung mga tao/participants */}
                  {liveConflicts
                    .filter(msg => !msg.toLowerCase().includes('venue') && !msg.toLowerCase().includes('location'))
                    .map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
                <div className="sef-conflict-resolution">
                  <p className="sef-conflict-resolution-label">To resolve this conflict, you may:</p>
                  <div className="sef-conflict-resolution-options">
                    <div className="sef-conflict-option">
                      <span className="sef-conflict-option-key">A</span>
                      <span>Review and adjust the <strong>participants</strong> to remove those with conflicting schedules.</span>
                    </div>
                    <div className="sef-conflict-option">
                      <span className="sef-conflict-option-key">B</span>
                      <span>Select a different <strong>date</strong> that does not overlap with existing activities.</span>
                    </div>
                    <div className="sef-conflict-option">
                      <span className="sef-conflict-option-key">C</span>
                      <span>Adjust the <strong>start or end time</strong> to avoid overlapping with the conflicting event.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

  <div className="participants-container">
    
<div className="participants-inline-row">
  {/* Positions Group */}
{/* Heads Group with Custom Dropdown */}
<div className="input-group-inline" style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
  {/* <label className="simple-event-label">Heads</label> */}

  {/* Custom Trigger */}
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
          const hasSubMenu = p.has_sub_menu;
          return (
            <li
              key={p.id}
              className={hoveredPosition === p.name ? 'active-li' : ''}
              onMouseEnter={() => {
                setHoveredPosition(p.name);
                if (hasSubMenu) {
                  setSubType(p.sub_menu_type);
                  if (p.sub_menu_type === 'tti' || p.sub_menu_type === 'school') {
                    setSelectedRegionIdForTTI(null);
                    setSelectedProvinceIdForTTI(null);
                  }
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

      {/* PANGALAWANG COLUMN WRAPPER */}
      {subType && (
        <div className="sub-menu-wrapper" style={{ display: 'flex' }}>
          
          {/* 1. Clusters, Offices, Regions */}
          {['cluster', 'office', 'region'].includes(subType) && (
            <ul className="dropdown-list-sub">
              <li className="select-all-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    onChange={() => {
                      const items = { 'cluster': clusters, 'office': offices, 'region': regions }[subType];
                      handleSelectAll(items, subType, hoveredPosition);
                    }}
                    checked={selectedPositions.some(p => {
                      const labelMap = { 'cluster': 'Clusters', 'office': 'Offices', 'region': 'Regions' };
                      return p.name === `${hoveredPosition} - All ${labelMap[subType]}`;
                    })}
                  />
                  <span className="item-text">
                    All {subType.charAt(0).toUpperCase() + subType.slice(1) + 's'}
                  </span>
                </label>
              </li>
              <div className="scrollable-sub-list">
                {({ clusters, offices, regions }[getPosConfig(hoveredPosition)?.source] || [])
                  .filter(item => item.id !== 1)
                  .map(item => {
                    const itemName = subType === 'region' ? item.region : item.name;
                    const fullName = `${hoveredPosition} - ${itemName}`;
                    const currentConfig = getPosConfig(hoveredPosition);
                    // IBALIK ANG LOGIC MO: Naka-check kung individual OR kung naka "Select All"
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

          {/* 2. District NCR */}
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
                  const fullName = `${hoveredPosition} - ${pr.name}`;
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

          {/* 3. Provincial Director */}
          {subType === 'prov_region' && (
            <>
              <ul className="dropdown-list-sub" style={{ minWidth: '180px' }}>
                <div className="scrollable-sub-list">
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
              </ul>
              {selectedRegionId && (
                <ul className="dropdown-list-sub" style={{ borderLeft: '1px solid #eee' }}>
                  <li className="select-all-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        onChange={() => handleSelectAll(provinces, 'prov_region', hoveredPosition)}
                        checked={selectedPositions.some(p => p.name === `${hoveredPosition} - All Provinces`)}
                      />
                      <span className="item-text">All Provinces</span>
                    </label>
                  </li>
                  <div className="scrollable-sub-list">
                    {provinces.map(pr => {
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
            </>
          )}

          {/* 4. TTI / TTIs */}
          {['tti', 'school'].includes(subType) && (
            <>
              <ul className="dropdown-list-sub" style={{ minWidth: '180px' }}>
                <div className="scrollable-sub-list">
                  {regions.filter(r => r.id !== 1).map(r => (
                    <li
                      key={r.id}
                      onMouseEnter={() => handleRegionHoverTTI(r.id)}
                      className={selectedRegionIdForTTI === r.id ? 'active-li' : ''}
                      style={{ padding: '10px 15px', display: 'flex', justifyContent: 'space-between', cursor: 'default' }}
                    >
                      {r.region} <span className="chevron-right">▶</span>
                    </li>
                  ))}
                </div>
              </ul>
              {selectedRegionIdForTTI && (
                <ul className="dropdown-list-sub" style={{ minWidth: '180px', borderLeft: '1px solid #eee' }}>
                  <div className="scrollable-sub-list">
                    {tempProvincesForTTI.map(p => (
                      <li
                        key={p.id}
                        onMouseEnter={() => handleProvinceHoverTTI(p.id)}
                        className={selectedProvinceIdForTTI === p.id ? 'active-li' : ''}
                        style={{ padding: '10px 15px', display: 'flex', justifyContent: 'space-between', cursor: 'default' }}
                      >
                        {p.name} <span className="chevron-right">▶</span>
                      </li>
                    ))}
                  </div>
                </ul>
              )}
              {selectedProvinceIdForTTI && (
                <ul className="dropdown-list-sub" style={{ 
                    minWidth: '250px',            // Tinaasan natin ang base width
                    width: 'max-content',         // Ito ang magic: kusa siyang lalapad base sa text
                    maxWidth: '450px',            // Pero may limit para hindi sobrang haba
                    borderLeft: '1px solid #eee',
                    whiteSpace: 'nowrap'          // Pinipigilan natin mag-wrap yung text sa bagong linya
                  }}
                >
                  <li className="select-all-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        onChange={() => handleSelectAll(tempTtis, 'tti', hoveredPosition)}
                        checked={selectedPositions.some(p => p.name === `${hoveredPosition} - All TTIs`)}
                      />
                      <span className="item-text">All TTIs</span>
                    </label>
                  </li>
                  <div className="scrollable-sub-list">
                    {tempTtis.map(tti => {
                      const fullName = `${hoveredPosition} - ${tti.name}`;
                      // Inapply rin natin ang logic dito para sa TTI
                      const isChecked = selectedPositions.some(p => p.name === fullName || p.name === `${hoveredPosition} - All TTIs`);
                    return (
                              <li key={tti.id} className="checkbox-item">
                                <label 
                                  className="checkbox-label" 
                                  onClick={() => handleSubSelect(tti.name, 'tti', hoveredPosition)}
                                  style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                                >
                                  <input type="checkbox" checked={isChecked} readOnly />
                                  {/* textOverflow para kung sakaling lumampas sa 450px, mag-dot-dot-dot (...) */}
                                  <span 
                                    className="item-text" 
                                    style={{ 
                                      whiteSpace: 'nowrap', 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis' 
                                    }}
                                    title={tti.name} // Pag hino-hover ng mouse, lalabas ang buong pangalan
                                  >
                                    {tti.name}
                                  </span>
                          </label>
                        </li>
                      );
                    })}
                  </div>
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )}
</div>

  {/* Focals Group */}
  <div className="input-group-inline">
    <select 
      className="simple-event-input modern-select" 
      onChange={handleFocalDropdownChange}
      defaultValue=""
    >
      <option value="" disabled>-- Select Focals--</option>
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
           disabled={
              loading || 
              hasBlockingErrors || 
              liveConflicts.length > 0 || // STOP pag may detected schedule conflict
              (form.meetingType === 'virtual' && !isZoomLink(form.zoomLink)) || 
              (selectedPositions.length === 0 && selectedFocals.length === 0)
            }
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
            <div className="sef-success-reminder">
              <span className="sef-reminder-icon">⏳</span>
              <div>
                <strong>Reminder:</strong> Your submission is marked as <em>Tentative</em> and must be completed within <strong>5 days</strong>. After 3 days, a follow-up notice will be sent. Submissions that are not completed will automatically expire.
              </div>
            </div>
            <button
              className="sef-success-btn"
              onClick={() => { setShowSuccessModal(false); navigate('/my-events'); }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

