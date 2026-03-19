import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import '../components/Header.css';
import './SimpleEventForm.css';
import { config as scheduleAPI } from '../api';
export default function SimpleEventForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location?.state?.backTo || '/dashboard';
  const attachmentInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
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
    startTime: '',
    endTime: '',
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
const SUB_MENU_CONFIG = {
  'Deputy Director General': { type: 'cluster', source: 'clusters', label: 'Clusters' },
  'Executive Director': { type: 'office', source: 'offices', label: 'Offices' },
  'Assistant Executive Director': { type: 'office', source: 'offices', label: 'Offices' }, // REUSABLE!
  'Division Chief': { type: 'office', source: 'offices', label: 'Offices' }, 
  'Regional Director': { type: 'region', source: 'regions', label: 'Regions' },
  'Provincial Director': { type: 'prov_region', source: 'regions', label: 'Provinces' },
  'District Director': { type: 'district_ncr', source: 'districts', label: 'Districts' }
};
  const updateParticipantsText = useCallback((selPos, selFocals) => {
    const posNames = selPos.map(p => p.name);
    const focalNames = selFocals.map(f => `Focal: ${f}`);
    const combined = [...posNames, ...focalNames];
    
    setForm(prev => ({
      ...prev,
      participants: combined.join(', ')
    }));
  }, []);
const handlePositionDropdownChange = (e) => {
  const val = e.target.value;
  setSubType(null);
  setSelectedRegionId(null);

  // DYNAMIC CHECK: Titingin lang sa config kung may sub-menu itong position na ito
  const config = SUB_MENU_CONFIG[val];

  if (config) {
    setSubType(config.type); // Halimbawa: 'office' or 'cluster'
    setHoveredPosition(val); // Para malaman ng UI kung sino ang naka-hover
  } else {
    // Normal position logic...
    const posObj = positions.find(p => p.name === val);
    if (posObj && !selectedPositions.find(p => p.id === posObj.id)) {
      const updated = [...selectedPositions, posObj];
      setSelectedPositions(updated);
      updateParticipantsText(updated, selectedFocals);
    }
  }
};
const handleSubSelect = (subName, type, parentPos) => {
  const config = SUB_MENU_CONFIG[parentPos];
  if (!config) return;

  const typeLabel = config.label;
  const fullName = `${parentPos} - ${subName}`;
  const allLabel = `${parentPos} - All ${typeLabel}`;

  setSelectedPositions(prev => {
    const isAllActive = prev.some(p => p.name === allLabel);
    let updated;

    if (isAllActive) {
      // DYNAMIC SOURCE: Kunin ang listahan base sa config (e.g., 'offices', 'regions')
      const sourceList = {
        clusters, offices, regions, provinces
      }[config.source] || [];

      const remainingItems = sourceList
        .filter(item => {
           const compareValue = type === 'region' ? item.region : item.name;
           return compareValue !== subName;
        })
        .map(item => ({
          id: `${type}-${item.id}-${Date.now()}`,
          name: `${parentPos} - ${type === 'region' ? item.region : item.name}`,
          isSub: true
        }));

      updated = [...prev.filter(p => p.name !== allLabel), ...remainingItems];
    } else {
      const exists = prev.find(p => p.name === fullName);
      if (exists) {
        updated = prev.filter(p => p.name !== fullName);
      } else {
        const newEntry = { id: `${type}-${subName}-${Date.now()}`, name: fullName, isSub: true };
        updated = [...prev, newEntry];
      }
    }

    updateParticipantsText(updated, selectedFocals);
    return updated;
  });
};
const handleSelectAll = (items, type, parentPos) => {
  const config = SUB_MENU_CONFIG[parentPos];
  const typeLabel = config?.label || 'Items';
  const allLabel = `${parentPos} - All ${typeLabel}`;
  
  // Gamitin ang Restriction Logic na ginawa natin kanina
  const allowedItems = items.filter(item => {
    if (type === 'cluster' || type === 'region') return item.id !== 1;
    if (type === 'province') return item.region_id !== 2; 
    if (type === 'district') return item.region_id === 2;
    return true;
  });

  const currentViewFullNames = allowedItems.map(item => {
    if (type === 'district') return `${parentPos} - National Capital Region - ${item.name}`;
    if (type === 'region') return `${parentPos} - ${item.region}`;
    return `${parentPos} - ${item.name}`;
  });

  setSelectedPositions(prev => {
    const isAlreadyAll = prev.some(p => p.name === allLabel);
    let updated;

    if (isAlreadyAll) {
      updated = prev.filter(p => p.name !== allLabel);
    } else {
      const filteredOthers = prev.filter(p => !currentViewFullNames.includes(p.name));
      const allEntry = { 
        id: `all-${type}-${Date.now()}`, 
        name: allLabel, 
        isSub: true,
        isAll: true,
        includedIds: allowedItems.map(i => i.id)
      };
      updated = [...filteredOthers, allEntry];
    }
    
    updateParticipantsText(updated, selectedFocals);
    return updated;
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
    if (!ymd || String(ymd).length < 10) return false;
    const d = new Date(`${String(ymd).slice(0, 10)}T12:00:00`);
    const day = d.getDay();
    return day === 0 || day === 6;
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
      
      // Mapping to Backend Model (snake_case)
      formData.append('host_name', form.office);
      formData.append('host_division', form.division);
      formData.append('event_title', form.title);
      formData.append('description', form.description);
      
      // Map Type to ENUM
      const typeMapping = {
        'face-to-face': 'Face to Face',
        'hybrid': 'Hybrid',
        'virtual': 'Virtual/Zoom'
      };
      formData.append('type', typeMapping[form.meetingType]);

      formData.append('start_date', form.startDate);
      formData.append('end_date', form.endDate);
      formData.append('start_time', form.startTime);
      formData.append('end_time', form.endTime);
      
      // Handle Location & Zoom Link
      let finalLocation = form.location;
      if (form.meetingType === 'virtual') finalLocation = `Zoom: ${form.zoomLink}`;
      if (form.meetingType === 'hybrid') finalLocation = `${form.location} | Zoom: ${form.zoomLink}`;
      formData.append('location', finalLocation);

      formData.append('participants', form.participants);

      // Attachment logic
      if (form.attachment) {
        formData.append('attachment_file', form.attachment);
      }

      // API CALL
      const response = await scheduleAPI.addSchedule(formData);

if (response) {
      alert('Event saved successfully!');
      
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
        startTime: '',
        endTime: '',
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
      alert('Failed to save event: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-event-page">
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="header-logo simple-event-header-logo">
              <Logo className="header-logo-img" src="/tesda-logo.png" alt="TESDA" transparentBlack />
              <span className="header-logo-text">COROPOTI Centralized Schedule Management System</span>
            </div>
          </div>
          <div className="simple-event-header-actions">
            <button
              type="button"
              className="simple-event-back-btn"
              onClick={() => navigate(backTo)}
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="simple-event-main">
        <form className="simple-event-form" onSubmit={handleSubmit}>
          <section className="simple-event-section">
            <h2 className="simple-event-section-title">Host</h2>
            <div className="simple-event-grid">
              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="office">
                  Office
                </label>
                <input
                  id="office"
                  name="office"
                  type="text"
                  value={form.office}
                  onChange={handleChange}
                  className="simple-event-input"
                  placeholder="e.g. ROMO, PLO"
                  required
                />
              </div>

              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="division">
                  Division <span className="simple-optional">(optional)</span>
                </label>
                <input
                  id="division"
                  name="division"
                  type="text"
                  value={form.division}
                  onChange={handleChange}
                  className="simple-event-input"
                  placeholder="e.g. ROMD, HRMD"
                />
                </div>
            </div>

            <div className="simple-event-grid-3">

              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="simple-event-input"
                    placeholder="Enter email"
                />
            </div>

            <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="contactPerson">
                    Contact Person
                </label>
                <input
                    id="contactPerson"
                    name="contactPerson"
                    type="text"
                    value={form.contactPerson}
                    onChange={handleChange}
                    className="simple-event-input"
                    placeholder="Enter contact person"
                />
            </div>

            <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="contactNumber">
                    Contact Number
                </label>
                  <input
                      id="contactNumber"
                      name="contactNumber"
                      type="tel"
                      // Binago ang pattern para tanggapin ang format na may dash
                      pattern="[0-9]{4}-[0-9]{3}-[0-9]{4}" 
                      value={form.contactNumber}
                      onChange={handleContactChange}
                      className="simple-event-input"
                      placeholder="09XX-XXX-XXXX" // Mas mainam na placeholder para sa user
                      required
                      title="Format: 09XX-XXX-XXXX" // Lalabas ito kapag mali ang format
                  />
                </div>
            </div>
          
          </section>

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

              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="meetingType">
                  Meeting Type
                </label>
                <select
                  id="meetingType"
                  name="meetingType"
                  value={form.meetingType}
                  onChange={handleChange}
                  className="simple-event-input"
                >
                  <option value="face-to-face">Face to Face</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="virtual">Virtual/Zoom</option>
                </select>
              </div>

              

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

              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="startTime">
                  Start Time
                </label>
                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={handleChange}
                  className="simple-event-input"
                  required
                />
              </div>

              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="endTime">
                  End Time
                </label>
                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={handleChange}
                  className="simple-event-input"
                  required
                />
              </div>

              {form.meetingType === 'face-to-face' && (
                <div className="simple-event-field simple-event-field-full">
                  <label className="simple-event-label" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={form.location}
                    onChange={handleChange}
                    className="simple-event-input"
                    placeholder="e.g. TESDA Auditorium, Room 101"
                    required
                  />
                </div>
              )}

              {form.meetingType === 'hybrid' && (
                <>
                  <div className="simple-event-field simple-event-field-full">
                    <label className="simple-event-label" htmlFor="location">
                      Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={form.location}
                      onChange={handleChange}
                      className="simple-event-input"
                      placeholder="e.g. TESDA Auditorium, Room 101"
                      required
                    />
                  </div>
                  <div className="simple-event-field simple-event-field-full">
                    <label className="simple-event-label" htmlFor="zoomLink">
                      Zoom Link
                    </label>
                    <input
                      id="zoomLink"
                      name="zoomLink"
                      type="url"
                      value={form.zoomLink}
                      onChange={handleChange}
                      className="simple-event-input"
                      placeholder="e.g. https://zoom.us/j/123456789"
                      required
                    />
                  </div>
                </>
              )}

              {form.meetingType === 'virtual' && (
                <div className="simple-event-field simple-event-field-full">
                  <label className="simple-event-label" htmlFor="zoomLink">
                    Zoom Link
                  </label>
                  <input
                    id="zoomLink"
                    name="zoomLink"
                    type="url"
                    value={form.zoomLink}
                    onChange={handleChange}
                    className="simple-event-input"
                    placeholder="e.g. https://zoom.us/j/123456789"
                    required
                  />
                  {form.zoomLink && !isZoomLink(form.zoomLink) && (
                    <span className="simple-event-hint simple-event-hint-error">
                      {/* Please enter a valid Zoom link (e.g. https://zoom.us/j/...) */}
                      Please enter a valid Zoom link 
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>
<section className="simple-event-section">
  <h2 className="simple-event-section-title">Participants</h2>
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
    // 1. Check kung ang position na ito ay nasa config natin
    const config = SUB_MENU_CONFIG[p.name];
    const hasSubMenu = !!config;

    return (
      <li 
        key={p.id} 
        className={hoveredPosition === p.name ? 'active-li' : ''}
        onMouseEnter={() => {
          setHoveredPosition(p.name);
          
          if (hasSubMenu) {
            setSubType(config.type);
            // Special trigger for District Director (NCR)
            if (config.type === 'district_ncr') handleRegionHover(2);
            else setSelectedRegionId(null);
          } else {
            setSubType(null);
          }
        }}
        onClick={() => {
          // Kung walang sub-menu, direct add (dynamic check)
          if (!hasSubMenu) {
            handlePositionDropdownChange({ target: { value: p.name } });
            setIsMenuOpen(false);
            setHoveredPosition(null);
          }
        }}
      >
        {p.name}
        {/* Dynamic Chevron: Lalabas lang kung nasa config ang position */}
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
            const config = SUB_MENU_CONFIG[hoveredPosition];
            // Kunin ang tamang data source (offices vs clusters vs regions)
            const items = { clusters, offices, regions }[config.source];
            handleSelectAll(items, subType, hoveredPosition);
          }}
          checked={selectedPositions.some(p => p.name === `${hoveredPosition} - All ${SUB_MENU_CONFIG[hoveredPosition]?.label}`)}
        />
        <span className="item-text">All {SUB_MENU_CONFIG[hoveredPosition]?.label}</span>
      </label>
    </li>
    <div className="scrollable-sub-list">
      {({ clusters, offices, regions }[SUB_MENU_CONFIG[hoveredPosition]?.source] || [])
        .filter(item => item.id !== 1) // Halimbawa: wag isama ang 'N/A'
        .map(item => {
          const itemName = subType === 'region' ? item.region : item.name;
          const fullName = `${hoveredPosition} - ${itemName}`;
          const isChecked = selectedPositions.some(p => p.name === fullName || p.name === `${hoveredPosition} - All ${SUB_MENU_CONFIG[hoveredPosition]?.label}`);
          
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
        const fullName = `${hoveredPosition} - National Capital Region - ${pr.name}`;
        const isChecked = selectedPositions.some(p => p.name === fullName || p.name === `${hoveredPosition} - All Districts`);
        return (
          <li key={pr.id} className="checkbox-item">
            <label className="checkbox-label" onClick={() => handleSubSelect(`National Capital Region - ${pr.name}`, 'district', hoveredPosition)}>
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
            const regName = regions.find(reg => reg.id === selectedRegionId)?.region || '';
            handleSelectAll(provinces.map(p => ({...p, name: `${regName} - ${p.name}`})), 'province', hoveredPosition);
          }}
          checked={selectedPositions.some(p => p.name === `${hoveredPosition} - All Provinces`)}
        />
        <span className="item-text">All Provinces</span>
      </label>
    </li>
    <div className="scrollable-sub-list">
      {provinces.map(pr => {
        const regName = regions.find(reg => reg.id === selectedRegionId)?.region || '';
        const fullName = `${hoveredPosition} - ${regName} - ${pr.name}`;
        const isChecked = selectedPositions.some(p => p.name === fullName || p.name === `${hoveredPosition} - All Provinces`);
        
        return (
          <li key={pr.id} className="checkbox-item">
            <label className="checkbox-label" onClick={() => handleSubSelect(`${regName} - ${pr.name}`, 'province', hoveredPosition)}>
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


  {/* Focals Group */}
  <div className="input-group-inline">
    <label>Focals</label>
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
  </div>

  {/* Others Field - Biglang susulpot sa dulo */}
  {showOthersInput && (
    <div className="input-group-inline others-animate">
      <label>Specify Name</label>
      <div className="modern-inline-group">
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
    </div>
  )}
        </div>
</div>
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
  </div>
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
      </main>
    </div>
  );
}

