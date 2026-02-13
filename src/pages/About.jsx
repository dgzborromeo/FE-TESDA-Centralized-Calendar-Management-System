import { Link } from 'react-router-dom';
import './Info.css';

export default function About() {
  return (
    <div className="info-page">
      <div className="info-topbar">
        <div>
          <h1 className="info-title">About</h1>
          <p className="info-subtitle">COROPOTI Centralized Schedule Management System overview.</p>
        </div>
        <div className="info-actions">
          <Link to="/dashboard" className="info-btn">Back to Dashboard</Link>
          <Link to="/calendar" className="info-btn">View Calendar</Link>
        </div>
      </div>

      <div className="info-grid">
        <section className="info-card">
          <h2>What this system does</h2>
          <ul>
            <li>Create and view events, meetings, and Zoom schedules.</li>
            <li>Invite offices as participants and track their responses.</li>
            <li>Detect schedule conflicts and keep weekends locked.</li>
            <li>Show events directly on the calendar with office color legend.</li>
          </ul>
        </section>

        <section className="info-card">
          <h2>Roles and permissions</h2>
          <ul>
            <li><strong>Admin</strong>: can manage all events.</li>
            <li><strong>Office accounts</strong>: can view all events and create new ones; some offices are view/create only.</li>
            <li><strong>Invited offices</strong>: can submit a response (Accept/Decline) for invitations.</li>
          </ul>
          <p className="info-muted" style={{ marginTop: '0.6rem' }}>
            Note: permissions are enforced on the server for security.
          </p>
        </section>
      </div>
    </div>
  );
}

