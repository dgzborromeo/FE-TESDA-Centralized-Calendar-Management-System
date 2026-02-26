import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ListOfActivity.css';

/* Offices under clusters (tabs show office only, not cluster name) */
const PLACEHOLDER_CLUSTERS_OFFICES = [
  { clusterName: 'OSEC', offices: ['PIO', 'SMO', 'TBS', 'IAD', 'PMO'] },
  { clusterName: 'ODDG-PP', offices: ['PO', 'QSO', 'NITESD'] },
  { clusterName: 'ODDG-AI', offices: ['AS', 'ICTO'] },
  { clusterName: 'ODDG-SC', offices: ['CLGEO', 'EBETO'] },
  { clusterName: 'ODDG-PL', offices: ['PLO'] },
  { clusterName: 'ODDG-FLA', offices: ['FMS'] },
  { clusterName: 'ODDG-TESDO', offices: ['ROMO'] },
];
const TABS_OFFICES = PLACEHOLDER_CLUSTERS_OFFICES.flatMap((c) =>
  c.offices.map((office) => ({ officeName: office, clusterName: c.clusterName }))
);

export default function ListOfActivity() {
  const { user } = useAuth();
  const [activeCard, setActiveCard] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  if (!user) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="list-of-activity-page">
      <header className="list-of-activity-header">
        <h1 className="list-of-activity-title">List of Activity</h1>
        <p className="list-of-activity-subtitle">
          View activities by status.
        </p>
      </header>

      <div className="list-of-activity-cards">
        <button
          type="button"
          className={`list-of-activity-card ${activeCard === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveCard(activeCard === 'all' ? null : 'all')}
        >
          <span className="list-of-activity-card-label">All Activity</span>
          <span className="list-of-activity-card-value">—</span>
          <span className="list-of-activity-card-sublabel">All activities</span>
        </button>

        <button
          type="button"
          className={`list-of-activity-card list-of-activity-card-final ${activeCard === 'final' ? 'is-active' : ''}`}
          onClick={() => setActiveCard(activeCard === 'final' ? null : 'final')}
        >
          <span className="list-of-activity-card-label">Final</span>
          <span className="list-of-activity-card-value">—</span>
          <span className="list-of-activity-card-sublabel">Final schedule</span>
        </button>

        <button
          type="button"
          className={`list-of-activity-card list-of-activity-card-tentative ${activeCard === 'tentative' ? 'is-active' : ''}`}
          onClick={() => setActiveCard(activeCard === 'tentative' ? null : 'tentative')}
        >
          <span className="list-of-activity-card-label">Tentative</span>
          <span className="list-of-activity-card-value">—</span>
          <span className="list-of-activity-card-sublabel">Tentative schedule</span>
        </button>
      </div>

      {activeCard && (
        <div className="list-of-activity-placeholder">
          <p>
            <strong>{activeCard === 'all' ? 'All Activity' : activeCard === 'final' ? 'Final' : 'Tentative'}</strong> filter. Table below shows data per office tab.
          </p>
        </div>
      )}

      <section className="list-of-activity-sheet">
        <div className="list-of-activity-filters">
          <table className="list-of-activity-filters-table">
            <thead>
              <tr>
                <th className="list-of-activity-filter-th">Programs/Activities</th>
                <th className="list-of-activity-filter-th">Participants</th>
                <th className="list-of-activity-filter-th">Mode</th>
                <th className="list-of-activity-filter-th">Schedule</th>
              </tr>
              <tr className="list-of-activity-filter-subrow">
                <th className="list-of-activity-filter-th list-of-activity-filter-th-sub" />
                <th className="list-of-activity-filter-th list-of-activity-filter-th-sub" />
                <th className="list-of-activity-filter-th list-of-activity-filter-th-sub" />
                <th className="list-of-activity-filter-th list-of-activity-filter-th-sub" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="list-of-activity-filter-td">
                    <input type="text" className="list-of-activity-filter-input" placeholder="—" />
                  </td>
                  <td className="list-of-activity-filter-td">
                    <input type="text" className="list-of-activity-filter-input" placeholder="—" />
                  </td>
                  <td className="list-of-activity-filter-td">
                    <input type="text" className="list-of-activity-filter-input" placeholder="—" />
                  </td>
                  <td className="list-of-activity-filter-td">
                    <input type="text" className="list-of-activity-filter-input" placeholder="—" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="list-of-activity-tabs">
          {TABS_OFFICES.map(({ officeName }, i) => (
            <button
              key={`${officeName}-${i}`}
              type="button"
              className={`list-of-activity-tab ${activeTab === i ? 'is-active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {officeName}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
