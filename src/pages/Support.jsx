import { Link } from 'react-router-dom';
import './Info.css';
import './Dashboard.css';

export default function Support() {
  return (
    <div className="info-page">
      <section className="dashboard-panel dashboard-panel-overview ev-hero-panel">
        <div className="dashboard-overview-top">
          <div className="dashboard-overview-titleblock">
            <h1 className="dashboard-title">Contact / Support</h1>
            <p className="dashboard-subtitle">Where to report issues or request assistance.</p>
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
            <li>Date and time when it happened</li>
            <li>Steps to reproduce the problem</li>
            <li>Browser and device used</li>
          </ul>
        </section>

        <section className="info-card">
          <h2>Common issues to self-check first</h2>
          <ul>
            <li>Can't log in — check your credentials or contact admin to reset your password.</li>
            <li>Can't create events — make sure you are logged in and your account has the right permissions.</li>
            <li>Events not showing — try refreshing the page or clearing your browser cache.</li>
            <li>PDF not opening — check if your browser allows pop-ups or PDF viewing.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
