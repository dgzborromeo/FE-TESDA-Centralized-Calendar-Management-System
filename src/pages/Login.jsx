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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user: userData, token } = await authApi.login(email, password, remember);
      login(userData, token);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Login failed.';
      setError(msg === 'Failed to fetch' ? 'Cannot reach server. Run START-SERVERS.bat and try again.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-split">
      <div className="auth-split">
        <div className="auth-split-media" aria-hidden="true">
          <img className="auth-split-img" src="/login-hero.png" alt="" />
          <div className="auth-split-overlay">
            <div className="auth-split-overlay-inner">
              <div className="auth-split-kicker">TESDA</div>
              <div className="auth-split-title">Scheduling Management</div>
              <div className="auth-split-subtitle">Plan, coordinate, and confirm events across offices.</div>
            </div>
          </div>
        </div>

        <div className="auth-split-panel">
          <div className="auth-card">
            <div className="auth-header">
              <span className="auth-logo" aria-hidden="true">
                <Logo src="/tesda-logo.png" alt="" transparentBlack className="auth-logo-img" />
              </span>
              <h1>TESDA Centralized Scheduling Management System</h1>
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
            <p className="auth-footer">
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
