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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setError('');
  //   setLoading(true);
  //   try {
  //     const { user: userData, token } = await authApi.login(email, password, remember);
  //     await login(userData, token);
  //     navigate('/dashboard');
  //   } catch (err) {
  //     const msg = err.message || 'Login failed.';
  //     setError(msg === 'Failed to fetch' ? 'Cannot reach server. Run START-SERVERS.bat and try again.' : msg);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
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
        <div className="auth-split-media" aria-hidden="true">
          <Link to="/" className="auth-back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home
          </Link>
          <img className="auth-split-img" src="/login-hero.png" alt="" />
          <div className="auth-split-overlay">
            <div className="auth-split-overlay-inner">
              <div className="auth-split-kicker">TESDA</div>
              <div className="auth-split-title">ONE Centralized Calendar System</div>
              <div className="auth-split-subtitle">Plan, coordinate, and confirm activities across all TESDA COROPOTIs.</div>
            </div>
          </div>
        </div>

        <div className="auth-split-panel">
          <div className="auth-card">
            <div className="auth-header">
              <span className="auth-logo" aria-hidden="true">
                <Logo src="/tesda-logo.png" alt="" transparentBlack className="auth-logo-img" />
              </span>
              <h1>ONE Centralized Calendar System</h1>
              <p>Sign in to continue</p>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="auth-error">{error}</div>}
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </label>
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <p className="auth-forgot">
                <Link to="/forgot-password">Forgot password?</Link>
              </p>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
            {/* <p className="auth-footer">
              Don't have an account? <Link to="/register">Register</Link>
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
}
