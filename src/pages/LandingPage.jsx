import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import './LandingPage.css';

export default function LandingPage() {
  const { user } = useAuth();
  const [slide, setSlide] = useState(0);
  const [visible, setVisible] = useState(true);
  const [entering, setEntering] = useState(false);
  const TOTAL = 4;
  const INTERVAL = 4000;

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setEntering(true);
        setSlide(s => (s + 1) % TOTAL);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setEntering(false);
            setVisible(true);
          });
        });
      }, 380);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

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
                  <span className="landing-one-calendar-text">Calendar System</span>
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

          {/* Right column — rotating showcase */}
          <div className="landing-hero-right">
            <div className={`landing-slide-wrap ${entering ? 'landing-slide-enter' : visible ? 'landing-slide-in' : 'landing-slide-out'}`}>

              {/* SLIDE 0 — Feature cards */}
              {slide === 0 && (
                <div className="landing-feat-stack">
                  <div className="landing-feat-card">
                    <div className="landing-feat-icon landing-feat-icon--blue">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    </div>
                    <div className="landing-feat-text">
                      <span className="landing-feat-label">Centralized</span>
                      <span className="landing-feat-title">Calendar</span>
                    </div>
                  </div>
                  <div className="landing-feat-card">
                    <div className="landing-feat-icon landing-feat-icon--teal">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                    </div>
                    <div className="landing-feat-text">
                      <span className="landing-feat-label">Activity</span>
                      <span className="landing-feat-title">Validation</span>
                    </div>
                  </div>
                  <div className="landing-feat-card">
                    <div className="landing-feat-icon landing-feat-icon--amber">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div className="landing-feat-text">
                      <span className="landing-feat-label">Conflict</span>
                      <span className="landing-feat-title">Detection</span>
                    </div>
                  </div>
                  <div className="landing-feat-card">
                    <div className="landing-feat-icon landing-feat-icon--green">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-4"/><path d="M10 16h4"/></svg>
                    </div>
                    <div className="landing-feat-text">
                      <span className="landing-feat-label">Schedule</span>
                      <span className="landing-feat-title">Submission</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 1 — How it works */}
              {slide === 1 && (
                <div className="landing-workflow">
                  <div className="landing-workflow-label">How it works</div>
                  <div className="landing-workflow-step">
                    <div className="landing-workflow-icon landing-workflow-icon--blue">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-4"/><path d="M10 16h4"/></svg>
                    </div>
                    <div className="landing-workflow-text">
                      <span className="landing-workflow-step-title">Submit Schedule</span>
                      <span className="landing-workflow-step-desc">Offices submit their tentative programs and activities</span>
                    </div>
                    <span className="landing-workflow-step-num">01</span>
                  </div>
                  <div className="landing-workflow-connector"><div className="landing-workflow-line" /></div>
                  <div className="landing-workflow-step">
                    <div className="landing-workflow-icon landing-workflow-icon--amber">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div className="landing-workflow-text">
                      <span className="landing-workflow-step-title">Conflict Check</span>
                      <span className="landing-workflow-step-desc">System automatically detects scheduling overlaps</span>
                    </div>
                    <span className="landing-workflow-step-num">02</span>
                  </div>
                  <div className="landing-workflow-connector"><div className="landing-workflow-line" /></div>
                  <div className="landing-workflow-step">
                    <div className="landing-workflow-icon landing-workflow-icon--teal">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                    </div>
                    <div className="landing-workflow-text">
                      <span className="landing-workflow-step-title">Admin Validates</span>
                      <span className="landing-workflow-step-desc">Approved activities are published to the calendar</span>
                    </div>
                    <span className="landing-workflow-step-num">03</span>
                  </div>
                  <div className="landing-workflow-connector"><div className="landing-workflow-line" /></div>
                  <div className="landing-workflow-step">
                    <div className="landing-workflow-icon landing-workflow-icon--green">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="15" r="2"/></svg>
                    </div>
                    <div className="landing-workflow-text">
                      <span className="landing-workflow-step-title">Live on Calendar</span>
                      <span className="landing-workflow-step-desc">All offices see the unified COROPOTI calendar</span>
                    </div>
                    <span className="landing-workflow-step-num">04</span>
                  </div>
                </div>
              )}

              {/* SLIDE 2 — Office constellation */}
              {slide === 2 && (
                <div className="landing-constellation">
                  <svg className="landing-constellation-svg" viewBox="-20 -20 360 360" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="160" cy="160" r="90"  stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeDasharray="4 6"/>
                    <circle cx="160" cy="160" r="130" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" strokeDasharray="3 8"/>
                    <line x1="160" y1="160" x2="160" y2="70"  stroke="rgba(59,130,246,0.3)"  strokeWidth="0.8"/>
                    <line x1="160" y1="160" x2="235" y2="115" stroke="rgba(236,72,153,0.3)"  strokeWidth="0.8"/>
                    <line x1="160" y1="160" x2="235" y2="205" stroke="rgba(245,158,11,0.3)"  strokeWidth="0.8"/>
                    <line x1="160" y1="160" x2="160" y2="250" stroke="rgba(34,197,94,0.3)"   strokeWidth="0.8"/>
                    <line x1="160" y1="160" x2="85"  y2="205" stroke="rgba(139,92,246,0.3)"  strokeWidth="0.8"/>
                    <line x1="160" y1="160" x2="85"  y2="115" stroke="rgba(6,182,212,0.3)"   strokeWidth="0.8"/>
                    <circle cx="160" cy="160" r="26" stroke="rgba(59,130,246,0.2)" strokeWidth="0.8" className="lc-pulse-1"/>
                    <circle cx="160" cy="160" r="34" stroke="rgba(59,130,246,0.1)" strokeWidth="0.8" className="lc-pulse-2"/>
                    <circle cx="160" cy="160" r="22" fill="rgba(59,130,246,0.28)" stroke="#3b82f6" strokeWidth="1.5"/>
                    <text x="160" y="157" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="700" fontFamily="Plus Jakarta Sans,sans-serif">ROMO</text>
                    <text x="160" y="167" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="6" fontFamily="Plus Jakarta Sans,sans-serif">Central</text>
                    <circle cx="160" cy="70"  r="17" fill="rgba(59,130,246,0.22)"  stroke="#3b82f6" strokeWidth="1.2" className="lc-node"/>
                    <text x="160" y="68"  textAnchor="middle" fill="white" fontSize="7.5" fontWeight="700" fontFamily="Plus Jakarta Sans,sans-serif">TESDO</text>
                    <text x="160" y="77"  textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="5.5" fontFamily="Plus Jakarta Sans,sans-serif">CO · ROMO</text>
                    <circle cx="235" cy="115" r="17" fill="rgba(236,72,153,0.22)"  stroke="#ec4899" strokeWidth="1.2" className="lc-node"/>
                    <text x="235" y="113" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="700" fontFamily="Plus Jakarta Sans,sans-serif">PP</text>
                    <text x="235" y="122" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="5.5" fontFamily="Plus Jakarta Sans,sans-serif">PO · QSO</text>
                    <circle cx="235" cy="205" r="17" fill="rgba(245,158,11,0.22)"  stroke="#f59e0b" strokeWidth="1.2" className="lc-node"/>
                    <text x="235" y="203" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="700" fontFamily="Plus Jakarta Sans,sans-serif">SC</text>
                    <text x="235" y="212" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="5.5" fontFamily="Plus Jakarta Sans,sans-serif">CLGEO</text>
                    <circle cx="160" cy="250" r="17" fill="rgba(34,197,94,0.22)"   stroke="#22c55e" strokeWidth="1.2" className="lc-node"/>
                    <text x="160" y="248" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="700" fontFamily="Plus Jakarta Sans,sans-serif">FLA</text>
                    <text x="160" y="257" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="5.5" fontFamily="Plus Jakarta Sans,sans-serif">FMS</text>
                    <circle cx="85"  cy="205" r="17" fill="rgba(139,92,246,0.22)"  stroke="#8b5cf6" strokeWidth="1.2" className="lc-node"/>
                    <text x="85"  y="203" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="700" fontFamily="Plus Jakarta Sans,sans-serif">PL</text>
                    <text x="85"  y="212" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="5" fontFamily="Plus Jakarta Sans,sans-serif">PLO · EBETO</text>
                    <circle cx="85"  cy="115" r="17" fill="rgba(6,182,212,0.22)"   stroke="#06b6d4" strokeWidth="1.2" className="lc-node"/>
                    <text x="85"  y="113" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="700" fontFamily="Plus Jakarta Sans,sans-serif">AI</text>
                    <text x="85"  y="122" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="5.5" fontFamily="Plus Jakarta Sans,sans-serif">AS · ICTO</text>
                    <circle r="3" fill="#3b82f6" opacity="0.9"><animateMotion dur="3s" repeatCount="indefinite" path="M160,160 L160,70"/></circle>
                    <circle r="3" fill="#ec4899" opacity="0.9"><animateMotion dur="3.5s" repeatCount="indefinite" begin="0.8s" path="M160,160 L235,115"/></circle>
                    <circle r="3" fill="#f59e0b" opacity="0.9"><animateMotion dur="4s" repeatCount="indefinite" begin="1.4s" path="M160,160 L235,205"/></circle>
                    <circle r="3" fill="#22c55e" opacity="0.9"><animateMotion dur="3.2s" repeatCount="indefinite" begin="0.4s" path="M160,160 L160,250"/></circle>
                    <circle r="3" fill="#8b5cf6" opacity="0.9"><animateMotion dur="3.8s" repeatCount="indefinite" begin="1.1s" path="M160,160 L85,205"/></circle>
                    <circle r="3" fill="#06b6d4" opacity="0.9"><animateMotion dur="2.9s" repeatCount="indefinite" begin="0.6s" path="M160,160 L85,115"/></circle>
                  </svg>
                  <div className="landing-constellation-caption">COROPOTI Office Network</div>
                </div>
              )}

              {/* SLIDE 3 — CY 2026 system info */}
              {slide === 3 && (
                <div className="landing-info-slide">
                  <div className="landing-info-slide-header">
                    <span className="landing-info-slide-dot" />
                    COROPOTI · CY 2026
                  </div>
                  <div className="landing-info-grid">
                    <div className="landing-info-item">
                      <span className="landing-info-value">16</span>
                      <span className="landing-info-label">Regions</span>
                    </div>
                    <div className="landing-info-item">
                      <span className="landing-info-value">7</span>
                      <span className="landing-info-label">Clusters</span>
                    </div>
                    <div className="landing-info-item">
                      <span className="landing-info-value">CO</span>
                      <span className="landing-info-label">Central Office</span>
                    </div>
                    <div className="landing-info-item">
                      <span className="landing-info-value">ROs</span>
                      <span className="landing-info-label">Regional Offices</span>
                    </div>
                  </div>
                  <div className="landing-info-divider" />
                  <p className="landing-info-tagline">
                    "One system. One calendar.<br/>All TESDA offices, coordinated."
                  </p>
                  <div className="landing-info-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Official · TESDA ROMO
                  </div>
                </div>
              )}
            </div>{/* end landing-slide-wrap */}

            {/* Slide indicators */}
            <div className="landing-slide-dots">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <button
                  key={i}
                  className={`landing-slide-dot ${i === slide ? 'landing-slide-dot--active' : ''}`}
                  onClick={() => {
                    setVisible(false);
                    setTimeout(() => {
                      setEntering(true);
                      setSlide(i);
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                          setEntering(false);
                          setVisible(true);
                        });
                      });
                    }, 300);
                  }}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>{/* end landing-hero-inner */}
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
