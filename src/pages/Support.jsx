import { Link } from 'react-router-dom';
import HamburgerBtn from '../components/HamburgerBtn';
import './Info.css';
import './Dashboard.css';

export default function Support() {
  return (
    <div className="info-page">
      <section className="dashboard-panel dashboard-panel-overview ev-hero-panel">
        <div className="dashboard-overview-top">
          <HamburgerBtn />
          <div className="dashboard-overview-titleblock">
            <h1 className="dashboard-title">Contact / Support</h1>
            <p className="dashboard-subtitle">Where to report issues or request assistance with the ONE Calendar System.</p>
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
          <h2>System Administrator (ROMO)</h2>
          <p className="info-muted">The Regional Operations Management Office (ROMO) is the system owner and primary point of contact for all calendar system concerns.</p>
          <ul style={{ marginTop: '0.75rem' }}>
            <li>Email: ROMO-ROMD@tesda.gov.ph</li>
            <li>Contact: ########</li>
          </ul>
          <p className="info-muted" style={{ marginTop: '0.75rem' }}>
            COROPOTIs shall coordinate all calendar system concerns directly with ROMO.
          </p>
        </section>

        <section className="info-card">
          <h2>ICT Support (ICTO)</h2>
          <p className="info-muted">The Information and Communications Technology Office (ICTO) handles technical infrastructure and system compliance concerns.</p>
          <ul style={{ marginTop: '0.75rem' }}>
            <li>System integration with TESDA ICT infrastructure</li>
            <li>ICT standards, data governance, and cybersecurity compliance</li>
            <li>Technical requirements and system enhancements</li>
          </ul>
          <p className="info-muted" style={{ marginTop: '0.75rem' }}>
            ICTO coordinates with ROMO on all technical matters affecting TESDA ICT systems.
          </p>
        </section>

        <section className="info-card">
          <h2>What to Include When Reporting</h2>
          <ul>
            <li>Screenshot of the issue</li>
            <li>Your office/account email</li>
            <li>Date and time when it happened</li>
            <li>Steps to reproduce the problem</li>
            <li>Browser and device used</li>
            <li>Schedule ID or event title (if applicable)</li>
          </ul>
        </section>

        <section className="info-card">
          <h2>Common Issues to Self-Check First</h2>
          <ul>
            <li><strong>Can't log in</strong> — Check your credentials or contact ROMO to reset your password.</li>
            <li><strong>Can't submit a schedule</strong> — Ensure you are logged in, your account has the right permissions, and the date is at least 15 working days from today.</li>
            <li><strong>Schedule not appearing in calendar</strong> — Only <em>Final</em> schedules appear in the official calendar. Check if your schedule has been finalized with complete supporting documents.</li>
            <li><strong>Tentative schedule deleted</strong> — Tentative schedules are automatically deleted after 10 working days if not finalized. Resubmit as a new schedule.</li>
            <li><strong>Events not showing</strong> — Try refreshing the page or clearing your browser cache.</li>
            <li><strong>PDF not opening</strong> — Check if your browser allows pop-ups or PDF viewing.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
