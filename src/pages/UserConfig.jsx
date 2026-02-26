import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

  if (!user) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="user-config-page">
      <header className="user-config-header">
        <h1 className="user-config-title">User Configuration</h1>
        <p className="user-config-subtitle">
          Manage offices and divisions.
        </p>
      </header>

      <div className="user-config-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
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
            <h2 className="user-config-panel-title">Offices</h2>
            <p className="user-config-empty">Content will be loaded from the database.</p>
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
