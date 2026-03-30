import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [calendarSearch, setCalendarSearch] = useState('');
  const accountRef = useRef(null);
  const helpRef = useRef(null);
  const isCalendarPage = location.pathname.startsWith('/calendar');

  const officeShort = (() => {
    const email = (user?.email || '').trim().toLowerCase();
    const name = String(user?.name || '').trim();

    // For cluster accounts, prefer the suffix inside the last parentheses,
    // e.g. "Cluster - ... (ODDG-TESDO)" -> "ODDG-TESDO".
    if (email.startsWith('cluster.')) {
      const m = name.match(/\(([^()]+)\)\s*$/);
      if (m?.[1]) return String(m[1]).trim().toUpperCase();
    }

    if (email.includes('@')) {
      const local = email.split('@')[0] || '';
      if (local && local.length <= 12) return local.toUpperCase();
    }

    if (name) {
      const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 4)
        .map((w) => w[0]?.toUpperCase())
        .filter(Boolean)
        .join('');
      if (initials) return initials;
    }
    return 'USER';
  })();

  useEffect(() => {
    function handleClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (helpRef.current && !helpRef.current.contains(e.target)) setHelpOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isCalendarPage) {
      setCalendarSearch('');
      return;
    }
    const params = new URLSearchParams(location.search || '');
    setCalendarSearch(params.get('q') || '');
  }, [isCalendarPage, location.search]);

  const handleCalendarSearchChange = (value) => {
    setCalendarSearch(value);
    const params = new URLSearchParams(location.search || '');
    const trimmed = String(value || '').trim();
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    const qs = params.toString();
    navigate(`/calendar${qs ? `?${qs}` : ''}`, { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate('/'); // back to public dashboard view
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <Link to="/dashboard" className="header-logo">
            <Logo className="header-logo-img" src="/tesda-logo.png" alt="TESDA" transparentBlack />
            <span className="header-logo-text">ONE Centralized Calendar System</span>
          </Link>
          {isCalendarPage && (
            <input
              type="search"
              className="header-calendar-search"
              placeholder="Search events..."
              value={calendarSearch}
              onChange={(e) => handleCalendarSearchChange(e.target.value)}
            />
          )}
        </div>
        <nav className="header-nav">
          <div className="header-nav-scroll">
            {user?.role === 'admin' && (
              <Link to="/list-of-activity" className="header-link">List of Activity</Link>
            )}
            <Link to="/events" className="header-link">Events / Meetings</Link>
            {user?.role === 'admin' && (
              <Link to="/user-config" className="header-link">User Configuration</Link>
            )}
          </div>

          <div className="header-help" ref={helpRef}>
            <button
              type="button"
              className="header-link header-help-btn"
              onClick={() => {
                setHelpOpen((v) => !v);
                setAccountOpen(false);
              }}
              aria-expanded={helpOpen}
              aria-haspopup="true"
            >
              Help & Info <span className="header-chevron">▼</span>
            </button>
            {helpOpen && (
              <div className="header-dropdown header-dropdown-left">
                <div className="header-dropdown-section-label">System</div>
                <Link to="/about" className="header-dropdown-item" onClick={() => setHelpOpen(false)}>
                  About COROPOTI
                </Link>
                <Link to="/help" className="header-dropdown-item" onClick={() => setHelpOpen(false)}>
                  User Guide
                </Link>
                <Link to="/faq" className="header-dropdown-item" onClick={() => setHelpOpen(false)}>
                  FAQs
                </Link>
                <div className="header-dropdown-sep" />
                <div className="header-dropdown-section-label">Support</div>
                <Link to="/support" className="header-dropdown-item" onClick={() => setHelpOpen(false)}>
                  Contact / Report Issue
                </Link>
              </div>
            )}
          </div>
        </nav>
        <div className="header-user" ref={accountRef}>
          {!user && (
          <Link to="/login" className="header-login-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Log In
          </Link>
          )}
          {user ? (
            <>
              <button
                type="button"
                className="header-profile-btn"
                onClick={() => {
                  setAccountOpen((v) => !v);
                  setHelpOpen(false);
                }}
                aria-expanded={accountOpen}
                aria-haspopup="true"
              >
                <span className="header-avatar">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                <span className="header-office-short" title={user?.name || ''}>
                  ({officeShort})
                </span>
                <span className="header-chevron">▼</span>
              </button>
              {accountOpen && (
                <div className="header-dropdown">
                  <div className="header-dropdown-user">
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                    <span>{user?.role === 'admin' ? 'Admin' : user?.role === 'viewer' ? 'Viewer' : 'User'}</span>
                  </div>
                  {/* <Link to="/invitations" className="header-dropdown-item" onClick={() => setAccountOpen(false)}>Invitations</Link> */}
                  <button type="button" className="header-dropdown-item header-dropdown-logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
