import { Link } from 'react-router-dom';
import './Info.css';

export default function Support() {
  return (
    <div className="info-page">
      <div className="info-topbar">
        <div>
          <h1 className="info-title">Contact / Support</h1>
          <p className="info-subtitle">Where to report issues or request assistance.</p>
        </div>
        <div className="info-actions">
          <Link to="/dashboard" className="info-btn">Back to Dashboard</Link>
          <Link to="/calendar" className="info-btn">View Calendar</Link>
        </div>
      </div>

      <div className="info-grid">
        <section className="info-card">
          <h2>Support channels</h2>
          <ul>
            <li>Primary: ROMD Help Desk (internal channel)</li>
            <li>Alternative: System Admin</li>
          </ul>
          <p className="info-muted" style={{ marginTop: '0.6rem' }}>
            Email: ROMO-ROMD@tesda.gov.ph <br />
            Contact: ########
          </p>
        </section>

        <section className="info-card">
          <h2>What to include when reporting</h2>
          <ul>
            <li>Screenshot of the issue</li>
            <li>Your office/account email</li>
            <li>Date/time when it happened</li>
            <li>Steps to reproduce</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

