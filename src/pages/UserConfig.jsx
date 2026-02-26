import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { config as configApi } from '../api'; // Gamit ang iyong custom api wrapper
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
  
  // States
  const [offices, setOffices] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', abbr: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadOffices = useCallback(() => {
    setLoading(true);
    configApi.getOffices()
      .then(data => {
        setOffices(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (activeTab === 'offices') loadOffices();
  }, [activeTab, loadOffices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await configApi.updateOffice(editingId, formData);
      } else {
        await configApi.addOffice(formData);
      }
      setFormData({ name: '', abbr: '' });
      setIsFormOpen(false);
      setEditingId(null);
      loadOffices();
    } catch (err) {
      alert(err.message || "Error saving office");
    }
  };

  const handleEdit = (office) => {
    setEditingId(office.id);
    setFormData({ name: office.name, abbr: office.abbr });
    setIsFormOpen(true); // Buksan ang form kapag mag-e-edit
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this office?")) {
      try {
        await configApi.deleteOffice(id);
        loadOffices();
      } catch (err) {
        alert("Failed to delete office");
      }
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
 <div className="user-config-page">
      <header className="user-config-header">
        <h1 className="user-config-title">User Configuration</h1>
        <p className="user-config-subtitle">Manage offices and divisions.</p>
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
        {activeTab === 'offices' && (
          <section className="user-config-panel">
            <div className="panel-header-inline">
              <h2 className="user-config-panel-title">Offices</h2>
              {!isFormOpen && (
                <button className="btn-add-toggle" onClick={() => setIsFormOpen(true)}>
                  + Add Office
                </button>
              )}
            </div>

            {/* IMPROVED FORM SECTION */}
            {isFormOpen && (
              <form className="inline-config-form" onSubmit={handleSubmit}>
                <div className="inline-form-inputs">
                  <input 
                    type="text" 
                    placeholder="Office Name (e.g. Regional Operations Management Office)"
                    className="input-name-wide"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                  <input 
                    type="text" 
                    placeholder="Abbr (e.g. ROMO)"
                    className="input-abbr-small"
                    value={formData.abbr}
                    onChange={(e) => setFormData({...formData, abbr: e.target.value})}
                    required
                  />
                  <div className="inline-form-btns">
                    <button type="submit" className="btn-inline-save">
                      {editingId ? 'Update' : 'Save'}
                    </button>
                    <button type="button" className="btn-inline-cancel" onClick={() => {
                      setIsFormOpen(false);
                      setEditingId(null);
                      setFormData({name: '', abbr: ''});
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* LIST SECTION */}
            <div className="config-list-container">
              {loading ? (
                <p className="user-config-empty">Loading offices...</p>
              ) : offices.length > 0 ? (
                <ul className="modern-config-list">
                  {offices.map(office => (
                    <li key={office.id} className="config-list-item">
                      <span className="office-display-text">
                        {office.name} <span className="abbr-text">({office.abbr})</span>
                      </span>
                      <div className="item-actions">
                        <button className="btn-action-edit" onClick={() => handleEdit(office)}>Edit</button>
                        <button className="btn-action-delete" onClick={() => handleDelete(office.id)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="user-config-empty">No offices found in the database.</p>
              )}
            </div>
          </section>
        )}

        {activeTab === 'divisions' && (
          <section className="user-config-panel">
            <h2 className="user-config-panel-title">Divisions</h2>
            <p className="user-config-empty">Content will be loaded from the database.</p>
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
