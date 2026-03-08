import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { events as eventsApi } from '../api';
import EventModal from '../components/EventModal';
import './DayView.css';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 6); // 6 AM to 6 PM

// Ibalik natin ang configuration ng kulay
const OFFICE_COLORS = {
  'ROMO': { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  'PLO': { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  'QSO': { bg: '#fef9c3', text: '#a16207', border: '#fef08a' },
  'PIO': { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' },
  'SMO': { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
  'PO': { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  'AS': { bg: '#fae8ff', text: '#86198f', border: '#f5d0fe' },
  'ICTO': { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
  'CLGEO': { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' },
  'EBETO': { bg: '#fff1f2', text: '#9f1239', border: '#ffe4e6' },
  'FMS': { bg: '#ecfdf5', text: '#047857', border: '#d1fae5' },
  'CO': { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' },
};

export default function DayView() {
  const { date: dateParam } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const dateYmd = dateParam?.slice(0, 10) || new Date().toISOString().split('T')[0];

  // Helper function para sa styling
  const getOfficeStyle = (name) => {
    const key = String(name || '').toUpperCase();
    // I-check kung may match sa abbreviation (e.g. QSO) o sa buong pangalan
    const match = Object.keys(OFFICE_COLORS).find(k => key.includes(k));
    return OFFICE_COLORS[match] || { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
  };

  const getAbbreviation = (name) => {
    const n = String(name || '').trim();
    const match = n.match(/\(([^)]+)\)/);
    if (match) return match[1].toUpperCase();
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4);
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const list = await eventsApi.list({ start: dateYmd, end: dateYmd });
      setEvents(list || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateYmd]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const eventsByHour = useMemo(() => {
    const map = {};
    HOURS.forEach(h => { map[h] = []; });
    events.forEach(e => {
      const hour = parseInt(e.start_time?.split(':')[0]);
      if (map[hour]) map[hour].push(e);
    });
    return map;
  }, [events]);

  const formatHour = (h) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour} ${period}`;
  };

  const formatFullTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${period}`;
  };
const renderParticipants = (participantsData) => {
  if (!participantsData) return 'To Follow';
  
  try {
    // I-check kung string ito na kailangang i-parse o array na talaga
    const data = typeof participantsData === 'string' 
      ? JSON.parse(participantsData) 
      : participantsData;

    if (Array.isArray(data)) {
      // Kunin lang ang 'name' property ng bawat object at pagsamahin gamit ang comma
      return data.map(p => p.name).join(', ');
    }
    return String(participantsData);
  } catch (err) {
    // Fallback kung hindi pala valid JSON
    return String(participantsData);
  }
};
  return (
    <div className="day-view-container">
      <header className="day-view-header">
        <div className="day-view-back">
          <Link to={`/calendar?date=${dateYmd}`} className="day-view-link">← Back</Link>
        </div>
        <h1 className="day-view-title">
          {new Date(dateYmd).toLocaleDateString('en-US', { dateStyle: 'full' })}
        </h1>
      </header>

      {loading ? (
        <div className="day-view-loading">Loading schedule...</div>
      ) : (
        <div className="timeline-list">
          {HOURS.map(hour => (
            <div key={hour} className="hour-section">
              <div className="hour-header">
                <span className="hour-text">{formatHour(hour)}</span>
                <div className="hour-line"></div>
              </div>
              
              <div className="hour-content">
                {eventsByHour[hour].length > 0 ? (
                  <div className="event-table-container">
                    <table className="event-list-table">
                      <thead>
                        <tr>
                          <th style={{ width: '35%' }}>ACTIVITY</th>
                          <th style={{ width: '10%' }}>HOST</th>
                          <th style={{ width: '15%' }}>MODE</th>
                          <th style={{ width: '20%' }}>VENUE</th>
                          <th style={{ width: '20%' }}>PARTICIPANTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventsByHour[hour].map((e) => {
                          const style = getOfficeStyle(e.creator_name || e.office);
                          const hostAbbr = getAbbreviation(e.creator_name || e.office);
                          const modeDisplay = e.type === 'zoom' ? 'Online / Zoom' : (e.location ? 'Face-to-Face' : 'Hybrid');

                          return (
                            <tr key={e.id} onClick={() => setSelectedEvent(e.id)} className="clickable-row">
                              <td className="col-activity">
                                <div className="activity-title">{e.title}</div>
                                <div className="time-indicator">
                                  {formatFullTime(e.start_time)} - {formatFullTime(e.end_time)}
                                </div>
                              </td>
                              <td className="col-host">
                                <span 
                                  className="host-abbr-badge" 
                                  style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
                                >
                                  {hostAbbr}
                                </span>
                              </td>
                              <td className="col-mode">
                                <span className={`mode-text ${e.type}`}>
                                  {modeDisplay}
                                </span>
                              </td>
                              <td className="col-venue">{e.location || 'N/A'}</td>
                              <td className="col-participants">{renderParticipants(e.participants)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-events-spacer"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEvent && (
        <EventModal 
          eventId={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
          onEdit={fetchEvents} 
          onDelete={fetchEvents} 
        />
      )}
    </div>
  );
}