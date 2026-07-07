// Shared hamburger button — used in all page overview panels
export default function HamburgerBtn({ className = '' }) {
  return (
    <button
      type="button"
      className={`page-hamburger ${className}`.trim()}
      aria-label="Toggle navigation"
      onClick={() => window.dispatchEvent(new Event('sidebar-toggle'))}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  );
}

/* NOTE: Styling for .page-hamburger is in Dashboard.css (shared global rule) */
