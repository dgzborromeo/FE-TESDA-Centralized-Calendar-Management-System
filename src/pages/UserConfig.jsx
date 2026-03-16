import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { config as configApi } from '../api'; 
import './UserConfig.css';

const TABS = [
  { id: 'users', label: 'Users' },
  { id: 'offices', label: 'Offices' },
  { id: 'divisions', label: 'Divisions' },
  { id: 'positions', label: 'Positions' },
  { id: 'pos-setup', label: 'Position Setup' },
  { id: 'focals', label: 'Focalships' },
];

export default function UserConfig() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('offices');
  const [loading, setLoading] = useState(false);
  
  // States para sa Offices
  const [offices, setOffices] = useState([]);
  
  // States para sa Divisions
  const [divisions, setDivisions] = useState([]);
  const [positions, setPositions] = useState([]);
  const [configPositions, setConfigPositions] = useState([]);
  // Shared Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', abbr: '', office_id: '', division_id: '', position_id: '' });
const [focals, setFocals] = useState([]);
  // Load Offices
  const loadOffices = useCallback(() => {
    setLoading(true);
    configApi.getOffices()
      .then(data => {
        setOffices(data || []);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  // Load Divisions
  const loadDivisions = useCallback(() => {
    setLoading(true);
    configApi.getDivisions()
      .then(data => {
        setDivisions(data || []);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);
const loadPositions = useCallback(() => {
    setLoading(true);
    configApi.getPositions().then(data => { setPositions(data || []); setLoading(false); }).catch(console.error);
  }, []);
  
const loadConfigPositions = useCallback(() => {
    setLoading(true);
    configApi.getConfigPositions().then(data => { setConfigPositions(data || []); setLoading(false); }).catch(console.error);
  }, []);

const loadFocals = useCallback(() => {
  setLoading(true);
  configApi.getFocalships()
    .then(data => {
      setFocals(data || []);
      setLoading(false);
    })
    .catch(err => { console.error(err); setLoading(false); });
}, []);

  useEffect(() => {
    if (activeTab === 'offices') loadOffices();
    if (activeTab === 'divisions') {
      loadDivisions();
      loadOffices(); // Kailangan natin ito para sa dropdown sa Divisions tab
    }
    if (activeTab === 'positions') loadPositions();
    if (activeTab === 'pos-setup') { 
        loadConfigPositions(); 
        loadOffices(); 
        loadDivisions(); 
        loadPositions(); 
    }
    if (activeTab === 'focals') loadFocals();
    // I-reset ang form state paglipat ng tab
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', abbr: '', office_id: '' });
  }, [activeTab, loadOffices, loadDivisions, loadPositions, loadConfigPositions, loadFocals]);

  
  // Handle Save (Unified for Office and Division)
const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      name: formData.name.trim(),
      abbr: formData.abbr ? formData.abbr.trim() : ''
    };

    try {
      setLoading(true);
      if (activeTab === 'offices') {
        if (editingId) await configApi.updateOffice(editingId, payload);
        else await configApi.addOffice(payload);
        loadOffices();
      } else if (activeTab === 'divisions') {
        if (editingId) await configApi.updateDivision(editingId, payload);
        else await configApi.addDivision(payload);
        loadDivisions();
      } else if (activeTab === 'positions') {
        // Position Master List logic
        if (editingId) await configApi.updatePosition(editingId, { name: payload.name });
        else await configApi.addPosition({ name: payload.name });
        loadPositions();
      } else if (activeTab === 'focals') {
        if (editingId) await configApi.updateFocalship(editingId, { name: payload.name });
        else await configApi.addFocalship({ name: payload.name });
        loadFocals();
      }
      else if (activeTab === 'pos-setup') {
        // SETUP CONFIG POSITION CRUD
        const payload = {
            office_id: formData.office_id,
            division_id: formData.division_id || null,
            position_id: formData.position_id
        };
        if (editingId) await configApi.updateConfigPosition(editingId, payload);
        else await configApi.setupPosition(payload);
        loadConfigPositions();
      }
      resetForm();
    } catch (err) {
      alert(err.message || "Error saving record");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', abbr: '', office_id: '', division_id: '', position_id: '' });
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    if (activeTab === 'pos-setup') {
        setFormData({
            office_id: item.office_id || '',
            division_id: item.division_id || '',
            position_id: item.position_id || ''
        });
    } else {
        setFormData({ name: item.name, abbr: item.abbr || '', office_id: item.office_id || '' });
    }
    setIsFormOpen(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      if (activeTab === 'offices') await configApi.deleteOffice(id);
      else if (activeTab === 'divisions') await configApi.deleteDivision(id);
      else if (activeTab === 'positions') await configApi.deletePosition(id);
      else if (activeTab === 'pos-setup') await configApi.deleteConfigPosition(id);
      else if (activeTab === 'focals') await configApi.deleteFocalship(id);
      // Refresh current tab
      if (activeTab === 'offices') loadOffices();
      if (activeTab === 'divisions') loadDivisions();
      if (activeTab === 'positions') loadPositions();
      if (activeTab === 'pos-setup') loadConfigPositions();
      if (activeTab === 'focals') loadFocals();
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="user-config-page">
      <header className="user-config-header">
        <h1 className="user-config-title">User Configuration</h1>
        <p className="user-config-subtitle">Manage system structure and settings.</p>
      </header>

      <div className="user-config-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`user-config-tab ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="user-config-content">
        {/* OFFICES TAB */}
        {activeTab === 'offices' && (
          <section className="user-config-panel">
            <div className="panel-header-inline">
              <h2 className="user-config-panel-title">Offices</h2>
              {!isFormOpen && (
                <button className="btn-add-toggle" onClick={() => setIsFormOpen(true)}>+ Add Office</button>
              )}
            </div>

            {isFormOpen && (
              <form className="inline-config-form" onSubmit={handleSubmit}>
                <div className="inline-form-inputs">
                  <input 
                    type="text" placeholder="Office Name" className="input-name-wide"
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required
                  />
                  <input 
                    type="text" placeholder="Abbr" className="input-abbr-small"
                    value={formData.abbr} onChange={(e) => setFormData({...formData, abbr: e.target.value})} required
                  />
                  <div className="inline-form-btns">
                    <button type="submit" className="btn-inline-save">{editingId ? 'Update' : 'Save'}</button>
                    <button type="button" className="btn-inline-cancel" onClick={resetForm}>Cancel</button>
                  </div>
                </div>
              </form>
            )}

            <ul className="modern-config-list">
              {offices.map(off => (
                <li key={off.id} className="config-list-item">
                  <span className="office-display-text">{off.name} <strong>({off.abbr})</strong></span>
                  <div className="item-actions">
                    <button className="btn-action-edit" onClick={() => handleEdit(off)}>Edit</button>
                    <button className="btn-action-delete" onClick={() => handleDelete(off.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* DIVISIONS TAB */}
        {activeTab === 'divisions' && (
          <section className="user-config-panel">
            <div className="panel-header-inline">
              <h2 className="user-config-panel-title">Divisions</h2>
              {!isFormOpen && (
                <button className="btn-add-toggle" onClick={() => setIsFormOpen(true)}>+ Add Division</button>
              )}
            </div>

            {isFormOpen && (
              <form className="inline-config-form" onSubmit={handleSubmit}>
                <div className="inline-form-inputs" style={{ flexWrap: 'wrap' }}>
                  {/* OFFICE DROPDOWN */}
                  <select 
                    className="input-select-office"
                    value={formData.office_id}
                    onChange={(e) => setFormData({...formData, office_id: e.target.value})}
                    required
                  >
                    <option value="">-- Select Parent Office --</option>
                    {offices.map(off => (
                      <option key={off.id} value={off.id}>{off.name}</option>
                    ))}
                  </select>

                  <input 
                    type="text" placeholder="Division Name" className="input-name-wide"
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required
                  />
                  <input 
                    type="text" placeholder="Abbr" className="input-abbr-small"
                    value={formData.abbr} onChange={(e) => setFormData({...formData, abbr: e.target.value})} required
                  />
                  <div className="inline-form-btns">
                    <button type="submit" className="btn-inline-save">{editingId ? 'Update' : 'Save'}</button>
                    <button type="button" className="btn-inline-cancel" onClick={resetForm}>Cancel</button>
                  </div>
                </div>
              </form>
            )}

            <ul className="modern-config-list">
              {divisions.map(div => (
                <li key={div.id} className="config-list-item">
                  <div className="office-display-text">
                    {div.name} <strong>({div.abbr})</strong>
                    <div className="parent-label">Under: {div.office?.name || 'Unknown Office'}</div>
                  </div>
                  <div className="item-actions">
                    <button className="btn-action-edit" onClick={() => handleEdit(div)}>Edit</button>
                    <button className="btn-action-delete" onClick={() => handleDelete(div.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {activeTab === 'positions' && (
          <section className="user-config-panel">
            <div className="panel-header-inline">
              <h2 className="user-config-panel-title">Positions</h2>
              {!isFormOpen && (
                <button className="btn-add-toggle" onClick={() => setIsFormOpen(true)}>+ Add Position</button>
              )}
            </div>

            {isFormOpen && (
              <form className="inline-config-form" onSubmit={handleSubmit}>
                <div className="inline-form-inputs">
                  <input 
                    type="text" 
                    placeholder="Position Name (e.g. Administrative Officer V)" 
                    className="input-name-wide"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required
                  />
                  <div className="inline-form-btns">
                    <button type="submit" className="btn-inline-save">{editingId ? 'Update' : 'Save'}</button>
                    <button type="button" className="btn-inline-cancel" onClick={resetForm}>Cancel</button>
                  </div>
                </div>
              </form>
            )}

            <ul className="modern-config-list">
              {loading ? <p>Loading...</p> : positions.map(pos => (
                <li key={pos.id} className="config-list-item">
                  <span className="office-display-text">{pos.name}</span>
                  <div className="item-actions">
                    <button className="btn-action-edit" onClick={() => handleEdit(pos)}>Edit</button>
                    <button className="btn-action-delete" onClick={() => handleDelete(pos.id)}>Delete</button>
                  </div>
                </li>
              ))}
              {!loading && positions.length === 0 && <p className="user-config-empty">No positions found.</p>}
            </ul>
          </section>
        )}
        {activeTab === 'pos-setup' && (
          <section className="user-config-panel">
            <div className="panel-header-inline">
              <h2 className="user-config-panel-title">Position Assignments</h2>
              {!isFormOpen && (
                <button className="btn-add-toggle" onClick={() => setIsFormOpen(true)}>+ Setup New Position</button>
              )}
            </div>

            {isFormOpen && (
              <form className="inline-config-form" onSubmit={handleSubmit}>
                <div className="inline-form-inputs" style={{ flexWrap: 'wrap', gap: '10px' }}>
                  <select 
                    value={formData.office_id} 
                    onChange={(e) => setFormData({...formData, office_id: e.target.value, division_id: ''})} 
                    required
                  >
                    <option value="">-- Select Office --</option>
                    {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>

                  <select 
                    value={formData.division_id} 
                    onChange={(e) => setFormData({...formData, division_id: e.target.value})}
                    disabled={!formData.office_id}
                  >
                    <option value="">-- No Division (Office Level) --</option>
                    {divisions
                        .filter(d => d.office_id === parseInt(formData.office_id))
                        .map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>

                  <select 
                    value={formData.position_id} 
                    onChange={(e) => setFormData({...formData, position_id: e.target.value})} 
                    required
                  >
                    <option value="">-- Select Position --</option>
                    {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>

                  <div className="inline-form-btns">
                    <button type="submit" className="btn-inline-save">{editingId ? 'Update' : 'Save Setup'}</button>
                    <button type="button" className="btn-inline-cancel" onClick={resetForm}>Cancel</button>
                  </div>
                </div>
              </form>
            )}

            <ul className="modern-config-list">
              {configPositions.map(cp => (
                <li key={cp.id} className="config-list-item">
                  <div className="office-display-text">
                    <strong>{cp.position?.name}</strong>
                    <div className="parent-label">
                        {cp.division ? `Division: ${cp.division.name}` : `Office: ${cp.office?.name}`}
                        {cp.division && <small> ({cp.office?.abbr})</small>}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn-action-edit" onClick={() => handleEdit(cp)}>Edit</button>
                    <button className="btn-action-delete" onClick={() => handleDelete(cp.id)}>Delete</button>
                  </div>
                </li>
              ))}
              {configPositions.length === 0 && <p className="user-config-empty">No positions configured yet.</p>}
            </ul>
          </section>
        )}
        {activeTab === 'users' && (
          <section className="user-config-panel">
            <h2 className="user-config-panel-title">Users</h2>
            <p className="user-config-empty">Content will be loaded from the database.</p>
          </section>
        )}
        {/* FOCALSHIPS TAB */}
        {activeTab === 'focals' && (
          <section className="user-config-panel">
            <div className="panel-header-inline">
              <h2 className="user-config-panel-title">Focalship Configuration</h2>
              {!isFormOpen && (
                <button className="btn-add-toggle" onClick={() => setIsFormOpen(true)}>+ Add Focalship</button>
              )}
            </div>

            {isFormOpen && (
              <form className="inline-config-form" onSubmit={handleSubmit}>
                <div className="inline-form-inputs">
                  <input 
                    type="text" 
                    placeholder="Focalship Name (e.g. GAD Focal, 5S Committee)" 
                    className="input-name-wide"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required
                  />
                  <div className="inline-form-btns">
                    <button type="submit" className="btn-inline-save">{editingId ? 'Update' : 'Save'}</button>
                    <button type="button" className="btn-inline-cancel" onClick={resetForm}>Cancel</button>
                  </div>
                </div>
              </form>
            )}

            <ul className="modern-config-list">
              {loading ? <p>Loading...</p> : focals.map(f => (
                <li key={f.id} className="config-list-item">
                  <span className="office-display-text">{f.name}</span>
                  <div className="item-actions">
                    <button className="btn-action-edit" onClick={() => handleEdit(f)}>Edit</button>
                    <button className="btn-action-delete" onClick={() => handleDelete(f.id)}>Delete</button>
                  </div>
                </li>
              ))}
              {!loading && focals.length === 0 && <p className="user-config-empty">No focalships found.</p>}
            </ul>
          </section>
        )}

      </div>
    </div>
  );
}
