import { Link } from 'react-router-dom';
import HamburgerBtn from '../components/HamburgerBtn';
import './Info.css';
import './Dashboard.css';

export default function HelpGuide() {
  return (
    <div className="info-page">
      <section className="dashboard-panel dashboard-panel-overview ev-hero-panel">
        <div className="dashboard-overview-top">
          <HamburgerBtn />
          <div className="dashboard-overview-titleblock">
            <h1 className="dashboard-title">User Guide</h1>
            <p className="dashboard-subtitle">Step-by-step guide for using the ONE Centralized Calendar System.</p>
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
        <h2>Submitting an Activity Schedule</h2>
        <ul>
          <li>All activity schedules must be submitted at least <strong>15 working days</strong> prior to the intended date.</li>
          <li>Monthly activity plans must be submitted every <strong>second week of the preceding month</strong>.</li>
          <li>Click <strong>+ Add Schedule</strong> on the Calendar toolbar, or click any weekday on the calendar grid.</li>
          <li>You must be logged in. If not, a login prompt will appear.</li>
          <li>Fill in the Event Title, Date, Start/End Time, Meeting Type, Location, and Participants.</li>
          <li>Upload required supporting documents (e.g., TESDA Order, Office Order, Notice of Meeting).</li>
          <li>Click <strong>Save Event</strong> to submit. The schedule will be tagged as <em>Tentative</em> upon submission.</li>
        </ul>
      </section>

      <section className="info-card" style={{ marginBottom: '1rem' }}>
        <h2>Schedule Status</h2>
        <ul>
          <li><strong>Tentative</strong> — Schedule is submitted but pending confirmation. Must be finalized within <strong>10 working days</strong> from submission, otherwise it will be automatically deleted from the system.</li>
          <li><strong>Final</strong> — Schedule is confirmed with complete supporting documents uploaded. Only Final schedules appear in the official calendar. Final activities take priority over other schedules.</li>
          <li><strong>Expired</strong> — Tentative schedule that was not finalized within the 10-day window. The concerned office must resubmit as a new schedule subject to the 15-day timeline.</li>
        </ul>
      </section>

      <section className="info-card" style={{ marginBottom: '1rem' }}>
        <h2>Browsing Events</h2>
        <ul>
          <li>Go to <strong>Events / Meetings</strong> in the nav bar.</li>
          <li>Switch between tabs: <strong>Recent</strong> (past events), <strong>Upcoming</strong> (future events), <strong>By Year</strong> (all events for a selected year).</li>
          <li>Use the search bar to filter by title, location, or description.</li>
          <li>Click any event card to view full details including participants, location, and attachments.</li>
          <li>Use Prev / Next to navigate between pages (10 events per page).</li>
        </ul>
      </section>

      <section className="info-card" style={{ marginBottom: '1rem' }}>
        <h2>Using the Calendar</h2>
        <ul>
          <li>Switch between <strong>Month</strong>, <strong>Week</strong>, and <strong>Day</strong> views using the toolbar buttons.</li>
          <li>Use the <strong>Offices</strong> tab in the legend to filter events by office or cluster.</li>
          <li>Use the <strong>Participants</strong> tab to filter events by participant type (RDs, PDs, EDs, etc.).</li>
          <li>Click an event to open its details modal.</li>
          <li>The search bar in the header filters events directly on the calendar.</li>
          <li>Weekends are locked — activities can only be scheduled on weekdays (Mon–Fri).</li>
          <li>Philippine holidays are shown automatically on the calendar.</li>
        </ul>
      </section>

      <section className="info-card" style={{ marginBottom: '1rem' }}>
        <h2>Post-Activity Documentation</h2>
        <ul>
          <li>Within <strong>14 working days</strong> after the activity, the concerned office must upload all relevant documentation.</li>
          <li>Required documents include: presentations/materials, attendance/participant lists, photos/videos, minutes of meeting or agreements reached, and other supporting outputs.</li>
          <li>Failure to upload complete documentation may prevent a schedule from being tagged as Final.</li>
          <li>To upload, open the event details and use the Documents & Reports section.</li>
        </ul>
      </section>

      <section className="info-card" style={{ marginBottom: '1rem' }}>
        <h2>Admin: Activity Validation List</h2>
        <ul>
          <li>Go to <strong>List of Activity</strong> in the nav bar (admin/ROMO only).</li>
          <li>Filter by office name, date range, or status (All / Final / Tentative / Expired).</li>
          <li>Click <strong>Edit</strong> to update the event title or status — changing to <em>Final</em> will promote the schedule to the official calendar.</li>
          <li>Click <strong>Delete</strong> to remove an activity after confirmation.</li>
          <li>Click <strong>View PDF</strong> to open an attached supporting document.</li>
        </ul>
      </section>

      <section className="info-card">
        <h2>Logging In and Out</h2>
        <ul>
          <li>Click the <strong>Sign In</strong> button on the Landing Page or the <strong>Log In</strong> button in the top-right of the nav bar.</li>
          <li>Enter your assigned TESDA COROPOTI credentials.</li>
          <li>To log out, click your account name in the nav bar and select <strong>Logout</strong>.</li>
        </ul>
      </section>
    </div>
  );
}
