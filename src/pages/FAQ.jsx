import { Link } from 'react-router-dom';
import HamburgerBtn from '../components/HamburgerBtn';
import './Info.css';
import './Dashboard.css';

export default function FAQ() {
  return (
    <div className="info-page">
      <section className="dashboard-panel dashboard-panel-overview ev-hero-panel">
        <div className="dashboard-overview-top">
          <HamburgerBtn />
          <div className="dashboard-overview-titleblock">
            <h1 className="dashboard-title">FAQ</h1>
            <p className="dashboard-subtitle">Frequently asked questions about the ONE Centralized Calendar System.</p>
          </div>
          <div className="dashboard-overview-side">
            <div className="dashboard-actions">
              <Link to="/dashboard" className="dashboard-btn">Back to Dashboard</Link>
              <Link to="/calendar" className="dashboard-btn">View Calendar</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="info-card">
        <div className="info-accordion">
          <details>
            <summary>How far in advance must I submit an activity schedule?</summary>
            <div className="info-answer">
              All activity schedules must be submitted at least <strong>15 working days</strong> prior to the intended date. Schedules submitted beyond this period shall not be accepted. Requests for special exemptions may be submitted to ROMO for approval.
            </div>
          </details>

          <details>
            <summary>What is the difference between Tentative and Final status?</summary>
            <div className="info-answer">
              A <strong>Tentative</strong> schedule is submitted but pending confirmation. It must be finalized within <strong>10 working days</strong> from submission, otherwise it will be automatically deleted from the system. A <strong>Final</strong> schedule is confirmed with complete supporting documents uploaded and will appear in the official calendar. Only Final schedules take priority over other activities.
            </div>
          </details>

          <details>
            <summary>What happens if my Tentative schedule is not finalized in time?</summary>
            <div className="info-answer">
              Tentative schedules not finalized within 10 working days will be automatically deleted from the system. If the concerned office still intends to proceed with the activity, the event must be resubmitted as a new schedule, subject to the required 15 working days submission timeline.
            </div>
          </details>

          <details>
            <summary>What documents are required to tag a schedule as Final?</summary>
            <div className="info-answer">
              A schedule may only be tagged as Final once the required supporting documents have been submitted, such as the approved TESDA Order, Office Order, Notice of Meeting, or similar documents. The concerned office is responsible and accountable for the accuracy and authenticity of all uploaded documents.
            </div>
          </details>

          <details>
            <summary>Why can't I create events on weekends?</summary>
            <div className="info-answer">
              Weekends (Saturday and Sunday) are locked by design in accordance with the system guidelines. Please select a weekday (Monday to Friday).
            </div>
          </details>

          <details>
            <summary>What does "Conflict detected" mean?</summary>
            <div className="info-answer">
              Your selected time overlaps with another event involving the same participants on the same date. The system automatically detects scheduling conflicts to prevent overlapping activities. Adjust the date, time, or participants before submitting.
            </div>
          </details>

          <details>
            <summary>When must post-activity documentation be uploaded?</summary>
            <div className="info-answer">
              Within <strong>14 working days</strong> after the activity, the concerned office must upload all relevant documentation including presentations, attendance lists, photos/videos, minutes of meeting, and other supporting outputs.
            </div>
          </details>

          <details>
            <summary>Who can submit and edit schedules in the system?</summary>
            <div className="info-answer">
              Scheduling and editing of activities is restricted to <strong>authorized focal persons within the COROPOTIs</strong>. All TESDA officials and personnel at the Central, Regional, Provincial, and Institutional levels may view scheduled activities.
            </div>
          </details>

          <details>
            <summary>Who manages and administers the system?</summary>
            <div className="info-answer">
              The <strong>Regional Operations Management Office (ROMO)</strong> is the system owner and administrator. ROMO has full access to all schedules, manages the system, reviews submissions, monitors conflicts, and provides technical support and training to COROPOTIs.
            </div>
          </details>

          <details>
            <summary>Where do I find past and upcoming events?</summary>
            <div className="info-answer">
              Go to <strong>Events / Meetings</strong> in the nav bar. Use the <strong>Recent</strong> tab for past events, <strong>Upcoming</strong> for future ones, and <strong>By Year</strong> to browse all events for a specific year.
            </div>
          </details>

          <details>
            <summary>Why can't some office accounts edit or move events?</summary>
            <div className="info-answer">
              Some office accounts are configured as view-only in accordance with the system's roles and responsibilities. They can view all events but cannot edit, delete, drag, or resize them. Contact ROMO if you need access adjustments.
            </div>
          </details>

          <details>
            <summary>How do I log in?</summary>
            <div className="info-answer">
              Click the <strong>Sign In</strong> button on the Landing Page or the <strong>Log In</strong> button in the top-right corner of the navigation bar and enter your assigned TESDA COROPOTI credentials.
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
