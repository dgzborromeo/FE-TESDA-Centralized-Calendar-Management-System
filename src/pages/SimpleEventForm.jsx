import { useState } from 'react';
import Logo from '../components/Logo';
import '../components/Header.css';
import './SimpleEventForm.css';

export default function SimpleEventForm() {
  const [form, setForm] = useState({
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
    zoomLink: '',
    participants: '',
    attachment: null,
  });

  const isZoomLink = (str) => {
    const s = (str || '').trim();
    if (!s) return false;
    return /zoom\.us\//i.test(s);
  };

  const toLocalYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isWeekendYMD = (ymd) => {
    if (!ymd || String(ymd).length < 10) return false;
    const d = new Date(`${String(ymd).slice(0, 10)}T12:00:00`);
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const addBusinessDays = (date, businessDays) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    let remaining = Math.max(0, Number(businessDays) || 0);
    while (remaining > 0) {
      d.setDate(d.getDate() + 1);
      const day = d.getDay();
      const isWeekend = day === 0 || day === 6;
      if (!isWeekend) remaining -= 1;
    }
    return d;
  };

  const today = new Date();
  const minStartDateYmd = toLocalYMD(addBusinessDays(today, 10));

  const dateErrors = (() => {
    const errs = {};
    const start = form.startDate;
    const end = form.endDate;

    if (start) {
      if (isWeekendYMD(start)) errs.startDate = 'Weekends are not allowed. Please select a weekday (Mon–Fri).';
      else if (start < minStartDateYmd) errs.startDate = 'Minimum lead time is 10 working days (Mon–Fri). Please select a later date.';
    }
    if (end) {
      if (isWeekendYMD(end)) errs.endDate = 'Weekends are not allowed. Please select a weekday (Mon–Fri).';
      else if (start && end < start) errs.endDate = 'End Date must be the same as or after Start Date.';
    }
    return errs;
  })();

  const hasBlockingErrors = Boolean(dateErrors.startDate || dateErrors.endDate);

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
    if (form.meetingType === 'virtual' && !isZoomLink(form.zoomLink)) {
      alert('Please enter a valid Zoom link (e.g. https://zoom.us/j/...) to continue.');
      return;
    }
    if (hasBlockingErrors) {
      alert('Please fix the date requirements before saving.');
      return;
    }
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
                  min={minStartDateYmd}
                  required
                />
                {dateErrors.startDate && (
                  <span className="simple-event-hint simple-event-hint-error">{dateErrors.startDate}</span>
                )}
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
                  min={form.startDate || minStartDateYmd}
                  required
                />
                {dateErrors.endDate && (
                  <span className="simple-event-hint simple-event-hint-error">{dateErrors.endDate}</span>
                )}
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

              {form.meetingType === 'face-to-face' && (
                <div className="simple-event-field simple-event-field-full">
                  <label className="simple-event-label" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={form.location}
                    onChange={handleChange}
                    className="simple-event-input"
                    placeholder="e.g. TESDA Auditorium, Room 101"
                    required
                  />
                </div>
              )}

              {form.meetingType === 'hybrid' && (
                <>
                  <div className="simple-event-field simple-event-field-full">
                    <label className="simple-event-label" htmlFor="location">
                      Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={form.location}
                      onChange={handleChange}
                      className="simple-event-input"
                      placeholder="e.g. TESDA Auditorium, Room 101"
                      required
                    />
                  </div>
                  <div className="simple-event-field simple-event-field-full">
                    <label className="simple-event-label" htmlFor="zoomLink">
                      Zoom Link
                    </label>
                    <input
                      id="zoomLink"
                      name="zoomLink"
                      type="url"
                      value={form.zoomLink}
                      onChange={handleChange}
                      className="simple-event-input"
                      placeholder="e.g. https://zoom.us/j/123456789"
                      required
                    />
                  </div>
                </>
              )}

              {form.meetingType === 'virtual' && (
                <div className="simple-event-field simple-event-field-full">
                  <label className="simple-event-label" htmlFor="zoomLink">
                    Zoom Link
                  </label>
                  <input
                    id="zoomLink"
                    name="zoomLink"
                    type="url"
                    value={form.zoomLink}
                    onChange={handleChange}
                    className="simple-event-input"
                    placeholder="e.g. https://zoom.us/j/123456789"
                    required
                  />
                  {form.zoomLink && !isZoomLink(form.zoomLink) && (
                    <span className="simple-event-hint simple-event-hint-error">
                      Please enter a valid Zoom link (e.g. https://zoom.us/j/...)
                    </span>
                  )}
                </div>
              )}
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
            <button
              type="submit"
              className="simple-event-submit"
              disabled={(form.meetingType === 'virtual' && !isZoomLink(form.zoomLink)) || hasBlockingErrors}
            >
              Save Event
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

