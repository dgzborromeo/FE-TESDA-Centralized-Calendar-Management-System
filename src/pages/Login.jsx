import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth as authApi } from '../api';
import Logo from '../components/Logo';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user: userData, token } = await authApi.login(email, password, remember);
      await login(userData, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-split">
      <div className="auth-split">

        {/* ── Left: media panel ── */}
        <div className="auth-split-media" aria-hidden="true">
          <Link to="/" className="auth-back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </Link>
          <img className="auth-split-img" src="/login-hero.png" alt="" />
          <div className="auth-split-overlay">
            <div className="auth-split-overlay-inner">
              <div className="auth-split-kicker">TESDA COROPOTI</div>
              <div className="auth-split-title">
                Operations Network and Events
                <span className="auth-split-title-sub">Centralized Calendar System</span>
              </div>
              <div className="auth-split-subtitle">
                Plan, coordinate, and confirm activities across all TESDA COROPOTIs.
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: form panel ── */}
        <div className="auth-split-panel">
          <div className="auth-card">

            {/* Header */}
            <div className="auth-header">
              <span className="auth-logo" aria-hidden="true">
                <Logo src="/tesda-logo.png" alt="" transparentBlack className="auth-logo-img" />
              </span>
              <h1 className="auth-brand-title">
                <span className="auth-brand-one">ONE</span>
                <span className="auth-brand-cursive">Centralized Calendar System</span>
              </h1>
              <p className="auth-header-sub">Sign in to your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="auth-error" role="alert">{error}</div>}

              {/* Email */}
              <label>
                <span className="auth-label-text">Email address</span>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M2 7l10 7 10-7"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@tesda.gov.ph"
                    required
                    autoComplete="email"
                    className="auth-input-with-icon"
                  />
                </div>
              </label>

              {/* Password */}
              <label>
                <span className="auth-label-text">Password</span>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="auth-input-with-icon auth-input-with-toggle"
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      /* eye-off — clearly crossed out */
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                        <line x1="2" y1="2" x2="22" y2="22"/>
                      </svg>
                    ) : (
                      /* eye */
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              {/* Remember + Forgot */}
              <div className="auth-row">
                <label className="auth-checkbox">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="auth-forgot-link">Forgot password?</Link>
              </div>

              {/* Submit */}
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? (
                  <span className="auth-spinner-wrap">
                    <span className="auth-spinner" aria-hidden="true" />
                    Signing in…
                  </span>
                ) : (
                  <>Sign in <span className="auth-submit-arrow">→</span></>
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
