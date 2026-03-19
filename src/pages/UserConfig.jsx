import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { config as configApi, users as usersApi } from '../api';
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
const [clusters, setClusters] = useState([]);
const [expandedCluster, setExpandedCluster] = useState(null);
const [userAccounts, setUserAccounts] = useState([]);
const [userSearch, setUserSearch] = useState('');
const [isUserModalOpen, setIsUserModalOpen] = useState(false);
const [editingUserId, setEditingUserId] = useState(null);
const [userFormData, setUserFormData] = useState({
  name: '', email: '', password: '', role: 'user', is_verified: false,
});
const [userFormError, setUserFormError] = useState('');
const [userFormLoading, setUserFormLoading] = useState(false);
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

  // Load Clusters
const loadClusters = useCallback(() => {
  setLoading(true);
  configApi.getClusters()
    .then(data => {
      setClusters(data || []);
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

const loadUserAccounts = useCallback(() => {
  setLoading(true);
  usersApi
    .list()
    .then((data) => {
      const normalizedUsers = (data || []).map((item) => ({
        ...item,
        profile: item.profile || {
          first_name: item.first_name,
          middle_name: item.middle_name,
          last_name: item.last_name,
          designation: item.designation,
          phone_number: item.phone_number,
          office: item.office,
          division: item.division,
          cluster: item.cluster,
          region: item.region,
          province_district: item.province_district,
        },
      }));
      setUserAccounts(normalizedUsers);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setLoading(false);
    });
}, []);

const openAddUser = () => {
  setEditingUserId(null);
  setUserFormData({ name: '', email: '', password: '', role: 'user', is_verified: false });
  setUserFormError('');
  setIsUserModalOpen(true);
};

const openEditUser = (item) => {
  setEditingUserId(item.id);
  setUserFormData({
    name: item.name || '',
    email: item.email || '',
    password: '',
    role: item.role || 'user',
    is_verified: !!item.email_verified_at || !!item.is_verified,
  });
  setUserFormError('');
  setIsUserModalOpen(true);
};

const handleSaveUser = async (e) => {
  e.preventDefault();
  setUserFormError('');
  setUserFormLoading(true);
  try {
    const payload = {
      name: userFormData.name.trim(),
      email: userFormData.email.trim(),
      role: userFormData.role,
      is_verified: userFormData.is_verified,
    };
    if (userFormData.password.trim()) {
      payload.password = userFormData.password.trim();
    }
    if (editingUserId) {
      await usersApi.update(editingUserId, payload);
    } else {
      if (!userFormData.password.trim()) {
        setUserFormError('Password is required for new users.');
        setUserFormLoading(false);
        return;
      }
      payload.password = userFormData.password.trim();
      await usersApi.create(payload);
    }
    setIsUserModalOpen(false);
    loadUserAccounts();
  } catch (err) {
    setUserFormError(err.message || 'Failed to save user.');
  } finally {
    setUserFormLoading(false);
  }
};

const handleDeleteUser = async (id, name) => {
  if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
  try {
    await usersApi.remove(id);
    loadUserAccounts();
  } catch (err) {
    alert(err.message || 'Failed to delete user.');
  }
};

const displayValue = (value) => {
  if (value === null || value === undefined) return '-';
  const text = String(value).trim();
  return text.length ? text : '-';
};

const buildUserSearchText = (item) => {
  const values = [
    item?.name,
    item?.email,
    item?.role,
    item?.password,
    item?.is_verified ? 'verified' : 'not verified',
    item?.profile?.first_name,
    item?.profile?.middle_name,
    item?.profile?.last_name,
    item?.profile?.designation,
    item?.profile?.phone_number,
    item?.profile?.office,
    item?.profile?.division,
    item?.profile?.cluster,
    item?.profile?.region,
    item?.profile?.province_district,
  ];

  return values
    .filter((v) => v !== null && v !== undefined)
    .map((v) => String(v).toLowerCase())
    .join(' ');
};

const filteredUserAccounts = userAccounts.filter((item) => {
  const query = userSearch.trim().toLowerCase();
  if (!query) return true;
  return buildUserSearchText(item).includes(query);
});

  useEffect(() => {
if (activeTab === 'offices') {
    loadOffices();
    loadClusters(); // Idagdag ito
  }
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
    if (activeTab === 'users') loadUserAccounts();
    // I-reset ang form state paglipat ng tab
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', abbr: '', office_id: '' });
  }, [activeTab, loadOffices, loadClusters, loadDivisions, loadPositions, loadConfigPositions, loadFocals, loadUserAccounts]);

  
  // Handle Save (Unified for Office and Division)
const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      name: formData.name.trim(),
      abbr: formData.abbr ? formData.abbr.trim() : '',
      cluster_id: formData.cluster_id
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
    <h2 className="user-config-panel-title">Offices by Cluster</h2>
    
    {clusters.map(cluster => {
      const isExpanded = expandedCluster === cluster.id;
      const clusterOffices = offices.filter(off => off.cluster_id === cluster.id);

      return (
        <div key={cluster.id} className="cluster-group-container" style={{ marginBottom: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          {/* CLUSTER HEADER */}
          <div 
            className="cluster-header" 
            onClick={() => setExpandedCluster(isExpanded ? null : cluster.id)}
            style={{ padding: '15px', background: '#f8f9fa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
               {cluster.name} <small style={{ color: '#666', fontWeight: 'normal' }}>({clusterOffices.length} Offices)</small>
            </span>
            <span>{isExpanded ? '▲' : '▼'}</span>
          </div>

          {/* ACCORDION CONTENT */}
          {isExpanded && (
            <div className="cluster-content" style={{ padding: '15px', background: '#fff' }}>
              
              {/* ADD OFFICE FORM INSIDE CLUSTER */}
              {!isFormOpen ? (
                <button 
                  className="btn-add-toggle" 
                  onClick={() => {
                    setIsFormOpen(true);
                    setFormData({ ...formData, cluster_id: cluster.id }); // Auto-set cluster_id
                  }}
                  style={{ marginBottom: '15px' }}
                >
                  + Add Office to {cluster.name}
                </button>
              ) : (
                formData.cluster_id === cluster.id && (
                  <form className="inline-config-form" onSubmit={handleSubmit} style={{ marginBottom: '20px', background: '#f0f4f8', padding: '15px', borderRadius: '5px' }}>
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
                )
              )}

              {/* OFFICE LIST UNDER THIS CLUSTER */}
              <ul className="modern-config-list">
                {clusterOffices.map(off => (
                  <li key={off.id} className="config-list-item">
                    <span className="office-display-text">{off.name} <strong>({off.abbr})</strong></span>
                    <div className="item-actions">
                      <button className="btn-action-edit" onClick={() => {
                        handleEdit(off);
                        setFormData(prev => ({ ...prev, cluster_id: cluster.id }));
                      }}>Edit</button>
                      <button className="btn-action-delete" onClick={() => handleDelete(off.id)}>Delete</button>
                    </div>
                  </li>
                ))}
                {clusterOffices.length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>No offices in this cluster yet.</p>}
              </ul>
            </div>
          )}
        </div>
      );
    })}

    {/* Optional: Central Office Section (Offices without cluster_id) */}
    <div style={{ marginTop: '30px' }}>
      <h3 style={{ fontSize: '1rem', color: '#666' }}>Unassigned / Central Offices</h3>
      <ul className="modern-config-list">
        {offices.filter(off => !off.cluster_id).map(off => (
          <li key={off.id} className="config-list-item">
            <span className="office-display-text">{off.name} <strong>({off.abbr})</strong></span>
            <div className="item-actions">
              <button className="btn-action-edit" onClick={() => handleEdit(off)}>Edit</button>
              <button className="btn-action-delete" onClick={() => handleDelete(off.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
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
            <div className="panel-header-inline">
              <h2 className="user-config-panel-title">Users</h2>
              <button className="btn-add-toggle" onClick={openAddUser}>+ Add User</button>
            </div>

            <div className="user-config-users-tools">
              <input
                type="text"
                className="user-config-users-search"
                placeholder="Search name, email, role, office, division, cluster, region..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            {loading && <p className="user-config-empty">Loading users...</p>}
            {!loading && userAccounts.length === 0 && (
              <p className="user-config-empty">No users found in database.</p>
            )}
            {!loading && userAccounts.length > 0 && filteredUserAccounts.length === 0 && (
              <p className="user-config-empty">No users matched your search.</p>
            )}

            {!loading && userAccounts.length > 0 && filteredUserAccounts.length > 0 && (
              <>
                <p className="user-config-panel-desc">
                  Showing {filteredUserAccounts.length} of {userAccounts.length} account(s).
                </p>
                <div className="user-config-table-wrap">
                  <table className="user-config-table">
                    <thead>
                      <tr>
                        <th>Actions</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Password</th>
                        <th>Email Verified</th>
                        <th>Role</th>
                        <th>Firstname</th>
                        <th>Middlename</th>
                        <th>Lastname</th>
                        <th>Designation</th>
                        <th>Phone Number</th>
                        <th>Office</th>
                        <th>Division</th>
                        <th>Cluster</th>
                        <th>Region</th>
                        <th>Province/District</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUserAccounts.map((item) => (
                        <tr key={item.id}>
                          <td className="user-config-action-cell">
                            <button className="btn-action-edit" onClick={() => openEditUser(item)}>Edit</button>
                            <button className="btn-action-delete" onClick={() => handleDeleteUser(item.id, item.name)}>Delete</button>
                          </td>
                          <td>{displayValue(item.name)}</td>
                          <td>{displayValue(item.email)}</td>
                          <td>
                            {item.password
                              ? <span className="user-config-password-pill" title={item.password}>
                                  {item.password.slice(0, 20)}…
                                </span>
                              : <span className="user-config-password-pill">-</span>
                            }
                          </td>
                          <td>
                            <span className={`user-config-badge ${item.email_verified_at || item.is_verified ? 'badge-verified' : 'badge-unverified'}`}>
                              {item.email_verified_at || item.is_verified ? 'Verified' : 'Not Verified'}
                            </span>
                          </td>
                          <td>
                            <span className={`user-config-badge ${item.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                              {displayValue(item.role)}
                            </span>
                          </td>
                          <td>{displayValue(item.profile?.first_name)}</td>
                          <td>{displayValue(item.profile?.middle_name)}</td>
                          <td>{displayValue(item.profile?.last_name)}</td>
                          <td>{displayValue(item.profile?.designation)}</td>
                          <td>{displayValue(item.profile?.phone_number)}</td>
                          <td>{displayValue(item.profile?.office)}</td>
                          <td>{displayValue(item.profile?.division)}</td>
                          <td>{displayValue(item.profile?.cluster)}</td>
                          <td>{displayValue(item.profile?.region)}</td>
                          <td>{displayValue(item.profile?.province_district)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ADD / EDIT USER MODAL */}
            {isUserModalOpen && (
              <div className="user-modal-overlay" onClick={() => setIsUserModalOpen(false)}>
                <div className="user-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="user-modal-header">
                    <h3>{editingUserId ? 'Edit User' : 'Add New User'}</h3>
                    <button className="user-modal-close" onClick={() => setIsUserModalOpen(false)}>✕</button>
                  </div>
                  <form className="user-modal-form" onSubmit={handleSaveUser}>
                    {userFormError && <p className="user-modal-error">{userFormError}</p>}
                    <div className="user-modal-field">
                      <label>Name <span className="required">*</span></label>
                      <input
                        type="text"
                        value={userFormData.name}
                        onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div className="user-modal-field">
                      <label>Email <span className="required">*</span></label>
                      <input
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                    <div className="user-modal-field">
                      <label>Password {editingUserId && <small>(leave blank to keep current)</small>}</label>
                      <input
                        type="password"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        placeholder={editingUserId ? 'Leave blank to keep current' : 'Min. 6 characters'}
                        {...(!editingUserId && { required: true, minLength: 6 })}
                      />
                    </div>
                    <div className="user-modal-row">
                      <div className="user-modal-field">
                        <label>Role <span className="required">*</span></label>
                        <select
                          value={userFormData.role}
                          onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="user-modal-field user-modal-field-check">
                        <label>
                          <input
                            type="checkbox"
                            checked={userFormData.is_verified}
                            onChange={(e) => setUserFormData({ ...userFormData, is_verified: e.target.checked })}
                          />
                          Email Verified
                        </label>
                      </div>
                    </div>
                    <div className="user-modal-footer">
                      <button type="button" className="btn-inline-cancel" onClick={() => setIsUserModalOpen(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-inline-save" disabled={userFormLoading}>
                        {userFormLoading ? 'Saving...' : editingUserId ? 'Update' : 'Add User'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
