import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import './Sidebar.css';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    to: '/calendar',
    label: 'Calendar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    to: '/events',
    label: 'Events / Meetings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
      </svg>
    ),
  },
  {
    to: '/my-events',
    label: 'My Schedules',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2"/>
      </svg>
    ),
    requireAuth: true,
  },
  {
    to: '/office-legend',
    label: 'Office Directory',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <circle cx="12" cy="12" r="8" strokeDasharray="3 2"/>
        <line x1="12" y1="2" x2="12" y2="4"/>
        <line x1="12" y1="20" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="4" y2="12"/>
        <line x1="20" y1="12" x2="22" y2="12"/>
      </svg>
    ),
  },
];

const ADMIN_ITEMS = [
  {
    to: '/list-of-activity',
    label: 'List of Activity',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
  },
  {
    to: '/user-config',
    label: 'Configuration',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
];

const HELP_ITEMS = [
  { to: '/about',   label: 'About' },
  { to: '/help',    label: 'User Guide' },
  { to: '/faq',     label: 'FAQs' },
  { to: '/support', label: 'Support' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [calendarSearch, setCalendarSearch] = useState('');
  const accountRef = useRef(null);
  const isCalendarPage = location.pathname.startsWith('/calendar');

  // Auto-collapse when entering calendar page, restore when leaving
  useEffect(() => {
    if (isCalendarPage) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [isCalendarPage]);

  // Listen for external toggle from the Calendar toolbar hamburger
  // Auto-collapse when entering calendar page, restore when leaving
  // (no longer needed — drawer mode on all pages)

  // Listen for hamburger toggle from anywhere in the app
  // Works on ALL pages now, not just calendar
  useEffect(() => {
    const handler = () => {
      setMobileOpen(v => {
        const next = !v;
        if (next) setCollapsed(false); // ensure full sidebar shows
        return next;
      });
    };
    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Sync calendar search with URL
  useEffect(() => {
    if (!isCalendarPage) { setCalendarSearch(''); return; }
    const params = new URLSearchParams(location.search || '');
    setCalendarSearch(params.get('q') || '');
  }, [isCalendarPage, location.search]);

  const handleCalendarSearch = (value) => {
    setCalendarSearch(value);
    const params = new URLSearchParams(location.search || '');
    value.trim() ? params.set('q', value.trim()) : params.delete('q');
    navigate(`/calendar${params.toString() ? `?${params}` : ''}`, { replace: true });
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (to) => {
    if (to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(to);
  };

  const officeShort = (() => {
    const email = (user?.email || '').trim().toLowerCase();
    const name = String(user?.name || '').trim();
    if (email.startsWith('cluster.')) {
      const m = name.match(/\(([^()]+)\)\s*$/);
      if (m?.[1]) return String(m[1]).trim().toUpperCase();
    }
    if (email.includes('@')) {
      const local = email.split('@')[0] || '';
      if (local && local.length <= 12) return local.toUpperCase();
    }
    if (name) {
      return name.split(/\s+/).filter(Boolean).slice(0, 3).map(w => w[0]?.toUpperCase()).join('');
    }
    return 'USER';
  })();

  const visibleNav = NAV_ITEMS.filter(item => !item.requireAuth || user);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Backdrop — shown on all pages when drawer is open */}
      <div
        className={`sidebar-drawer-backdrop ${mobileOpen ? 'is-open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar wrapper — always drawer mode */}
      <div className={`sidebar-wrapper ${mobileOpen ? 'sidebar-drawer-open' : ''}`}>
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed
              ? <path d="M9 18l6-6-6-6"/>
              : <path d="M15 18l-6-6 6-6"/>
            }
          </svg>
        </button>

        <aside
          className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
          onClick={(e) => {
            // Close drawer when clicking any nav link on any page
            if (e.target.closest('a')) { setMobileOpen(false); }
          }}
        >

        {/* Logo */}
        <div className="sidebar-logo">
          <Link to="/dashboard" className="sidebar-logo-link">
            <Logo src="/tesda-logo.png" alt="TESDA" transparentBlack className="sidebar-logo-img" />
            {!collapsed && (
              <span className="sidebar-logo-text">
                <span className="sidebar-logo-main"><span className="sidebar-logo-one">ONE</span> Centralized</span>
                <span className="sidebar-logo-main">Calendar System</span>
                <span className="sidebar-logo-sub">Operations Network & Events</span>
              </span>
            )}
          </Link>
        </div>

        {/* Calendar search — only on calendar page */}
        {isCalendarPage && !collapsed && (
          <div className="sidebar-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="search"
              placeholder="Search events..."
              value={calendarSearch}
              onChange={e => handleCalendarSearch(e.target.value)}
            />
          </div>
        )}

        {/* Main nav */}
        <nav className="sidebar-nav">
          {/* Main nav */}
          <div className="sidebar-nav-section">
            <span className="sidebar-section-label">Main</span>
            {visibleNav.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-nav-item ${isActive(item.to) ? 'is-active' : ''}`}
                title={item.label}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span className="sidebar-nav-label">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Admin section */}
          {user?.role === 'admin' && (
            <div className="sidebar-nav-section">
              <span className="sidebar-section-label">Admin</span>
              {ADMIN_ITEMS.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`sidebar-nav-item ${isActive(item.to) ? 'is-active' : ''}`}
                  title={item.label}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Help section */}
          <div className="sidebar-nav-section sidebar-nav-section--help">
            <span className="sidebar-section-label">Help & Info</span>
            {HELP_ITEMS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-nav-item sidebar-nav-item--small ${isActive(item.to) ? 'is-active' : ''}`}
                title={item.label}
              >
                <span className="sidebar-nav-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                  </svg>
                </span>
                <span className="sidebar-nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="sidebar-footer" ref={accountRef}>
          {!user ? (
            <Link to="/login" className="sidebar-login-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <span className="sidebar-nav-label">Sign In</span>
            </Link>
          ) : (
            <>
              <button
                className="sidebar-user-btn"
                onClick={() => setAccountOpen(v => !v)}
                aria-expanded={accountOpen}
                title={user?.name}
              >
                <span className="sidebar-avatar">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                <span className="sidebar-user-info">
                  <span className="sidebar-user-name">{user?.name}</span>
                  <span className="sidebar-user-role">{officeShort}</span>
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`sidebar-user-chevron ${accountOpen ? 'is-open' : ''}`}>
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
              </button>

              {accountOpen && (
                <div className={`sidebar-user-menu ${collapsed ? 'sidebar-user-menu--collapsed' : ''}`}>
                  <div className="sidebar-user-menu-header">
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                    <span className="sidebar-role-badge">
                      {user?.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </div>
                  <button className="sidebar-user-menu-item sidebar-user-menu-logout" onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
      </div>{/* end sidebar-wrapper */}
    </>
  );
}
