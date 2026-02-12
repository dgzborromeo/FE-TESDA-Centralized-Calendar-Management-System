import { Link } from 'react-router-dom';
import './Auth.css';

/**
 * Forgot password page (optional).
 * For a full implementation you would send a reset link via email.
 * This placeholder directs users to contact their administrator.
 */
export default function ForgotPassword() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">📅</span>
          <h1>Forgot password?</h1>
          <p>Password reset is not configured. Contact your administrator to reset your password.</p>
        </div>
        <div className="auth-form">
          <p className="auth-forgot-info">
            If your organization has enabled email-based password reset, a link would be sent to your registered email.
            Otherwise, ask an admin to update your account.
          </p>
        </div>
        <p className="auth-footer">
          <Link to="/login">Back to Sign in</Link>
        </p>
      </div>
    </div>
  );
}
