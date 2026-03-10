import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Kopyahin natin ang helpers mula sa main para consistent ang itsura
const formatTimeShort = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
};

export default function ParticipantsCalendarView({ events, user, onEventClick }) {
  
  // Dito, pwedeng mag-apply ng special filtering ang Junior Dev
  // Halimbawa: Ipakita lang ang events na may OSEC participant
  const participantFilteredEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      // Pwedeng palitan ang kulay dito para sa Participant View naman
      // Halimbawa: Kung OSEC, gawing Red ang Border
      borderColor: event.extendedProps?.has_osec_participant ? '#ef4444' : event.borderColor,
      classNames: [
        ...(event.classNames || []),
        'participant-view-event'
      ]
    }));
  }, [events]);

  return (
    <div className="participants-calendar-container" style={{ marginTop: '10px' }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={participantFilteredEvents}
        height="auto"
        editable={false} // Usually read-only pag "Focus Mode"
        selectable={true}
        eventClick={(info) => onEventClick && onEventClick(info.event)}
        
        // DITO MAG-EEXPERIMENT ANG JUNIOR DEV SA DESIGN
        eventContent={(eventInfo) => {
          const { event } = eventInfo;
          const isOsec = event.extendedProps?.has_osec_participant;
          
          return (
            <div className={`fc-event-main-content ${isOsec ? 'priority-osec' : ''}`} 
                 title={event.extendedProps?.tooltip}>
              <div className="fc-event-time" style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                {formatTimeShort(event.extendedProps?.start_time_raw)}
              </div>
              <div className="fc-event-title-container" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isOsec && <span style={{ color: '#ef4444', marginRight: '4px' }}>●</span>}
                {event.title}
              </div>
              
              {/* Badge for Participants - Eto yung main difference sa Office View */}
              <div className="participant-mini-badges" style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                 {isOsec && (
                   <span style={{ background: '#ef4444', height: '4px', width: '10px', borderRadius: '2px' }} />
                 )}
                 {/* Pwede siyang magdagdag ng iba pang indicator dito */}
              </div>
            </div>
          );
        }}
      />

      <style jsx="true">{`
        .priority-osec {
          border-left: 3px solid #ef4444 !important;
          padding-left: 4px;
        }
        .fc-event-main-content {
          padding: 2px;
          font-size: 0.85rem;
          line-height: 1.2;
        }
      `}</style>
    </div>
  );
}