import { Link } from 'react-router-dom';
import './Info.css';
import './Dashboard.css';

export default function HelpGuide() {
  return (
    <div className="info-page">
      <section className="dashboard-panel dashboard-panel-overview ev-hero-panel">
        <div className="dashboard-overview-top">
          <div className="dashboard-overview-titleblock">
            <h1 className="dashboard-title">User Guide</h1>
            <p className="dashboard-subtitle">Quick steps for common tasks in the system.</p>
          </div>
          <div className="dashboard-overview-side">
            <div className="dashboard-actions">
              <Link to="/dashboard" className="dashboard-btn">Back to Dashboard</Link>
              <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="info-card" style={{ marginBottom: '1rem' }}>
        <h2>Submit a new schedule</h2>
        <ul>
          <li>Click <strong>+ Add Schedule</strong> on the Calendar (top-right of the toolbar), or click any weekday on the calendar grid.</li>
          <li>You must be logged in. If not, a login prompt will appear.</li>
          <li>Fill in the Event Title, Date, Start/End Time, Meeting Type, and Location.</li>
          <li>Select Heads and Focals under Participants if applicable.</li>
          <li>If a conflict is detected, adjust the time before submitting.</li>
          <li>Click <strong>Submit Schedule</strong> to save.</li>
        </ul>
      </section>

      <section className="info-card" style={{ marginBottom: '1rem' }}>
        <h2>Browse events</h2>
        <ul>
          <li>Go to <strong>Events / Meetings</strong> in the nav bar.</li>
          <li>Switch between tabs: <strong>Recent</strong> (past events), <strong>Upcoming</strong> (future events), <strong>By Year</strong> (all events for a selected year).</li>
          <li>Use the search bar to filter by title, location, or description.</li>
          <li>Click any event card to view full details.</li>
          <li>Use Prev / Next to navigate between pages (10 events per page).</li>
        </ul>
      </section>

      <section className="info-card" style={{ marginBottom: '1rem' }}>
        <h2>Using the Calendar</h2>
        <ul>
          <li>Switch between <strong>Month</strong>, <strong>Week</strong>, and <strong>Day</strong> views using the toolbar buttons.</li>
          <li>Click an event to open its details modal.</li>
          <li>Use the <strong>Host Events</strong> filter (Upcoming tab) to view events by a specific office.</li>
          <li>The search bar in the header filters events directly on the calendar.</li>
          <li>Holidays are shown automatically on the calendar.</li>
        </ul>
      </section>

      <section className="info-card" style={{ marginBottom: '1rem' }}>
        <h2>Admin: List of Activity</h2>
        <ul>
          <li>Go to <strong>List of Activity</strong> in the nav bar (admin only).</li>
          <li>Filter by office name, date range, or status (All / Final / Tentative).</li>
          <li>Click <strong>Edit</strong> to update the event title or status — a modal will appear with a success or error message.</li>
          <li>Click <strong>Delete</strong> to remove an activity after confirmation.</li>
          <li>Click <strong>View PDF</strong> to open an attached document.</li>
        </ul>
      </section>

      <section className="info-card">
        <h2>Logging in and out</h2>
        <ul>
          <li>Click the <strong>Log In</strong> button in the top-right of the nav bar.</li>
          <li>To log out, click your account name in the nav bar and select <strong>Logout</strong>.</li>
        </ul>
      </section>
    </div>
  );
}
