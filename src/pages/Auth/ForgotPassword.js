import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../api/authReset';
import '../../features/auth/Account.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Add class to body for auth page styling
  useEffect(() => {
    document.body.classList.add('auth-page-active');
    document.documentElement.classList.add('auth-page-active');
    
    return () => {
      document.body.classList.remove('auth-page-active');
      document.documentElement.classList.remove('auth-page-active');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!email) {
      setError('Email address is required');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await requestPasswordReset(email);
      setMessage('If an account with that email exists, a password reset link has been sent.');
      setEmail('');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="body">
      <div className="account-container">
        <div className="jebena"></div>
        <div className="forms-container">
          <div className="signin-signup">
            <form className="sign-in-form" onSubmit={handleSubmit}>
              <h2 className="form-title">Reset Password</h2>
              <p className="form-subtitle">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message">{message}</div>}

              <div className="input-field">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  disabled={loading}
                />
              </div>

              <input
                type="submit"
                value={loading ? "Sending..." : "Send Reset Link"}
                className="account-btn solid"
                disabled={loading}
              />

              <div className="auth-links">
                <Link to="/login" className="auth-link">
                  Back to Login
                </Link>
                <Link to="/register" className="auth-link">
                  Don't have an account? Sign up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;