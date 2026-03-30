import { Link } from 'react-router-dom';
import './Info.css';
import './Dashboard.css';

export default function About() {
  return (
    <div className="info-page">
      <section className="dashboard-panel dashboard-panel-overview ev-hero-panel">
        <div className="dashboard-overview-top">
          <div className="dashboard-overview-titleblock">
            <h1 className="dashboard-title">About COROPOTI</h1>
            <p className="dashboard-subtitle">Centralized Schedule Management System — overview and features.</p>
          </div>
          <div className="dashboard-overview-side">
            <div className="dashboard-actions">
              <Link to="/dashboard" className="dashboard-btn">Back to Dashboard</Link>
              <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="info-grid">
        <section className="info-card">
          <h2>What this system does</h2>
          <ul>
            <li>Create and manage events, meetings, and Zoom schedules.</li>
            <li>View all schedules on an interactive calendar with office color legend.</li>
            <li>Browse events by tab — Recent, Upcoming, or By Year — under <strong>Events / Meetings</strong>.</li>
            <li>Detect schedule conflicts automatically and lock weekends.</li>
            <li>Admin can validate and manage all office activities via <strong>List of Activity</strong>.</li>
          </ul>
        </section>

        <section className="info-card">
          <h2>Roles and permissions</h2>
          <ul>
            <li><strong>Admin</strong> — full access: create, edit, delete, validate all events; access List of Activity and User Configuration.</li>
            <li><strong>Office accounts</strong> — can view all events and submit new schedules via the Event Form.</li>
            <li><strong>Read-only offices</strong> — view-only access; cannot create or edit events.</li>
            <li><strong>Public / not logged in</strong> — can view the calendar and events list; cannot create events.</li>
          </ul>
          <p className="info-muted" style={{ marginTop: '0.6rem' }}>
            Permissions are enforced server-side for security.
          </p>
        </section>

        <section className="info-card">
          <h2>Navigation</h2>
          <ul>
            <li><strong>Calendar</strong> — main view; click any weekday to open the Event Form (login required).</li>
            <li><strong>Events / Meetings</strong> — tabbed list of Recent, Upcoming, and By Year events.</li>
            <li><strong>List of Activity</strong> — admin-only validation table with edit and delete controls.</li>
            <li><strong>User Configuration</strong> — admin-only account management.</li>
            <li><strong>Log In</strong> — visible in the nav bar when not signed in.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
