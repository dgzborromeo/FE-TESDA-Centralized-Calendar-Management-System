import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth as authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import './LoginRequiredModal.css';

export default function LoginRequiredModal({ onClose, redirectTo = null }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState('prompt'); // 'prompt' | 'form'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user: userData, token } = await authApi.login(email, password, remember);
      await login(userData, token);
      onClose();
      if (redirectTo) {
        navigate(redirectTo.path, { state: redirectTo.state });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lrm-overlay" onClick={onClose}>
      <div className="lrm-card" onClick={(e) => e.stopPropagation()}>

        {/* ── STEP 1: Prompt ── */}
        {step === 'prompt' && (
          <>
            <div className="lrm-icon">🔒</div>
            <h2 className="lrm-title">Login Required</h2>
            <p className="lrm-desc">
              You need to be logged in to add a schedule.<br />
              Please sign in to continue.
            </p>
            <div className="lrm-actions">
              <button className="lrm-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button className="lrm-btn-login" onClick={() => setStep('form')}>
                Sign In
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: Login Form ── */}
        {step === 'form' && (
          <>
            <button className="lrm-back-btn" onClick={() => { setStep('prompt'); setError(''); }}>
              ← Back
            </button>
            <div className="lrm-icon">👤</div>
            <h2 className="lrm-title">Sign In</h2>

            <form className="lrm-form" onSubmit={handleLogin}>
              {error && <p className="lrm-error">{error}</p>}

              <div className="lrm-field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              <div className="lrm-field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <label className="lrm-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>

              <div className="lrm-actions lrm-actions-form">
                <button type="button" className="lrm-btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="lrm-btn-login" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
