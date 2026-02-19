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
 const isProfileIncomplete = !user?.isProfileComplete || !user?.email_verified_at;
  
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
const handleLinkClick = (e) => {
    if (isProfileIncomplete) {
      e.preventDefault();
      alert("Please complete your profile first to access other features.");
    }
  };
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
    navigate('/login');
    // setOpen(false);
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <Link 
            to={isProfileIncomplete ? "/profile" : "/dashboard"} 
            className="header-logo"
            onClick={isProfileIncomplete ? null : undefined} 
          >
            <Logo className="header-logo-img" src="/tesda-logo.png" alt="TESDA" transparentBlack />
            <span className="header-logo-text">COROPOTI Centralized Schedule Management System</span>
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
            <Link to="/dashboard" className={`header-link ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={handleLinkClick}>Dashboard</Link>
            <Link to="/calendar" className={`header-link ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={handleLinkClick}>Calendar</Link>
            <Link to="/upcoming" className={`header-link ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={handleLinkClick}>Upcoming</Link>
            <Link to="/year-events" className={`header-link ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={handleLinkClick}>Year Events</Link>
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
                <Link to="/help" className={`header-dropdown-item ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={(e) => { setHelpOpen(false); handleLinkClick(e); }}
  >Help / User Guide</Link>
                <Link to="/faq" className={`header-dropdown-item ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={(e) => { setHelpOpen(false); handleLinkClick(e); }}
  >FAQ</Link>
                <Link to="/support" className={`header-dropdown-item ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={(e) => { setHelpOpen(false); handleLinkClick(e); }}
  >Contact / Support</Link>
                <Link to="/about" className={`header-dropdown-item ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={(e) => { setHelpOpen(false); handleLinkClick(e); }}
  >About</Link>
                <div className="header-dropdown-sep" />
                <Link to="/terms" className={`header-dropdown-item ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={(e) => { setHelpOpen(false); handleLinkClick(e); }}
  >Terms of Use</Link>
                <Link to="/privacy" className={`header-dropdown-item ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={(e) => { setHelpOpen(false); handleLinkClick(e); }}
  >Privacy Policy</Link>
              </div>
            )}
          </div>
        </nav>
        <div className="header-user" ref={accountRef}>
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
                <span>{user?.role === 'admin' ? 'Admin' : 'User'}</span>
              </div>
              <Link to="/profile" className="header-dropdown-item" onClick={() => setAccountOpen(false)}>Profile</Link>
              <Link to="/dashboard" className={`header-dropdown-item ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={(e) => { setAccountOpen(false); handleLinkClick(e); }}
  >Dashboard</Link>
              <Link to="/calendar" className={`header-dropdown-item ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={(e) => { setAccountOpen(false); handleLinkClick(e); }}
  >Calendar</Link>
              <Link to="/invitations" className={`header-dropdown-item ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={(e) => { setAccountOpen(false); handleLinkClick(e); }}
  >Invitations</Link>
              <Link to="/upcoming" className={`header-dropdown-item ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={(e) => { setAccountOpen(false); handleLinkClick(e); }}
  >Upcoming</Link>
              <Link to="/recent" className={`header-dropdown-item ${isProfileIncomplete ? 'disabled-link' : ''}`} 
    onClick={(e) => { setAccountOpen(false); handleLinkClick(e); }}
  >Recent</Link>
              <button type="button" className="header-dropdown-item header-dropdown-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
