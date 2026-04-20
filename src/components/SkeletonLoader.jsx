/**
 * Reusable skeleton loader components
 * Usage: <SkeletonDashboard />, <SkeletonEventList />, <SkeletonEventDetails />, <SkeletonCard rows={n} />
 */
import './SkeletonLoader.css';

/** Generic shimmer block */
export function SkeletonBlock({ width = '100%', height = '1rem', radius = '6px', style = {} }) {
  return (
    <div
      className="skeleton-block"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

/** A generic card with N text rows */
export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <SkeletonBlock width="55%" height="1.1rem" style={{ marginBottom: '0.75rem' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock
          key={i}
          width={i % 2 === 0 ? '90%' : '70%'}
          height="0.85rem"
          style={{ marginBottom: '0.5rem' }}
        />
      ))}
    </div>
  );
}

/** Dashboard skeleton — mirrors the real dashboard layout */
export function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard" aria-label="Loading dashboard..." aria-busy="true">
      {/* Top overview panel */}
      <div className="skeleton-panel">
        <SkeletonBlock width="40%" height="1.8rem" style={{ marginBottom: '0.5rem' }} />
        <SkeletonBlock width="60%" height="0.9rem" />
      </div>

      {/* Stat cards row */}
      <div className="skeleton-cards-row">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-stat-card">
            <SkeletonBlock width="50%" height="0.8rem" style={{ marginBottom: '0.6rem' }} />
            <SkeletonBlock width="35%" height="2rem" style={{ marginBottom: '0.4rem' }} />
            <SkeletonBlock width="65%" height="0.75rem" />
          </div>
        ))}
      </div>

      {/* Two-column: upcoming + mini calendar */}
      <div className="skeleton-panels-row">
        <div className="skeleton-panel skeleton-panel-grow">
          <SkeletonBlock width="45%" height="1rem" style={{ marginBottom: '1rem' }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-event-row">
              <SkeletonBlock width="18px" height="18px" radius="50%" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <SkeletonBlock width="70%" height="0.85rem" style={{ marginBottom: '0.35rem' }} />
                <SkeletonBlock width="45%" height="0.75rem" />
              </div>
            </div>
          ))}
        </div>
        <div className="skeleton-panel skeleton-mini-cal">
          <SkeletonBlock width="60%" height="1rem" style={{ marginBottom: '0.75rem' }} />
          <div className="skeleton-cal-grid">
            {Array.from({ length: 35 }).map((_, i) => (
              <SkeletonBlock key={i} width="28px" height="28px" radius="50%" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Event list skeleton — for MyEvents, Invitations, EventsView */
export function SkeletonEventList({ rows = 5 }) {
  return (
    <div className="skeleton-event-list" aria-label="Loading events..." aria-busy="true">
      {/* Header bar */}
      <div className="skeleton-panel" style={{ marginBottom: '1rem' }}>
        <SkeletonBlock width="35%" height="1.6rem" style={{ marginBottom: '0.4rem' }} />
        <SkeletonBlock width="50%" height="0.85rem" />
      </div>

      {/* Filter chips */}
      <div className="skeleton-chips-row">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBlock key={i} width="80px" height="28px" radius="20px" />
        ))}
      </div>

      {/* Event rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-event-item">
          <SkeletonBlock width="10px" height="100%" radius="4px" style={{ alignSelf: 'stretch', minHeight: '60px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock width="60%" height="0.95rem" style={{ marginBottom: '0.4rem' }} />
            <SkeletonBlock width="40%" height="0.8rem" style={{ marginBottom: '0.35rem' }} />
            <SkeletonBlock width="30%" height="0.75rem" />
          </div>
          <SkeletonBlock width="70px" height="26px" radius="20px" style={{ flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

/** EventDetails skeleton */
export function SkeletonEventDetails() {
  return (
    <div className="skeleton-event-details" aria-label="Loading event details..." aria-busy="true">
      <div className="skeleton-panel">
        <SkeletonBlock width="55%" height="1.8rem" style={{ marginBottom: '0.5rem' }} />
        <SkeletonBlock width="30%" height="0.85rem" />
      </div>
      <div className="skeleton-panel">
        <SkeletonBlock width="25%" height="1rem" style={{ marginBottom: '1rem' }} />
        <SkeletonBlock width="90%" height="0.85rem" style={{ marginBottom: '0.4rem' }} />
        <SkeletonBlock width="75%" height="0.85rem" style={{ marginBottom: '1rem' }} />
        <div className="skeleton-details-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <SkeletonBlock width="50%" height="0.75rem" style={{ marginBottom: '0.3rem' }} />
              <SkeletonBlock width="80%" height="0.9rem" />
            </div>
          ))}
        </div>
      </div>
      <div className="skeleton-panel">
        <SkeletonBlock width="35%" height="1rem" style={{ marginBottom: '0.75rem' }} />
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} width={i === 2 ? '60%' : '85%'} height="0.85rem" style={{ marginBottom: '0.4rem' }} />
        ))}
      </div>
    </div>
  );
}
