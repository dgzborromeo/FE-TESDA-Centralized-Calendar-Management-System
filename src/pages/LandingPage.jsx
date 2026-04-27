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
        <div className="landing-hero-orb landing-hero-orb-4" />
        {/* Bokeh sparkle particles */}
        <div className="landing-bokeh landing-bokeh-1" />
        <div className="landing-bokeh landing-bokeh-2" />
        <div className="landing-bokeh landing-bokeh-3" />
        <div className="landing-bokeh landing-bokeh-4" />
        <div className="landing-bokeh landing-bokeh-5" />
        <div className="landing-bokeh landing-bokeh-6" />
        <div className="landing-bokeh landing-bokeh-7" />
        <div className="landing-bokeh landing-bokeh-8" />
        {/* Gold streak */}
        
        <div className="landing-hero-inner">
          <div className="landing-hero-left">
            <div className="landing-hero-kicker">
              <span className="landing-hero-kicker-dot" />
              Technical Education and Skills Development Authority
            </div>

            {/* ONE Calendar System branding */}
            <div className="landing-one-brand">
              <div className="landing-one-glow-ring" />
              <div className="landing-one-composition">
                <div className="landing-one-o-wrap">
                  <img src="/romo-logo.png" alt="ROMO" className="landing-one-romo" />
                </div>
                <div className="landing-one-ne">
                  <svg viewBox="0 0 280 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="landing-one-ne-calendar">
                    <g opacity="0.2">
                      <text x="4"   y="14" fill="white" fontSize="8" fontFamily="Plus Jakarta Sans,sans-serif" fontWeight="700" letterSpacing="0.5">SUN</text>
                      <text x="44"  y="14" fill="white" fontSize="8" fontFamily="Plus Jakarta Sans,sans-serif" fontWeight="700" letterSpacing="0.5">MON</text>
                      <text x="84"  y="14" fill="white" fontSize="8" fontFamily="Plus Jakarta Sans,sans-serif" fontWeight="700" letterSpacing="0.5">TUE</text>
                      <text x="124" y="14" fill="white" fontSize="8" fontFamily="Plus Jakarta Sans,sans-serif" fontWeight="700" letterSpacing="0.5">WED</text>
                      <text x="164" y="14" fill="white" fontSize="8" fontFamily="Plus Jakarta Sans,sans-serif" fontWeight="700" letterSpacing="0.5">THU</text>
                      <text x="204" y="14" fill="white" fontSize="8" fontFamily="Plus Jakarta Sans,sans-serif" fontWeight="700" letterSpacing="0.5">FRI</text>
                      <text x="244" y="14" fill="white" fontSize="8" fontFamily="Plus Jakarta Sans,sans-serif" fontWeight="700" letterSpacing="0.5">SAT</text>
                      <line x1="0" y1="19" x2="280" y2="19" stroke="white" strokeWidth="0.7"/>
                      <text x="8"   y="34" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">1</text>
                      <text x="48"  y="34" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">2</text>
                      <text x="88"  y="34" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">3</text>
                      <text x="128" y="34" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">4</text>
                      <text x="168" y="34" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">5</text>
                      <text x="208" y="34" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">6</text>
                      <text x="248" y="34" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">7</text>
                      <text x="8"   y="52" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">8</text>
                      <text x="45"  y="52" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">9</text>
                      <text x="82"  y="52" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">10</text>
                      <text x="122" y="52" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">11</text>
                      <text x="162" y="52" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">12</text>
                      <text x="202" y="52" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">13</text>
                      <text x="242" y="52" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">14</text>
                      <text x="8"   y="70" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">15</text>
                      <text x="45"  y="70" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">16</text>
                      <text x="82"  y="70" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">17</text>
                      <text x="122" y="70" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">18</text>
                      <text x="162" y="70" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">19</text>
                      <text x="202" y="70" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">20</text>
                      <circle cx="251" cy="66" r="9" fill="none" stroke="white" strokeWidth="1"/>
                      <text x="242" y="70" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">21</text>
                      <text x="8"   y="88" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">22</text>
                      <text x="45"  y="88" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">23</text>
                      <circle cx="91" cy="84" r="9" fill="none" stroke="white" strokeWidth="1"/>
                      <text x="82"  y="88" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">24</text>
                      <text x="122" y="88" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">25</text>
                      <text x="162" y="88" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">26</text>
                      <text x="202" y="88" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">27</text>
                      <text x="242" y="88" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">28</text>
                      <line x1="0" y1="96" x2="280" y2="96" stroke="white" strokeWidth="0.5"/>
                      <text x="8"   y="111" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">29</text>
                      <text x="45"  y="111" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">30</text>
                      <circle cx="91" cy="107" r="9" fill="none" stroke="white" strokeWidth="1"/>
                      <text x="82"  y="111" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">31</text>
                      <text x="122" y="111" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">1</text>
                      <text x="162" y="111" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">2</text>
                      <text x="202" y="111" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">3</text>
                      <text x="242" y="111" fill="white" fontSize="10" fontFamily="Plus Jakarta Sans,sans-serif">4</text>
                      <line x1="40"  y1="19" x2="40"  y2="118" stroke="white" strokeWidth="0.5"/>
                      <line x1="80"  y1="19" x2="80"  y2="118" stroke="white" strokeWidth="0.5"/>
                      <line x1="120" y1="19" x2="120" y2="118" stroke="white" strokeWidth="0.5"/>
                      <line x1="160" y1="19" x2="160" y2="118" stroke="white" strokeWidth="0.5"/>
                      <line x1="200" y1="19" x2="200" y2="118" stroke="white" strokeWidth="0.5"/>
                      <line x1="240" y1="19" x2="240" y2="118" stroke="white" strokeWidth="0.5"/>
                    </g>
                  </svg>
                  <span className="landing-one-n-letter">N</span>
                  <span className="landing-one-e-letter">E</span>
                </div>
                <div className="landing-one-calendar-wrap">
                  <span className="landing-one-calendar-text">Centralized Calendar System</span>
                </div>
              </div>
            </div>

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
          </div>{/* end landing-hero-left */}

          {/* Right column — video */}
          <div className="landing-hero-right">
            <div className="landing-video-frame">
              {/* Elegant label — not browser-style */}
              <div className="landing-video-frame-label">
                <span className="landing-video-frame-label-dot" />
                <span className="landing-video-frame-label-text">COROPOTI Calendar of Activities — CY 2026</span>
              </div>
              <div className="landing-video-wrap">
                <video
                  className="landing-video"
                  src="/ROMO-Calendar of Activities.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                />
              </div>
              <div className="landing-video-frame-footer">
                <span className="landing-video-footer-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  CY 2026 Schedule
                </span>
                <span className="landing-video-footer-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Regional Operations
                </span>
                <span className="landing-video-footer-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  20+ Offices
                </span>
              </div>
            </div>

          </div>
        </div>{/* end landing-hero-inner */}
      </section>

      {/* Feature cards */}
      <section className="landing-features">
        <div className="landing-features-header">
          <div className="landing-features-kicker">What it does</div>
          <h2 className="landing-features-title">Everything you need to manage TESDA activities</h2>
        </div>
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
