import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { config as configApi } from '../api'; 
import './UserConfig.css';

const TABS = [
  { id: 'offices', label: 'Offices' },
  { id: 'divisions', label: 'Divisions' },
  { id: 'users', label: 'Users' },
  { id: 'positions', label: 'Positions' },
];

export default function UserConfig() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('offices');
  const [loading, setLoading] = useState(false);
  
  // States para sa Offices
  const [offices, setOffices] = useState([]);
  
  // States para sa Divisions
  const [divisions, setDivisions] = useState([]);
  
  // Shared Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', abbr: '', office_id: '' });

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

  useEffect(() => {
    if (activeTab === 'offices') loadOffices();
    if (activeTab === 'divisions') {
      loadDivisions();
      loadOffices(); // Kailangan natin ito para sa dropdown sa Divisions tab
    }
    // I-reset ang form state paglipat ng tab
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', abbr: '', office_id: '' });
  }, [activeTab, loadOffices, loadDivisions]);

  // Handle Save (Unified for Office and Division)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
    ...formData,
    name: formData.name.trim(),
    abbr: formData.abbr.trim()
  };
    try {
      setLoading(true);
      if (activeTab === 'offices') {
        if (editingId) await configApi.updateOffice(editingId, formData);
        else await configApi.addOffice(formData);
        loadOffices();
      } else {
        if (editingId) await configApi.updateDivision(editingId, formData);
        else await configApi.addDivision(formData);
        loadDivisions();
      }
      resetForm();
    } catch (err) {
      alert(err.message || "Error saving record");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', abbr: '', office_id: '' });
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({ 
        name: item.name, 
        abbr: item.abbr, 
        office_id: item.office_id || '' 
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      if (activeTab === 'offices') {
        await configApi.deleteOffice(id);
        loadOffices();
      } else {
        await configApi.deleteDivision(id);
        loadDivisions();
      }
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
        {activeTab === 'users' && (
          <section className="user-config-panel">
            <h2 className="user-config-panel-title">Users</h2>
            <p className="user-config-empty">Content will be loaded from the database.</p>
          </section>
        )}
        {activeTab === 'positions' && (
          <section className="user-config-panel">
            <h2 className="user-config-panel-title">Positions</h2>
            <p className="user-config-empty">Content will be loaded from the database.</p>
          </section>
        )}
      </div>
    </div>
  );
}
