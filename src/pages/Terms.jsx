import { Link } from 'react-router-dom';
import './Info.css';

export default function Terms() {
  return (
    <div className="info-page">
      <div className="info-topbar">
        <div>
          <h1 className="info-title">Terms of Use</h1>
          <p className="info-subtitle">Guidelines for using the system responsibly.</p>
        </div>
        <div className="info-actions">
          <Link to="/dashboard" className="info-btn">Back to Dashboard</Link>
          <Link to="/calendar" className="info-btn">View Calendar</Link>
        </div>
      </div>

      <div className="info-card">
        <h2>Acceptable use</h2>
        <ul>
          <li>Use the system for official scheduling and coordination.</li>
          <li>Do not share your account credentials.</li>
          <li>Ensure event details are accurate and respectful.</li>
        </ul>

        <h2 style={{ marginTop: '1rem' }}>Data and access</h2>
        <ul>
          <li>Events may be visible to all logged-in users depending on system policy.</li>
          <li>Actions are logged for audit and troubleshooting.</li>
        </ul>

        <p className="info-muted" style={{ marginTop: '0.8rem' }}>
          
        </p>
      </div>
    </div>
  );
}

