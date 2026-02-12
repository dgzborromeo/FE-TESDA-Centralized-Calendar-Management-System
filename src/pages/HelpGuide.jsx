import { Link } from 'react-router-dom';
import './Info.css';

export default function HelpGuide() {
  return (
    <div className="info-page">
      <div className="info-topbar">
        <div>
          <h1 className="info-title">Help / User Guide</h1>
          <p className="info-subtitle">Quick steps for common tasks.</p>
        </div>
        <div className="info-actions">
          <Link to="/dashboard" className="info-btn">Back to Dashboard</Link>
          <Link to="/calendar" className="info-btn">View Calendar</Link>
        </div>
      </div>

      <section className="info-card" style={{ marginBottom: '1rem' }}>
        <h2>Create an event</h2>
        <ul>
          <li>Go to <strong>Dashboard</strong> and click <strong>Create Event</strong>.</li>
          <li>Fill in Title, Date, Time, Type, and optional Location/Description.</li>
          <li>Select Participants (offices) if needed.</li>
          <li>If conflicts are detected, adjust the time.</li>
        </ul>
      </section>

      <section className="info-card" style={{ marginBottom: '1rem' }}>
        <h2>Respond to an invitation</h2>
        <ul>
          <li>Open <strong>Invitations</strong> from your account menu.</li>
          <li>Click an invitation to open the event.</li>
          <li>Under <strong>Your Response</strong>, choose:</li>
          <li><strong>Accept</strong> (enter representative name), or <strong>Decline</strong> (enter a reason).</li>
        </ul>
      </section>

      <section className="info-card">
        <h2>Calendar tips</h2>
        <ul>
          <li>Events show with office colors; weekends are locked.</li>
          <li>Completed events are marked as <strong>Done</strong>.</li>
          <li>The conflicts list hides conflicts for events that are already done.</li>
        </ul>
      </section>
    </div>
  );
}

