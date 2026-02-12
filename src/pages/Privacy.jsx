import { Link } from 'react-router-dom';
import './Info.css';

export default function Privacy() {
  return (
    <div className="info-page">
      <div className="info-topbar">
        <div>
          <h1 className="info-title">Privacy Policy</h1>
          <p className="info-subtitle">How scheduling data is handled.</p>
        </div>
        <div className="info-actions">
          <Link to="/dashboard" className="info-btn">Back to Dashboard</Link>
          <Link to="/calendar" className="info-btn">View Calendar</Link>
        </div>
      </div>

      <div className="info-card">
        <h2>What data is stored</h2>
        <ul>
          <li>Account information (name, email, role)</li>
          <li>Event information (title, date, time, location, description)</li>
          <li>Invitations and responses (accepted/declined, representative/reason)</li>
        </ul>

        <h2 style={{ marginTop: '1rem' }}>How data is used</h2>
        <ul>
          <li>To coordinate schedules and avoid conflicts</li>
          <li>To display calendars and generate reminders/invitations</li>
          <li>For operational troubleshooting and audit</li>
        </ul>

        <p className="info-muted" style={{ marginTop: '0.8rem' }}>
          
        </p>
      </div>
    </div>
  );
}

