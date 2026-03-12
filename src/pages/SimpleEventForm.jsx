import { useState } from 'react';
import Logo from '../components/Logo';
import '../components/Header.css';
import './SimpleEventForm.css';

export default function SimpleEventForm() {
  const [form, setForm] = useState({
    region: '',
    office: '',
    division: '',
    title: '',
    description: '',
    meetingType: 'face-to-face',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    participants: '',
    attachment: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, attachment: file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just log. This page is intentionally not wired to backend/calendar.
    // eslint-disable-next-line no-console
    console.log('Simple event form submit:', form);
    alert('Simple Event Form submit captured in console (no backend wiring yet).');
  };

  return (
    <div className="simple-event-page">
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="header-logo simple-event-header-logo">
              <Logo className="header-logo-img" src="/tesda-logo.png" alt="TESDA" transparentBlack />
              <span className="header-logo-text">COROPOTI Centralized Schedule Management System</span>
            </div>
          </div>
        </div>
      </header>

      <main className="simple-event-main">
        <form className="simple-event-form" onSubmit={handleSubmit}>
          <section className="simple-event-section">
            <h2 className="simple-event-section-title">Host</h2>
            <div className="simple-event-grid">
              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="region">
                  Region
                </label>
                <input
                  id="region"
                  name="region"
                  type="text"
                  value={form.region}
                  onChange={handleChange}
                  className="simple-event-input"
                  placeholder="e.g. NCR, Region III"
                  required
                />
              </div>

              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="office">
                  Office
                </label>
                <input
                  id="office"
                  name="office"
                  type="text"
                  value={form.office}
                  onChange={handleChange}
                  className="simple-event-input"
                  placeholder="e.g. ROMO, PLO"
                  required
                />
              </div>

              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="division">
                  Division <span className="simple-optional">(optional)</span>
                </label>
                <input
                  id="division"
                  name="division"
                  type="text"
                  value={form.division}
                  onChange={handleChange}
                  className="simple-event-input"
                  placeholder="e.g. ROMD, HRMD"
                />
              </div>
            </div>
          </section>

          <section className="simple-event-section">
            <h2 className="simple-event-section-title">Activities Details</h2>
            <div className="simple-event-grid">
              <div className="simple-event-field simple-event-field-full">
                <label className="simple-event-label" htmlFor="title">
                  Event Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  className="simple-event-input"
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="simple-event-field simple-event-field-full">
                <label className="simple-event-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="simple-event-textarea"
                  placeholder="Add a short description of the activity"
                  rows={3}
                />
              </div>

              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="meetingType">
                  Meeting Type
                </label>
                <select
                  id="meetingType"
                  name="meetingType"
                  value={form.meetingType}
                  onChange={handleChange}
                  className="simple-event-input"
                >
                  <option value="face-to-face">Face to Face</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="virtual">Virtual/Zoom</option>
                </select>
              </div>

              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="startDate">
                  Start Date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  className="simple-event-input"
                  required
                />
              </div>

              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="endDate">
                  End Date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                  className="simple-event-input"
                  required
                />
              </div>

              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="startTime">
                  Start Time
                </label>
                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={handleChange}
                  className="simple-event-input"
                  required
                />
              </div>

              <div className="simple-event-field">
                <label className="simple-event-label" htmlFor="endTime">
                  End Time
                </label>
                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={handleChange}
                  className="simple-event-input"
                  required
                />
              </div>

              <div className="simple-event-field simple-event-field-full">
                <label className="simple-event-label" htmlFor="location">
                  Location / Zoom Link
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  className="simple-event-input"
                  placeholder="e.g. TESDA Auditorium or https://zoom.us/j/..."
                  required
                />
              </div>
            </div>
          </section>

          <section className="simple-event-section">
            <h2 className="simple-event-section-title">Participants</h2>
            <div className="simple-event-grid">
              <div className="simple-event-field simple-event-field-full">
                <label className="simple-event-label" htmlFor="participants">
                  Participants
                </label>
                <textarea
                  id="participants"
                  name="participants"
                  value={form.participants}
                  onChange={handleChange}
                  className="simple-event-textarea"
                  placeholder="List of participants, roles, or categories"
                  rows={3}
                  required
                />
              </div>
            </div>
          </section>

          <section className="simple-event-section">
            <h2 className="simple-event-section-title">Attachments</h2>
            <div className="simple-event-grid">
              <div className="simple-event-field simple-event-field-full">
                <label className="simple-event-label" htmlFor="attachment">
                  Attach documents (optional)
                </label>
                <input
                  id="attachment"
                  name="attachment"
                  type="file"
                  onChange={handleFileChange}
                  className="simple-event-input simple-event-input-file"
                />
              </div>
            </div>
          </section>

          <div className="simple-event-actions">
            <button type="submit" className="simple-event-submit">
              Save Event
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

