import { Link } from 'react-router-dom';
import HamburgerBtn from '../components/HamburgerBtn';
import './Info.css';
import './Dashboard.css';

export default function About() {
  return (
    <div className="info-page">
      <section className="dashboard-panel dashboard-panel-overview ev-hero-panel">
        <div className="dashboard-overview-top">
          <HamburgerBtn />
          <div className="dashboard-overview-titleblock">
            <h1 className="dashboard-title">About the ONE Calendar System</h1>
            <p className="dashboard-subtitle">Operations Network and Events — Centralized Schedule Management System for TESDA COROPOTIs.</p>
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
          <h2>Background</h2>
          <p className="info-muted">
            The ONE (Operations Network and Events) Centralized Calendar System was designed and proposed as a web-based platform to address long-standing scheduling and coordination challenges across TESDA, particularly overlapping activities and participation of key personnel identified during the General Directorate Conference (GDC) 2026.
          </p>
          <p className="info-muted" style={{ marginTop: '0.6rem' }}>
            The system directly contributes to the TESDABest 8-Point Agenda, particularly the pillars on Behavior and Mindset Change, Demand-Driven and Data-Driven TVET, and Global Competitiveness and Good Housekeeping.
          </p>
        </section>

        <section className="info-card">
          <h2>Objectives</h2>
          <ul>
            <li>Establish a unified and centralized scheduling system for all TESDA COROPOTI activities.</li>
            <li>Promote effective, participatory, and professional planning and scheduling practices.</li>
            <li>Strengthen coordination and harmonization of programs, meetings, and institutional activities across all COROPOTIs.</li>
            <li>Enhance data-informed coordination and decision-making through a shared, accessible, and reliable scheduling platform.</li>
            <li>Uphold good governance, accountability, and proper documentation of official activities.</li>
          </ul>
        </section>

        <section className="info-card">
          <h2>Scope and Coverage</h2>
          <ul>
            <li><strong>National / Central Level Events</strong> — Policy-driven, strategic, and national in scope (e.g., national conferences, high-level policy briefings, agency-wide celebrations, national planning workshops).</li>
            <li><strong>Regional Level Events</strong> — Regional coordination, implementation, and stakeholder engagement (e.g., regional TVET fora, regional skills competition, consultations with industry partners).</li>
            <li><strong>Provincial / Institutional Level Events</strong> — Local implementation and community-focused activities (e.g., local TVET enrollment days, provincial skills competition, coordination meetings with LGUs).</li>
          </ul>
        </section>

        <section className="info-card">
          <h2>Roles and Responsibilities</h2>
          <ul>
            <li><strong>ROMO (System Administrator)</strong> — System owner with full access. Manages the system, reviews schedules, monitors conflicts, and provides technical support and training to COROPOTIs.</li>
            <li><strong>COROPOTIs (System Users)</strong> — Submit and finalize schedules, maintain accuracy, coordinate with participants, monitor attendance, and upload post-activity documentation within 14 working days.</li>
            <li><strong>ICTO</strong> — Ensures system alignment with TESDA ICT policies, standards, and infrastructure. Reviews compliance with ICT standards, data governance, and cybersecurity requirements.</li>
          </ul>
        </section>

        <section className="info-card">
          <h2>What This System Does</h2>
          <ul>
            <li>Provides a centralized, shared scheduling platform accessible to all TESDA officials and personnel.</li>
            <li>Automatically detects scheduling conflicts to prevent overlapping activities among participants.</li>
            <li>Enforces a 15-working-day submission lead time and 10-working-day finalization window.</li>
            <li>Distinguishes between Tentative and Final schedules — only Final schedules appear in the official calendar.</li>
            <li>Supports post-activity documentation upload within 14 working days.</li>
            <li>Locks weekends and Philippine holidays to enforce proper scheduling practices.</li>
          </ul>
        </section>

        <section className="info-card">
          <h2>Implementation</h2>
          <ul>
            <li>The ONE Centralized Calendar System is currently under <strong>pilot implementation for one (1) year</strong>.</li>
            <li>Recommendations and feedback gathered during the pilot shall be used to further enhance the system towards its institutionalization into the Agency's operations.</li>
            <li>The system is monitored by ROMO for usage, activity submissions, schedule conflicts, and compliance with established guidelines.</li>
          </ul>
          <p className="info-muted" style={{ marginTop: '0.6rem' }}>
            Issued by: <strong>Jose Francisco "Kiko" B. Benitez</strong>, Secretary/Director General, TESDA
          </p>
        </section>
      </div>
    </div>
  );
}
