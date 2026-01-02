import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { submitNewPassword } from '../../api/authReset';
import './Account.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Add class to body for auth page styling
  useEffect(() => {
    document.body.classList.add('auth-page-active');
    document.documentElement.classList.add('auth-page-active');
    
    return () => {
      document.body.classList.remove('auth-page-active');
      document.documentElement.classList.remove('auth-page-active');
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      setLoading(false);
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required');
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await submitNewPassword(token, newPassword);
      setMessage('Password reset successfully! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      if (err.normalized?.status === 400) {
        setError('Invalid or expired reset token. Please request a new password reset.');
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!token) {
    return (
      <div className="body">
        <div className="account-container">
          <div className="jebena"></div>
          <div className="forms-container">
            <div className="signin-signup">
              <div className="sign-in-form">
                <h2 className="form-title">Invalid Reset Link</h2>
                <div className="error-message">
                  This password reset link is invalid or has expired.
                </div>
                <div className="auth-links">
                  <Link to="/forgot-password" className="auth-link">
                    Request New Reset Link
                  </Link>
                  <Link to="/login" className="auth-link">
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="body">
      <div className="account-container">
        <div className="jebena"></div>
        <div className="forms-container">
          <div className="signin-signup">
            <form className="sign-in-form" onSubmit={handleSubmit}>
              <h2 className="form-title">Set New Password</h2>
              <p className="form-subtitle">
                Enter your new password below.
              </p>

              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message">{message}</div>}

              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  disabled={loading}
                />
                <span 
                  className="show-pass" 
                  onClick={togglePasswordVisibility}
                  style={{ cursor: 'pointer' }}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </span>
              </div>

              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  disabled={loading}
                />
              </div>

              <input
                type="submit"
                value={loading ? "Resetting..." : "Reset Password"}
                className="account-btn solid"
                disabled={loading}
              />

              <div className="auth-links">
                <Link to="/login" className="auth-link">
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;