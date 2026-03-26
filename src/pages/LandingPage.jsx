import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-orb landing-hero-orb-1" />
        <div className="landing-hero-orb landing-hero-orb-2" />
        <div className="landing-hero-orb landing-hero-orb-3" />
        <div className="landing-hero-inner">
          <div className="landing-hero-kicker">
            <span className="landing-hero-kicker-dot" />
            Technical Education and Skills Development Authority
          </div>
          <h1 className="landing-hero-title">
            COROPOTI Centralized<br />Schedule Management
          </h1>
          <p className="landing-hero-subtitle">
            A unified platform for planning, coordinating, and confirming programs,
            activities, and plans across all TESDA COROPOTI offices for CY 2026.
          </p>
          <div className="landing-hero-actions">
            <Link to="/dashboard" className="landing-btn landing-btn-primary">
              View Dashboard
            </Link>
            <Link to="/calendar" className="landing-btn landing-btn-secondary">
              Open Calendar
            </Link>
            {!user && (
              <Link to="/login" className="landing-btn landing-btn-ghost">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="landing-features">
        <div className="landing-features-inner">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="15" r="2"/></svg>
            </div>
            <h3>Centralized Calendar</h3>
            <p>View all scheduled events, meetings, and activities across offices in one unified calendar.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-4"/><path d="M10 16h4"/></svg>
            </div>
            <h3>Schedule Submission</h3>
            <p>Submit tentative schedules for validation. Approved schedules are automatically reflected on the calendar.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3>Conflict Detection</h3>
            <p>Automatic detection of scheduling conflicts to prevent overlapping activities among participants.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3>Activity Validation</h3>
            <p>Admin review and approval workflow ensures all activities are properly validated before finalization.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 Technical Education and Skills Development Authority — Regional Operations Management Office</p>
        <div className="landing-footer-links">
          <Link to="/about">About</Link>
          <Link to="/help">Help Guide</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/support">Support</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
