import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const accountRef = useRef(null);
  const helpRef = useRef(null);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
    setOpen(false);
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/dashboard" className="header-logo">
          <Logo className="header-logo-img" src="/tesda-logo.png" alt="TESDA" transparentBlack />
          <span className="header-logo-text">COROPOTI Centralized Schedule Management System</span>
        </Link>
        <nav className="header-nav">
          <div className="header-nav-scroll">
            <Link to="/dashboard" className="header-link">Dashboard</Link>
            <Link to="/calendar" className="header-link">Calendar</Link>
            <Link to="/upcoming" className="header-link">Upcoming</Link>
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
                <Link to="/help" className="header-dropdown-item" onClick={() => setHelpOpen(false)}>Help / User Guide</Link>
                <Link to="/faq" className="header-dropdown-item" onClick={() => setHelpOpen(false)}>FAQ</Link>
                <Link to="/support" className="header-dropdown-item" onClick={() => setHelpOpen(false)}>Contact / Support</Link>
                <Link to="/about" className="header-dropdown-item" onClick={() => setHelpOpen(false)}>About</Link>
                <div className="header-dropdown-sep" />
                <Link to="/terms" className="header-dropdown-item" onClick={() => setHelpOpen(false)}>Terms of Use</Link>
                <Link to="/privacy" className="header-dropdown-item" onClick={() => setHelpOpen(false)}>Privacy Policy</Link>
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
              <Link to="/dashboard" className="header-dropdown-item" onClick={() => setAccountOpen(false)}>Dashboard</Link>
              <Link to="/calendar" className="header-dropdown-item" onClick={() => setAccountOpen(false)}>Calendar</Link>
              <Link to="/invitations" className="header-dropdown-item" onClick={() => setAccountOpen(false)}>Invitations</Link>
              <Link to="/upcoming" className="header-dropdown-item" onClick={() => setAccountOpen(false)}>Upcoming</Link>
              <Link to="/recent" className="header-dropdown-item" onClick={() => setAccountOpen(false)}>Recent</Link>
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
