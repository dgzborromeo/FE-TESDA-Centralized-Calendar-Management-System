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
            <summary>Why can’t I create events on weekends?</summary>
            <div className="info-answer">
              Weekends (Saturday and Sunday) are locked by design to prevent scheduling. Please select a weekday.
            </div>
          </details>

          <details>
            <summary>What does “Conflict detected” mean?</summary>
            <div className="info-answer">
              It means your selected time overlaps with another event on the same date. The system shows which event and the overlapping time range.
            </div>
          </details>

          <details>
            <summary>Can I still open an event after it is done?</summary>
            <div className="info-answer">
              Yes. Completed events are marked as <strong>Done</strong> but remain clickable so you can view details.
            </div>
          </details>

          <details>
            <summary>How do I respond to an invitation?</summary>
            <div className="info-answer">
              Open <strong>Invitations</strong>, click the item, then submit your response (Accept with representative name or Decline with a reason).
            </div>
          </details>

          <details>
            <summary>Why can’t some office accounts edit or move events?</summary>
            <div className="info-answer">
              Some office accounts are configured as view/create only. They can create new events but cannot edit, delete, drag, or resize events.
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

