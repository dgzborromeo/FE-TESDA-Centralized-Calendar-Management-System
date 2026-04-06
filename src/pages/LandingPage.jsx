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

          {/* Right column — rotating showcase */}
          <div className="landing-hero-right">
            <div className={`landing-slide-wrap ${entering ? 'landing-slide-enter' : visible ? 'landing-slide-in' : 'landing-slide-out'}`}>

              {/* SLIDE 0 — Activity Pulse */}
              {slide === 0 && (
                <div className="landing-pulse-slide">
                  <div className="landing-pulse-header">
                    <span className="landing-pulse-live-dot" />
                    <span className="landing-pulse-live-text">System Live</span>
                    <span className="landing-pulse-year">CY 2026</span>
                  </div>
                  <div className="landing-pulse-grid">
                    <div className="landing-pulse-stat landing-pulse-stat--blue">
                      <div className="landing-pulse-stat-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                      </div>
                      <span className="landing-pulse-stat-value">16</span>
                      <span className="landing-pulse-stat-label">Regions</span>
                    </div>
                    <div className="landing-pulse-stat landing-pulse-stat--teal">
                      <div className="landing-pulse-stat-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                      </div>
                      <span className="landing-pulse-stat-value">7</span>
                      <span className="landing-pulse-stat-label">Clusters</span>
                    </div>
                    <div className="landing-pulse-stat landing-pulse-stat--amber">
                      <div className="landing-pulse-stat-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                      </div>
                      <span className="landing-pulse-stat-value">20+</span>
                      <span className="landing-pulse-stat-label">Offices</span>
                    </div>
                    <div className="landing-pulse-stat landing-pulse-stat--green">
                      <div className="landing-pulse-stat-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      </div>
                      <span className="landing-pulse-stat-value">Q2</span>
                      <span className="landing-pulse-stat-label">Active Quarter</span>
                    </div>
                  </div>
                  <div className="landing-pulse-bar-wrap">
                    <div className="landing-pulse-bar-label">
                      <span>Annual Progress</span>
                      <span className="landing-pulse-bar-pct">~25%</span>
                    </div>
                    <div className="landing-pulse-bar-track">
                      <div className="landing-pulse-bar-fill" />
                    </div>
                  </div>
                  <div className="landing-pulse-footer">
                    <span className="landing-pulse-footer-dot landing-pulse-footer-dot--blue" />
                    CO &amp; ROs coordinated on one platform
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
                    <circle cx="160" cy="160" r="110" stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 6"/>
                    <circle cx="160" cy="160" r="148" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 8"/>
                    <line x1="160" y1="160" x2="160" y2="45"  stroke="rgba(59,130,246,0.45)"  strokeWidth="1.2"/>
                    <line x1="160" y1="160" x2="255" y2="90"  stroke="rgba(236,72,153,0.45)"  strokeWidth="1.2"/>
                    <line x1="160" y1="160" x2="255" y2="230" stroke="rgba(245,158,11,0.45)"  strokeWidth="1.2"/>
                    <line x1="160" y1="160" x2="160" y2="275" stroke="rgba(34,197,94,0.45)"   strokeWidth="1.2"/>
                    <line x1="160" y1="160" x2="65"  y2="230" stroke="rgba(139,92,246,0.45)"  strokeWidth="1.2"/>
                    <line x1="160" y1="160" x2="65"  y2="90"  stroke="rgba(6,182,212,0.45)"   strokeWidth="1.2"/>
                    {/* Center pulse rings */}
                    <circle cx="160" cy="160" r="38" stroke="rgba(59,130,246,0.2)" strokeWidth="1" className="lc-pulse-1"/>
                    <circle cx="160" cy="160" r="48" stroke="rgba(59,130,246,0.1)" strokeWidth="1" className="lc-pulse-2"/>
                    {/* Center node — ROMO */}
                    <circle cx="160" cy="160" r="32" fill="rgba(59,130,246,0.32)" stroke="#3b82f6" strokeWidth="2"/>
                    <text x="160" y="156" textAnchor="middle" fill="white" fontSize="11" fontWeight="800" fontFamily="Plus Jakarta Sans,sans-serif">ROMO</text>
                    <text x="160" y="169" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="8" fontFamily="Plus Jakarta Sans,sans-serif">Central</text>
                    {/* Outer nodes */}
                    <circle cx="160" cy="45"  r="26" fill="rgba(59,130,246,0.28)"  stroke="#3b82f6" strokeWidth="1.8" className="lc-node"/>
                    <text x="160" y="41"  textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="Plus Jakarta Sans,sans-serif">TESDO</text>
                    <text x="160" y="53"  textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="7.5" fontFamily="Plus Jakarta Sans,sans-serif">CO · ROMO</text>
                    <circle cx="255" cy="90"  r="26" fill="rgba(236,72,153,0.28)"  stroke="#ec4899" strokeWidth="1.8" className="lc-node"/>
                    <text x="255" y="86"  textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="Plus Jakarta Sans,sans-serif">PP</text>
                    <text x="255" y="98"  textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="7.5" fontFamily="Plus Jakarta Sans,sans-serif">PO · QSO</text>
                    <circle cx="255" cy="230" r="26" fill="rgba(245,158,11,0.28)"  stroke="#f59e0b" strokeWidth="1.8" className="lc-node"/>
                    <text x="255" y="226" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="Plus Jakarta Sans,sans-serif">SC</text>
                    <text x="255" y="238" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="7.5" fontFamily="Plus Jakarta Sans,sans-serif">CLGEO</text>
                    <circle cx="160" cy="275" r="26" fill="rgba(34,197,94,0.28)"   stroke="#22c55e" strokeWidth="1.8" className="lc-node"/>
                    <text x="160" y="271" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="Plus Jakarta Sans,sans-serif">FLA</text>
                    <text x="160" y="283" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="7.5" fontFamily="Plus Jakarta Sans,sans-serif">FMS</text>
                    <circle cx="65"  cy="230" r="26" fill="rgba(139,92,246,0.28)"  stroke="#8b5cf6" strokeWidth="1.8" className="lc-node"/>
                    <text x="65"  y="226" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="Plus Jakarta Sans,sans-serif">PL</text>
                    <text x="65"  y="238" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="7" fontFamily="Plus Jakarta Sans,sans-serif">PLO · EBETO</text>
                    <circle cx="65"  cy="90"  r="26" fill="rgba(6,182,212,0.28)"   stroke="#06b6d4" strokeWidth="1.8" className="lc-node"/>
                    <text x="65"  y="86"  textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="Plus Jakarta Sans,sans-serif">AI</text>
                    <text x="65"  y="98"  textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="7.5" fontFamily="Plus Jakarta Sans,sans-serif">AS · ICTO</text>
                    {/* Animated signal dots */}
                    <circle r="4" fill="#3b82f6" opacity="0.9"><animateMotion dur="3s" repeatCount="indefinite" path="M160,160 L160,45"/></circle>
                    <circle r="4" fill="#ec4899" opacity="0.9"><animateMotion dur="3.5s" repeatCount="indefinite" begin="0.8s" path="M160,160 L255,90"/></circle>
                    <circle r="4" fill="#f59e0b" opacity="0.9"><animateMotion dur="4s" repeatCount="indefinite" begin="1.4s" path="M160,160 L255,230"/></circle>
                    <circle r="4" fill="#22c55e" opacity="0.9"><animateMotion dur="3.2s" repeatCount="indefinite" begin="0.4s" path="M160,160 L160,275"/></circle>
                    <circle r="4" fill="#8b5cf6" opacity="0.9"><animateMotion dur="3.8s" repeatCount="indefinite" begin="1.1s" path="M160,160 L65,230"/></circle>
                    <circle r="4" fill="#06b6d4" opacity="0.9"><animateMotion dur="2.9s" repeatCount="indefinite" begin="0.6s" path="M160,160 L65,90"/></circle>
                  </svg>
                  <div className="landing-constellation-caption">COROPOTI Office Network</div>
                </div>
              )}

              {/* SLIDE 3 — Mini Calendar Heatmap */}
              {slide === 3 && (
                <div className="landing-heatmap-slide">
                  <div className="landing-heatmap-header">
                    <div className="landing-heatmap-month-label">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                      April 2026
                    </div>
                    <span className="landing-heatmap-badge">CY 2026</span>
                  </div>
                  <div className="landing-heatmap-grid-wrap">
                    <div className="landing-heatmap-dow">
                      {['S','M','T','W','T','F','S'].map((d,i) => (
                        <span key={i} className="landing-heatmap-dow-cell">{d}</span>
                      ))}
                    </div>
                    {/* April 2026: starts Wednesday (offset 3), 30 days */}
                    <div className="landing-heatmap-grid">
                      {Array.from({ length: 3 }).map((_,i) => (
                        <span key={`e${i}`} className="landing-heatmap-cell landing-heatmap-cell--empty" />
                      ))}
                      {Array.from({ length: 30 }).map((_,i) => {
                        const day = i + 1;
                        // today = April 6
                        const isToday = day === 6;
                        // sample event density: high=3+, med=2, low=1, none=0
                        const density = [3,7,10,14,15,17,21,22,24,28].includes(day) ? 'high'
                          : [2,5,9,12,16,19,23,27,29].includes(day) ? 'med'
                          : [1,4,8,11,13,18,20,25,26,30].includes(day) ? 'low'
                          : 'none';
                        return (
                          <span
                            key={day}
                            className={[
                              'landing-heatmap-cell',
                              `landing-heatmap-cell--${density}`,
                              isToday ? 'landing-heatmap-cell--today' : ''
                            ].join(' ')}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="landing-heatmap-legend">
                    <span className="landing-heatmap-legend-label">Activity density</span>
                    <span className="landing-heatmap-legend-swatch landing-heatmap-legend-swatch--none" />
                    <span className="landing-heatmap-legend-swatch landing-heatmap-legend-swatch--low" />
                    <span className="landing-heatmap-legend-swatch landing-heatmap-legend-swatch--med" />
                    <span className="landing-heatmap-legend-swatch landing-heatmap-legend-swatch--high" />
                    <span className="landing-heatmap-legend-label">High</span>
                  </div>
                  <div className="landing-heatmap-footer">
                    <span className="landing-heatmap-today-pill">
                      <span className="landing-heatmap-today-dot" />
                      Today · Apr 6
                    </span>
                    <span className="landing-heatmap-offices">20+ offices tracked</span>
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
