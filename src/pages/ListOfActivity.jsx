import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { config as scheduleAPI } from '../api'; 
import './ListOfActivity.css';

export default function ListOfActivity() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState('all');
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  // FILTER STATES
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalMsg, setModalMsg] = useState({ type: '', text: '' });

  // PDF VIEWER STATE
  const [viewingPdf, setViewingPdf] = useState(null);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await scheduleAPI.getSchedules();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      try {
        await scheduleAPI.deleteSchedule(id);
        alert("Deleted successfully!");
        fetchSchedules(); 
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const handleEditClick = (item) => {
    setEditingItem({ ...item });
    setModalMsg({ type: '', text: '' });
    setIsModalOpen(true);
  };

const handleUpdate = async (e) => {
  e.preventDefault();
  setIsSaving(true);
  setModalMsg({ type: '', text: '' });
  try {
    const { 
      user, 
      host_name, 
      participantDetails, 
      createdAt, 
      updatedAt, 
      ...cleanData 
    } = editingItem;

    await scheduleAPI.updateSchedule(editingItem.id, JSON.stringify(cleanData));

    setModalMsg({ type: 'success', text: 'Activity updated successfully!' });
    fetchSchedules();
    setTimeout(() => {
      setIsModalOpen(false);
      setModalMsg({ type: '', text: '' });
    }, 1500);
  } catch (error) {
    console.error("Update error:", error);
    setModalMsg({ type: 'error', text: 'Update failed. Please try again.' });
  } finally {
    setIsSaving(false);
  }
}; 

const handleRenew = async (id) => {
  try {
    await scheduleAPI.renewSchedule(id);
    fetchSchedules();
  } catch (error) {
    console.error("Renew error:", error);
  }
};

const filteredData = useMemo(() => {
  return schedules.filter(item => {
    // 1. Search Logic: Tumingin sa host_name at event_title
    const searchString = `${item.host_name || ''} ${item.event_title || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());

    // 2. Status Logic
    const matchesStatus = activeCard === 'all' || item.status?.toLowerCase() === activeCard.toLowerCase();

    // 3. Date Logic
    const itemDate = new Date(item.start_date);
    const start = startDateFilter ? new Date(startDateFilter) : null;
    const end = endDateFilter ? new Date(endDateFilter) : null;
    let matchesDate = true;

    if (start && end) matchesDate = itemDate >= start && itemDate <= end;
    else if (start) matchesDate = itemDate >= start;
    else if (end) matchesDate = itemDate <= end;

    return matchesSearch && matchesStatus && matchesDate;
  });
}, [schedules, searchTerm, activeCard, startDateFilter, endDateFilter]);

  const counts = useMemo(() => ({
    all: schedules.length,
    final: schedules.filter(s => s.status?.toLowerCase() === 'final').length,
    tentative: schedules.filter(s => s.status?.toLowerCase() === 'tentative').length,
    expired: schedules.filter(s => s.status?.toLowerCase() === 'expired').length,
  }), [schedules]);

  if (!user) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="list-of-activity-page">
      <header className="list-of-activity-header">
        <h1 className="list-of-activity-title">Activity Validation List</h1>
        <p className="list-of-activity-subtitle">Filter and manage all office schedules efficiently.</p>
      </header>

      {/* Summary Cards */}
      <div className="list-of-activity-cards">
        <button className={`list-of-activity-card ${activeCard === 'all' ? 'is-active' : ''}`} onClick={() => setActiveCard('all')}>
          <span className="list-of-activity-card-label">All Activity</span>
          <span className="list-of-activity-card-value">{counts.all}</span>
        </button>
        <button className={`list-of-activity-card list-of-activity-card-final ${activeCard === 'final' ? 'is-active' : ''}`} onClick={() => setActiveCard('final')}>
          <span className="list-of-activity-card-label">Final</span>
          <span className="list-of-activity-card-value">{counts.final}</span>
        </button>
        <button className={`list-of-activity-card list-of-activity-card-tentative ${activeCard === 'tentative' ? 'is-active' : ''}`} onClick={() => setActiveCard('tentative')}>
          <span className="list-of-activity-card-label">Tentative</span>
          <span className="list-of-activity-card-value">{counts.tentative}</span>
        </button>
        <button className={`list-of-activity-card list-of-activity-card-expired ${activeCard === 'expired' ? 'is-active' : ''}`} onClick={() => setActiveCard('expired')}>
          <span className="list-of-activity-card-label">Expired</span>
          <span className="list-of-activity-card-value">{counts.expired}</span>
        </button>
      </div>

      <section className="list-of-activity-sheet">
        <div className="filter-toolbar">
            <div className="filter-group host-search">
                <label>Host Office Filter</label>
                <input type="text" placeholder="Search Office / Division..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="filter-group date-range">
                <label>Date Range</label>
                <div className="date-inputs">
                    <input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
                    <span>to</span>
                    <input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
                </div>
            </div>
            <button className="btn-reset" onClick={() => {setSearchTerm(''); setStartDateFilter(''); setEndDateFilter('');}}>Reset Filters</button>
        </div>

        <div className="list-of-activity-table-wrapper">
          <table className="list-of-activity-filters-table">
            <thead>
              <tr>
                <th className="list-of-activity-filter-th">Host Office</th>
                <th className="list-of-activity-filter-th">Activities & Details</th>
                <th className="list-of-activity-filter-th">Participants</th>
                <th className="list-of-activity-filter-th">Schedule & Time</th>
                <th className="list-of-activity-filter-th">Status</th>
                <th className="list-of-activity-filter-th">Attachment</th>
                <th className="list-of-activity-filter-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center">Loading data...</td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id}>
                    <td className="list-of-activity-filter-td">
                    <div className="host-cell">
                        <span className="host-name">
                          {item.host_name || "Unknown Host"}
                        </span>
                    </div>
                    </td>
                    <td className="list-of-activity-filter-td">
                      <div className="activity-cell">
                        <strong className="event-title">{item.event_title}</strong>
                        <div className="meta-info">
                            <span className="tag-mode">{item.type}</span>
                            <span className="tag-loc">📍 {item.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="list-of-activity-filter-td">
                      <div className="participants-list">
                        {item.participantDetails?.map((pd, idx) => (
                            <div key={idx} className="pd-badge">{pd.designation} {pd.location}</div>
                        ))}
                      </div>
                    </td>
                    <td className="list-of-activity-filter-td">
                      <div className="schedule-cell">
                        <div className="date-val">{new Date(item.start_date).toLocaleDateString()}</div>
                        <div className="time-val">{item.start_time?.substring(0,5)} - {item.end_time?.substring(0,5)}</div>
                      </div>
                    </td>
                    <td className="list-of-activity-filter-td">
                      <div className="status-cell">
                        <span className={`status-pill ${item.status?.toLowerCase()}`}>{item.status}</span>
                        {item.expiry_warning && (
                          <span className="expiry-warning">⚠️ {item.days_until_expiry}d left</span>
                        )}
                      </div>
                    </td>
                    <td className="list-of-activity-filter-td">
                      {item.attachment_path ? (
                      <button 
                        className="btn-view-pdf"
                        onClick={() => {
                          // 1. Linisin ang path: palitan ang \ ng /
                          let cleanPath = item.attachment_path.replace(/\\/g, '/');

                          // 2. Siguraduhin na walang extra slash sa unahan
                          if (cleanPath.startsWith('/')) {
                            cleanPath = cleanPath.substring(1);
                          }

                          // 3. I-construct ang URL gamit ang Root URL (hindi yung may /api)
                          // Kung ang BASE_URL mo sa .env ay may /api, i-remove natin manually:
                          const rootUrl = BASE_URL.replace('/api', '');
                          const finalUrl = `${rootUrl}/${cleanPath}`;

                          console.log("Final PDF Link:", finalUrl);
                          setViewingPdf(finalUrl);
                        }}
                      >
                        👁️ View PDF
                      </button>
                      ) : (
                        <span className="no-file">None</span>
                      )}
                    </td>
                    <td className="list-of-activity-filter-td">
                      <div className="action-buttons">
                        <button className="btn-edit" onClick={() => handleEditClick(item)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="no-data-cell">No matching records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* PDF VIEWER MODAL */}
      {viewingPdf && (
        <div className="pdf-modal-overlay" onClick={() => setViewingPdf(null)}>
          <div className="pdf-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <h3>Document Viewer</h3>
              <button className="close-pdf" onClick={() => setViewingPdf(null)}>&times;</button>
            </div>
            <div className="pdf-body">
              <iframe 
                src={viewingPdf} 
                title="PDF Viewer" 
                width="100%" 
                height="100%"
                style={{ border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isModalOpen && editingItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Edit Activity</h2>
            <form onSubmit={handleUpdate} className="modal-form">
              <div className="form-group">
                <label>Event Title</label>
                <input type="text" value={editingItem.event_title || ''} onChange={(e) => setEditingItem({...editingItem, event_title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={editingItem.status} onChange={(e) => setEditingItem({...editingItem, status: e.target.value})}>
                    <option value="Final">Final</option>
                    <option value="Tentative">Tentative</option>
                    <option value="Expired">Expired</option>
                </select>
              </div>
              {modalMsg.text && (
                <div className={`modal-msg modal-msg-${modalMsg.type}`}>
                  {modalMsg.type === 'success' ? '✓ ' : '✕ '}{modalMsg.text}
                </div>
              )}
              <div className="modal-actions">
                <button type="submit" className="btn-save" disabled={isSaving}>{isSaving ? "Saving..." : "Update"}</button>
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}