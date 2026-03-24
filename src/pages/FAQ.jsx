import { Link } from 'react-router-dom';
import './Info.css';

export default function FAQ() {
  return (
    <div className="info-page">
      <div className="info-topbar">
        <div>
          <h1 className="info-title">FAQ</h1>
          <p className="info-subtitle">Common questions and answers.</p>
        </div>
        <div className="info-actions">
          <Link to="/dashboard" className="info-btn">Back to Dashboard</Link>
          <Link to="/calendar" className="info-btn">View Calendar</Link>
        </div>
      </div>

      <div className="info-card">
        <div className="info-accordion">
          <details>
            <summary>Why can't I create events on weekends?</summary>
            <div className="info-answer">
              Weekends (Saturday and Sunday) are locked by design. Please select a weekday.
            </div>
          </details>

          <details>
            <summary>What does "Conflict detected" mean?</summary>
            <div className="info-answer">
              Your selected time overlaps with another event on the same date. The system shows which event conflicts and the overlapping time range. Adjust the time before submitting.
            </div>
          </details>

          <details>
            <summary>Where do I find past and upcoming events?</summary>
            <div className="info-answer">
              Go to <strong>Events / Meetings</strong> in the nav bar. Use the <strong>Recent</strong> tab for past events, <strong>Upcoming</strong> for future ones, and <strong>By Year</strong> to browse all events for a specific year.
            </div>
          </details>

          <details>
            <summary>Can I still view an event after it is done?</summary>
            <div className="info-answer">
              Yes. Completed events are marked as <strong>Done</strong> on the calendar but remain clickable so you can view their details.
            </div>
          </details>

          <details>
            <summary>Why can't I see the List of Activity or User Configuration links?</summary>
            <div className="info-answer">
              Those links are only visible to <strong>Admin</strong> accounts. If you need access, contact your system administrator.
            </div>
          </details>

          <details>
            <summary>How do I add a schedule?</summary>
            <div className="info-answer">
              Click <strong>+ Add Schedule</strong> on the calendar toolbar, or click any weekday on the calendar grid. You must be logged in to submit a schedule.
            </div>
          </details>

          <details>
            <summary>Why can't some office accounts edit or move events?</summary>
            <div className="info-answer">
              Some office accounts are configured as view-only. They can view all events but cannot edit, delete, drag, or resize them.
            </div>
          </details>

          <details>
            <summary>How do I log in?</summary>
            <div className="info-answer">
              Click the <strong>Log In</strong> button in the top-right corner of the navigation bar and enter your credentials.
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
